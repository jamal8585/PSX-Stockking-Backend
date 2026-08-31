import mongoose from 'mongoose';

const RecommendationSchema = new mongoose.Schema({
  symbol: { type: String, required: true, index: true },
  companyName: { type: String, required: true },
  sector: { type: String, required: true },
  signal: { 
    type: String, 
    enum: ['STRONG_BUY', 'ACCUMULATE', 'HOLD', 'AVOID_SELL'], 
    required: true,
    index: true 
  },
  currentPrice: { type: Number, required: true },
  entryZone: {
    min: Number,
    max: Number
  },
  stopLoss: { type: Number, required: true },
  target1: { type: Number, required: true },
  target2: Number,
  riskReward: String,
  riskRewardRatio: Number,
  confidence: Number,
  timeHorizon: { type: String, default: 'Short-to-Medium Term (Swing)' },
  reasons: [String],
  newsSentimentImpact: {
    sentiment: String,
    score: Number,
    headline: String
  },
  orderAdvice: {
    darsonAction: String,
    allocationPercent: Number,
    riskPerSharePKR: Number,
    rewardPerSharePKR: Number
  },
  date: { type: String, required: true, index: true }
}, { timestamps: true });

export default mongoose.models.Recommendation || mongoose.model('Recommendation', RecommendationSchema);
