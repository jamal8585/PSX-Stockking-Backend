# 📈 PSX Stockking - Financial Intelligence & Real-Time Scraper Backend

High-performance Node.js & Express REST API engine for the **Pakistan Stock Exchange (PSX)**. Provides official PSX DPS live market watch scraping, multi-sector financial news synthesis with UP/DOWN stock catalysts, quantitative technical indicators (RSI, EMAs, Support/Resistance), and real-time user portfolio P&L tracking with Google Gemini AI exit advisory.

---

## 🌟 Key Backend Capabilities

1. **🏛️ Official PSX DPS Market Watch Scraper (`livePsxScraper.js`):**
   - Directly scrapes `https://dps.psx.com.pk/market-watch` for 500+ listed equity companies.
   - Extracts exact official closing prices, previous close, high, low, day change (PKR & %), and volumes.
   - Intraday KSE-100 index ticks from `https://dps.psx.com.pk/timeseries/int/KSE100`.
   - Automatic market session detection (Pre-Market / Closed vs Live 09:30 AM to 03:30 PM PKT).

2. **📰 Multi-Sector Live Financial News Hub (`liveNewsScraper.js`):**
   - Scrapes live RSS feeds from Business Recorder, Dawn, and Express Tribune across all 12 major PSX industrial sectors.
   - Generates distinct **🟢 Stocks Expected to Go UP** (Target Sell Price, Gain %, Buy Zone) vs **🔴 Stocks Expected to Go DOWN** (Stop Loss, Downside Risk %).

3. **💼 Real-Time Portfolio & Live AI Exit Advisor (`routes/portfolio.js` & `aiAdvisorService.js`):**
   - CRUD trade management with real-time P&L against live DPS market prices.
   - Evaluates holdings using technical momentum + news sentiment to issue live exit actions (`SELL_NOW`, `HOLD_AND_RIDE`, `ACCUMULATE_DIP`, `TRIGGER_STOP_LOSS`).

4. **⚡ 60-Second Automated Background Sync Loop:**
   - Asynchronous worker syncs all 763 PSX listed companies every 60 seconds into a high-speed in-memory store (`memDB`) and MongoDB.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- Optional: MongoDB local or Atlas (System includes resilient in-memory fallback)

### 2. Installation
```bash
cd server
npm install
```

### 3. Environment Configuration
Create a `.env` file based on `.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/psx_intelligence
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Start the Server
```bash
# Development / Production
npm start
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/market/summary` | KSE-100 Index, 39 Sectors Heatmap, Gainers/Losers, Market Timing Status |
| `GET` | `/api/stocks` | Full 763 PSX Listed Universe with technical indicators |
| `GET` | `/api/stocks/:symbol` | Deep-dive technicals, historical OHLCV chart data, and support/resistance |
| `GET` | `/api/news` | 12-Sector Breaking Financial News + UP/DOWN Stock Catalyst Setups |
| `GET` | `/api/recommendations` | Algorithmic Swing Trade Signals (Target 1, Target 2, Stop Loss) |
| `GET` | `/api/portfolio` | User holdings with live P&L, day move, and AI Exit advice |
| `POST` | `/api/portfolio` | Add new trade position (symbol, buyPrice, quantity, notes) |
| `PUT` | `/api/portfolio/:id` | Update buy price or quantity |
| `DELETE` | `/api/portfolio/:id` | Remove position from portfolio |
| `POST` | `/api/scan` | Trigger immediate full-market re-sync |

---

## 🏗️ Architecture

```
server/
├── src/
│   ├── config/
│   │   └── db.js                 # In-Memory Cache (memDB) & MongoDB Connection
│   ├── models/                   # Mongoose Schemas (Stock, News, Portfolio, etc.)
│   ├── routes/                   # Express API Routers
│   ├── services/
│   │   ├── livePsxScraper.js     # Real DPS Market Watch & KSE-100 Scraper
│   │   ├── liveNewsScraper.js    # Multi-Sector News Ingestion & UP/DOWN Catalysts
│   │   ├── psxDataService.js     # 763 PSX Listed Symbols Loader
│   │   ├── technicalEngine.js    # Quant Technical Math (RSI, EMAs, Support/Resistance)
│   │   ├── aiAdvisorService.js   # Gemini AI Exit Strategy Formulator
│   │   └── seedService.js        # Parallel Full Market Synchronizer
│   └── index.js                  # Express Server Entrypoint & 60s Sync Loop
├── .env.example
├── .gitignore
├── package.json
└── README.md
```