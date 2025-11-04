/**
 * Format a number in billions with currency.
 * @param {number|null} v
 * @returns {string}
 */
export function fmtBillionsUSD(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) {
    return 'n/a';
  }
  return `$${v.toFixed(2)}B`;
}

/**
 * Format percentage with sign and two decimals.
 * @param {number|null} v
 * @returns {string}
 */
export function fmtPct(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) {
    return 'n/a';
  }
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}
