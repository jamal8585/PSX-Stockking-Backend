import { syncMarketData } from './src/services/seedService.js';
import { memDB } from './src/config/db.js';

async function run() {
  await syncMarketData();
  const prl = memDB.stocks.get('PRL');
  const ogdc = memDB.stocks.get('OGDC');
  const ppl = memDB.stocks.get('PPL');
  const sys = memDB.stocks.get('SYS');
  
  console.log('\n=== VERIFIED STOCKS IN MEMDB ===');
  console.log('PRL:', prl?.currentPrice, '| change:', prl?.change, '| isOfficial:', prl?.isOfficialDPS);
  console.log('OGDC:', ogdc?.currentPrice, '| change:', ogdc?.change);
  console.log('PPL:', ppl?.currentPrice, '| change:', ppl?.change);
  console.log('SYS:', sys?.currentPrice, '| change:', sys?.change);
}
run();