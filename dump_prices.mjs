import fs from 'fs';
import * as cheerio from 'cheerio';

async function run() {
  console.log('Fetching official PSX Market Watch...');
  const res = await fetch('https://dps.psx.com.pk/market-watch', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const priceMap = {};
  $('table tbody tr').each((_, el) => {
    const cols = $(el).find('td').map((_, td) => $(td).text().replace(/\s+/g, ' ').trim()).get();
    if (cols.length >= 8) {
      const symbol = cols[0].toUpperCase();
      const prevClose = parseFloat(cols[3].replace(/,/g, '')) || 0;
      const openPrice = parseFloat(cols[4].replace(/,/g, '')) || prevClose;
      const high = parseFloat(cols[5].replace(/,/g, '')) || openPrice;
      const low = parseFloat(cols[6].replace(/,/g, '')) || openPrice;
      const current = parseFloat(cols[7].replace(/,/g, '')) || prevClose;
      const change = parseFloat(cols[8].replace(/,/g, '')) || 0;
      const changePct = parseFloat(cols[9].replace(/%/g, '').replace(/,/g, '')) || 0;
      const volume = parseInt(cols[10]?.replace(/,/g, ''), 10) || 0;

      if (symbol && current > 0) {
        priceMap[symbol] = {
          symbol,
          sectorCode: cols[1] || '',
          prevClose,
          open: openPrice,
          high,
          low,
          currentPrice: current,
          change,
          changePercent: changePct,
          volume
        };
      }
    }
  });

  console.log(`Extracted ${Object.keys(priceMap).length} official stock quotes.`);
  console.log('PRL Quote:', priceMap['PRL']);
  console.log('OGDC Quote:', priceMap['OGDC']);
  console.log('PPL Quote:', priceMap['PPL']);
  console.log('SYS Quote:', priceMap['SYS']);

  fs.writeFileSync('src/data/official_quotes.json', JSON.stringify(priceMap, null, 2), 'utf8');
  console.log('✅ Saved src/data/official_quotes.json');
}
run();