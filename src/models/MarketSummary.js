
import mongoose from 'mongoose';

const MarketSummarySchema = new mongoose.Schema({
  indexName: { type: String, default: 'KSE-100' },
  currentValue: { type: Number, required: true },
  change: { type: Number, required: true },
  changePercent: { type: Number, required: true },
  high: Number,
  low: Number,
  prevClose: Number,
  totalVolume: Number,
  totalValuePKR: Number,
  advances: Number,
  declines: Number,
  unchanged: Number,
  marketSentiment: { type: String, default: 'BULLISH' },
  sectorPerformance: [{
    sector: String,
    changePercent: Number,
    volume: Number,
    sentiment: String
  }],
  topGainers: [{
    symbol: String,
    price: Number,
    change: Number,
    changePercent: Number,
    volume: Number
  }],
  topLosers: [{
    symbol: String,
    price: Number,
    change: Number,
    changePercent: Number,
    volume: Number
  }],
  volumeLeaders: [{
    symbol: String,
    price: Number,
    changePercent: Number,
    volume: Number
  }],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.MarketSummary || mongoose.model('MarketSummary', MarketSummarySchema);
