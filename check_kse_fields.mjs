import axios from 'axios';

async function checkKSE() {
  const res = await axios.get('https://psx-stockking-backend.vercel.app/api/market/summary');
  console.log('KSE fields:', {
    current: res.data.data.current,
    currentValue: res.data.data.currentValue,
    change: res.data.data.change,
    changePercent: res.data.data.changePercent,
    high: res.data.data.high,
    low: res.data.data.low,
    lastUpdated: res.data.data.lastUpdated
  });
}
checkKSE();
