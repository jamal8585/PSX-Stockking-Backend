
import express from 'express';
import Stock from '../models/Stock.js';
import { memDB } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { sector, signal, search, sortBy = 'volume', sortDir = 'desc' } = req.query;
    let list = [];

    if (Stock.db && Stock.db.readyState === 1) {
      const query = {};
      if (sector && sector !== 'ALL') query.sector = sector;
      if (signal && signal !== 'ALL') query['technicals.signal'] = signal;
      if (search) {
        query.$or = [
          { symbol: new RegExp(search, 'i') },
          { name: new RegExp(search, 'i') }
        ];
      }
      list = await Stock.find(query).lean();
    } else {
      list = Array.from(memDB.stocks.values());
      if (sector && sector !== 'ALL') {
        list = list.filter(s => s.sector.toLowerCase() === sector.toLowerCase());
      }
      if (signal && signal !== 'ALL') {
        list = list.filter(s => s.technicals?.signal === signal);
      }
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
      }
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
    const sym = req.params.symbol.toUpperCase();
    let stock = null;

    if (Stock.db && Stock.db.readyState === 1) {
      stock = await Stock.findOne({ symbol: sym }).lean();
    } else {
      stock = memDB.stocks.get(sym);
    }

    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock ' + sym + ' not found in PSX universe.' });
    }

    const rec = memDB.recommendations.get(sym) || null;

    res.json({
      success: true,
      data: {
        ...stock,
        recommendation: rec
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
