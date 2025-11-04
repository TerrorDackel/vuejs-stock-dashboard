import { tslaRevenue, tslaNetIncome, tslaGrossMargin, tslaQuarters, isTslaSheet } from './tslaParser';
/* Google Sheet access via SheetDB with retry, pacing and label fallbacks. */
import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 15000 });

/** De-dupe in-flight GETs and gentle pacing to avoid 429s. */
const inflight = new Map();
let lastAt = 0;

function delay(ms){ return new Promise(r => setTimeout(r, ms)); }
async function pace(){ const GAP=120; const now=Date.now(); const wait=Math.max(0,lastAt+GAP-now); if(wait>0) await delay(wait); lastAt=Date.now(); }

async function getJson(url, params){
  const key = url + JSON.stringify(params || {});
  if (inflight.has(key)) return inflight.get(key);
  const p = (async ()=>{
    await pace();
    const MAX=4;
    for (let i=0;i<MAX;i++){
      try { const { data } = await api.get(url, { params }); return data; }
      catch(err){
        const s = err?.response?.status;
        const retry = s === 429 || (s >= 500 && s < 600);
        if (!retry || i === MAX-1) throw err;
        await delay(250 * Math.pow(2,i));
      }
    }
    return null;
  })();
  inflight.set(key, p);
  try { return await p; } finally { inflight.delete(key); }
}

/** Load all rows of a specific sheet tab. */
export async function fetchTab(tabName){
  const data = await getJson('/v1/h383llrajzdr9', { sheet: tabName });
  return Array.isArray(data) ? data : [];
}
const fetchData = fetchTab; // legacy alias for callers that expect fetchData

/** Helpers */
function firstColKey(rowObj){ const keys = Object.keys(rowObj || {}); return keys.length ? keys[0] : null; }

export function findRowByLabel(rows, label){
  if (!rows.length) return null;
  const k0 = firstColKey(rows[0]); if (!k0) return null;
  return rows.find(r => String(r[k0]).trim() === String(label).trim()) || null;
}

export function findRowByAnyLabel(rows, patterns){
  if (!rows.length) return null;
  const k0 = firstColKey(rows[0]); if (!k0) return null;
  return rows.find(r => {
    const v = String(r[k0] ?? '').trim();
    return patterns.some(rx => rx.test(v));
  }) || null;
}

/** Quarter/date header detector used by extractQuarterLabels. */
function looksLikeQuarterLabel(v){
  const s = String(v || '').trim();
  if (!s) return false;
  const rxQ = /^\d{2}Q[1-4]$/;                 // 24Q3
  const rxD = /^\d{1,2}\s+[A-Za-z]{3}\s+\d{2}$/; // 24 Jan 24 / 3 Aug 23
  return rxQ.test(s) || rxD.test(s);
}

/** Robust quarter extraction with TSLA-safe fallback. */
export function extractQuarterLabels(rows){
  if (!rows.length) return [];
  // Heuristik: Zeile finden, deren Nicht-First-Cells überwiegend wie Quarter/Date aussehen.
  let qrow = rows.find(r => {
    const vals = Object.keys(r).slice(1).map(k => String(r[k] ?? '').trim());
    if (!vals.length) return false;
    const hits = vals.filter(looksLikeQuarterLabel).length;
    return hits >= Math.max(4, Math.ceil(vals.length * 0.5));
  });

  // Fallback wie zuvor (z.B. manche Sheets haben "Product" als Quarter-Zeile)
  if (!qrow) {
    const product = findRowByLabel(rows, 'Product') || getRowByIndex(rows, 5);
    qrow = product || null;
  }
  if (!qrow) return [];

  return Object.keys(qrow)
    .slice(1)
    .map(k => String(qrow[k]).trim())
    .filter(v => v && v !== '""');
}

/** Map sheet 1-based row index to zero-based data index used by SheetDB. */
export function getRowByIndex(rows, rowIndex1){
  const idx = Math.max(0, rowIndex1 - 2);
  return rows[idx] || null;
}

/** Convert a metric row to number series aligned to given quarters. */
export function rowToSeries(rowObj, quarters){
  if (!rowObj) return quarters.map(() => null);
  const keys = Object.keys(rowObj).slice(1);
  const vals = keys.map(k => toNumberOrNull(rowObj[k]));
  const out = new Array(quarters.length).fill(null);
  const len = Math.min(vals.length, quarters.length);
  for (let i=0;i<len;i++) out[i] = vals[i];
  return out;
}

function toNumberOrNull(v){
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  const isPct = s.endsWith('%');
  const n = Number(s.replace(/[, ]/g,'').replace(/%$/,''));
  if (!Number.isFinite(n)) return null;
  return isPct ? n/100 : n;
}

/* ==== Originals (alle Nicht-TSLA Tabs) ==== */
async function _origGetRevenue(sheetName){
  const rows = await fetchData(sheetName);
  const quarters = extractQuarterLabels(rows);
  const row = findRowByAnyLabel(rows, [/^Total\s+Revenue$/i, /^Revenue$/i]);
  return rowToSeries(row, quarters);
}
async function _origGetNetIncome(sheetName){
  const rows = await fetchData(sheetName);
  const quarters = extractQuarterLabels(rows);
  const row = findRowByAnyLabel(rows, [/^Net\s+Income$/i, /^Net\s+income\s+\(loss\)$/i]);
  return rowToSeries(row, quarters);
}
async function _origGetGrossMargin(sheetName){
  const rows = await fetchData(sheetName);
  const quarters = extractQuarterLabels(rows);
  const row = findRowByAnyLabel(rows, [/^Gross\s*Margin$/i, /^Gross\s*margin$/i]);
  return rowToSeries(row, quarters);
}

/* ==== TSLA-aware Exports (nur wenn $TSLA + TSLA-Layout erkannt) ==== */
export async function getRevenue(sheetName){
  if (sheetName === '$TSLA') {
    const rows = await fetchData(sheetName);
    if (isTslaSheet(rows)) return tslaRevenue(rows);
  }
  return _origGetRevenue(sheetName);
}
export async function getNetIncome(sheetName){
  if (sheetName === '$TSLA') {
    const rows = await fetchData(sheetName);
    if (isTslaSheet(rows)) return tslaNetIncome(rows);
  }
  return _origGetNetIncome(sheetName);
}
export async function getGrossMargin(sheetName){
  if (sheetName === '$TSLA') {
    const rows = await fetchData(sheetName);
    if (isTslaSheet(rows)) return tslaGrossMargin(rows);
  }
  return _origGetGrossMargin(sheetName);
}

/** Liefert Quarter-Labels; nutzt tslaQuarters für TSLA, sonst Heuristik. */
export async function getQuarters(sheetName){
  const rows = await fetchData(sheetName);
  if (sheetName === '$TSLA' && isTslaSheet(rows)) return tslaQuarters(rows);
  return extractQuarterLabels(rows);
}
