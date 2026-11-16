import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import Recommendation from '../models/Recommendation.js';
import { memDB } from '../config/db.js';
import { syncMarketData } from '../services/seedService.js';
import { getPSXMarketStatus } from '../services/livePsxScraper.js';
import { 
  getSnapshotsForDate, 
  initSnapshotEngine, 
  computeHistoricalOutcome 
} from '../services/snapshotService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'psx_stockking_super_secret_jwt_key_2026';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let officialQuotes = {};
try {
  const qPath = path.join(__dirname, '../data/official_quotes.json');
  if (fs.existsSync(qPath)) {
    officialQuotes = JSON.parse(fs.readFileSync(qPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not load official_quotes.json in recommendations:', e.message);
}

// Initialize snapshot engine on boot
initSnapshotEngine().catch(e => console.warn('Snapshot engine init warning:', e.message));

const router = express.Router();

// Generate Last N PSX Trading Days (skips Saturday and Sunday)
export function getPSXRecentTradingSessions(count = 5) {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const pktDate = new Date(utc + (3600000 * 5));
  const marketStatus = getPSXMarketStatus();
  const isMarketOpen = marketStatus.isOpen;
  const hours = pktDate.getHours();
  const minutes = pktDate.getMinutes();
  const isPostMarket = hours >= 16;
  
  const sessions = [];
  let cur = new Date(pktDate);
  const day = cur.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat

  if (day === 6) { // Sat
    const mon = new Date(cur);
    mon.setDate(cur.getDate() + 2);
    sessions.push({
      dateStr: mon.toISOString().split('T')[0],
      label: `Mon, ${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Karachi' })}`,
      badge: 'Upcoming (Mon)',
      isLive: false,
      dayOffset: 0
    });
  } else if (day === 0) { // Sun
    const mon = new Date(cur);
    mon.setDate(cur.getDate() + 1);
    sessions.push({
      dateStr: mon.toISOString().split('T')[0],
      label: `Mon, ${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Karachi' })}`,
      badge: 'Upcoming (Mon)',
      isLive: false,
      dayOffset: 0
    });
  } else if (isPostMarket) {
    // Post-Market: Tomorrow is Tab 0, Today Close is Tab 1
    const nextTradingDay = new Date(cur);
    nextTradingDay.setDate(cur.getDate() + (day === 5 ? 3 : 1));
    const nextWeekday = nextTradingDay.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Karachi' });
    const nextDateFmt = nextTradingDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Karachi' });
    
    sessions.push({
      dateStr: nextTradingDay.toISOString().split('T')[0],
      label: `${nextWeekday}, ${nextDateFmt}`,
      badge: day === 5 ? "Upcoming (Mon)" : "Tomorrow's Open",
      isLive: false,
      dayOffset: 0
    });

    sessions.push({
      dateStr: cur.toISOString().split('T')[0],
      label: `Today, ${cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Karachi' })}`,
      badge: "Today's Close / EOD",
      isLive: false,
      dayOffset: 1
    });
  } else {
    sessions.push({
      dateStr: cur.toISOString().split('T')[0],
      label: `Today, ${cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Karachi' })} ${isMarketOpen ? '(Live)' : '(EOD)'}`,
      badge: isMarketOpen ? 'Live Session' : 'Closing / EOD',
      isLive: isMarketOpen,
      dayOffset: 0
    });
  }

  let backtrack = new Date(cur);
  let offsetCounter = sessions.length;

  while (sessions.length < count) {
    backtrack.setDate(backtrack.getDate() - 1);
    const bDay = backtrack.getDay();
    if (bDay !== 0 && bDay !== 6) { // Mon-Fri only
      const dateStr = backtrack.toISOString().split('T')[0];
      if (!sessions.some(s => s.dateStr === dateStr)) {
        const weekday = backtrack.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Karachi' });
        const dateFmt = backtrack.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Karachi' });
        sessions.push({
          dateStr,
          label: `${weekday}, ${dateFmt}`,
          badge: `Day -${offsetCounter}`,
          isLive: false,
          dayOffset: offsetCounter
        });
        offsetCounter++;
      }
    }
  }

  return sessions.slice(0, count);
}

// GET /api/recommendations/sessions (List available 5 trading sessions)
router.get('/sessions', (req, res) => {
  const sessions = getPSXRecentTradingSessions(5);
  res.json({
    success: true,
    sessions
  });
});

// GET /api/recommendations/snapshots (Dedicated immutable snapshot archive query endpoint)
router.get('/snapshots', (req, res) => {
  const sessionDate = req.query.session_date || req.query.date;
  if (!sessionDate) {
    return res.status(400).json({ success: false, error: 'session_date is required' });
  }

  const snapshots = getSnapshotsForDate(sessionDate);
  res.json({
    success: true,
    session_date: sessionDate,
    count: snapshots.length,
    snapshots
  });
});

// GET /api/recommendations
router.get('/', async (req, res) => {
  try {
    const { signal, sector, date, session_date } = req.query;
    const requestedDate = session_date || date;
    const availableSessions = getPSXRecentTradingSessions(5);
    const requestedSession = requestedDate 
      ? availableSessions.find(s => s.dateStr === requestedDate) || { dateStr: requestedDate, label: requestedDate, dayOffset: 1 }
      : availableSessions[0];

    const targetDateStr = requestedSession.dateStr;
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const pktDate = new Date(utc + (3600000 * 5));
    const todayPktStr = pktDate.toISOString().split('T')[0];

    let list = [];

    // 1. First check if immutable snapshot records exist for this session date
    const snapshots = getSnapshotsForDate(targetDateStr);
    if (snapshots && snapshots.length > 0) {
      list = snapshots.map(s => {
        const sym = (s.ticker || '').toUpperCase().trim();
        const official = officialQuotes ? officialQuotes[sym] : null;
        const livePrice = Number(official?.currentPrice || s.closing_price || 100);
        
        // Re-evaluate outcome against latest market price for historical days
        const outcome = s.outcome && s.outcome.status !== 'IN_PROGRESS' 
          ? s.outcome 
          : computeHistoricalOutcome(s, livePrice);

        return {
          symbol: s.ticker,
          companyName: s.name,
          sector: s.sector,
          signal: s.signal_type,
          currentPrice: s.closing_price,
          prevClose: s.prev_close,
          change: s.change,
          changePercent: s.change_percent,
          entryZone: { min: s.entry_min, max: s.entry_max },
          stopLoss: s.stop_loss,
          target1: s.target_1,
          target2: s.target_2,
          rsi: s.rsi,
          confidence: s.confidence,
          reasons: s.reasons,
          isMomentumBreakout: s.is_momentum_breakout,
          outcome,
          date: s.session_date,
          isHistoricalSnapshot: s.session_date < todayPktStr
        };
      });
    } else {
      // Fallback to active recommendation store
      if (Recommendation.db && Recommendation.db.readyState === 1) {
        const q = {};
        if (signal && signal !== 'ALL') q.signal = signal;
        if (sector && sector !== 'ALL') q.sector = sector;
        if (targetDateStr) q.date = targetDateStr;
        list = await Recommendation.find(q).sort({ confidence: -1 }).lean();
      } else {
        if (memDB.recommendations.size === 0) {
          try {
            await syncMarketData();
          } catch (syncErr) {
            console.warn('On-demand sync warning:', syncErr.message);
          }
        }
        list = Array.from(memDB.recommendations.values());
        if (signal && signal !== 'ALL') list = list.filter(r => r.signal === signal);
        if (sector && sector !== 'ALL') list = list.filter(r => r.sector.toLowerCase() === sector.toLowerCase());
        if (targetDateStr) list = list.filter(r => r.date === targetDateStr);
        list.sort((a, b) => b.confidence - a.confidence);
      }

      // Attach outcome evaluation
      list = list.map(item => {
        const sym = (item.symbol || '').toUpperCase().trim();
        const official = officialQuotes ? officialQuotes[sym] : null;
        const livePrice = Number(official?.currentPrice || item.currentPrice || 100);
        const outcome = computeHistoricalOutcome(item, livePrice);
        return {
          ...item,
          outcome
        };
      });
    }

    // Apply filters
    if (signal && signal !== 'ALL') {
      list = list.filter(r => r.signal === signal);
    }
    if (sector && sector !== 'ALL') {
      list = list.filter(r => (r.sector || '').toLowerCase() === sector.toLowerCase());
    }
    list.sort((a, b) => b.confidence - a.confidence);

    // Check Pro Subscription Authenticity
    const authHeader = req.headers.authorization;
    let isProUser = false;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && (decoded.plan === 'PRO' || decoded.role === 'ADMIN')) {
          isProUser = true;
        }
      } catch (e) {
        isProUser = false;
      }
    }

    // Server-Side Paywall: For free or unauthenticated users, protect pro setups (index >= 2)
    const securedList = list.map((item, idx) => {
      if (!isProUser && idx >= 2) {
        return {
          ...item,
          entryZone: { min: null, max: null },
          stopLoss: null,
          target1: null,
          target2: null,
          reasons: ['Pro Quantitative Setup: Upgrade to StockKing Pro to unlock algorithmic entry ranges and multi-tier targets.'],
          isLocked: true
        };
      }
      return {
        ...item,
        isLocked: false
      };
    });

    const strongBuy = securedList.filter(r => r.signal === 'STRONG_BUY');
    const accumulate = securedList.filter(r => r.signal === 'ACCUMULATE');
    const hold = securedList.filter(r => r.signal === 'HOLD');
    const avoidSell = securedList.filter(r => r.signal === 'AVOID_SELL');

    const marketTiming = getPSXMarketStatus();

    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.json({
      success: true,
      sessions: availableSessions,
      selectedSession: requestedSession,
      marketStatus: marketTiming,
      isEodFrozen: marketTiming.isEodFrozen,
      eodSnapshotDate: marketTiming.eodSnapshotDate,
      nextTradingDate: marketTiming.nextTradingDate,
      actionableLabel: marketTiming.actionableLabel,
      isProUser,
      summary: {
        total: securedList.length,
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
      all: securedList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
