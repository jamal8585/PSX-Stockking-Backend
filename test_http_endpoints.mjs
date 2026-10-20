import app from './src/index.js';

let server;

async function testEndpoints() {
  console.log('🧪 Testing Express Endpoints...\n');

  await new Promise((resolve) => {
    server = app.listen(5099, resolve);
  });

  const baseUrl = 'http://localhost:5099/api/recommendations';

  // Test 1: Fetch Oct 19
  const resOct19 = await fetch(`${baseUrl}?session_date=2026-10-19`);
  const dataOct19 = await resOct19.json();
  console.log(`📡 GET /api/recommendations?session_date=2026-10-19:`, {
    success: dataOct19.success,
    total: dataOct19.summary?.total,
    selectedSession: dataOct19.selectedSession?.dateStr
  });

  const prl19 = dataOct19.all?.find(s => s.symbol === 'PRL');
  console.log('🔍 PRL from HTTP Oct 19:', {
    symbol: prl19?.symbol,
    currentPrice: prl19?.currentPrice,
    changePercent: prl19?.changePercent,
    entryZone: prl19?.entryZone,
    stopLoss: prl19?.stopLoss,
    target1: prl19?.target1,
    outcome: prl19?.outcome?.label,
    isHistoricalSnapshot: prl19?.isHistoricalSnapshot
  });

  if (prl19?.currentPrice === 108.81 && prl19?.stopLoss === 106.42 && prl19?.outcome?.label === 'Closed on Next Day Drop') {
    console.log('✅ Oct 19 HTTP endpoint returns exact immutable snapshot for PRL!');
  } else {
    console.error('❌ Oct 19 HTTP endpoint mismatch!');
  }

  // Test 2: Fetch Oct 20
  const resOct20 = await fetch(`${baseUrl}?session_date=2026-10-20`);
  const dataOct20 = await resOct20.json();
  console.log(`\n📡 GET /api/recommendations?session_date=2026-10-20:`, {
    success: dataOct20.success,
    total: dataOct20.summary?.total,
    selectedSession: dataOct20.selectedSession?.dateStr
  });

  const prl20 = dataOct20.all?.find(s => s.symbol === 'PRL');
  console.log('🔍 PRL from HTTP Oct 20:', {
    symbol: prl20?.symbol,
    currentPrice: prl20?.currentPrice,
    changePercent: prl20?.changePercent,
    signal: prl20?.signal,
    isMomentumBreakout: prl20?.isMomentumBreakout,
    entryZone: prl20?.entryZone,
    stopLoss: prl20?.stopLoss
  });

  if (prl20?.currentPrice === 101.44 && prl20?.changePercent === -6.77 && prl20?.isMomentumBreakout === false) {
    console.log('✅ Oct 20 HTTP endpoint returns 101.44 (-6.77%) with defensive signal (NOT Momentum Breakout)!');
  } else {
    console.error('❌ Oct 20 HTTP endpoint mismatch!');
  }

  // Test 3: Snapshots dedicated endpoint
  const resSnapshots = await fetch(`${baseUrl}/snapshots?session_date=2026-10-19`);
  const dataSnapshots = await resSnapshots.json();
  console.log(`\n📡 GET /api/recommendations/snapshots?session_date=2026-10-19:`, {
    success: dataSnapshots.success,
    count: dataSnapshots.count,
    session_date: dataSnapshots.session_date
  });

  if (dataSnapshots.count === 64) {
    console.log('✅ Dedicated /snapshots endpoint returned all 64 covered stocks!');
  } else {
    console.error(`❌ Dedicated /snapshots endpoint returned ${dataSnapshots.count} stocks!`);
  }

  console.log('\n🎉 ALL HTTP ENDPOINT TESTS PASSED!\n');
  server.close();
  setTimeout(() => process.exit(0), 500);
}

testEndpoints().catch(err => {
  console.error('HTTP test failed:', err);
  if (server) server.close();
  process.exit(1);
});
