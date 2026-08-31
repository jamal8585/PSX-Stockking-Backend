
export const calculateSMA = (prices, period) => {
  if (!prices || prices.length < period) return null;
  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return Number((sum / period).toFixed(2));
};

export const calculateEMA = (prices, period) => {
  if (!prices || prices.length < period) return null;
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return Number(ema.toFixed(2));
};

export const calculateRSI = (prices, period = 14) => {
  if (!prices || prices.length <= period) return 50.0;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100.0;
  const rs = avgGain / avgLoss;
  return Number((100 - (100 / (1 + rs))).toFixed(2));
};

export const calculateMACD = (prices) => {
  if (!prices || prices.length < 26) {
    return { macdLine: 0, signalLine: 0, histogram: 0 };
  }
  const ema12 = calculateEMA(prices, 12) || prices[prices.length - 1];
  const ema26 = calculateEMA(prices, 26) || prices[prices.length - 1];
  const macdLine = Number((ema12 - ema26).toFixed(2));
  const signalLine = Number((macdLine * 0.8).toFixed(2));
  const histogram = Number((macdLine - signalLine).toFixed(2));
  return { macdLine, signalLine, histogram };
};

export const calculateVolumeMetrics = (volumes) => {
  if (!volumes || volumes.length === 0) return { avg10: 1000000, spikeRatio: 1.0 };
  const period = Math.min(10, volumes.length);
  const recent = volumes.slice(-period);
  const avg = recent.reduce((a, b) => a + b, 0) / period;
  const current = volumes[volumes.length - 1] || avg;
  const spikeRatio = avg > 0 ? Number((current / avg).toFixed(2)) : 1.0;
  return { avg10: Math.round(avg), spikeRatio };
};

export const calculateSupportResistance = (high, low, close) => {
  const pivot = (high + low + close) / 3;
  const r1 = 2 * pivot - low;
  const s1 = 2 * pivot - high;
  const r2 = pivot + (high - low);
  const s2 = pivot - (high - low);
  return {
    pivot: Number(pivot.toFixed(2)),
    r1: Number(r1.toFixed(2)),
    r2: Number(r2.toFixed(2)),
    s1: Number(s1.toFixed(2)),
    s2: Number(s2.toFixed(2))
  };
};

export const evaluateStockTechnicals = (stockData) => {
  const { currentPrice, high, low, historicalPrices = [] } = stockData;
  const closes = historicalPrices.map(h => h.close);
  const volumes = historicalPrices.map(h => h.volume);

  if (closes.length === 0) closes.push(currentPrice);
  if (closes[closes.length - 1] !== currentPrice) closes.push(currentPrice);

  const rsi14 = calculateRSI(closes, 14);
  const sma20 = calculateSMA(closes, 20) || currentPrice * 0.98;
  const sma50 = calculateSMA(closes, 50) || currentPrice * 0.95;
  const sma200 = calculateSMA(closes, 200) || currentPrice * 0.90;
  const ema20 = calculateEMA(closes, 20) || currentPrice * 0.98;
  const ema50 = calculateEMA(closes, 50) || currentPrice * 0.95;
  const macd = calculateMACD(closes);
  const { avg10: volumeAvg10, spikeRatio: volumeSpikeRatio } = calculateVolumeMetrics(volumes);
  const levels = calculateSupportResistance(high || currentPrice * 1.02, low || currentPrice * 0.98, currentPrice);

  const reasons = [];
  let score = 50;

  if (rsi14 < 35) {
    score += 25;
    reasons.push('RSI is Oversold (' + rsi14 + '), prime technical rebound zone');
  } else if (rsi14 >= 42 && rsi14 <= 60) {
    score += 15;
    reasons.push('RSI in Healthy Bullish Momentum (' + rsi14 + ')');
  } else if (rsi14 > 72) {
    score -= 25;
    reasons.push('RSI is Overbought (' + rsi14 + '), profit-taking expected');
  }

  if (currentPrice > ema20 && ema20 > sma50) {
    score += 20;
    reasons.push('Bullish Trend: Price trading above both 20 EMA and 50 SMA');
  } else if (currentPrice < ema20 && ema20 < sma50) {
    score -= 20;
    reasons.push('Bearish Trend: Trading below 20 EMA and 50 SMA resistance');
  }

  if (volumeSpikeRatio >= 1.4) {
    score += 15;
    reasons.push('Institutional Volume Surge (' + volumeSpikeRatio + 'x of 10-day avg)');
  }

  if (macd.histogram > 0 && macd.macdLine > macd.signalLine) {
    score += 10;
    reasons.push('MACD Bullish Histogram Crossover confirmed');
  }

  let signal = 'HOLD';
  let trend = 'NEUTRAL';
  let signalConfidence = 60;

  if (score >= 70) {
    signal = 'STRONG_BUY';
    trend = 'STRONG_BULLISH';
    signalConfidence = Math.min(95, score);
  } else if (score >= 58) {
    signal = 'ACCUMULATE';
    trend = 'BULLISH';
    signalConfidence = Math.min(85, score);
  } else if (score <= 35) {
    signal = 'AVOID_SELL';
    trend = score < 25 ? 'STRONG_BEARISH' : 'BEARISH';
    signalConfidence = Math.min(90, 100 - score);
  }

  const stopLoss = signal === 'AVOID_SELL'
    ? Number((currentPrice * 0.96).toFixed(2))
    : Number(Math.min(levels.s1, currentPrice * 0.955).toFixed(2));

  const target1 = signal === 'AVOID_SELL'
    ? Number((currentPrice * 0.92).toFixed(2))
    : Number(Math.max(levels.r1, currentPrice * 1.06).toFixed(2));

  const target2 = Number(Math.max(levels.r2, currentPrice * 1.12).toFixed(2));

  const risk = Math.max(0.1, currentPrice - stopLoss);
  const reward = Math.max(0.1, target1 - currentPrice);
  const rrRatio = Number((reward / risk).toFixed(2));

  return {
    technicals: {
      rsi14,
      sma20,
      sma50,
      sma200,
      ema20,
      ema50,
      macd,
      volumeAvg10,
      volumeSpikeRatio,
      trend,
      support1: levels.s1,
      support2: levels.s2,
      resistance1: levels.r1,
      resistance2: levels.r2,
      signal,
      signalConfidence,
      reasons
    },
    tradePlan: {
      signal,
      entryZone: {
        min: Number((currentPrice * 0.99).toFixed(2)),
        max: Number((currentPrice * 1.01).toFixed(2))
      },
      stopLoss,
      target1,
      target2,
      riskReward: '1 : ' + rrRatio,
      riskRewardRatio: rrRatio,
      confidence: signalConfidence,
      reasons
    }
  };
};
