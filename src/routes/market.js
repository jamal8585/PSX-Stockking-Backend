
import express from 'express';
import MarketSummary from '../models/MarketSummary.js';
import { memDB, getDBStatus } from '../config/db.js';
import { fetchLiveKSE100Summary, getPSXMarketStatus } from '../services/livePsxScraper.js';

const router = express.Router();

let lastLiveFetchTime = 0;
let cachedLiveSummary = null;

router.get('/summary', async (req, res) => {
  try {
    const now = Date.now();
    // Cache for 3 seconds to guarantee 100% real-time data without delay
    if (!cachedLiveSummary || (now - lastLiveFetchTime > 3000)) {
      const liveKse = await fetchLiveKSE100Summary();
      const marketTiming = getPSXMarketStatus();
      
      const currentMem = memDB.marketSummary || {};
      cachedLiveSummary = {
        ...currentMem,
        ...liveKse,
        current: liveKse.current,
        currentValue: liveKse.current,
        prevClose: liveKse.prevClose,
        change: liveKse.change,
        changePercent: liveKse.changePercent,
        high: liveKse.high,
        low: liveKse.low,
        marketStatus: marketTiming,
        marketSentiment: liveKse.change >= 0 ? 'BULLISH' : 'BEARISH',
        lastUpdated: new Date()
      };
      memDB.marketSummary = cachedLiveSummary;
      lastLiveFetchTime = now;
    }

    res.json({
      success: true,
      dbStatus: getDBStatus(),
      data: cachedLiveSummary
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
