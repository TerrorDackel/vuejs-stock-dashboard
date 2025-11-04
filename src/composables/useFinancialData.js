/**
 * Composable that loads and caches financial series per company.
 * Provides single-call accessors used by the dashboard components.
 */
import { ref } from 'vue';
import { stockService } from '../services/stockService';

/**
 * Load metrics once for a given ticker. Missing series are replaced with empty arrays.
 * @param {string} ticker - Stock ticker (e.g., "AAPL").
 * @returns {Promise<{ticker:string, quarters:string[], revenue:(number|null)[], netIncome:(number|null)[], grossMargin:(number|null)[]}>}
 */
async function loadCompanyOnce(ticker) {
  const safe = async (fn) => { try { return await fn(); } catch { return { quarters: [], series: [] }; } };
  const rev = await safe(() => stockService.getRevenue(ticker));
  const ni = await safe(() => stockService.getNetIncome(ticker));
  const gm = await safe(() => stockService.getGrossMargin(ticker));
  const quarters = rev.quarters.length ? rev.quarters : (ni.quarters.length ? ni.quarters : gm.quarters);
  return { ticker, quarters, revenue: rev.series || [], netIncome: ni.series || [], grossMargin: gm.series || [] };
}

/**
 * Create a shared cache and API for financial data.
 * @returns {{getCompany: (t:string)=>Promise<any>, refresh:(t?:string)=>Promise<void>, loading:import('vue').Ref<boolean>, error:import('vue').Ref<string>}}
 */
export function useFinancialData() {
  const cache = new Map();
  const loading = ref(false);
  const error = ref('');

  /**
   * Get company payload from cache or fetch once.
   * @param {string} ticker
   * @returns {Promise<any>}
   */
  async function getCompany(ticker) {
    if (cache.has(ticker)) return cache.get(ticker);
    loading.value = true; error.value = '';
    try {
      const data = await loadCompanyOnce(ticker);
      cache.set(ticker, data);
      return data;
    } catch (e) {
      error.value = 'Failed to load data';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Invalidate cache. If ticker provided, reload it.
   * @param {string} [ticker]
   * @returns {Promise<void>}
   */
  async function refresh(ticker) {
    if (ticker) cache.delete(ticker); else cache.clear();
    if (ticker) await getCompany(ticker);
  }

  return { getCompany, refresh, loading, error };
}
