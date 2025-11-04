/**
 * Company → Sheet tab mapping and absolute row indices for metrics.
 * Row indices are 1-based INCLUDING the header row (as in Google Sheets UI).
 * We convert them in code to zero-based data indices where needed.
 */

/** @type {Record<string, string>} */
export const SHEET_NAME = {
  AAPL: '$AAPL',
  AMZN: '$AMZN',
  GOOG: '$GOOG',
  META: '$META',
  MSFT: '$MSFT',
  NVDA: '$NVDA',
  TSLA: '$TSLA'
};

/**
 * Absolute row indices (1-based incl. header) per metric and ticker.
 * These align with the checklist/spec of your sheet.
 * Fill in/adjust as needed when rows change.
 * @type {{ revenue: Record<string, number>, netIncome: Record<string, number>, grossMargin: Record<string, number> }}
 */
export const ROW_INDEX = {
  revenue: {
    AAPL: 5,
    AMZN: 9,
    GOOG: 5,
    META: 5,
    MSFT: 9,
    NVDA: 5,
    TSLA: 13
  },
  netIncome: {
    AAPL: 36,
    AMZN: 41,
    GOOG: 41,
    META: 27,
    MSFT: 30,
    NVDA: 29,
    TSLA: 44
  },
  grossMargin: {
    AAPL: 23,
    AMZN: 15,
    GOOG: 25,
    META: 11,
    MSFT: 15,
    NVDA: 11,
    TSLA: 26
  }
};
