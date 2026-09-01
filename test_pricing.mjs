import axios from 'axios';
import * as cheerio from 'cheerio';

const testSymbols = ['CNERGY', 'PRL', 'ATRL', 'OGDC', 'MARI', 'PPL'];

async function testDPS() {
  console.log('Testing dps.psx.com.pk for symbols...');
  
  for (const sym of testSymbols) {
    try {
      // Test 1: timeseries/int/
      const tsRes = await axios.get(`https://dps.psx.com.pk/timeseries/int/${sym}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*'
        },
        timeout: 5000
      });
      const data = tsRes.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        const lastTick = data[data.length - 1];
        console.log(`[TIMESERIES] ${sym}: Last price = ${lastTick[1]}, time = ${new Date(lastTick[0] * 1000).toLocaleTimeString()}`);
      } else {
        console.log(`[TIMESERIES] ${sym}: No timeseries data or format different:`, tsRes.data);
      }
    } catch (e) {
      console.log(`[TIMESERIES] ${sym} error:`, e.message);
    }
  }

  try {
    console.log('\nTesting /market-watch...');
    const mwRes = await axios.get('https://dps.psx.com.pk/market-watch', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 8000
    });
    const $ = cheerio.load(mwRes.data);
    console.log('Tables found:', $('table').length, 'Rows found:', $('table tr').length);
    $('table tbody tr').each((i, el) => {
      const cols = $(el).find('td').map((_, td) => $(td).text().trim()).get();
      if (cols.length > 0 && testSymbols.includes(cols[0].toUpperCase())) {
        console.log(`[MARKET-WATCH] ${cols[0]}: cols=`, cols);
      }
    });
  } catch (e) {
    console.log('Market-watch error:', e.message);
  }
}

testDPS();
