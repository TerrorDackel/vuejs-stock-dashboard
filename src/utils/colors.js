/**
 * Brand colors per ticker for charts.
 * Keep high contrast and consistent mapping across widgets.
 * @type {Record<string, string>}
 */
export const BRAND = {
  AAPL: '#5AC8FA',
  AMZN: '#FF9900',
  GOOG: '#34A853',
  META: '#1877F2',
  MSFT: '#737373',
  NVDA: '#76B900',
  TSLA: '#CC0000'
};

/**
 * Resolve a color for a ticker with fallback.
 * @param {string} t - Stock ticker.
 * @returns {string} Hex color.
 */
export function colorOf(t) {
  return BRAND[t] || '#888888';
}
