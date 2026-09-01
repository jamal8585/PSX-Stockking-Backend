import express from 'express';
import User from '../models/User.js';
import { requireAuth } from './auth.js';
import { memDB, getDBStatus } from '../config/db.js';

const router = express.Router();

// Middleware: Admin Only
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
  next();
};

router.use(requireAuth);
router.use(requireAdmin);

// Helper to calculate end date based on duration
const calculateEndDate = (duration) => {
  const now = new Date();
  switch (duration) {
    case '1_MONTH':
      return new Date(now.setMonth(now.getMonth() + 1));
    case '3_MONTHS':
      return new Date(now.setMonth(now.getMonth() + 3));
    case '1_YEAR':
      return new Date(now.setFullYear(now.getFullYear() + 1));
    case 'LIFETIME':
      return new Date(now.setFullYear(now.getFullYear() + 50));
    default:
      return null;
  }
};

// ==========================================
// 1. GET ALL USERS (GET /api/admin/users)
// ==========================================
router.get('/users', async (req, res) => {
  try {
    const { q = '', plan = 'ALL', status = 'ALL' } = req.query;

    let usersList = [];
    if (getDBStatus().isMock) {
      usersList = Array.from(memDB.users.values());
    } else {
      usersList = await User.find({}).sort({ createdAt: -1 });
    }

    // Apply filtering
    let filtered = usersList.filter(u => {
      if (plan !== 'ALL' && u.plan !== plan) return false;
      if (status !== 'ALL' && u.subscriptionStatus !== status) return false;
      if (q) {
        const query = q.toLowerCase();
        const matchesName = u.name?.toLowerCase().includes(query);
        const matchesEmail = u.email?.toLowerCase().includes(query);
        const matchesPhone = u.phone?.toLowerCase().includes(query);
        const matchesTrx = u.paymentProof?.transactionId?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesTrx) return false;
      }
      return true;
    });

    // Format safe response
    const sanitized = filtered.map(u => ({
      id: u._id || u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      plan: u.plan,
      subscriptionStatus: u.subscriptionStatus,
      subscriptionDuration: u.subscriptionDuration,
      subscriptionStart: u.subscriptionStart,
      subscriptionEnd: u.subscriptionEnd,
      paymentProof: u.paymentProof,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin
    }));

    return res.json({
      success: true,
      count: sanitized.length,
      users: sanitized
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users: ' + err.message });
  }
});

// ==========================================
// 2. UPDATE SUBSCRIPTION / ACTIVATE PRO (PUT /api/admin/users/:id/subscription)
// ==========================================
router.post('/users/:id/subscription', async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, subscriptionStatus, subscriptionDuration, extendDays } = req.body;

    let user = null;
    if (getDBStatus().isMock) {
      user = Array.from(memDB.users.values()).find(u => (u._id || u.id) === id || u.email === id);
    } else {
      user = await User.findById(id);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (plan !== undefined) user.plan = plan;
    if (subscriptionStatus !== undefined) user.subscriptionStatus = subscriptionStatus;
    if (subscriptionDuration !== undefined) user.subscriptionDuration = subscriptionDuration;

    if (plan === 'PRO') {
      user.subscriptionStatus = 'ACTIVE';
      user.subscriptionStart = user.subscriptionStart || new Date();

      if (extendDays && Number(extendDays) > 0) {
        const baseDate = user.subscriptionEnd ? new Date(user.subscriptionEnd) : new Date();
        baseDate.setDate(baseDate.getDate() + Number(extendDays));
        user.subscriptionEnd = baseDate;
      } else if (subscriptionDuration) {
        user.subscriptionEnd = calculateEndDate(subscriptionDuration);
      }
    } else if (plan === 'FREE') {
      user.plan = 'FREE';
      user.subscriptionStatus = 'INACTIVE';
      user.subscriptionDuration = 'FREE';
      user.subscriptionEnd = null;
    }

    if (getDBStatus().isMock) {
      memDB.users.set(user.email.toLowerCase(), user);
    } else {
      await User.findByIdAndUpdate(user._id, {
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionDuration: user.subscriptionDuration,
        subscriptionStart: user.subscriptionStart,
        subscriptionEnd: user.subscriptionEnd
      });
    }

    return res.json({
      success: true,
      message: `User subscription updated successfully to ${user.plan} (${user.subscriptionStatus})!`,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionDuration: user.subscriptionDuration,
        subscriptionEnd: user.subscriptionEnd
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update subscription: ' + err.message });
  }
});

// ==========================================
// 3. DELETE USER (DELETE /api/admin/users/:id)
// ==========================================
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id === id || req.user.id === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    if (getDBStatus().isMock) {
      const user = Array.from(memDB.users.values()).find(u => (u._id || u.id) === id || u.email === id);
      if (user) memDB.users.delete(user.email.toLowerCase());
    } else {
      await User.findByIdAndDelete(id);
    }

    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete user: ' + err.message });
  }
});

// ==========================================
// 4. ADMIN ANALYTICS & STATS (GET /api/admin/analytics)
// ==========================================
router.get('/analytics', async (req, res) => {
  try {
    let usersList = [];
    if (getDBStatus().isMock) {
      usersList = Array.from(memDB.users.values());
    } else {
      usersList = await User.find({});
    }

    const totalUsers = usersList.length;
    const proUsers = usersList.filter(u => u.plan === 'PRO' && u.subscriptionStatus === 'ACTIVE').length;
    const freeUsers = usersList.filter(u => u.plan === 'FREE' || u.subscriptionStatus === 'INACTIVE').length;
    const pendingApprovals = usersList.filter(u => u.subscriptionStatus === 'PENDING').length;
    const expiredUsers = usersList.filter(u => u.subscriptionStatus === 'EXPIRED').length;
    
    // Estimate MRR (Monthly Recurring Revenue in PKR assuming avg PKR 1,499 per Pro user)
    const estimatedMRR = proUsers * 1499;

    return res.json({
      success: true,
      stats: {
        totalUsers,
        proUsers,
        freeUsers,
        pendingApprovals,
        expiredUsers,
        estimatedMRR
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
