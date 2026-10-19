import { fetchStockPayouts } from './src/services/payoutsService.js';

async function verifyPayouts() {
  const testCases = [
    { sym: 'ENGRO', shouldHavePayouts: true },
    { sym: 'OGDC', shouldHavePayouts: true },
    { sym: 'SYS', shouldHavePayouts: true },
    { sym: 'WTL', shouldHavePayouts: false }
  ];

  console.log('--- Verifying Corporate Payouts for ENGRO, OGDC, SYS, WTL ---');
  let allPassed = true;

  for (const tc of testCases) {
    try {
      const data = await fetchStockPayouts(tc.sym);
      if (!data) {
        console.error(`❌ [${tc.sym}] Returned null or undefined!`);
        allPassed = false;
        continue;
      }

      const hasDividends = Array.isArray(data.dividends);
      const divCount = data.dividends.length;
      const ttm = data.summary?.ttmDividend;
      const yieldPct = data.summary?.dividendYield;

      if (tc.shouldHavePayouts) {
        if (divCount > 0 && typeof ttm === 'number' && typeof yieldPct === 'number') {
          console.log(`✅ [${tc.sym}] PASS: ${divCount} payouts, TTM: ${ttm} PKR, Yield: ${yieldPct}%, Latest: ${data.dividends[0].date} (${data.dividends[0].amount} PKR)`);
        } else {
          console.error(`❌ [${tc.sym}] FAIL: Expected payouts but found count=${divCount}, ttm=${ttm}, yield=${yieldPct}`);
          allPassed = false;
        }
      } else {
        // Genuine empty state for non-dividend stock
        if (divCount === 0 && ttm === 0) {
          console.log(`✅ [${tc.sym}] PASS: Genuine 0-payout empty state confirmed (count=0, ttm=0).`);
        } else {
          console.error(`❌ [${tc.sym}] FAIL: Expected 0 payouts but found count=${divCount}`);
          allPassed = false;
        }
      }
    } catch (err) {
      console.error(`❌ [${tc.sym}] EXCEPTION:`, err.message);
      allPassed = false;
    }
  }

  if (!allPassed) {
    process.exit(1);
  } else {
    console.log('🎉 Corporate Payouts verified successfully across all test symbols!');
  }
}

verifyPayouts();
