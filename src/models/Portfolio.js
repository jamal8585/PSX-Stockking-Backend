
import mongoose from 'mongoose';

const PortfolioSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true, index: true },
  name: { type: String, required: true },
  sector: String,
  positionType: { type: String, enum: ['BUY_LONG', 'SELL_SHORT'], default: 'BUY_LONG' },
  buyPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  buyDate: { type: Date, default: Date.now },
  notes: String,
  targetPriceUser: Number,
  stopLossUser: Number
}, { timestamps: true });

export default mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema);
