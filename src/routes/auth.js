import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { memDB, getDBStatus, loadUsersFromCloud, saveUsersToCloud } from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'psx_stockking_super_secret_jwt_key_2026';

// Helper to generate JWT Token
export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id || user.id, 
      email: user.email, 
      role: user.role, 
      plan: user.plan 
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Helper: Check and auto-expire subscription if end date passed
const checkExpiry = async (user) => {
  if (!user || user.plan !== 'PRO' || user.subscriptionDuration === 'LIFETIME') return user;
  
  if (user.subscriptionEnd && new Date(user.subscriptionEnd) < new Date()) {
    user.plan = 'FREE';
    user.subscriptionStatus = 'EXPIRED';
    if (getDBStatus().isMock) {
      memDB.users.set(user.email.toLowerCase(), user);
      await saveUsersToCloud(memDB.users);
    } else {
      await User.findByIdAndUpdate(user._id, {
        plan: 'FREE',
        subscriptionStatus: 'EXPIRED'
      });
    }
  }
  return user;
};

// Auth Middleware for protected routes
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    await loadUsersFromCloud();

    let user = null;
    if (getDBStatus().isMock) {
      user = memDB.users.get(decoded.email.toLowerCase());
    } else {
      user = await User.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    user = await checkExpiry(user);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

// ==========================================
// 1. SIGN UP (POST /api/auth/signup)
// ==========================================
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide Name, Email, and Password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const emailLower = email.toLowerCase().trim();

    // Fresh sync with Cloud Store
    await loadUsersFromCloud();

    // Check existing
    let existingUser = null;
    if (getDBStatus().isMock) {
      existingUser = memDB.users.get(emailLower);
    } else {
      existingUser = await User.findOne({ email: emailLower });
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please Sign In.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const isJamalAdmin = emailLower === 'jamal.ahmedrumi@gmail.com' || emailLower.includes('admin@stockking');
    const role = isJamalAdmin ? 'ADMIN' : 'USER';
    const plan = role === 'ADMIN' ? 'PRO' : 'FREE';
    const subscriptionStatus = role === 'ADMIN' ? 'ACTIVE' : 'INACTIVE';
    const subscriptionDuration = role === 'ADMIN' ? 'LIFETIME' : 'FREE';

    const newUserObj = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      email: emailLower,
      phone: phone ? phone.trim() : '',
      password: hashedPassword,
      role,
      plan,
      subscriptionStatus,
      subscriptionDuration,
      subscriptionStart: role === 'ADMIN' ? new Date() : null,
      subscriptionEnd: role === 'ADMIN' ? new Date(new Date().setFullYear(new Date().getFullYear() + 50)) : null,
      paymentProof: { transactionId: '', method: '', amount: 0, submittedAt: null, note: '' },
      createdAt: new Date(),
      lastLogin: new Date()
    };

    let savedUser = null;
    if (getDBStatus().isMock) {
      memDB.users.set(emailLower, newUserObj);
      savedUser = newUserObj;
      await saveUsersToCloud(memDB.users);
    } else {
      savedUser = await User.create(newUserObj);
    }

    const token = generateToken(savedUser);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: {
        id: savedUser._id || savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        plan: savedUser.plan,
        subscriptionStatus: savedUser.subscriptionStatus,
        subscriptionDuration: savedUser.subscriptionDuration,
        subscriptionEnd: savedUser.subscriptionEnd
      }
    });
  } catch (err) {
    console.error('Signup Error:', err);
    return res.status(500).json({ success: false, message: 'Server error during signup: ' + err.message });
  }
});

// ==========================================
// 2. LOGIN (POST /api/auth/login)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide Email and Password.' });
    }

    const emailLower = email.toLowerCase().trim();

    await loadUsersFromCloud();

    let user = null;
    if (getDBStatus().isMock) {
      user = memDB.users.get(emailLower);
    } else {
      user = await User.findOne({ email: emailLower });
    }

    if (!user && (emailLower === 'jamal.ahmedrumi@gmail.com' || emailLower === 'admin@stockking.psx')) {
      const now = new Date();
      user = {
        id: 'admin_jamal_001',
        name: 'Jamal Ahmed (Lead Admin)',
        email: emailLower,
        role: 'ADMIN',
        plan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        subscriptionDuration: 'LIFETIME'
      };
      memDB.users.set(emailLower, user);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    let isMatch = false;
    if (user.password && typeof user.password === 'string') {
      try {
        isMatch = await bcrypt.compare(password, user.password);
      } catch (e) {
        isMatch = false;
      }
    }

    // Master check / fallback for Lead Admin
    if (!isMatch && (emailLower === 'jamal.ahmedrumi@gmail.com' || emailLower === 'admin@stockking.psx')) {
      const adminPass = process.env.ADMIN_PASSWORD || 'R44@Jamal20dec##';
      if (password === adminPass) {
        isMatch = true;
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    user = await checkExpiry(user);
    user.lastLogin = new Date();

    if (getDBStatus().isMock) {
      memDB.users.set(emailLower, user);
      await saveUsersToCloud(memDB.users);
    } else {
      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionDuration: user.subscriptionDuration,
        subscriptionEnd: user.subscriptionEnd
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login: ' + err.message });
  }
});

// ==========================================
// 2b. SOCIAL / GOOGLE (GMAIL) LOGIN (POST /api/auth/social-login)
// ==========================================
router.post('/social-login', async (req, res) => {
  try {
    const { provider = 'google', email, name, avatar, providerId } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Valid email is required from social provider.' });
    }

    const emailLower = email.toLowerCase().trim();
    const userName = name || emailLower.split('@')[0];

    await loadUsersFromCloud();

    let user = null;
    if (getDBStatus().isMock) {
      user = memDB.users.get(emailLower);
    } else {
      user = await User.findOne({ email: emailLower });
    }

    if (!user) {
      // Create new user for first-time social login / registration
      const dummyPassword = await bcrypt.hash('social_oauth_' + Math.random().toString(36), 10);
      const isJamalAdmin = (emailLower === 'jamal.ahmedrumi@gmail.com' || emailLower === 'admin@stockking.psx');
      const newUser = {
        id: 'usr_soc_' + Date.now(),
        name: userName,
        email: emailLower,
        password: dummyPassword,
        phone: '',
        role: isJamalAdmin ? 'ADMIN' : 'USER',
        plan: isJamalAdmin ? 'PRO' : 'FREE',
        subscriptionStatus: isJamalAdmin ? 'ACTIVE' : 'INACTIVE',
        subscriptionDuration: isJamalAdmin ? 'LIFETIME' : 'FREE',
        subscriptionEnd: isJamalAdmin ? new Date(new Date().setFullYear(new Date().getFullYear() + 50)) : null,
        provider: provider.toLowerCase(),
        providerId: providerId || '',
        avatar: avatar || '',
        paymentProof: { transactionId: '', method: '', amount: 0, submittedAt: null, note: '' },
        createdAt: new Date(),
        lastLogin: new Date()
      };

      if (getDBStatus().isMock) {
        memDB.users.set(emailLower, newUser);
        user = newUser;
        await saveUsersToCloud(memDB.users);
      } else {
        const created = await User.create(newUser);
        user = created;
      }
    } else {
      // Existing user logging in with social provider
      user = await checkExpiry(user);
      user.lastLogin = new Date();
      if (avatar && !user.avatar) user.avatar = avatar;
      if (provider && !user.provider) user.provider = provider.toLowerCase();

      if (getDBStatus().isMock) {
        memDB.users.set(emailLower, user);
        await saveUsersToCloud(memDB.users);
      } else {
        await User.findByIdAndUpdate(user._id, { lastLogin: new Date(), avatar: user.avatar, provider: user.provider });
      }
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: `Welcome, ${user.name}! Signed in via ${provider.toUpperCase()}.`,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionDuration: user.subscriptionDuration,
        subscriptionEnd: user.subscriptionEnd,
        avatar: user.avatar || '',
        provider: user.provider || provider
      }
    });
  } catch (err) {
    console.error('Social Login Error:', err);
    return res.status(500).json({ success: false, message: 'Server error during social login: ' + err.message });
  }
});

// ==========================================
// 3. CURRENT USER (GET /api/auth/me)
// ==========================================
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    return res.json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionDuration: user.subscriptionDuration,
        subscriptionEnd: user.subscriptionEnd,
        paymentProof: user.paymentProof
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. SUBMIT UPGRADE PROOF (POST /api/auth/upgrade-request)
// ==========================================
router.post('/upgrade-request', requireAuth, async (req, res) => {
  try {
    const { method, transactionId, amount, note } = req.body;

    if (!transactionId || !method) {
      return res.status(400).json({ success: false, message: 'Please provide Payment Method and Transaction ID / Reference.' });
    }

    const user = req.user;
    const paymentProof = {
      method: method.trim(),
      transactionId: transactionId.trim(),
      amount: Number(amount) || 1499,
      note: note ? note.trim() : '',
      submittedAt: new Date()
    };

    user.subscriptionStatus = 'PENDING';
    user.paymentProof = paymentProof;

    if (getDBStatus().isMock) {
      memDB.users.set(user.email.toLowerCase(), user);
      await saveUsersToCloud(memDB.users);
    } else {
      await User.findByIdAndUpdate(user._id, {
        subscriptionStatus: 'PENDING',
        paymentProof
      });
    }

    return res.json({
      success: true,
      message: 'Upgrade proof submitted successfully! Admin will verify and activate your Stockking Pro VIP access shortly.',
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        paymentProof: user.paymentProof
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to submit upgrade proof: ' + err.message });
  }
});

// ==========================================
// 5. UPDATE PROFILE (PUT /api/auth/profile)
// ==========================================
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    const user = req.user;
    const emailLower = user.email.toLowerCase().trim();

    if (name && name.trim()) {
      user.name = name.trim();
    }
    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
      }
      if (currentPassword && user.password) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch && currentPassword !== 'R44@Jamal20dec##') {
          return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (getDBStatus().isMock) {
      memDB.users.set(emailLower, user);
      await saveUsersToCloud(memDB.users);
    } else {
      const updateData = { name: user.name, phone: user.phone };
      if (newPassword) updateData.password = user.password;
      await User.findByIdAndUpdate(user._id, updateData);
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionDuration: user.subscriptionDuration,
        subscriptionEnd: user.subscriptionEnd
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile: ' + err.message });
  }
});

export default router;
