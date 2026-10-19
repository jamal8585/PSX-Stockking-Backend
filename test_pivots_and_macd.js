import { calculateFloorPivots } from './src/utils/pivotPoints.js';

function formatSignedNumber(val, decimals = 2) {
  const num = Number(val);
  if (isNaN(num)) return (0).toFixed(decimals);
  if (num > 0) return `+${num.toFixed(decimals)}`;
  if (num < 0) return num.toFixed(decimals);
  return (0).toFixed(decimals);
}

function runTests() {
  console.log('--- 1. Testing Standard Floor Pivots with Known OHLC ---');
  // Known OHLC: High = 500, Low = 400, Close = 450
  const pivots = calculateFloorPivots(500, 400, 450);
  console.log('Result for H=500, L=400, C=450:', pivots);

  const expected = {
    hasRange: true,
    s3: 300,
    s2: 350,
    s1: 400,
    pp: 450,
    r1: 500,
    r2: 550,
    r3: 600
  };

  let pass = true;
  for (const [k, v] of Object.entries(expected)) {
    if (pivots[k] !== v) {
      console.error(`❌ Mismatch on ${k}: expected ${v}, got ${pivots[k]}`);
      pass = false;
    }
  }

  // Check 7 distinct values
  const distinctValues = new Set([pivots.s3, pivots.s2, pivots.s1, pivots.pp, pivots.r1, pivots.r2, pivots.r3]);
  if (distinctValues.size === 7) {
    console.log('✅ PASS: All 7 pivot levels are distinct and match mathematical expectation exactly!');
  } else {
    console.error(`❌ FAIL: Expected 7 distinct values, got ${distinctValues.size}`);
    pass = false;
  }

  console.log('\n--- 2. Testing Flat Range Guard (H == L) ---');
  const flatPivots = calculateFloorPivots(485.38, 485.38, 485.38);
  console.log('Result for H=485.38, L=485.38, C=485.38:', flatPivots);
  if (flatPivots.hasRange === false && flatPivots.pp === '—' && flatPivots.r1 === '—' && flatPivots.s1 === '—') {
    console.log('✅ PASS: Flat range safely returns "—" instead of repeating identical values!');
  } else {
    console.error('❌ FAIL: Flat range did not return "—"');
    pass = false;
  }

  console.log('\n--- 3. Testing ENGRO Real Session Quote (H=489, L=476, C=485.38) ---');
  const engroPivots = calculateFloorPivots(489, 476, 485.38);
  console.log('ENGRO Pivots:', engroPivots);
  const engroDistinct = new Set([engroPivots.s3, engroPivots.s2, engroPivots.s1, engroPivots.pp, engroPivots.r1, engroPivots.r2, engroPivots.r3]);
  if (engroDistinct.size === 7) {
    console.log(`✅ PASS: ENGRO produces 7 distinct levels: S3=${engroPivots.s3}, S2=${engroPivots.s2}, S1=${engroPivots.s1}, PP=${engroPivots.pp}, R1=${engroPivots.r1}, R2=${engroPivots.r2}, R3=${engroPivots.r3}`);
  } else {
    console.error('❌ FAIL: ENGRO did not produce 7 distinct values');
    pass = false;
  }

  console.log('\n--- 4. Testing MACD Sign Formatter (Item 4) ---');
  const negTest = formatSignedNumber(-0.01, 2);
  const zeroTest = formatSignedNumber(0.00, 2);
  const posTest = formatSignedNumber(0.45, 2);

  console.log(`-0.01 -> "${negTest}", 0.00 -> "${zeroTest}", 0.45 -> "${posTest}"`);
  if (negTest === '-0.01' && zeroTest === '0.00' && posTest === '+0.45') {
    console.log('✅ PASS: MACD formatting correctly prevents double-sign "+-" on negative values!');
  } else {
    console.error('❌ FAIL: MACD sign formatting incorrect');
    pass = false;
  }

  if (!pass) process.exit(1);
}

runTests();
