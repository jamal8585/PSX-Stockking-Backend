
import express from 'express';
import jwt from 'jsonwebtoken';
import { memDB } from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'psx_stockking_super_secret_jwt_key_2026';

// Multi-tenant user watchlist isolation map: userKey -> Set<Symbol>
const userWatchlists = new Map();

const getUserKey = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded?.id || decoded?.email) {
        return (decoded.id || decoded.email).toLowerCase().trim();
      }
    } catch (e) {}
  }
  return 'guest';
};

router.get('/', (req, res) => {
  const userKey = getUserKey(req);
  const userSet = userWatchlists.get(userKey) || new Set();
  const symbols = Array.from(userSet);
  const items = symbols.map(s => memDB.stocks.get(s)).filter(Boolean);
  res.json({ success: true, count: items.length, data: items });
});

router.post('/toggle', (req, res) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ success: false, message: 'Symbol is required' });
  const sym = symbol.toUpperCase().trim();
  const userKey = getUserKey(req);
  
  if (!userWatchlists.has(userKey)) {
    userWatchlists.set(userKey, new Set());
  }
  const userSet = userWatchlists.get(userKey);

  let added = false;
  if (userSet.has(sym)) {
    userSet.delete(sym);
    added = false;
  } else {
    userSet.add(sym);
    added = true;
  }
  res.json({ success: true, symbol: sym, isWatchlisted: added, totalWatchlist: userSet.size });
});

export default router;
