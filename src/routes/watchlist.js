
import express from 'express';
import { memDB } from '../config/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const symbols = Array.from(memDB.watchlist);
  const items = symbols.map(s => memDB.stocks.get(s)).filter(Boolean);
  res.json({ success: true, count: items.length, data: items });
});

router.post('/toggle', (req, res) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ success: false, message: 'Symbol is required' });
  const sym = symbol.toUpperCase();
  let added = false;
  if (memDB.watchlist.has(sym)) {
    memDB.watchlist.delete(sym);
    added = false;
  } else {
    memDB.watchlist.add(sym);
    added = true;
  }
  res.json({ success: true, symbol: sym, isWatchlisted: added, totalWatchlist: memDB.watchlist.size });
});

export default router;
