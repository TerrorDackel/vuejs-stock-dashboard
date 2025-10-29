import { fetchTab, extractQuarterLabels, getRowByIndex, rowToSeries } from './sheetClient';
import { ROW_INDEX } from '@/utils/companyMap';

export class StockService {
  constructor() { this.cache = new Map(); }

  async loadCompanyTab(ticker) {
    if (this.cache.has(ticker)) return this.cache.get(ticker);
    const rows = await fetchTab(`$${ticker}`); // tabs named $AAPL, $MSFT, …
    this.cache.set(ticker, rows);
    return rows;
  }

  async getQuarters(ticker) {
    const rows = await this.loadCompanyTab(ticker);
    return extractQuarterLabels(rows);
  }

  async getSeries(ticker, metric) {
    const rows = await this.loadCompanyTab(ticker);
    const quarters = extractQuarterLabels(rows);
    const index = ROW_INDEX[metric]?.[ticker];
    const rowObj = getRowByIndex(rows, index);
    const series = rowToSeries(rowObj, quarters);
    return { quarters, series };
  }

  async getRevenue(ticker) { return this.getSeries(ticker, 'revenue'); }
  async getNetIncome(ticker) { return this.getSeries(ticker, 'netIncome'); }
  async getGrossMargin(ticker) { return this.getSeries(ticker, 'grossMargin'); }
}

export const stockService = new StockService();