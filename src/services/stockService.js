/* High-level access to financial series */

import { fetchTab, extractQuarterLabels, getRowByIndex, rowToSeries } from './sheetClient';
import { ROW_INDEX } from '../utils/companyMap';

/**
 * Service for loading and caching per-company tabs and series.
 */
export class StockService {
  constructor() { this.cache = new Map(); }

  /**
   * Load a company tab and cache it.
   * @param {string} ticker - e.g. "AAPL".
   * @returns {Promise<object[]>} Tab rows.
   */
  async loadCompanyTab(ticker) {
    if (this.cache.has(ticker)) return /** @type {object[]} */(this.cache.get(ticker));
    const rows = await fetchTab(`$${ticker}`);
    this.cache.set(ticker, rows);
    return rows;
  }

  /**
   * Get quarter labels for a company.
   * @param {string} ticker - e.g. "AAPL".
   * @returns {Promise<string[]>} Quarter labels.
   */
  async getQuarters(ticker) {
    const rows = await this.loadCompanyTab(ticker);
    return extractQuarterLabels(rows);
  }

  /**
   * Get a metric series for a company.
   * @param {string} ticker - e.g. "AAPL".
   * @param {'revenue'|'netIncome'|'grossMargin'} metric - Metric key.
   * @returns {Promise<{quarters:string[], series:(number|null)[]}>} Series payload.
   */
  async getSeries(ticker, metric) {
    const rows = await this.loadCompanyTab(ticker);
    const quarters = extractQuarterLabels(rows);
    const idx = ROW_INDEX[metric]?.[ticker];
    const row = getRowByIndex(rows, idx);
    const series = rowToSeries(row, quarters);
    return { quarters, series };
  }

    /** @param {string} t */ async getRevenue(t) { return this.getSeries(t, 'revenue'); }
    /** @param {string} t */ async getNetIncome(t) { return this.getSeries(t, 'netIncome'); }
    /** @param {string} t */ async getGrossMargin(t) { return this.getSeries(t, 'grossMargin'); }
}

/** Singleton instance */
export const stockService = new StockService();
