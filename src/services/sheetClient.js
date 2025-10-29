/* Google Sheet access via SheetDB */

import axios from 'axios';

const api = axios.create({
  baseURL: 'https://sheetdb.io/api/v1/h383llrajzdr9',
  timeout: 15000
});

/**
 * Load all rows of a tab.
 * @param {string} tabName - SheetDB tab name (e.g. "$AAPL").
 * @returns {Promise<object[]>} Array of row objects in visual order.
 */
export async function fetchTab(tabName) {
  const { data } = await api.get('/', { params: { sheet: tabName } });
  return Array.isArray(data) ? data : [];
}

/**
 * Get the first column key of a row object.
 * @param {object} rowObj - A row object as returned by SheetDB.
 * @returns {string|null} First key or null if none.
 */
function firstColKey(rowObj) {
  const keys = Object.keys(rowObj);
  return keys.length ? keys[0] : null;
}

/**
 * Find a row by its label in the first column.
 * @param {object[]} rows - Tab rows.
 * @param {string} label - Expected label text.
 * @returns {object|null} Matching row or null.
 */
export function findRowByLabel(rows, label) {
  if (!rows.length) return null;
  const k0 = firstColKey(rows[0]);
  if (!k0) return null;
  return rows.find(r => String(r[k0]).trim() === String(label).trim()) || null;
}

/**
 * Map absolute sheet row index (1-based incl. header) to data array index.
 * @param {object[]} rows - Tab rows (header excluded by API).
 * @param {number} rowIndex1 - Absolute row index incl. header.
 * @returns {object|null} Row object or null.
 */
export function getRowByIndex(rows, rowIndex1) {
  const idx = Math.max(0, rowIndex1 - 2);
  return rows[idx] || null;
}

/**
 * Extract quarter labels from the "Product" row (A5:AO5).
 * Falls back to absolute row 5 if label search fails.
 * @param {object[]} rows - Tab rows.
 * @returns {string[]} Quarter labels in natural order.
 */
export function extractQuarterLabels(rows) {
  const product = findRowByLabel(rows, 'Product') || getRowByIndex(rows, 5);
  if (!product) return [];
  const keys = Object.keys(product).slice(1);
  return keys.map(k => String(product[k]).trim()).filter(v => v && v !== '""');
}

/**
 * Convert a metric row to a numeric time series aligned to quarters.
 * @param {object|null} rowObj - Metric row or null.
 * @param {string[]} quarters - Target quarter labels.
 * @returns {(number|null)[]} Series aligned to quarters.
 */
export function rowToSeries(rowObj, quarters) {
  if (!rowObj) return quarters.map(() => null);
  const keys = Object.keys(rowObj).slice(1);
  const vals = keys.map(k => toNumberOrNull(rowObj[k]));
  const len = Math.min(vals.length, quarters.length);
  const out = new Array(quarters.length).fill(null);
  for (let i = 0; i < len; i++) out[i] = vals[i];
  return out;
}

/**
 * Parse value to number or null.
 * @param {*} v - Raw cell value.
 * @returns {number|null} Parsed number or null.
 */
function toNumberOrNull(v) {
  if (v === null || v === undefined) return null;
  const n = Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
}
