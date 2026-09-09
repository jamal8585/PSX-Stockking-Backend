import express from 'express';
import News from '../models/News.js';
import { memDB } from '../config/db.js';
import { fetchLiveFinancialNews, isWithinActiveMarketSession } from '../services/liveNewsScraper.js';

const router = express.Router();

let lastNewsFetchTime = 0;
const NEWS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache

router.get('/', async (req, res) => {
  try {
    const { category, sentiment, symbol } = req.query;
    let list = [];

    if (News.db && News.db.readyState === 1) {
      try {
        const q = {};
        if (category && category !== 'ALL') q.category = category;
        if (sentiment && sentiment !== 'ALL') q.sentiment = sentiment;
        if (symbol) q['tradeSuggestions.symbol'] = symbol.toUpperCase();
        list = await News.find(q).sort({ publishedAt: -1 }).lean();
      } catch (e) {}
    }
    
    // If list is from DB, filter by active market session
    let sessionFiltered = Array.isArray(list) ? list.filter(n => isWithinActiveMarketSession(n.publishedAt)) : [];

    // Auto-populate on demand if memory is empty, cache expired, or sessionFiltered is empty/sparse
    if (sessionFiltered.length === 0 || memDB.news.size === 0 || (Date.now() - lastNewsFetchTime > NEWS_CACHE_TTL)) {
      try {
        const fresh = await fetchLiveFinancialNews();
        if (Array.isArray(fresh) && fresh.length > 0) {
          memDB.news.clear();
          fresh.forEach((n, idx) => {
            memDB.news.set(n._id || `news_${idx}_${Date.now()}`, n);
          });
          lastNewsFetchTime = Date.now();
        }
      } catch (e) {
        console.warn('News auto-fetch warning:', e.message);
      }

      let memList = Array.from(memDB.news.values());
      if (category && category !== 'ALL') memList = memList.filter(n => n.category === category);
      if (sentiment && sentiment !== 'ALL') memList = memList.filter(n => n.sentiment === sentiment);
      if (symbol) {
        const s = symbol.toUpperCase();
        memList = memList.filter(n => n.tradeSuggestions && n.tradeSuggestions.some(t => t.symbol === s));
      }
      memList.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      sessionFiltered = memList.filter(n => isWithinActiveMarketSession(n.publishedAt));
    }

    res.json({
      success: true,
      count: sessionFiltered.length,
      data: sessionFiltered
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
