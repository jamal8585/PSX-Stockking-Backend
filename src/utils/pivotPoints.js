/**
 * Standard Floor Pivot Points Calculation
 * PP = (H + L + C) / 3
 * R1 = 2*PP - L        S1 = 2*PP - H
 * R2 = PP + (H - L)    S2 = PP - (H - L)
 * R3 = H + 2*(PP - L)  S3 = L - 2*(H - PP)
 * 
 * If H == L (no range), returns '—' for all levels.
 */
export function calculateFloorPivots(high, low, close) {
  const H = Number(high);
  const L = Number(low);
  const C = Number(close);

  if (!H || !L || !C || isNaN(H) || isNaN(L) || isNaN(C) || H <= L || L <= 0) {
    return {
      hasRange: false,
      pp: '—',
      r1: '—',
      r2: '—',
      r3: '—',
      s1: '—',
      s2: '—',
      s3: '—'
    };
  }

  const pp = (H + L + C) / 3;
  const r1 = 2 * pp - L;
  const s1 = 2 * pp - H;
  const r2 = pp + (H - L);
  const s2 = pp - (H - L);
  const r3 = H + 2 * (pp - L);
  const s3 = L - 2 * (H - pp);

  return {
    hasRange: true,
    pp: Number(pp.toFixed(2)),
    r1: Number(r1.toFixed(2)),
    r2: Number(r2.toFixed(2)),
    r3: Number(r3.toFixed(2)),
    s1: Number(s1.toFixed(2)),
    s2: Number(s2.toFixed(2)),
    s3: Number(s3.toFixed(2))
  };
}
