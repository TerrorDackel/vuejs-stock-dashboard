import axios from 'axios';

const BASE_URL = 'https://sheetdb.io/api/v1/h383llrajzdr9';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000
});

/** Load entire tab. Returns array of row objects in sheet order. */
export async function fetchTab(tabName) {
  const { data } = await api.get('/', { params: { sheet: tabName } });
  return Array.isArray(data) ? data : [];
}

/** Return the first column header name (e.g. "Metric" or similar). */
function firstColKey(rowObj) {
  const keys = Object.keys(rowObj);
  return keys.length ? keys[0] : null;
}

/** Find the row object whose first cell equals the given label. */
export function findRowByLabel(rows, label) {
  if (!rows.length) return null;
  const key0 = firstColKey(rows[0]);
  if (!key0) return null;
  return rows.find(r => String(r[key0]).trim() === String(label).trim()) || null;
}

/** Get row object by absolute sheet row index (1-based, counting header as row 1). */
export function getRowByIndex(rows, rowIndex1) {
  // SheetDB exposes rows in visual order excluding header as index 0? We keep it robust:
  // Assume: rows[0] corresponds to sheet row 2 when the first row is headers.
  // The checklist gave absolute indices including header. We translate: idx = rowIndex1 - 2.
  const idx = Math.max(0, rowIndex1 - 2);
  return rows[idx] || null;
}

/** Extract quarter labels from the "Product" row (cells after first column). */
export function extractQuarterLabels(rows) {
  // Prefer explicit "Product" row
  const product = findRowByLabel(rows, 'Product') || getRowByIndex(rows, 5);
  if (!product) return [];
  const keys = Object.keys(product);
  // drop first column (row label), keep the rest in natural order
  return keys.slice(1).map(k => String(product[k]).trim()).filter(v => v && v !== '""');
}

/** Convert a metric row object to an array of numbers aligned to provided quarters. */
export function rowToSeries(rowObj, quarters) {
  if (!rowObj) return quarters.map(() => null);
  const keys = Object.keys(rowObj).slice(1); // skip label column
  const values = keys.map(k => toNumberOrNull(rowObj[k]));
  // align by index length to quarters
  const len = Math.min(values.length, quarters.length);
  const out = new Array(quarters.length).fill(null);
  for (let i = 0; i < len; i++) out[i] = values[i];
  return out;
}

function toNumberOrNull(v) {
  if (v === null || v === undefined) return null;
  const n = Number(String(v).replace(/[, ]/g, '')); // remove thousands separators/spaces
  return Number.isFinite(n) ? n : null;
}