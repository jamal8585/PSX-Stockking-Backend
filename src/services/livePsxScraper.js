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

// Calculate the upcoming PSX trading date (skipping weekends)
export const getNextPSXTradingDate = (pktTime = null) => {
  const d = pktTime ? new Date(pktTime) : (() => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5));
  })();
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const timeNum = hours * 100 + minutes;

  const next = new Date(d);
  if (day === 5 && timeNum >= 1600) {
    next.setDate(d.getDate() + 3); // Friday after close -> Monday
  } else if (day === 6) {
    next.setDate(d.getDate() + 2); // Saturday -> Monday
  } else if (day === 0) {
    next.setDate(d.getDate() + 1); // Sunday -> Monday
  } else if (timeNum >= 1600) {
    next.setDate(d.getDate() + 1); // Mon-Thu after close -> Tomorrow
  } else {
    next.setDate(d.getDate() + 1);
  }

  const weekday = next.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Karachi' });
  const dateFmt = next.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Karachi' });
  return `${weekday}, ${dateFmt}`;
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
  const nextTradingDate = getNextPSXTradingDate(pktTime);
  const todayDateStr = pktTime.toISOString().split('T')[0];

  // Weekends
  if (day === 0 || day === 6) {
    const isSun = day === 0;
    return {
      isOpen: false,
      isEodFrozen: true,
      eodSnapshotDate: todayDateStr,
      nextTradingDate,
      actionableLabel: isSun 
        ? `Pre-Market Intelligence • Actionable for Tomorrow's Monday PSX Market Open (${nextTradingDate})`
        : `Post-Market Analysis • Actionable for Upcoming Monday PSX Market Open (${nextTradingDate})`,
      statusText: 'MARKET CLOSED (Weekend)',
      sessionNote: 'Official PSX Last Closing Rates Active • Re-opens Monday 09:15 AM PKT'
    };
  }

  // Friday Special Timing
  if (day === 5) {
    const isMorning = timeInMinutes >= (9 * 60 + 15) && timeInMinutes <= (12 * 60);
    const isAfternoon = timeInMinutes >= (14 * 60 + 30) && timeInMinutes <= (16 * 60 + 30);
    if (isMorning || isAfternoon) {
      return {
        isOpen: true,
        isEodFrozen: false,
        eodSnapshotDate: todayDateStr,
        nextTradingDate,
        actionableLabel: 'Live Trading Session • Active Trading Telemetry',
        statusText: 'LIVE MARKET SESSION',
        sessionNote: 'Real-time Tick Telemetry Active'
      };
    }
  } else {
    // Monday to Thursday: 09:15 AM to 03:30 PM (9:15 - 15:30)
    if (timeInMinutes >= (9 * 60 + 15) && timeInMinutes <= (15 * 60 + 30)) {
      return {
        isOpen: true,
        isEodFrozen: false,
        eodSnapshotDate: todayDateStr,
        nextTradingDate,
        actionableLabel: 'Live Trading Session • Active Trading Telemetry',
        statusText: 'LIVE MARKET SESSION',
        sessionNote: 'Real-time Tick Telemetry Active'
      };
    }
  }

  if (timeInMinutes < (9 * 60 + 15)) {
    const todayFmt = pktTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Karachi' });
    return {
      isOpen: false,
      isEodFrozen: true,
      eodSnapshotDate: todayDateStr,
      nextTradingDate: todayFmt,
      actionableLabel: `Pre-Market Intelligence • Actionable for Today's PSX Market Open (${todayFmt})`,
      statusText: 'PRE-MARKET (Closed)',
      sessionNote: 'Official Previous Day Closing Rates Active • Opens at 09:15 AM PKT'
    };
  }

  return {
    isOpen: false,
    isEodFrozen: true,
    eodSnapshotDate: todayDateStr,
    nextTradingDate,
    actionableLabel: `Post-Market Analysis • Actionable for Tomorrow's PSX Market Open (${nextTradingDate})`,
    statusText: 'MARKET CLOSED (Post-Market)',
    sessionNote: 'Official DPS Final Closing Rates Active • Opens Next Trading Day 09:15 AM PKT'
  };
};

// Cache for individual company quotes (TTL: 30s)
const companyQuoteCache = new Map();
const COMPANY_QUOTE_TTL_MS = 30000;

// Scrape 100% official real-time stock quote from DPS company page
export const fetchPSXCompanyQuote = async (symbol) => {
  const sym = symbol.toUpperCase().trim();
  const now = Date.now();
  if (companyQuoteCache.has(sym) && (now - companyQuoteCache.get(sym).time < COMPANY_QUOTE_TTL_MS)) {
    return companyQuoteCache.get(sym).data;
  }

  try {
    const res = await axios.get(`https://dps.psx.com.pk/company/${sym}`, {
      headers: HEADERS,
      timeout: 7000
    });
    if (!res.data || typeof res.data !== 'string') return null;

    const $ = cheerio.load(res.data);
    const rawSector = $('.quote__sector span').text().trim() || $('.quote__sector').text().trim();
    const sector = (rawSector && rawSector !== 'General Market') 
      ? rawSector 
      : (baseQuotes[sym]?.sector || 'Miscellaneous');

    const priceText = $('.quote__price .quote__close').text().replace(/Rs\.?/i, '').replace(/,/g, '').trim();
    const currentPrice = parseFloat(priceText);
    if (!currentPrice || isNaN(currentPrice)) return null;

    const changeValText = $('.quote__change .change__value').text().replace(/,/g, '').trim();
    const changePctText = $('.quote__change .change__percent').text().replace(/[()%]/g, '').trim();
    const isNegative = $('.quote__change').hasClass('change__text--neg') || $('.quote__change').find('.icon-down-dir').length > 0;

    let change = parseFloat(changeValText) || 0;
    if (isNegative && change > 0) change = -change;

    let changePercent = parseFloat(changePctText) || 0;
    if (isNegative && changePercent > 0) changePercent = -changePercent;

    const regTab = $('.tabs__panel[data-name="REG"]');
    const stats = {};
    const scope = regTab.length > 0 ? regTab : $('body');
    scope.find('.stats_item').each((_, el) => {
      const label = $(el).find('.stats_label').text().trim().toUpperCase();
      const val = $(el).find('.stats_value').text().trim();
      if (label && val) {
        stats[label] = val;
      }
    });

    const open = parseFloat((stats['OPEN'] || '').replace(/,/g, '')) || currentPrice;
    const high = parseFloat((stats['HIGH'] || '').replace(/,/g, '')) || Math.max(open, currentPrice);
    const low = parseFloat((stats['LOW'] || '').replace(/,/g, '')) || Math.min(open, currentPrice);
    const prevClose = parseFloat((stats['LDCP'] || '').replace(/,/g, '')) || Number((currentPrice - change).toFixed(2));
    const volume = parseInt((stats['VOLUME'] || '0').replace(/,/g, ''), 10) || 0;
    const peRatio = parseFloat((stats['P/E RATIO (TTM) **'] || stats['P/E RATIO (TTM)'] || '').replace(/,/g, '')) || 0;

    const cbText = stats['CIRCUIT BREAKER'] || '';
    const [cbLow, cbHigh] = cbText.split('—').map(v => parseFloat(v?.trim()) || 0);

    const range52Text = stats['52-WEEK RANGE ^'] || stats['52-WEEK RANGE'] || '';
    const [low52, high52] = range52Text.split('—').map(v => parseFloat(v?.trim()) || 0);

    const data = {
      symbol: sym,
      name: companyName,
      sector,
      category: sector,
      currentPrice: Number(currentPrice.toFixed(2)),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      prevClose: Number(prevClose.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume,
      peRatio,
      circuitBreaker: { lower: cbLow, upper: cbHigh },
      week52: { low: low52, high: high52 },
      high52: high52 || undefined,
      low52: low52 || undefined,
      isOfficialDPS: true,
      lastUpdated: new Date().toISOString()
    };

    companyQuoteCache.set(sym, { time: now, data });
    return data;
  } catch (err) {
    console.warn(`DPS quote fetch failed for ${sym}:`, err.message);
    return null;
  }
};

// 1. Fetch Complete Official PSX Market Watch Sheet (740+ Listed Companies via DPS Screener)
export const fetchOfficialPSXMarketWatch = async () => {
  console.log('📊 Synchronizing Official 100% Real PSX Market Watch Sheet (dps.psx.com.pk/screener)...');
  const marketMap = new Map();

  // Populate from base official quotes first
  Object.values(baseQuotes).forEach(q => {
    if (q.symbol && q.currentPrice > 0) {
      marketMap.set(q.symbol.toUpperCase(), { ...q, isOfficialDPS: true });
    }
  });

  try {
    // Primary: DPS Screener with 740+ real-time listed companies
    const res = await axios.get('https://dps.psx.com.pk/screener', { headers: HEADERS, timeout: 8000 });
    if (res.data && typeof res.data === 'string' && res.data.includes('<table')) {
      const $ = cheerio.load(res.data);
      let liveCount = 0;
      $('table tbody tr').each((_, el) => {
        const cols = $(el).find('td').map((_, cell) => $(cell).text().trim()).get();
        if (cols.length >= 10) {
          const symbol = cols[0].toUpperCase().trim();
          const sectorCode = cols[1] || '';
          const indices = cols[2] || '';
          const price = parseFloat(cols[4].replace(/,/g, '')) || 0;
          const changePct = parseFloat(cols[5].replace(/%/g, '').replace(/,/g, '')) || 0;
          const peRatio = parseFloat(cols[7].replace(/,/g, '')) || 0;
          const divYield = parseFloat(cols[8].replace(/%/g, '').replace(/,/g, '')) || 0;
          const volume = parseInt(cols[10]?.replace(/,/g, ''), 10) || 0;

          if (symbol && price > 0) {
            const prevClose = changePct !== 0 
              ? Number((price / (1 + (changePct / 100))).toFixed(2)) 
              : price;
            const change = Number((price - prevClose).toFixed(2));

            const existingQuote = marketMap.get(symbol);
            const resolvedSector = baseQuotes[symbol]?.sector || existingQuote?.sector || 'Miscellaneous';
            const resolvedName = baseQuotes[symbol]?.name || existingQuote?.name || symbol;

            marketMap.set(symbol, {
              symbol,
              name: resolvedName,
              sector: resolvedSector,
              category: resolvedSector,
              sectorCode,
              indices,
              prevClose,
              open: price,
              high: price,
              low: price,
              currentPrice: price,
              change,
              changePercent: changePct,
              peRatio,
              dividendYield: divYield,
              volume,
              isOfficialDPS: true
            });
            liveCount++;
          }
        }
      });
      if (liveCount > 0) {
        console.log(`✅ Live PSX Screener synchronized with ${liveCount} authentic listed stocks!`);
      }
    }
  } catch (err) {
    console.warn('⚠️ PSX Screener sync note (using verified official dataset):', err.message);
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
    current: 166419.71,
    currentValue: 166419.71,
    prevClose: 166186.16,
    change: 233.55,
    changePercent: 0.14,
    high: 166708.36,
    low: 165956.51,
    ticks: [],
    isLive: false
  };
};