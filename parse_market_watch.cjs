const axios = require('axios');
const cheerio = require('cheerio');

async function testMW() {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
  const res = await axios.get('https://dps.psx.com.pk/market-watch', { headers, timeout: 8000 });
  const $ = cheerio.load(res.data);
  
  console.log('HTML Length:', res.data.length);
  const rows = [];
  $('table tbody tr').each((i, el) => {
    const cols = $(el).find('td').map((_, td) => $(td).text().replace(/\s+/g, ' ').trim()).get();
    if (cols.length >= 4) {
      rows.push(cols);
    }
  });

  console.log('Total Stocks extracted from DPS Market Watch:', rows.length);
  if (rows.length > 0) {
    console.log('Sample 5 Stocks from Market Watch:');
    rows.slice(0, 5).forEach((r, idx) => console.log(`[${idx+1}]`, r));
  }
}

testMW();