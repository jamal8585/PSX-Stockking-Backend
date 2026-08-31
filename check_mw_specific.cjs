const axios = require('axios');
const cheerio = require('cheerio');

async function checkSpecific() {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
  const res = await axios.get('https://dps.psx.com.pk/market-watch', { headers, timeout: 8000 });
  const $ = cheerio.load(res.data);
  
  const map = new Map();
  $('table tbody tr').each((i, el) => {
    const cols = $(el).find('td').map((_, td) => $(td).text().replace(/\s+/g, ' ').trim()).get();
    if (cols.length >= 8) {
      const sym = cols[0];
      const prevClose = parseFloat(cols[3].replace(/,/g, ''));
      const openPrice = parseFloat(cols[4].replace(/,/g, ''));
      const high = parseFloat(cols[5].replace(/,/g, ''));
      const low = parseFloat(cols[6].replace(/,/g, ''));
      const current = parseFloat(cols[7].replace(/,/g, ''));
      const change = parseFloat(cols[8].replace(/,/g, ''));
      const changePct = parseFloat(cols[9].replace(/%/g, '').replace(/,/g, ''));
      const volume = parseInt(cols[10].replace(/,/g, ''), 10) || 0;
      
      map.set(sym, {
        symbol: sym,
        prevClose,
        open: openPrice,
        high,
        low,
        currentPrice: current,
        change,
        changePercent: changePct,
        volume
      });
    }
  });

  const checkSymbols = ['OGDC', 'PPL', 'MARI', 'SYS', 'LUCK', 'MEBL', 'FFC', 'PSO', 'HUBC', 'WTL', 'TELE', 'PAEL', 'BOP', 'PRL', 'CNERGY', 'KEL'];
  console.log('=== EXACT OFFICIAL PSX MARKET WATCH CLOSING & LIVE RATES ===');
  checkSymbols.forEach(sym => {
    const data = map.get(sym);
    if (data) {
      console.log(`${sym.padEnd(7)} | PrevClose: ${String(data.prevClose).padStart(8)} | Open: ${String(data.open).padStart(8)} | Current/Close: ${String(data.currentPrice).padStart(8)} | Change: ${(data.change>=0?'+':'')+data.change} (${(data.changePercent>=0?'+':'')+data.changePercent}%) | Vol: ${(data.volume/1000000).toFixed(2)}M`);
    } else {
      console.log(`${sym.padEnd(7)} | NOT IN DPS TABLE`);
    }
  });
}

checkSpecific();