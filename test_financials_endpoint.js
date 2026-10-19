import { fetchStockFinancials } from './src/services/financialsService.js';

async function verifyFinancials() {
  const symbols = ['ENGRO', 'OGDC', 'SYS'];
  console.log('--- Verifying Financials for ENGRO, OGDC, SYS ---');
  let allPassed = true;

  for (const sym of symbols) {
    try {
      const data = await fetchStockFinancials(sym);
      if (!data) {
        console.error(`❌ [${sym}] Returned null or undefined!`);
        allPassed = false;
        continue;
      }

      const hasQuarterly = data.quarterly && Array.isArray(data.quarterly.periods) && data.quarterly.periods.length > 0;
      const hasAnnual = data.annual && Array.isArray(data.annual.periods) && data.annual.periods.length > 0;
      const hasMetrics = data.quarterly?.metrics && typeof data.quarterly.metrics.sales !== 'undefined';
      const hasName = Boolean(data.companyName && data.companyName.length > 0);

      if (hasQuarterly && hasAnnual && hasMetrics && hasName) {
        console.log(`✅ [${sym}] PASS: "${data.companyName}", Quarterly Periods: ${data.quarterly.periods.length}, Annual Periods: ${data.annual.periods.length}`);
      } else {
        console.error(`❌ [${sym}] FAIL: Missing expected properties`, { hasQuarterly, hasAnnual, hasMetrics, hasName });
        allPassed = false;
      }
    } catch (err) {
      console.error(`❌ [${sym}] EXCEPTION:`, err.message);
      allPassed = false;
    }
  }

  if (!allPassed) {
    process.exit(1);
  } else {
    console.log('🎉 All 3 symbols verified successfully with non-empty financial statements!');
  }
}

verifyFinancials();
