
import express from 'express';
import Stock from '../models/Stock.js';
import { memDB } from '../config/db.js';
import { fetchOfficialPSXMarketWatch } from '../services/livePsxScraper.js';

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

    const merged = {
      ...(stock || {}),
      ...(liveQuote || {}),
      symbol: sym,
      currentPrice: liveQuote?.currentPrice || stock?.currentPrice,
      prevClose: liveQuote?.prevClose || stock?.prevClose,
      change: liveQuote?.change !== undefined ? liveQuote.change : stock?.change,
      changePercent: liveQuote?.changePercent !== undefined ? liveQuote.changePercent : stock?.changePercent,
      volume: liveQuote?.volume || stock?.volume
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
