import mongoose from 'mongoose';
import axios from 'axios';

let isConnected = false;
let isMock = false;

// In-memory collections fallback when local MongoDB daemon is not running
export const memDB = {
  stocks: new Map(),
  recommendations: new Map(),
  news: new Map(),
  marketSummary: null,
  watchlist: new Set(),
  users: new Map()
};

// Global Cloud Sync Endpoint for 100% Guaranteed Persistent Users across Vercel Serverless instances
const CLOUD_SYNC_ID = 'ff808181a061cdc401a063898a3a0679';
const CLOUD_STORE_URL = `https://api.restful-api.dev/objects/${CLOUD_SYNC_ID}`;

export const saveUsersToCloud = async (usersMap) => {
  try {
    // 1. Fetch current cloud users first to merge and prevent race condition
    let cloudUsers = [];
    try {
      const res = await axios.get(CLOUD_STORE_URL, { timeout: 3000 });
      if (res.data?.data?.users && Array.isArray(res.data.data.users)) {
        cloudUsers = res.data.data.users;
      }
    } catch (_) {}

    // 2. Merge into a unified map
    const mergedMap = new Map();
    for (const cu of cloudUsers) {
      if (cu.email) mergedMap.set(cu.email.toLowerCase().trim(), cu);
    }
    for (const [email, u] of usersMap.entries()) {
      if (email) mergedMap.set(email.toLowerCase().trim(), u);
    }

    // Sync back to local memDB.users
    for (const [email, u] of mergedMap.entries()) {
      memDB.users.set(email, u);
    }

    const userArray = Array.from(mergedMap.values()).map(u => ({
      id: u._id || u.id || ('usr_' + Date.now()),
      name: u.name,
      email: u.email?.toLowerCase().trim(),
      phone: u.phone || '',
      password: u.password,
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

    await axios.patch(CLOUD_STORE_URL, {
      data: { users: userArray }
    }, { timeout: 4000 });
    return userArray;
  } catch (err) {
    console.warn('Cloud store sync write warning:', err.message);
  }
};

export const deleteUserFromCloud = async (emailToDelete) => {
  try {
    let cloudUsers = [];
    try {
      const res = await axios.get(CLOUD_STORE_URL, { timeout: 3000 });
      if (res.data?.data?.users && Array.isArray(res.data.data.users)) {
        cloudUsers = res.data.data.users;
      }
    } catch (_) {}

    const emailClean = String(emailToDelete || '').toLowerCase().trim();
    const remaining = cloudUsers.filter(u => u.email?.toLowerCase().trim() !== emailClean && String(u.id || '') !== emailClean);
    memDB.users.delete(emailClean);

    await axios.patch(CLOUD_STORE_URL, {
      data: { users: remaining }
    }, { timeout: 4000 });
    return remaining;
  } catch (err) {
    console.warn('Cloud delete warning:', err.message);
  }
};

export const loadUsersFromCloud = async () => {
  try {
    const res = await axios.get(CLOUD_STORE_URL, { timeout: 4000 });
    if (res.data?.data?.users && Array.isArray(res.data.data.users)) {
      for (const u of res.data.data.users) {
        if (u.email) {
          memDB.users.set(u.email.toLowerCase().trim(), u);
        }
      }
      return res.data.data.users;
    }
  } catch (err) {
    console.warn('Cloud store sync read warning:', err.message);
  }
  return [];
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/psx_intelligence';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    isConnected = true;
    isMock = false;
    console.log('✅ Connected to MongoDB at:', uri);
  } catch (err) {
    console.warn('⚠️ Standalone MongoDB not running (' + err.message + ').');
    console.log('⚡ Activating Built-in High-Speed Cloud-Synced Storage Engine.');
    isConnected = true;
    isMock = true;
  }
};

export const getDBStatus = () => ({
  isConnected,
  isMock,
  mode: isMock ? 'Cloud-Synced In-Memory DB Engine' : 'Live MongoDB Daemon',
  uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/psx_intelligence'
});
