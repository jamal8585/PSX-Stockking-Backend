
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getDBStatus } from './config/db.js';
import { syncMarketData } from './services/seedService.js';

import stockRoutes from './routes/stocks.js';
import recRoutes from './routes/recommendations.js';
import newsRoutes from './routes/news.js';
import marketRoutes from './routes/market.js';
import watchlistRoutes from './routes/watchlist.js';
import scanRoutes from './routes/scan.js';
import portfolioRoutes from './routes/portfolio.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import { memDB } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/recommendations', recRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'PSX Stockking API Server',
    version: '1.0.0',
    documentation: 'Official PSX DPS Real-Time Scraping & Financial Intelligence Engine',
    endpoints: {
      marketSummary: '/api/market/summary',
      stocks: '/api/stocks',
      news: '/api/news',
      recommendations: '/api/recommendations',
      portfolio: '/api/portfolio',
      health: '/api/health'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'PSX Alpha Terminal Engine',
    database: getDBStatus(),
    time: new Date(),
    autoSyncInterval: '60 Seconds',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_key_here')
  });
});

const startServer = async () => {
  try {
    await connectDB();
    
    // Seed / Ensure Official Admin User and Directory
    const seedUsers = async () => {
      try {
        const adminEmail = (process.env.ADMIN_EMAIL || 'jamal.ahmedrumi@gmail.com').toLowerCase().trim();
        const adminPassword = process.env.ADMIN_PASSWORD || 'R44@Jamal20dec##';
        
        const salt = await bcrypt.genSalt(10);
        const hashedAdminPassword = await bcrypt.hash(adminPassword, salt);
        const hashedUserPassword = await bcrypt.hash('PsxTrader2026!', salt);

        const now = new Date();
        const oneMonthEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const threeMonthEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        const lifetimeEnd = new Date(now.getTime() + 50 * 365 * 24 * 60 * 60 * 1000);

        const initialUsers = [
          {
            id: 'admin_jamal_001',
            name: 'Jamal Ahmed (Lead Admin)',
            email: adminEmail,
            phone: '+923452831413',
            password: hashedAdminPassword,
            role: 'ADMIN',
            plan: 'PRO',
            subscriptionStatus: 'ACTIVE',
            subscriptionDuration: 'LIFETIME',
            subscriptionStart: now,
            subscriptionEnd: lifetimeEnd,
            paymentProof: { transactionId: 'MASTER_ADMIN', method: 'System Owner', amount: 0, submittedAt: now, note: 'Lead Admin & Platform Owner' },
            createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
            lastLogin: now
          },
          {
            id: 'usr_tariq_002',
            name: 'Tariq Mehmood',
            email: 'tariq.mehmood.psx@gmail.com',
            phone: '+923001234567',
            password: hashedUserPassword,
            role: 'USER',
            plan: 'PRO',
            subscriptionStatus: 'ACTIVE',
            subscriptionDuration: '1_MONTH',
            subscriptionStart: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            subscriptionEnd: oneMonthEnd,
            paymentProof: {
              transactionId: 'EP-99281728',
              method: 'Easypaisa (03452831413)',
              amount: 1499,
              submittedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
              note: 'Monthly Pro subscription paid via Easypaisa'
            },
            createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            lastLogin: now
          },
          {
            id: 'usr_usman_003',
            name: 'Usman Farooq (Alpha Trader)',
            email: 'usman.farooq.trader@gmail.com',
            phone: '+923219876543',
            password: hashedUserPassword,
            role: 'USER',
            plan: 'PRO',
            subscriptionStatus: 'ACTIVE',
            subscriptionDuration: '3_MONTHS',
            subscriptionStart: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
            subscriptionEnd: threeMonthEnd,
            paymentProof: {
              transactionId: 'JC-88371920',
              method: 'JazzCash (03413266381)',
              amount: 3999,
              submittedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
              note: 'Quarterly 3 Months Pro VIP Pass sent via JazzCash'
            },
            createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
            lastLogin: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
          },
          {
            id: 'usr_ayesha_004',
            name: 'Ayesha Khan',
            email: 'ayesha.khan.invest@gmail.com',
            phone: '+923335544332',
            password: hashedUserPassword,
            role: 'USER',
            plan: 'FREE',
            subscriptionStatus: 'PENDING',
            subscriptionDuration: '1_MONTH',
            subscriptionStart: null,
            subscriptionEnd: null,
            paymentProof: {
              transactionId: 'EP-44019283',
              method: 'Easypaisa (03452831413)',
              amount: 1499,
              submittedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
              note: 'Sent PKR 1499 via Easypaisa to 03452831413. Please activate Pro access.'
            },
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            lastLogin: now
          },
          {
            id: 'usr_bilal_005',
            name: 'Bilal Siddiqui',
            email: 'bilal.siddiqui.kse@gmail.com',
            phone: '+923456789012',
            password: hashedUserPassword,
            role: 'USER',
            plan: 'FREE',
            subscriptionStatus: 'PENDING',
            subscriptionDuration: '3_MONTHS',
            subscriptionStart: null,
            subscriptionEnd: null,
            paymentProof: {
              transactionId: 'JC-55102948',
              method: 'JazzCash (03413266381)',
              amount: 3999,
              submittedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
              note: 'JazzCash 3999 transfer confirmation code sent'
            },
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            lastLogin: now
          },
          {
            id: 'usr_kamran_006',
            name: 'Kamran Ali',
            email: 'kamran.ali.broker@gmail.com',
            phone: '+923123456789',
            password: hashedUserPassword,
            role: 'USER',
            plan: 'FREE',
            subscriptionStatus: 'INACTIVE',
            subscriptionDuration: 'FREE',
            subscriptionStart: null,
            subscriptionEnd: null,
            paymentProof: { transactionId: '', method: '', amount: 0, submittedAt: null, note: '' },
            createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
            lastLogin: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
          }
        ];

        for (const u of initialUsers) {
          memDB.users.set(u.email.toLowerCase(), u);
          if (!getDBStatus().isMock) {
            const existing = await User.findOne({ email: u.email.toLowerCase() });
            if (!existing) {
              await User.create(u);
            } else if (u.role === 'ADMIN') {
              await User.findByIdAndUpdate(existing._id, {
                password: hashedAdminPassword,
                role: 'ADMIN',
                plan: 'PRO',
                subscriptionStatus: 'ACTIVE',
                subscriptionDuration: 'LIFETIME'
              });
            }
          }
        }
        console.log(`👑 User Directory Initialized: ${initialUsers.length} platform accounts configured.`);
      } catch (err) {
        console.warn('User directory seed notice:', err.message);
      }
    };

    await seedUsers();

    // Initial Sync
    await syncMarketData();

    // 60-Second Automated Sync Loop
    const AUTO_SYNC_INTERVAL_MS = 60 * 1000;
    setInterval(async () => {
      try {
        console.log(`⏰ [${new Date().toLocaleTimeString()}] Running Automated Background PSX & Live News Sync...`);
        await syncMarketData();
      } catch (err) {
        console.error('Auto-Sync Background Warning:', err.message);
      }
    }, AUTO_SYNC_INTERVAL_MS);

    app.listen(PORT, () => {
      console.log('🚀 PSX Alpha Terminal Server running on http://localhost:' + PORT);
      console.log('⚡ Live Portfolio & Real-time AI Exit Advisory Engine Active!');
    });
  } catch (err) {
    console.error('Fatal Server Boot Error:', err);
  }
};

startServer();
