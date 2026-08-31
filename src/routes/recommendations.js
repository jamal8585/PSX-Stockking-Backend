
import express from 'express';
import Recommendation from '../models/Recommendation.js';
import { memDB } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { signal, sector } = req.query;
    let list = [];

    if (Recommendation.db && Recommendation.db.readyState === 1) {
      const q = {};
      if (signal && signal !== 'ALL') q.signal = signal;
      if (sector && sector !== 'ALL') q.sector = sector;
      list = await Recommendation.find(q).sort({ confidence: -1 }).lean();
    } else {
      list = Array.from(memDB.recommendations.values());
      if (signal && signal !== 'ALL') list = list.filter(r => r.signal === signal);
      if (sector && sector !== 'ALL') list = list.filter(r => r.sector.toLowerCase() === sector.toLowerCase());
      list.sort((a, b) => b.confidence - a.confidence);
    }

    const strongBuy = list.filter(r => r.signal === 'STRONG_BUY');
    const accumulate = list.filter(r => r.signal === 'ACCUMULATE');
    const hold = list.filter(r => r.signal === 'HOLD');
    const avoidSell = list.filter(r => r.signal === 'AVOID_SELL');

    res.json({
      success: true,
      summary: {
        total: list.length,
        strongBuyCount: strongBuy.length,
        accumulateCount: accumulate.length,
        holdCount: hold.length,
        avoidSellCount: avoidSell.length
      },
      grouped: {
        strongBuy,
        accumulate,
        hold,
        avoidSell
      },
      all: list
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
