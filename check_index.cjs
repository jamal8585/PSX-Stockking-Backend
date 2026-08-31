const axios = require('axios');
const cheerio = require('cheerio');

async function check() {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

  // 1. PSX Main Page
  try {
    const res = await axios.get('https://www.psx.com.pk', { headers, timeout: 6000 });
    const $ = cheerio.load(res.data);
    console.log('--- PSX.COM.PK MATCHES ---');
    $('body *').each((i, elem) => {
      const txt = $(elem).text().replace(/\s+/g, ' ').trim();
      if ((txt.includes('KSE100') || txt.includes('KSE 100') || txt.includes('KSE-100')) && txt.length < 100) {
        if (/\d{4,6}/.test(txt)) {
          console.log('Match:', txt);
        }
      }
    });
  } catch (e) {
    console.log('PSX main err:', e.message);
  }

  // 2. DPS Intraday
  try {
    const intRes = await axios.get('https://dps.psx.com.pk/timeseries/int/KSE100', { headers, timeout: 6000 });
    console.log('DPS Int points:', intRes.data?.data?.length, 'Last 2 ticks:', intRes.data?.data?.slice(-2));
  } catch (e) {
    console.log('DPS Int err:', e.message);
  }

  // 3. DPS EOD
  try {
    const eodRes = await axios.get('https://dps.psx.com.pk/timeseries/eod/KSE100', { headers, timeout: 6000 });
    console.log('DPS EOD points:', eodRes.data?.data?.length, 'Last 3:', eodRes.data?.data?.slice(-3));
  } catch (e) {
    console.log('DPS EOD err:', e.message);
  }

  // 4. DPS Symbols
  try {
    const syms = await axios.get('https://dps.psx.com.pk/symbols', { headers, timeout: 6000 });
    const kseObj = syms.data?.find(s => s.symbol === 'KSE100' || s.name?.includes('KSE100'));
    console.log('DPS KSE100 symbol entry:', kseObj);
  } catch (e) {
    console.log('DPS Symbols err:', e.message);
  }
}

check();