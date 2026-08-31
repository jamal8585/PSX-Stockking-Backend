
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/stocks', stockRoutes);
app.use('/api/recommendations', recRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/scan', scanRoutes);
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
