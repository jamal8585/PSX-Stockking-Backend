import express from 'express';
import News from '../models/News.js';
import { memDB } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, sentiment, symbol } = req.query;
    let list = [];

    if (News.db && News.db.readyState === 1) {
      const q = {};
      if (category && category !== 'ALL') q.category = category;
      if (sentiment && sentiment !== 'ALL') q.sentiment = sentiment;
      if (symbol) q['tradeSuggestions.symbol'] = symbol.toUpperCase();
      list = await News.find(q).sort({ publishedAt: -1 }).lean();
    }
    
    if (!list || list.length === 0) {
      list = Array.from(memDB.news.values());
      if (category && category !== 'ALL') list = list.filter(n => n.category === category);
      if (sentiment && sentiment !== 'ALL') list = list.filter(n => n.sentiment === sentiment);
      if (symbol) {
        const s = symbol.toUpperCase();
        list = list.filter(n => n.tradeSuggestions && n.tradeSuggestions.some(t => t.symbol === s));
      }
      list.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }

    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
