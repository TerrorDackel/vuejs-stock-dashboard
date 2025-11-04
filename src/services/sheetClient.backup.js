/* Google Sheet access via SheetDB with retry, pacing and label fallbacks. */

import axios from 'axios';

/**
 * Axios instance that goes through the Vue devServer proxy.
 * In vue.config.js we rewrite '^/api' â†’ '' to https://sheetdb.io
 * so requesting '/v1/...' here hits 'https://sheetdb.io/v1/...'.
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 15000
});

/** @type {Map<string, Promise<any>>} Prevent duplicate concurrent GETs for the same key. */
const inflight = new Map();

/** Timestamp of the last request to gently pace outgoing calls. */
let lastAt = 0;

/**
 * Sleep helper.
 * @param {number} ms - Milliseconds to wait.
 * @returns {Promise<void>} Resolves after the given delay.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gentle pacing (~120 ms) to avoid bursty calls that could trigger 429.
 * @returns {Promise<void>} Resolves when pacing delay (if any) is done.
 */
async function pace() {
  const GAP_MS = 120;
  const now = Date.now();
  const wait = Math.max(0, lastAt + GAP_MS - now);
  if (wait > 0) await delay(wait);
  lastAt = Date.now();
}

/**
 * Perform a GET request returning JSON with bounded retry on 429/5xx.
 * Also de-duplicates in-flight requests and applies pacing.
 *
 * @param {string} url - Relative URL (e.g., '/v1/h383llrajzdr9').
 * @param {object} [params] - Query parameters for the request.
 * @returns {Promise<any>} Parsed JSON payload.
 */
async function getJson(url, params) {
  const key = url + JSON.stringify(params || {});
  if (inflight.has(key)) {
    return /** @type {Promise<any>} */ (inflight.get(key));
  }

  const promise = (async () => {
    await pace();

    const MAX_ATTEMPTS = 4; /* 1 try + up to 3 retries */
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const { data } = await api.get(url, { params });
        return data;
      } catch (err) {
        const status = err?.response?.status;
        const retriable = status === 429 || (status >= 500 && status < 600);
        const lastTry = attempt === MAX_ATTEMPTS - 1;
        if (!retriable || lastTry) {
          throw err;
        }
        const backoff = 250 * Math.pow(2, attempt); /* 250, 500, 1000 ms */
        await delay(backoff);
      }
    }

    // Should be unreachable due to throw on lastTry; keep TS/JS happy.
    /* istanbul ignore next */
    return null;
  })();

  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

/**
 * Load all rows of a specific sheet tab.
 * @param {string} tabName - SheetDB tab name (e.g., "$AAPL").
 * @returns {Promise<object[]>} Array of row objects in visual order.
 */
export async function fetchTab(tabName) {
  const data = await getJson('/v1/h383llrajzdr9', { sheet: tabName });
  return Array.isArray(data) ? data : [];
}

/**
 * Get the first column header key from a row object.
 * @param {object} rowObj - Row object as returned by SheetDB.
 * @returns {string|null} First key or null if unavailable.
 */
function firstColKey(rowObj) {
  const keys = Object.keys(rowObj);
  return keys.length ? keys[0] : null;
}

/**
 * Find a row by an exact label match in the first column.
 * @param {object[]} rows - Tab rows.
 * @param {string} label - Expected label text.
 * @returns {object|null} Matching row or null.
 */
export function findRowByLabel(rows, label) {
  if (!rows.length) return null;
  const k0 = firstColKey(rows[0]);
  if (!k0) return null;
  return rows.find((r) => String(r[k0]).trim() === String(label).trim()) || null;
}

/**
 * Find a row matching any of the provided case-insensitive regex patterns.
 * @param {object[]} rows - Tab rows.
 * @param {RegExp[]} patterns - Candidate patterns (case-insensitive).
 * @returns {object|null} Matching row or null.
 */
export function findRowByAnyLabel(rows, patterns) {
  if (!rows.length) return null;
  const k0 = firstColKey(rows[0]);
  if (!k0) return null;
  return (
    rows.find((r) => {
      const v = String(r[k0] ?? '').trim();
      return patterns.some((rx) => rx.test(v));
    }) || null
  );
}

/**
 * Detect if a string looks like a quarter label or a date-like column header.
 * Examples: "24Q1", "25Q3", "24 Jan 24", "3 Aug 23", "2 Nov 23".
 * @param {string} v - Raw cell text.
 * @returns {boolean} True when it looks like a quarter/date header.
 */
// eslint-disable-next-line no-unused-vars
function looksLikeQuarterLabel(v) {
  const s = String(v || '').trim();
  if (!s) return false;
  const rxQuarter = /^\d{2}Q[1-4]$/;                     // e.g. 24Q3
  const rxDateHdr = /^\d{1,2}\s+[A-Za-z]{3}\s+\d{2}$/;   // e.g. 24 Jan 24 / 3 Aug 23
  return rxQuarter.test(s) || rxDateHdr.test(s);
}

/**
 * NEW robust quarter extraction:
 * - Prefer a row whose non-first cells are Ã¼berwiegend quarter/date headers.
 * - Only if none found, fallback to old "Product"-based logic.
 *
 * @param {object[]} rows - Tab rows.
 * @returns {string[]} Quarter labels in natural order.
 */
export function extractQuarterLabels(rows) {
  if (!rows.length) return [];

  const looksLikeQuarterLabel = (s) =>
    /^\d{2}Q[1-4]$/.test(s) || /^\d{1,2}\s+[A-Za-z]{3}\s+\d{2}$/.test(s);


  let qrow = rows.find((r) => {
    const vals = Object.keys(r).slice(1).map((k) => String(r[k] ?? '').trim());
    if (!vals.length) return false;
    const hits = vals.filter(looksLikeQuarterLabel).length;
    return hits >= Math.max(4, Math.ceil(vals.length * 0.5));
  });


  if (!qrow) {
    const product = findRowByLabel(rows, 'Product') || getRowByIndex(rows, 5);
    qrow = product || null;
  }
  if (!qrow) return [];

  return Object.keys(qrow)
    .slice(1)
    .map((k) => String(qrow[k]).trim())
    .filter((v) => v && v !== '""');
}



/**
 * Map absolute sheet row index (1-based incl. header) to the zero-based data index used by SheetDB.
 * @param {object[]} rows - Tab rows (header excluded by API).
 * @param {number} rowIndex1 - Absolute row index incl. header (as seen in Google Sheets UI).
 * @returns {object|null} Row object at the mapped position or null.
 */
export function getRowByIndex(rows, rowIndex1) {
  const idx = Math.max(0, rowIndex1 - 2);
  return rows[idx] || null;
}

/**
 * Convert a metric row to a numeric time series aligned to given quarters.
 * Missing/invalid values are mapped to null.
 * @param {object|null} rowObj - Metric row or null.
 * @param {string[]} quarters - Target quarter labels.
 * @returns {(number|null)[]} Series aligned to the quarters array.
 */
export function rowToSeries(rowObj, quarters) {
  if (!rowObj) return quarters.map(() => null);
  const keys = Object.keys(rowObj).slice(1);
  const vals = keys.map((k) => toNumberOrNull(rowObj[k]));
  const out = new Array(quarters.length).fill(null);
  const len = Math.min(vals.length, quarters.length);
  for (let i = 0; i < len; i++) out[i] = vals[i];
  return out;
}

/**
 * Parse an arbitrary value into a finite number, or null when not possible.
 * @param {*} v - Raw cell value.
 * @returns {number|null} Finite number or null.
 */
function toNumberOrNull(v) {
  if (v === null || v === undefined) return null;
  const n = Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
}
