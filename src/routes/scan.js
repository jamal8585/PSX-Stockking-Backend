
import express from 'express';
import { syncMarketData } from '../services/seedService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    console.log('⚡ User triggered live PSX market re-scan...');
    const result = await syncMarketData();
    res.json({
      success: true,
      message: 'PSX Market Scan & Daily Evaluation completed successfully.',
      timestamp: new Date(),
      result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
