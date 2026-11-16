
import express from 'express';
import jwt from 'jsonwebtoken';
import Portfolio from '../models/Portfolio.js';
import Stock from '../models/Stock.js';
import { memDB } from '../config/db.js';
import { generateAIExitAdvice } from '../services/aiAdvisorService.js';

const router = express.Router();
const memPortfolio = new Map();
const JWT_SECRET = process.env.JWT_SECRET || 'psx_stockking_super_secret_jwt_key_2026';

// Helper to safely extract user identity from JWT
const getUserIdFromReq = (req) => {
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
  return null;
};

router.get('/', async (req, res) => {
  try {
    const userKey = getUserIdFromReq(req);

    // Unauthenticated visitors do not see or leak any user portfolio
    if (!userKey) {
      return res.json({
        success: true,
        summary: {
          totalInvested: 0,
          totalCurrentValue: 0,
          totalUnrealizedPnl: 0,
          totalPnlPercent: 0,
          totalTodayPnl: 0,
          totalTodayPnlPercent: 0,
          winRate: 0
        },
        positions: []
      });
    }

    let positions = [];
    if (Portfolio.db && Portfolio.db.readyState === 1) {
      try {
        positions = await Portfolio.find({
          $or: [{ userId: userKey }, { userEmail: userKey }]
        }).sort({ createdAt: -1 }).lean();
      } catch (e) {
        console.warn('Portfolio find warning:', e.message);
      }
    }
    
    if (!positions || positions.length === 0) {
      positions = Array.from(memPortfolio.values()).filter(p => 
        p.userId === userKey || p.userEmail === userKey
      );
    }

    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalUnrealizedPnl = 0;
    let totalTodayPnl = 0;

    const enrichedPositions = await Promise.all(positions.map(async (pos) => {
      const sym = pos.symbol ? pos.symbol.toUpperCase().trim() : 'UNKNOWN';
      const stock = memDB.stocks.get(sym) || {
        currentPrice: Number(pos.buyPrice),
        prevClose: Number(pos.buyPrice),
        change: 0,
        changePercent: 0,
        name: pos.name || sym,
        sector: pos.sector || 'General Market',
        technicals: { rsi14: 50, trend: 'NEUTRAL', support1: pos.buyPrice * 0.95, resistance1: pos.buyPrice * 1.10 }
      };

      const currentPrice = Number(stock.currentPrice || pos.buyPrice);
      const buyPrice = Number(pos.buyPrice);
      const quantity = Number(pos.quantity);

      const invested = Number((buyPrice * quantity).toFixed(2));
      const currentValue = Number((currentPrice * quantity).toFixed(2));
      const pnlAmount = Number((currentValue - invested).toFixed(2));
      const pnlPercent = invested > 0 ? Number(((pnlAmount / invested) * 100).toFixed(2)) : 0;

      // Calculate Today's P&L (Aaj ka din ka munafa)
      const dayChangePerShare = Number(stock.change || 0);
      const todayPnlAmount = Number((dayChangePerShare * quantity).toFixed(2));
      const todayPnlPercent = Number(stock.changePercent || 0);

      totalInvested += invested;
      totalCurrentValue += currentValue;
      totalUnrealizedPnl += pnlAmount;
      totalTodayPnl += todayPnlAmount;

      // Find any matched live news for this held stock
      let matchedNews = null;
      for (const n of memDB.news.values()) {
        if (n.tradeSuggestions && n.tradeSuggestions.some(t => t.symbol === sym)) {
          matchedNews = n;
          break;
        }
      }

      // Generate Live AI Exit & Accumulation Advice
      const aiAdvice = await generateAIExitAdvice({
        symbol: sym,
        name: pos.name || stock.name,
        sector: pos.sector || stock.sector,
        buyPrice,
        currentPrice,
        quantity,
        pnlAmount,
        pnlPercent,
        technicals: stock.technicals,
        matchedNews
      });

      return {
        _id: String(pos._id || ('port_' + sym)),
        symbol: sym,
        name: pos.name || stock.name,
        sector: pos.sector || stock.sector,
        positionType: pos.positionType || 'BUY_LONG',
        buyPrice,
        quantity,
        buyDate: pos.buyDate || pos.createdAt || new Date(),
        notes: pos.notes || '',
        currentPrice,
        prevClose: stock.prevClose || currentPrice,
        dayChange: dayChangePerShare,
        dayChangePercent: todayPnlPercent,
        todayPnlAmount,
        todayPnlPercent,
        invested,
        currentValue,
        pnlAmount,
        pnlPercent,
        technicals: stock.technicals,
        matchedNews: matchedNews ? { title: matchedNews.title, sentiment: matchedNews.sentiment, timeAgo: matchedNews.timeAgo } : null,
        aiAdvice
      };
    }));

    const totalPrevValue = totalCurrentValue - totalTodayPnl;
    const totalPnlPercent = totalInvested > 0 ? Number(((totalUnrealizedPnl / totalInvested) * 100).toFixed(2)) : 0;
    const totalTodayPnlPercent = totalPrevValue > 0 ? Number(((totalTodayPnl / totalPrevValue) * 100).toFixed(2)) : 0;

    res.json({
      success: true,
      summary: {
        totalPositions: enrichedPositions.length,
        totalInvested: Number(totalInvested.toFixed(2)),
        totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
        totalUnrealizedPnl: Number(totalUnrealizedPnl.toFixed(2)),
        totalPnlPercent,
        totalTodayPnl: Number(totalTodayPnl.toFixed(2)),
        totalTodayPnlPercent,
        winRate: enrichedPositions.length > 0 
          ? Math.round((enrichedPositions.filter(p => p.pnlAmount >= 0).length / enrichedPositions.length) * 100)
          : 0
      },
      positions: enrichedPositions
    });
  } catch (err) {
    console.error('Portfolio GET Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const userKey = getUserIdFromReq(req);
    if (!userKey) {
      return res.status(401).json({ success: false, message: 'Please sign in to save and manage portfolio positions.' });
    }

    const { symbol, buyPrice, quantity, positionType = 'BUY_LONG', notes = '' } = req.body;
    if (!symbol || !buyPrice || !quantity) {
      return res.status(400).json({ success: false, message: 'Symbol, buyPrice, and quantity are required.' });
    }

    const sym = symbol.toUpperCase().trim();
    const stockInfo = memDB.stocks.get(sym);
    const resolvedName = stockInfo?.name || sym;
    const resolvedSector = (stockInfo?.sector && stockInfo.sector !== 'General Market') 
      ? stockInfo.sector 
      : 'Miscellaneous';

    let createdId = 'port_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    const newPosition = {
      userId: userKey,
      userEmail: userKey,
      symbol: sym,
      name: resolvedName,
      sector: resolvedSector,
      positionType,
      buyPrice: Number(buyPrice),
      quantity: Number(quantity),
      notes,
      buyDate: new Date()
    };

    if (Portfolio.db && Portfolio.db.readyState === 1) {
      try {
        const saved = await Portfolio.create(newPosition);
        createdId = String(saved._id);
      } catch (dbErr) {
        console.warn('MongoDB portfolio save notice:', dbErr.message);
      }
    }

    newPosition._id = createdId;
    memPortfolio.set(createdId, newPosition);

    console.log(`✅ Portfolio Position Added: ${sym} (${quantity} shares @ PKR ${buyPrice}) for ${userKey}`);

    res.json({
      success: true,
      message: 'Position added successfully to live portfolio.',
      data: newPosition
    });
  } catch (err) {
    console.error('Portfolio POST Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const userKey = getUserIdFromReq(req);
    if (!userKey) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const id = req.params.id;
    const { buyPrice, quantity, notes } = req.body;
    
    if (Portfolio.db && Portfolio.db.readyState === 1) {
      try {
        await Portfolio.findOneAndUpdate(
          { _id: id, $or: [{ userId: userKey }, { userEmail: userKey }] },
          {
            ...(buyPrice ? { buyPrice: Number(buyPrice) } : {}),
            ...(quantity ? { quantity: Number(quantity) } : {}),
            ...(notes !== undefined ? { notes } : {})
          }
        );
      } catch (e) {}
    }

    const existing = memPortfolio.get(id);
    if (existing && (existing.userId === userKey || existing.userEmail === userKey)) {
      if (buyPrice) existing.buyPrice = Number(buyPrice);
      if (quantity) existing.quantity = Number(quantity);
      if (notes !== undefined) existing.notes = notes;
      memPortfolio.set(id, existing);
    }

    res.json({
      success: true,
      message: 'Position updated successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userKey = getUserIdFromReq(req);
    if (!userKey) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const id = req.params.id;
    if (Portfolio.db && Portfolio.db.readyState === 1) {
      try {
        await Portfolio.findOneAndDelete({ _id: id, $or: [{ userId: userKey }, { userEmail: userKey }] });
      } catch (e) {}
    }

    const existing = memPortfolio.get(id);
    if (existing && (existing.userId === userKey || existing.userEmail === userKey)) {
      memPortfolio.delete(id);
    }

    res.json({
      success: true,
      message: 'Position removed from portfolio.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
