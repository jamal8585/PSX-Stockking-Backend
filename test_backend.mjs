import axios from 'axios';

async function testBackend() {
  try {
    const res = await axios.get('https://psx-stockking-backend.vercel.app/api/market/summary', { timeout: 10000 });
    console.log('LIVE VERCEL BACKEND STATUS:', res.status);
    console.log('LIVE VERCEL BACKEND DATA:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log('Backend Error:', e.message, e.response?.data);
  }

  try {
    const res2 = await axios.get('https://psx-stockking-frontend.vercel.app/api/market/summary', { timeout: 10000 });
    console.log('FRONTEND /api/market/summary Content-Type:', res2.headers['content-type']);
  } catch (e) {
    console.log('Frontend /api Error:', e.message);
  }
}

testBackend();
