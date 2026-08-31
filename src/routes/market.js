
import express from 'express';
import MarketSummary from '../models/MarketSummary.js';
import { memDB, getDBStatus } from '../config/db.js';

const router = express.Router();

router.get('/summary', async (req, res) => {
  try {
    let summary = null;
    if (MarketSummary.db && MarketSummary.db.readyState === 1) {
      summary = await MarketSummary.findOne().sort({ createdAt: -1 }).lean();
    }
    
    // If DB returned nothing or is starting up, use active in-memory summary
    if (!summary || !summary.sectorPerformance || summary.sectorPerformance.length === 0) {
      summary = memDB.marketSummary;
    }

    res.json({
      success: true,
      dbStatus: getDBStatus(),
      data: summary
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
