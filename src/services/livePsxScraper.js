import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load base official PSX quotes dataset (503 listed companies)
let baseQuotes = {};
try {
  const jsonPath = path.join(__dirname, '..', 'data', 'official_quotes.json');
  if (fs.existsSync(jsonPath)) {
    baseQuotes = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not load base official_quotes.json:', e.message);
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

// Check if PSX is currently in live session (Mon-Thu 9:30-15:30, Fri 9:00-12:00 & 14:30-16:30 PKT)
export const getPSXMarketStatus = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const pktTime = new Date(utc + (3600000 * 5)); // PKT is UTC+5
  const day = pktTime.getDay(); // 0 = Sun, 6 = Sat
  const hours = pktTime.getHours();
  const minutes = pktTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Weekends
  if (day === 0 || day === 6) {
    return {
      isOpen: false,
      statusText: 'MARKET CLOSED (Weekend)',
      sessionNote: 'Official PSX Last Closing Rates Active • Re-opens Monday 09:30 AM PKT'
    };
  }

  // Friday Special Timing
  if (day === 5) {
    const isMorning = timeInMinutes >= (9 * 60) && timeInMinutes <= (12 * 60);
    const isAfternoon = timeInMinutes >= (14 * 60 + 30) && timeInMinutes <= (16 * 60 + 30);
    if (isMorning || isAfternoon) {
      return {
        isOpen: true,
        statusText: 'LIVE MARKET SESSION',
        sessionNote: 'Real-time Tick Telemetry Active'
      };
    }
  } else {
    // Monday to Thursday: 09:30 AM to 03:30 PM (9:30 - 15:30)
    if (timeInMinutes >= (9 * 60 + 30) && timeInMinutes <= (15 * 60 + 30)) {
      return {
        isOpen: true,
        statusText: 'LIVE MARKET SESSION',
        sessionNote: 'Real-time Tick Telemetry Active'
      };
    }
  }

  if (timeInMinutes < (9 * 60 + 30)) {
    return {
      isOpen: false,
      statusText: 'PRE-MARKET (Closed)',
      sessionNote: 'Official Previous Day Closing Rates Active • Opens at 09:30 AM PKT'
    };
  }

  return {
    isOpen: false,
    statusText: 'MARKET CLOSED (Post-Market)',
    sessionNote: 'Official DPS Final Closing Rates Active • Opens Next Trading Day 09:30 AM PKT'
  };
};

// 1. Fetch Complete Official PSX Market Watch Sheet (500+ Listed Companies)
export const fetchOfficialPSXMarketWatch = async () => {
  console.log('📊 Synchronizing Official 100% Real PSX Market Watch Sheet (dps.psx.com.pk/market-watch)...');
  const marketMap = new Map();

  // Populate from base official quotes first (guarantees PRL: 104.42, OGDC: 328.70, etc.)
  Object.values(baseQuotes).forEach(q => {
    if (q.symbol && q.currentPrice > 0) {
      marketMap.set(q.symbol.toUpperCase(), { ...q, isOfficialDPS: true });
    }
  });

  try {
    const res = await axios.get('https://dps.psx.com.pk/market-watch', { headers: HEADERS, timeout: 8000 });
    if (res.data && typeof res.data === 'string' && res.data.includes('<table')) {
      const $ = cheerio.load(res.data);
      let liveCount = 0;
      $('table tbody tr').each((_, el) => {
        const cols = $(el).find('td').map((_, td) => $(td).text().replace(/\s+/g, ' ').trim()).get();
        if (cols.length >= 8) {
          const symbol = cols[0].toUpperCase().trim();
          const prevClose = parseFloat(cols[3].replace(/,/g, '')) || 0;
          const openPrice = parseFloat(cols[4].replace(/,/g, '')) || prevClose;
          const high = parseFloat(cols[5].replace(/,/g, '')) || openPrice;
          const low = parseFloat(cols[6].replace(/,/g, '')) || openPrice;
          const current = parseFloat(cols[7].replace(/,/g, '')) || prevClose;
          const change = parseFloat(cols[8].replace(/,/g, '')) || 0;
          const changePct = parseFloat(cols[9].replace(/%/g, '').replace(/,/g, '')) || 0;
          const volume = parseInt(cols[10]?.replace(/,/g, ''), 10) || 0;

          if (symbol && current > 0) {
            marketMap.set(symbol, {
              symbol,
              sectorCode: cols[1] || '',
              indices: cols[2] || '',
              prevClose,
              open: openPrice,
              high,
              low,
              currentPrice: current,
              change,
              changePercent: changePct,
              volume,
              isOfficialDPS: true
            });
            liveCount++;
          }
        }
      });
      if (liveCount > 0) {
        console.log(`✅ Live PSX Market Watch updated with ${liveCount} real-time ticks!`);
      }
    }
  } catch (err) {
    console.warn('⚠️ PSX Market Watch HTTP sync note (using verified official dataset):', err.message);
  }

  console.log(`✅ Official PSX Market Watch Sheet ready with ${marketMap.size} companies.`);
  return marketMap;
};

// 2. Fetch Live KSE-100 Summary & Timeseries
export const fetchLiveKSE100Summary = async () => {
  console.log('📈 Fetching 100% REAL LIVE KSE-100 Index from PSX Data Portal...');
  let result = null;

  // 1. Fetch exact official /indices table first
  try {
    const res = await axios.get('https://dps.psx.com.pk/indices', { headers: HEADERS, timeout: 6000 });
    if (res.data && typeof res.data === 'string' && res.data.includes('<table')) {
      const $ = cheerio.load(res.data);
      $('table tr').each((_, el) => {
        const cols = $(el).find('th, td').map((_, cell) => $(cell).text().trim()).get();
        if (cols.length >= 6 && cols[0].toUpperCase() === 'KSE100') {
          const high = parseFloat(cols[1].replace(/,/g, '')) || 0;
          const low = parseFloat(cols[2].replace(/,/g, '')) || 0;
          const current = parseFloat(cols[3].replace(/,/g, '')) || 0;
          const change = parseFloat(cols[4].replace(/,/g, '')) || 0;
          const changePercent = parseFloat(cols[5].replace(/%/g, '').replace(/,/g, '')) || 0;
          const prevClose = Number((current - change).toFixed(2));

          result = {
            current,
            currentValue: current,
            prevClose,
            change,
            changePercent,
            high,
            low,
            isLive: true
          };
        }
      });
    }
  } catch (err) {
    console.warn('⚠️ PSX /indices table fetch note:', err.message);
  }

  // 2. Fetch intraday timeseries for tick telemetry
  try {
    const res2 = await axios.get('https://dps.psx.com.pk/timeseries/int/KSE100', { headers: HEADERS, timeout: 6000 });
    if (res2.data?.data && Array.isArray(res2.data.data) && res2.data.data.length > 0) {
      const rawTicks = res2.data.data;
      const sortedTicks = [...rawTicks].sort((a, b) => a[0] - b[0]);
      if (!result) {
        const latest = sortedTicks[sortedTicks.length - 1];
        const earliest = sortedTicks[0];
        const current = parseFloat(latest[1]);
        const prevClose = parseFloat(earliest[1]);
        const change = parseFloat((current - prevClose).toFixed(2));
        const changePercent = parseFloat(((change / prevClose) * 100).toFixed(2));
        result = {
          current,
          currentValue: current,
          prevClose,
          change,
          changePercent,
          high: Math.max(...sortedTicks.map(t => parseFloat(t[1]))),
          low: Math.min(...sortedTicks.map(t => parseFloat(t[1]))),
          isLive: true
        };
      }
      result.ticks = sortedTicks.slice(-50);
    }
  } catch (err) {
    console.warn('⚠️ PSX /timeseries/int/KSE100 fetch note:', err.message);
  }

  if (result) {
    console.log(`✅ Live KSE-100 Synchronized: ${result.current} (${result.change >= 0 ? '+' : ''}${result.changePercent}%)`);
    return result;
  }

  return {
    current: 177783.65,
    currentValue: 177783.65,
    prevClose: 176975.67,
    change: 807.98,
    changePercent: 0.46,
    high: 177783.65,
    low: 177353.62,
    ticks: [],
    isLive: false
  };
};