import mongoose from 'mongoose';

const HistoricalPriceSchema = new mongoose.Schema({
  date: { type: String, required: true },
  open: Number,
  high: Number,
  low: Number,
  close: { type: Number, required: true },
  volume: Number
}, { _id: false });

const TechnicalsSchema = new mongoose.Schema({
  rsi14: Number,
  sma20: Number,
  sma50: Number,
  sma200: Number,
  ema20: Number,
  ema50: Number,
  macd: {
    macdLine: Number,
    signalLine: Number,
    histogram: Number
  },
  volumeAvg10: Number,
  volumeSpikeRatio: Number,
  trend: { type: String, enum: ['STRONG_BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', 'STRONG_BEARISH'] },
  support1: Number,
  support2: Number,
  resistance1: Number,
  resistance2: Number,
  signal: { type: String, enum: ['STRONG_BUY', 'ACCUMULATE', 'HOLD', 'AVOID_SELL'] },
  signalConfidence: Number,
  reasons: [String]
}, { _id: false });

const StockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  sector: { type: String, required: true, index: true },
  category: String,
  currentPrice: { type: Number, required: true },
  change: { type: Number, default: 0 },
  changePercent: { type: Number, default: 0 },
  open: Number,
  high: Number,
  low: Number,
  prevClose: Number,
  volume: { type: Number, default: 0 },
  peRatio: Number,
  eps: Number,
  dividendYield: Number,
  marketCap: Number,
  isKse100: { type: Boolean, default: true },
  technicals: TechnicalsSchema,
  historicalPrices: [HistoricalPriceSchema],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Stock || mongoose.model('Stock', StockSchema);
