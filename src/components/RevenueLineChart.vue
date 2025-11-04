<template>
  <BaseCard>
    <header class="head">
      <h2 class="title">Revenue last 3 years</h2>
    </header>
    <Line v-if="ready" :data="chartData" :options="options" />
    <p v-else-if="error" class="err">{{ error }}</p>
    <p v-else>Loading…</p>
  </BaseCard>
</template>

<script>
/**
 * Line chart of revenues for seven companies across the latest 12 quarters.
 * Tooltip shows hovered quarter and the values for all series.
 */
import BaseCard from './BaseCard.vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { useFinancialData } from '../composables/useFinancialData';
import { colorOf } from '../utils/colors';
import { isNum, lastN } from '../utils/seriesHelpers';
import { fmtBillionsUSD } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default {
  name: 'RevenueLineChart',
  components: { BaseCard, Line },
  data() {
    return {
      chartData: null,
      options: {},
      ready: false,
      error: ''
    };
  },
  async created() {
    try {
      const payloads = await this.loadAll(['AAPL', 'AMZN', 'GOOG', 'META', 'MSFT', 'NVDA', 'TSLA']);
      const ok = payloads.filter(p => p && p.quarters.length && p.revenue.length);
      if (!ok.length) {
        this.error = 'No revenue series available';
        return;
      }
      const labels = lastN(ok[0].quarters, 12);
      this.chartData = this.buildData(ok, labels);
      this.options = this.buildOptions();
      this.ready = true;
    } catch {
      this.error = 'Failed to load revenue series';
    }
  },
  methods: {
    /**
     * Load company payloads; ignore individual failures.
     * @param {string[]} tickers
     * @returns {Promise<Array<{ticker:string, quarters:string[], revenue:(number|null)[]}>>}
     */
    async loadAll(tickers) {
      const { getCompany } = useFinancialData();
      const results = await Promise.allSettled(tickers.map(t => getCompany(t)));
      return results
        .map((r, i) =>
          r.status === 'fulfilled'
            ? { ticker: tickers[i], quarters: r.value.quarters, revenue: r.value.revenue }
            : null
        )
        .filter(Boolean);
    },
    /**
     * Build Chart.js dataset config.
     * @param {Array<{ticker:string, quarters:string[], revenue:(number|null)[]}>} payloads
     * @param {string[]} labels
     * @returns {{labels:string[], datasets:any[]}}
     */
    buildData(payloads, labels) {
      const datasets = payloads.map(p => ({
        label: p.ticker,
        data: lastN(p.revenue, 12).map(v => (isNum(v) ? v : null)),
        spanGaps: true,
        borderColor: colorOf(p.ticker),
        backgroundColor: colorOf(p.ticker),
        tension: 0.25,
        pointRadius: 2,
        pointHitRadius: 10
      }));
      return { labels, datasets };
    },
    /**
     * Compose Chart.js options including shared tooltip.
     * @returns {import('chart.js').ChartOptions<'line'>}
     */
    buildOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true, position: 'bottom' },
          tooltip: {
            callbacks: {
              title: items => (items.length ? `Quarter: ${items[0].label}` : ''),
              label: i =>
                ` ${i.dataset.label}: ${fmtBillionsUSD(
                  Number.isFinite(i.parsed.y) ? i.parsed.y : null
                )}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(255,255,255,0.08)' },
            ticks: { callback: v => `$${Number(v).toFixed(0)}B` }
          }
        }
      };
    }
  }
};
</script>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.title {
  margin: 0;
  font-size: 18px;
}

.err {
  color: #f66;
}

:deep(canvas) {
  width: 100% !important;
  height: 360px !important;
}
</style>
