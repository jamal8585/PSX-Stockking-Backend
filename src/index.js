
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
    
    // Seed / Ensure Official Admin User and Load Cloud Store
    const seedUsers = async () => {
      try {
        const adminEmail = (process.env.ADMIN_EMAIL || 'jamal.ahmedrumi@gmail.com').toLowerCase().trim();
        const adminPassword = process.env.ADMIN_PASSWORD || 'R44@Jamal20dec##';
        
        const salt = await bcrypt.genSalt(10);
        const hashedAdminPassword = await bcrypt.hash(adminPassword, salt);

        const now = new Date();
        const lifetimeEnd = new Date(now.getTime() + 50 * 365 * 24 * 60 * 60 * 1000);

        // Load all real users from persistent cloud store
        const { loadUsersFromCloud, saveUsersToCloud } = await import('./config/db.js');
        await loadUsersFromCloud();

        // Ensure Lead Admin Accounts (Personal & Corporate) are always active and master-verified
        const adminAccounts = [
          {
            id: 'admin_jamal_001',
            name: 'Jamal Ahmed (Lead Admin)',
            email: 'jamal.ahmedrumi@gmail.com',
            phone: '+923452831413'
          },
          {
            id: 'admin_jamal_binate',
            name: 'Jamal Ahmed (Binate Digital)',
            email: 'jamal.ahmed@binatedigital.com',
            phone: '+923452831413'
          }
        ];

        for (const adm of adminAccounts) {
          const admEmail = adm.email.toLowerCase().trim();
          const adminPayload = {
            id: adm.id,
            name: adm.name,
            email: admEmail,
            phone: adm.phone,
            password: hashedAdminPassword,
            role: 'ADMIN',
            plan: 'PRO',
            subscriptionStatus: 'ACTIVE',
            subscriptionDuration: 'LIFETIME',
            subscriptionStart: now,
            subscriptionEnd: lifetimeEnd,
            paymentProof: { transactionId: 'MASTER_ADMIN', method: 'Platform Owner', amount: 0, submittedAt: now, note: 'Lead Admin & Platform Owner' },
            createdAt: new Date('2026-08-01'),
            lastLogin: now
          };

          memDB.users.set(admEmail, adminPayload);
        }

        await saveUsersToCloud(memDB.users);

        if (!getDBStatus().isMock) {
          for (const adm of adminAccounts) {
            const admEmail = adm.email.toLowerCase().trim();
            const existing = await User.findOne({ email: admEmail });
            if (!existing) {
              await User.create(memDB.users.get(admEmail));
            } else {
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
        console.log(`👑 Lead Admins Configured & Real Users Synced (${memDB.users.size} active accounts).`);
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

    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log('🚀 PSX Alpha Terminal Server running on http://localhost:' + PORT);
        console.log('⚡ Live Portfolio & Real-time AI Exit Advisory Engine Active!');
      });
    }
  } catch (err) {
    console.error('Fatal Server Boot Error:', err);
  }
};

startServer();

export default app;
