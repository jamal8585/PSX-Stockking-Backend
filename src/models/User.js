import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  password: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  plan: { type: String, enum: ['FREE', 'PRO'], default: 'FREE' },
  subscriptionStatus: { type: String, enum: ['INACTIVE', 'ACTIVE', 'PENDING', 'EXPIRED'], default: 'INACTIVE' },
  subscriptionDuration: { type: String, enum: ['FREE', '1_MONTH', '3_MONTHS', '1_YEAR', 'LIFETIME'], default: 'FREE' },
  subscriptionStart: { type: Date, default: null },
  subscriptionEnd: { type: Date, default: null },
  paymentProof: {
    transactionId: { type: String, default: '' },
    method: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    submittedAt: { type: Date, default: null },
    note: { type: String, default: '' }
  },
  lastLogin: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
