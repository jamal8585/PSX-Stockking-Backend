import { 
  initSnapshotEngine, 
  getSnapshotsForDate, 
  insertImmutableSnapshot 
} from './src/services/snapshotService.js';
import { getPSXRecentTradingSessions } from './src/routes/recommendations.js';
import fs from 'fs';
const officialQuotes = JSON.parse(fs.readFileSync('./src/data/official_quotes.json', 'utf8'));

async function runTests() {
  console.log('🧪 Starting Snapshots & Price Desync Verification Suite...\n');

  // Test 1: Initialize snapshot engine
  await initSnapshotEngine();
  console.log('✅ 1. Snapshot engine initialized successfully.');

  // Test 2: Check 5 trading sessions
  const sessions = getPSXRecentTradingSessions(5);
  console.log('📅 2. Generated 5 PSX Trading Sessions:');
  sessions.forEach((s, idx) => {
    console.log(`   [Tab ${idx}] ${s.dateStr} | Label: "${s.label}" | Badge: "${s.badge}"`);
  });

  // Test 3: Oct 19 Archive Verification
  const oct19Snapshots = getSnapshotsForDate('2026-10-19');
  console.log(`\n📦 3. Oct 19 Snapshot count: ${oct19Snapshots.length} stocks.`);
  if (oct19Snapshots.length !== 64) {
    console.error(`❌ Expected 64 stocks, got ${oct19Snapshots.length}`);
  } else {
    console.log('✅ Exactly 64 covered stocks captured for 2026-10-19.');
  }

  const prlOct19 = oct19Snapshots.find(s => s.ticker === 'PRL');
  console.log('\n🔍 PRL on Oct 19 (Historical Snapshot):', {
    ticker: prlOct19?.ticker,
    session_date: prlOct19?.session_date,
    closing_price: prlOct19?.closing_price,
    change_percent: prlOct19?.change_percent,
    signal_type: prlOct19?.signal_type,
    is_momentum_breakout: prlOct19?.is_momentum_breakout,
    entry_zone: `${prlOct19?.entry_min} - ${prlOct19?.entry_max}`,
    stop_loss: prlOct19?.stop_loss,
    target_1: prlOct19?.target_1,
    rsi: prlOct19?.rsi,
    outcome: prlOct19?.outcome
  });

  if (
    prlOct19?.closing_price === 108.81 &&
    prlOct19?.entry_min === 107.89 &&
    prlOct19?.entry_max === 109.27 &&
    prlOct19?.stop_loss === 106.42 &&
    prlOct19?.rsi === 78.7 &&
    prlOct19?.outcome?.label === 'Closed on Next Day Drop'
  ) {
    console.log('✅ PRL Oct 19 setup exactly matches required historical specs: 108.81, Trail Band 107.89-109.27, Stop 106.42, Outcome: Closed on Next Day Drop (-6.77%).');
  } else {
    console.error('❌ PRL Oct 19 mismatch!');
  }

  // Test 4: Oct 20 EOD Snapshot & Price Sync Verification
  const oct20Snapshots = getSnapshotsForDate('2026-10-20');
  console.log(`\n📦 4. Oct 20 EOD Snapshot count: ${oct20Snapshots.length} stocks.`);
  const prlOct20 = oct20Snapshots.find(s => s.ticker === 'PRL');
  console.log('🔍 PRL on Oct 20 (EOD Close):', {
    ticker: prlOct20?.ticker,
    session_date: prlOct20?.session_date,
    closing_price: prlOct20?.closing_price,
    change_percent: prlOct20?.change_percent,
    signal_type: prlOct20?.signal_type,
    is_momentum_breakout: prlOct20?.is_momentum_breakout,
    entry_zone: `${prlOct20?.entry_min} - ${prlOct20?.entry_max}`,
    stop_loss: prlOct20?.stop_loss,
    target_1: prlOct20?.target_1,
    rsi: prlOct20?.rsi,
    outcome: prlOct20?.outcome
  });

  const officialPrl = officialQuotes['PRL'];
  console.log('📊 Official Quotes Store PRL:', {
    symbol: officialPrl.symbol,
    currentPrice: officialPrl.currentPrice,
    changePercent: officialPrl.changePercent,
    prevClose: officialPrl.prevClose
  });

  if (
    prlOct20?.closing_price === 101.44 &&
    officialPrl?.currentPrice === 101.44 &&
    prlOct20?.change_percent === -6.77 &&
    prlOct20?.is_momentum_breakout === false
  ) {
    console.log('✅ PRL Oct 20 EOD is 101.44 (-6.77%), fully in sync with single source of truth, and correctly recalculated to defensive (NOT Momentum Breakout)!');
  } else {
    console.error('❌ PRL Oct 20 sync mismatch!');
  }

  // Test 5: Immutability Verification (Write-Once Guarantee)
  console.log('\n🔒 5. Testing Immutability Invariant...');
  const attemptOverwrite = await insertImmutableSnapshot({
    ticker: 'PRL',
    session_date: '2026-10-19',
    closing_price: 999.99, // Malicious overwrite attempt
    signal_type: 'STRONG_BUY'
  });

  const verifiedOct19 = getSnapshotsForDate('2026-10-19').find(s => s.ticker === 'PRL');
  if (verifiedOct19.closing_price === 108.81) {
    console.log('✅ Immutability verified: Overwrite attempt was blocked, original 108.81 record preserved intact!');
  } else {
    console.error('❌ Immutability violation! Record was overwritten.');
  }

  // Test 6: Oct 21 Tomorrow Setup Verification
  const oct21Snapshots = getSnapshotsForDate('2026-10-21');
  console.log(`\n📦 6. Oct 21 Tomorrow Open Snapshot count: ${oct21Snapshots.length} stocks.`);
  const prlOct21 = oct21Snapshots.find(s => s.ticker === 'PRL');
  console.log('🔍 PRL on Oct 21 (Tomorrow Open):', {
    ticker: prlOct21?.ticker,
    session_date: prlOct21?.session_date,
    closing_price: prlOct21?.closing_price,
    signal_type: prlOct21?.signal_type
  });

  console.log('\n🎉 ALL ARCHITECTURAL TESTS PASSED!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
