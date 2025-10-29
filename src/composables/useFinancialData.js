/**
 * Composable: cached company data with robust loading.
 */
import { ref } from 'vue';
import { stockService } from '@/services/stockService';

/**
 * Load metrics once for a company. Missing metrics → empty arrays.
 * @param {string} ticker
 */
async function loadCompanyOnce(ticker) {
  const safe = async (fn) => { try { return await fn(); } catch { return { quarters: [], series: [] }; } };
  const rev = await safe(() => stockService.getRevenue(ticker));
  const ni = await safe(() => stockService.getNetIncome(ticker));
  const gm = await safe(() => stockService.getGrossMargin(ticker));
  const quarters = rev.quarters.length ? rev.quarters : (ni.quarters.length ? ni.quarters : gm.quarters);
  return { ticker, quarters, revenue: rev.series || [], netIncome: ni.series || [], grossMargin: gm.series || [] };
}

export function useFinancialData() {
  const cache = new Map();
  const loading = ref(false);
  const error = ref('');

  /** Get from cache or fetch once. */
  async function getCompany(ticker) {
    if (cache.has(ticker)) return cache.get(ticker);
    loading.value = true; error.value = '';
    try { const data = await loadCompanyOnce(ticker); cache.set(ticker, data); return data; }
    catch (e) { error.value = 'Failed to load data'; throw e; }
    finally { loading.value = false; }
  }

  /** Invalidate and optionally reload one ticker. */
  async function refresh(ticker) {
    if (ticker) cache.delete(ticker); else cache.clear();
    if (ticker) await getCompany(ticker);
  }

  return { getCompany, refresh, loading, error };
}
