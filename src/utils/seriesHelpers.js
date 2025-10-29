export function lastN(arr, n) {
  const a = Array.isArray(arr) ? arr.slice() : [];
  return a.slice(Math.max(0, a.length - n));
}

export function sumTTM(arr) {
  const v = lastN(arr.filter(isNum), 4);
  return v.reduce((s, x) => s + x, 0);
}

export function pctChange(curr, prev) {
  if (!isNum(curr) || !isNum(prev) || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

export function yoySeries(series) {
  // YoY for last 4 completed quarters: q[i] vs q[i-4]
  const out = [];
  for (let i = 4; i < series.length; i++) {
    const p = series[i - 4], c = series[i];
    out.push(pctChange(c, p));
  }
  return lastN(out, 4);
}

export function isNum(x) { return typeof x === 'number' && Number.isFinite(x); }