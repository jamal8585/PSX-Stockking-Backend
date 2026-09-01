import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  };

  try {
    const res = await axios.get('https://dps.psx.com.pk/indices', { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(res.data);
    console.log('--- INDICES TABLE ROWS ---');
    $('table tr').each((i, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.includes('KSE100') || text.includes('KSE 100') || text.includes('KSE-100') || i < 4) {
        console.log(`Row ${i}:`, text);
        const cols = $(el).find('th, td').map((_, c) => $(c).text().trim()).get();
        console.log(`Cols:`, cols);
      }
    });
  } catch (e) {
    console.log('Indices Error:', e.message);
  }

  try {
    const res2 = await axios.get('https://dps.psx.com.pk/timeseries/int/KSE100', { headers: HEADERS, timeout: 8000 });
    console.log('--- TIMESERIES ---');
    if (res2.data && res2.data.data) {
      console.log('Total ticks:', res2.data.data.length);
      console.log('First tick:', res2.data.data[0]);
      console.log('Latest 5 ticks:', res2.data.data.slice(-5));
    }
  } catch (e) {
    console.log('Timeseries Error:', e.message);
  }

  // Also test psx.com.pk or dps.psx.com.pk main page
  try {
    const res3 = await axios.get('https://www.psx.com.pk/', { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(res3.data);
    console.log('--- WWW.PSX.COM.PK HOME ---');
    $('*').each((i, el) => {
      const t = $(el).text().trim();
      if ((t.includes('KSE 100') || t.includes('KSE100')) && t.length < 100 && $(el).children().length === 0) {
        console.log(`Text node:`, t);
      }
    });
  } catch (e) {
    console.log('www.psx.com.pk Error:', e.message);
  }
}

test();
