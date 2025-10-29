/**
 * Brand colors per ticker for charts.
 * Keep high contrast and consistent mapping across widgets.
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
 * @param {string} t
 * @returns {string}
 */
export function colorOf(t) { return BRAND[t] || '#888888'; }
