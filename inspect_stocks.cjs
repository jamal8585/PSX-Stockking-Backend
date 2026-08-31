const axios = require('axios');

async function checkStocks() {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
  const symbols = ['OGDC', 'PPL', 'MARI', 'SYS', 'LUCK', 'MEBL', 'FFC', 'PSO', 'DGKC', 'MLCF', 'HUBC', 'INDU'];

  console.log('=== REAL LIVE INTRADAY DATA FOR PSX STOCKS ===');
  for (const sym of symbols) {
    try {
      const res = await axios.get('https://dps.psx.com.pk/timeseries/int/' + sym, { headers, timeout: 4000 });
      const ticks = res.data?.data || [];
      if (ticks.length > 0) {
        const last = ticks[ticks.length - 1];
        const first = ticks[0];
        const current = last[1];
        const openVal = first[1];
        const chg = Number((current - openVal).toFixed(2));
        const chgPct = Number(((chg / openVal) * 100).toFixed(2));
        console.log(sym + ': Live Price = PKR ' + current + ' | Change = ' + (chg >= 0 ? '+' : '') + chg + ' (' + chgPct + '%)');
      }
    } catch (e) {
      console.log(sym + ' err: ' + e.message);
    }
  }
}

checkStocks();