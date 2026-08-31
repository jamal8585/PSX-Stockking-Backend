import mongoose from 'mongoose';

let isConnected = false;
let isMock = false;

// In-memory collections fallback when local MongoDB daemon is not running
export const memDB = {
  stocks: new Map(),
  recommendations: new Map(),
  news: new Map(),
  marketSummary: null,
  watchlist: new Set()
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
    console.log('⚡ Activating Built-in High-Speed In-Memory MongoDB Engine.');
    isConnected = true;
    isMock = true;
  }
};

export const getDBStatus = () => ({
  isConnected,
  isMock,
  mode: isMock ? 'In-Memory DB Engine' : 'Live MongoDB Daemon',
  uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/psx_intelligence'
});
