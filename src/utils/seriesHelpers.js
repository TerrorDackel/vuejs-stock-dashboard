/**
 * Return the last N items of an array.
 * @template T
 * @param {T[]} arr - Source array.
 * @param {number} n - Count of items from the end.
 * @returns {T[]} Last N items (or fewer).
 */
export function lastN(arr, n) {
  const a = Array.isArray(arr) ? arr : [];
  return a.slice(Math.max(0, a.length - n));
}

/**
 * Sum of the last four numeric values (TTM).
 * @param {(number|null|undefined)[]} series - Values per quarter.
 * @returns {number} Sum of last four finite numbers (NaN → 0 handled).
 */
export function sumTTM(series) {
  const v = lastN(series.filter(isNum), 4);
  return v.reduce((s, x) => s + x, 0);
}

/**
 * Percentage change from prev to curr.
 * @param {number|null|undefined} curr - Current value.
 * @param {number|null|undefined} prev - Previous value.
 * @returns {number|null} Percent or null if invalid.
 */
export function pctChange(curr, prev) {
  if (!isNum(curr) || !isNum(prev) || prev === 0) {
    return null;
  }
  return ((curr - prev) / prev) * 100;
}

/**
 * Year-over-year percentage for up to last four quarters.
 * Compares q[i] vs q[i-4].
 * @param {(number|null|undefined)[]} series - Quarterly values.
 * @returns {(number|null)[]} Up to 4 YoY percentages.
 */
export function yoySeries(series) {
  const out = [];
  for (let i = 4; i < series.length; i++) {
    out.push(pctChange(series[i], series[i - 4]));
  }
  return lastN(out, 4);
}

/**
 * Finite number guard.
 * @param {unknown} x - Any value.
 * @returns {x is number} True for finite numbers.
 */
export function isNum(x) {
  return typeof x === 'number' && Number.isFinite(x);
}
