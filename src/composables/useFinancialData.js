/**
 * Composable: load per-company data once, cache in-memory, allow refresh.
 * Uses stockService and exposes a simple API for widgets and charts.
 */
import { ref } from 'vue';
import { stockService } from '@/services/stockService';

/**
 * Load all three metrics for a company and cache them.
 * @param {string} ticker - e.g. "AAPL"
 * @returns {Promise<{ticker:string, quarters:string[], revenue:(number|null)[], netIncome:(number|null)[], grossMargin:(number|null)[]}>}
 */
async function loadCompanyOnce(ticker) {
  const [rev, ni, gm] = await Promise.all([
    stockService.getRevenue(ticker),
    stockService.getNetIncome(ticker),
    stockService.getGrossMargin(ticker)
  ]);
  return { ticker, quarters: rev.quarters, revenue: rev.series, netIncome: ni.series, grossMargin: gm.series };
}

/**
 * Main composable.
 * @returns {{ getCompany:(t:string)=>Promise<any>, refresh:(t?:string)=>Promise<void>, loading:import('vue').Ref<boolean>, error:import('vue').Ref<string> }}
 */
export function useFinancialData() {
  const cache = new Map();                // ticker -> payload
  const loading = ref(false);
  const error = ref('');

  /** Load from cache or fetch once. */
  async function getCompany(ticker) {
    if (cache.has(ticker)) return cache.get(ticker);
    loading.value = true; error.value = '';
    try { const data = await loadCompanyOnce(ticker); cache.set(ticker, data); return data; }
    catch (e) { error.value = 'Failed to load data'; throw e; }
    finally { loading.value = false; }
  }

  /** Invalidate one or all tickers and reload optionally one ticker. */
  async function refresh(ticker) {
    if (ticker) cache.delete(ticker); else cache.clear();
    if (ticker) await getCompany(ticker);
  }

  return { getCompany, refresh, loading, error };
}
