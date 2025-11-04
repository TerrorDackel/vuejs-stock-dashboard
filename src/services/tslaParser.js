/**
 * TSLA-Parser: zieht Quartale (Row 1) und Werte aus festen Index-Zeilen.
 * Indizes aus deiner Analyse:
 *  - quarters row: 1
 *  - revenue row:  13
 *  - net inc row:  10
 *  - gross % row:  27
 */
const FIRST_COL_FALLBACK = "__blank";

function firstColKey(row){ return row && Object.keys(row)[0] || FIRST_COL_FALLBACK; }
function kvs(row){
  const k0 = firstColKey(row);
  return Object.entries(row).filter(([k]) => k !== k0);
}
function toNumber(x){
  if (x == null) return null;
  const s = String(x).trim();
  if (!s) return null;
  const isPct = /%$/.test(s);
  const num = parseFloat(s.replace(/,/g,'').replace(/%/g,''));
  if (Number.isNaN(num)) return null;
  return isPct ? num/100 : num;
}
function readRowValues(rows, idx){
  const row = rows[idx]; if (!row) return [];
  return kvs(row).map((pair) => String(pair[1] ?? '').trim());
}
export function tslaQuarters(rows){
  const row = rows[1]; if (!row) return [];
  return kvs(row).map((pair) => String(pair[1] ?? '').trim());
}
export function tslaRevenue(rows){  return readRowValues(rows,13).map(toNumber); }
export function tslaNetIncome(rows){return readRowValues(rows,10).map(toNumber); }
export function tslaGrossMargin(rows){return readRowValues(rows,27).map(toNumber); }

export function isTslaSheet(rows){
  if (!Array.isArray(rows) || rows.length < 2) return false;
  const k0 = firstColKey(rows[0]);
  // TSLA hat häufig leere/Emoji-Header in erster Spalte → Key ist "" / __blank
  return !k0 || k0 === FIRST_COL_FALLBACK;
}




