import express from 'express';
import User from '../models/User.js';
import { requireAuth } from './auth.js';
import { memDB, getDBStatus, loadUsersFromCloud, saveUsersToCloud } from '../config/db.js';

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
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case '3_MONTHS':
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    case '1_YEAR':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    case 'LIFETIME':
      return new Date(now.getTime() + 50 * 365 * 24 * 60 * 60 * 1000);
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

    // Fresh sync with cloud persistent store
    await loadUsersFromCloud();

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

    // Format safe response with complete subscription details
    const sanitized = filtered.map(u => ({
      id: u._id || u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role || 'USER',
      plan: u.plan || 'FREE',
      subscriptionStatus: u.subscriptionStatus || 'INACTIVE',
      subscriptionDuration: u.subscriptionDuration || 'FREE',
      subscriptionStart: u.subscriptionStart || null,
      subscriptionEnd: u.subscriptionEnd || null,
      paymentProof: u.paymentProof || { transactionId: '', method: '', amount: 0, submittedAt: null, note: '' },
      createdAt: u.createdAt || new Date(),
      lastLogin: u.lastLogin || new Date()
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
// 1b. SYNC REGISTERED USERS (POST /api/admin/sync-users)
// ==========================================
router.post('/sync-users', async (req, res) => {
  try {
    const { clientUsers = [] } = req.body;

    await loadUsersFromCloud();

    if (Array.isArray(clientUsers)) {
      for (const cu of clientUsers) {
        if (!cu.email) continue;
        const emailLower = cu.email.toLowerCase().trim();
        const existing = memDB.users.get(emailLower);
        
        if (!existing) {
          memDB.users.set(emailLower, {
            id: cu.id || 'usr_' + Date.now(),
            name: cu.name || emailLower.split('@')[0],
            email: emailLower,
            phone: cu.phone || '',
            role: cu.role || 'USER',
            plan: cu.plan || 'FREE',
            subscriptionStatus: cu.subscriptionStatus || 'INACTIVE',
            subscriptionDuration: cu.subscriptionDuration || 'FREE',
            subscriptionStart: cu.subscriptionStart || null,
            subscriptionEnd: cu.subscriptionEnd || null,
            paymentProof: cu.paymentProof || { transactionId: '', method: '', amount: 0, submittedAt: null, note: '' },
            createdAt: cu.createdAt || new Date(),
            lastLogin: cu.lastLogin || new Date()
          });
        }
      }
      await saveUsersToCloud(memDB.users);
    }

    const allUsers = Array.from(memDB.users.values()).map(u => ({
      id: u._id || u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role || 'USER',
      plan: u.plan || 'FREE',
      subscriptionStatus: u.subscriptionStatus || 'INACTIVE',
      subscriptionDuration: u.subscriptionDuration || 'FREE',
      subscriptionStart: u.subscriptionStart || null,
      subscriptionEnd: u.subscriptionEnd || null,
      paymentProof: u.paymentProof || { transactionId: '', method: '', amount: 0, submittedAt: null, note: '' },
      createdAt: u.createdAt || new Date(),
      lastLogin: u.lastLogin || new Date()
    }));

    return res.json({
      success: true,
      count: allUsers.length,
      users: allUsers
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Sync failed: ' + err.message });
  }
});

// ==========================================
// 1c. CREATE USER MANUALLY (POST /api/admin/create-user)
// ==========================================
router.post('/create-user', async (req, res) => {
  try {
    const { name, email, phone, role = 'USER', plan = 'FREE', duration = 'FREE' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and Email are required.' });
    }

    const emailLower = email.toLowerCase().trim();
    await loadUsersFromCloud();

    if (memDB.users.has(emailLower)) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const now = new Date();
    const isPro = plan === 'PRO';
    const subEnd = isPro ? calculateEndDate(duration || '1_MONTH') : null;

    const newUser = {
      id: 'usr_manual_' + Date.now(),
      name: name.trim(),
      email: emailLower,
      phone: phone ? phone.trim() : '',
      role: role.toUpperCase(),
      plan: isPro ? 'PRO' : 'FREE',
      subscriptionStatus: isPro ? 'ACTIVE' : 'INACTIVE',
      subscriptionDuration: isPro ? (duration || '1_MONTH') : 'FREE',
      subscriptionStart: isPro ? now : null,
      subscriptionEnd: subEnd,
      paymentProof: { transactionId: 'MANUAL_ADMIN_ENTRY', method: 'Admin Grant', amount: isPro ? 1499 : 0, submittedAt: now, note: 'Manually added by Lead Admin' },
      createdAt: now,
      lastLogin: now
    };

    memDB.users.set(emailLower, newUser);
    await saveUsersToCloud(memDB.users);

    if (!getDBStatus().isMock) {
      await User.create(newUser);
    }

    return res.status(201).json({
      success: true,
      message: `User ${newUser.name} created successfully with ${newUser.plan} plan!`,
      user: newUser
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create user: ' + err.message });
  }
});

// ==========================================
// 2. UPDATE SUBSCRIPTION / ACTIVATE PRO (POST /api/admin/users/:id/subscription)
// ==========================================
router.post('/users/:id/subscription', async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, subscriptionStatus, subscriptionDuration, extendDays } = req.body;

    await loadUsersFromCloud();

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
      user.subscriptionStatus = subscriptionStatus || 'INACTIVE';
      user.subscriptionDuration = 'FREE';
      user.subscriptionEnd = null;
    }

    if (getDBStatus().isMock) {
      memDB.users.set(user.email.toLowerCase(), user);
      await saveUsersToCloud(memDB.users);
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
        subscriptionStart: user.subscriptionStart,
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

    if (req.user._id === id || req.user.id === id || req.user.email === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    await loadUsersFromCloud();

    if (getDBStatus().isMock) {
      const user = Array.from(memDB.users.values()).find(u => (u._id || u.id) === id || u.email === id);
      if (user) {
        memDB.users.delete(user.email.toLowerCase());
        await saveUsersToCloud(memDB.users);
      }
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
    await loadUsersFromCloud();

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
    
    // Calculate accurate MRR in PKR based on active subscription packages
    const estimatedMRR = usersList.reduce((sum, u) => {
      if (u.plan === 'PRO' && u.subscriptionStatus === 'ACTIVE') {
        if (u.subscriptionDuration === '3_MONTHS') return sum + Math.round(3999 / 3);
        if (u.subscriptionDuration === '1_YEAR') return sum + Math.round(12999 / 12);
        return sum + 1499;
      }
      return sum;
    }, 0);

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
