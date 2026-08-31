const axios = require('axios');

async function inspectDPSInt() {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
  const res = await axios.get('https://dps.psx.com.pk/timeseries/int/KSE100', { headers, timeout: 6000 });
  const ticks = res.data?.data || [];
  
  if (ticks.length > 0) {
    const first = ticks[0];
    const last = ticks[ticks.length - 1];
    const values = ticks.map(t => t[1]);
    const volumes = ticks.map(t => t[2]);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const current = last[1];
    const openVal = first[1];
    const change = Number((current - openVal).toFixed(2));
    const changePct = Number(((change / openVal) * 100).toFixed(2));
    const lastTime = new Date(last[0] * 1000).toLocaleString();

    console.log('=== REAL LIVE KSE-100 DATA FROM PSX DPS ===');
    console.log('Latest Index Point:', current.toLocaleString());
    console.log('Day Open Baseline:', openVal.toLocaleString());
    console.log('Day Change:', (change >= 0 ? '+' : '') + change + ' (' + (changePct >= 0 ? '+' : '') + changePct + '%)');
    console.log('Day High:', maxVal.toLocaleString());
    console.log('Day Low:', minVal.toLocaleString());
    console.log('Total Intraday Ticks:', ticks.length);
    console.log('Latest Timestamp:', lastTime);
  }
}

inspectDPSInt();