import mongoose from 'mongoose';

const NewsTradeSuggestionSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  sector: String,
  direction: { type: String, enum: ['UP', 'DOWN'], default: 'UP' },
  action: { type: String, required: true },
  currentPrice: { type: Number, required: true },
  volume: { type: Number, default: 0 },
  volumeSpike: { type: Number, default: 1.0 },
  entryPriceMin: Number,
  entryPriceMax: Number,
  stopLoss: { type: Number, required: true },
  targetSellPrice: { type: Number, required: true },
  targetSellPrice2: Number,
  expectedGainPct: Number,
  riskReward: String,
  tradeReason: String
}, { _id: false });

const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  source: { type: String, default: 'Pakistan Financial Media' },
  publishedAt: { type: Date, default: Date.now },
  timeAgo: { type: String, default: 'Just now' },
  category: { type: String, default: 'GENERAL_MARKET', index: true },
  sentiment: { type: String, default: 'POSITIVE', index: true },
  sentimentScore: { type: Number, default: 0 },
  impactSeverity: { type: String, default: 'HIGH' },
  impactSummary: String,
  impactedSectors: [String],
  upStocks: [NewsTradeSuggestionSchema],
  downStocks: [NewsTradeSuggestionSchema],
  tradeSuggestions: [NewsTradeSuggestionSchema],
  url: String
}, { timestamps: true });

export default mongoose.models.News || mongoose.model('News', NewsSchema);
