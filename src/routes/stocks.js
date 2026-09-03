
import express from 'express';
import Stock from '../models/Stock.js';
import { memDB } from '../config/db.js';
import { fetchOfficialPSXMarketWatch } from '../services/livePsxScraper.js';
import { 
  fetchIntradayBars, 
  fetchEodBars, 
  calculateTechnicalAnalysis, 
  calculatePerformanceReturns 
} from '../services/stockAnalyticsService.js';

const router = express.Router();

let lastSheetFetchTime = 0;
let cachedLiveSheet = null;

const getLiveMarketMap = async () => {
  const now = Date.now();
  if (!cachedLiveSheet || (now - lastSheetFetchTime > 5000)) {
    cachedLiveSheet = await fetchOfficialPSXMarketWatch();
    lastSheetFetchTime = now;
  }
  return cachedLiveSheet;
};

// ==========================================
// 1. GET ALL STOCKS (With live DPS prices & technicals)
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { sector, signal, search, sortBy = 'volume', sortDir = 'desc' } = req.query;
    
    // Fetch live market watch sheet directly from PSX DPS
    const liveSheet = await getLiveMarketMap();

    let baseList = [];
    if (Stock.db && Stock.db.readyState === 1) {
      baseList = await Stock.find({}).lean();
    } else {
      baseList = Array.from(memDB.stocks.values());
    }

    // Merge base database technicals with live scraped DPS prices
    const mergedMap = new Map();

    // 1. Add all live scraped companies from official DPS
    if (liveSheet && typeof liveSheet.forEach === 'function') {
      liveSheet.forEach((liveQuote, sym) => {
        mergedMap.set(sym, {
          symbol: sym,
          name: liveQuote.name || sym,
          sector: liveQuote.sector || 'General Market',
          currentPrice: liveQuote.currentPrice,
          prevClose: liveQuote.prevClose,
          open: liveQuote.open,
          high: liveQuote.high,
          low: liveQuote.low,
          change: liveQuote.change,
          changePercent: liveQuote.changePercent,
          volume: liveQuote.volume,
          isOfficialDPS: true,
          peRatio: 5.35,
          dividendYield: 0,
          technicals: { rsi14: 52, signal: liveQuote.change >= 0 ? 'ACCUMULATE' : 'NEUTRAL' }
        });
      });
    }

    // 2. Overlay database attributes (technicals, sector, name, fundamentals)
    baseList.forEach(dbStock => {
      const sym = dbStock.symbol.toUpperCase().trim();
      const live = mergedMap.get(sym);
      if (live) {
        mergedMap.set(sym, {
          ...dbStock,
          ...live,
          name: dbStock.name || live.name,
          sector: dbStock.sector || live.sector,
          currentPrice: live.currentPrice > 0 ? live.currentPrice : dbStock.currentPrice,
          prevClose: live.prevClose > 0 ? live.prevClose : dbStock.prevClose,
          change: live.change !== undefined ? live.change : dbStock.change,
          changePercent: live.changePercent !== undefined ? live.changePercent : dbStock.changePercent,
          volume: live.volume || dbStock.volume,
          technicals: dbStock.technicals || live.technicals,
          peRatio: dbStock.peRatio || live.peRatio,
          dividendYield: dbStock.dividendYield || live.dividendYield
        });
      } else {
        mergedMap.set(sym, dbStock);
      }
    });

    let list = Array.from(mergedMap.values());

    // Filtering
    if (sector && sector !== 'ALL') {
      list = list.filter(s => s.sector && s.sector.toLowerCase() === sector.toLowerCase());
    }
    if (signal && signal !== 'ALL') {
      list = list.filter(s => s.technicals?.signal === signal);
    }
    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(s => s.symbol.toLowerCase().includes(q) || (s.name && s.name.toLowerCase().includes(q)));
    }

    // Sorting
    list.sort((a, b) => {
      let valA = a[sortBy] ?? a.technicals?.[sortBy] ?? 0;
      let valB = b[sortBy] ?? b.technicals?.[sortBy] ?? 0;
      if (sortBy === 'rsi') {
        valA = a.technicals?.rsi14 ?? 50;
        valB = b.technicals?.rsi14 ?? 50;
      }
      return sortDir === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. GET REAL MULTI-TIMEFRAME HISTORY (GET /api/stocks/:symbol/history?timeframe=1D|5D|1M|3M|1Y)
// ==========================================
router.get('/:symbol/history', async (req, res) => {
  try {
    const sym = req.params.symbol.toUpperCase().trim();
    const timeframe = (req.query.timeframe || '1M').toUpperCase();

    const liveSheet = await getLiveMarketMap();
    const liveQuote = liveSheet ? liveSheet.get(sym) : null;

    let bars = null;
    if (timeframe === '1D') {
      bars = await fetchIntradayBars(sym);
    } else {
      bars = await fetchEodBars(sym, timeframe);
    }

    // Fetch EOD bars for technical indicators and performance returns
    const allEodBars = await fetchEodBars(sym, '1Y');
    const technicals = calculateTechnicalAnalysis(allEodBars || bars || [], liveQuote || {});
    const performanceReturns = calculatePerformanceReturns(allEodBars || [], liveQuote?.currentPrice || 100);

    res.json({
      success: true,
      symbol: sym,
      timeframe,
      count: bars ? bars.length : 0,
      bars: bars || [],
      technicals,
      performanceReturns,
      quote: liveQuote || null
    });
  } catch (err) {
    console.error(`History route error (${req.params.symbol}):`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. GET SINGLE STOCK WITH AUTHENTIC TELEMETRY (GET /api/stocks/:symbol)
// ==========================================
router.get('/:symbol', async (req, res) => {
  try {
    const sym = req.params.symbol.toUpperCase().trim();
    const liveSheet = await getLiveMarketMap();
    const liveQuote = liveSheet ? liveSheet.get(sym) : null;

    let stock = null;
    if (Stock.db && Stock.db.readyState === 1) {
      stock = await Stock.findOne({ symbol: sym }).lean();
    } else {
      stock = memDB.stocks.get(sym);
    }

    if (!stock && !liveQuote) {
      return res.status(404).json({ success: false, message: 'Stock ' + sym + ' not found in PSX universe.' });
    }

    const currentPrice = liveQuote?.currentPrice || stock?.currentPrice || 100;
    const prevClose = liveQuote?.prevClose || stock?.prevClose || (currentPrice * 0.99);

    // Fetch real EOD bars for real technical calculation
    const eodBars = await fetchEodBars(sym, '1M');
    const realTechnicals = calculateTechnicalAnalysis(eodBars || [], { currentPrice, prevClose });
    const realReturns = calculatePerformanceReturns(eodBars || [], currentPrice);

    const merged = {
      ...(stock || {}),
      ...(liveQuote || {}),
      symbol: sym,
      currentPrice,
      prevClose,
      change: liveQuote?.change !== undefined ? liveQuote.change : (stock?.change ?? Number((currentPrice - prevClose).toFixed(2))),
      changePercent: liveQuote?.changePercent !== undefined ? liveQuote.changePercent : (stock?.changePercent ?? Number((((currentPrice - prevClose) / prevClose) * 100).toFixed(2))),
      volume: liveQuote?.volume || stock?.volume || 1500000,
      technicals: {
        ...(stock?.technicals || {}),
        ...realTechnicals
      },
      performanceReturns: realReturns
    };

    const rec = memDB.recommendations.get(sym) || null;

    res.json({
      success: true,
      data: {
        ...merged,
        recommendation: rec
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
