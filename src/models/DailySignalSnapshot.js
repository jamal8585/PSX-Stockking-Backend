import mongoose from 'mongoose';

const DailySignalSnapshotSchema = new mongoose.Schema({
  ticker: { 
    type: String, 
    required: true, 
    uppercase: true, 
    trim: true, 
    index: true 
  },
  session_date: { 
    type: String, 
    required: true, 
    index: true 
  }, // Format: YYYY-MM-DD
  closing_price: { 
    type: Number, 
    required: true 
  },
  prev_close: { 
    type: Number 
  },
  change: { 
    type: Number 
  },
  change_percent: { 
    type: Number 
  },
  signal_type: { 
    type: String, 
    enum: ['STRONG_BUY', 'ACCUMULATE', 'HOLD', 'AVOID_SELL'], 
    required: true,
    index: true 
  },
  entry_min: { 
    type: Number, 
    required: true 
  },
  entry_max: { 
    type: Number, 
    required: true 
  },
  stop_loss: { 
    type: Number, 
    required: true 
  },
  target_1: { 
    type: Number, 
    required: true 
  },
  target_2: { 
    type: Number 
  },
  rsi: { 
    type: Number, 
    required: true 
  },
  confidence: { 
    type: Number, 
    default: 85 
  },
  reasons: [{ 
    type: String 
  }],
  sector: { 
    type: String 
  },
  name: { 
    type: String 
  },
  is_momentum_breakout: { 
    type: Boolean, 
    default: false 
  },
  outcome: {
    status: { 
      type: String, 
      default: 'IN_PROGRESS' 
    },
    label: { 
      type: String, 
      default: 'In Progress' 
    },
    badgeColor: { 
      type: String, 
      default: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
    },
    gainSinceSignalPct: { 
      type: Number, 
      default: 0 
    }
  }
}, { 
  timestamps: true,
  collection: 'daily_signal_snapshots'
});

// Enforce compound uniqueness: write-once immutability for ticker + session_date
DailySignalSnapshotSchema.index({ ticker: 1, session_date: 1 }, { unique: true });

export default mongoose.models.DailySignalSnapshot || mongoose.model('DailySignalSnapshot', DailySignalSnapshotSchema);
