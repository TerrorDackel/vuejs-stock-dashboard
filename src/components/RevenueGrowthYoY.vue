<template>
  <BaseCard>
    <header class="head">
      <h2 class="title">Revenue growth YoY (last 4 quarters)</h2>
    </header>
    <Bar v-if="ready" :data="data" :options="opts" />
    <p v-else-if="error" class="err">{{ error }}</p>
    <p v-else>Loading…</p>
  </BaseCard>
</template>

<script>
/**
 * Grouped bars showing YoY revenue growth (%) for the last 4 quarters.
 * Darker blue = most recent quarter.
 */
import BaseCard from './BaseCard.vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { useFinancialData } from '../composables/useFinancialData';
import { yoySeries, lastN, isNum } from '../utils/seriesHelpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const BLUES = ['#9ecae1', '#6baed6', '#4292c6', '#2171b5'];

export default {
  name: 'RevenueGrowthYoY',
  components: { BaseCard, Bar },
  data() {
    return {
      data: null,
      opts: {},
      ready: false,
      error: ''
    };
  },
  async created() {
    try {
      const { getCompany } = useFinancialData();
      const tickers = ['AAPL', 'AMZN', 'GOOG', 'META', 'MSFT', 'NVDA', 'TSLA'];
      const res = await Promise.allSettled(tickers.map(t => getCompany(t)));
      const ok = res.map((r, i) => (r.status === 'fulfilled' ? { t: tickers[i], rev: r.value.revenue } : null)).filter(Boolean);

      const labels = ok.map(o => o.t);
      const yoy = ok.map(o => lastN(yoySeries(o.rev), 4));

      const datasets = [0, 1, 2, 3].map(i => ({
        label: `Q-${3 - i}`,
        data: labels.map((_, j) => (isNum(yoy[j][i]) ? Number(yoy[j][i].toFixed(2)) : null)),
        backgroundColor: BLUES[i]
      }));

      this.data = { labels, datasets };
      this.opts = {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${Number(c.parsed.y).toFixed(2)}%` } }
        },
        scales: {
          y: { ticks: { callback: v => `${Number(v).toFixed(0)}%` }, grid: { color: 'rgba(255,255,255,0.08)' } },
          x: { grid: { display: false } }
        }
      };
      this.ready = true;
    } catch {
      this.error = 'Failed to load YoY growth';
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
