<template>
  <BaseCard>
    <header class="head">
      <h2 class="title">Gross margin (last quarter, %)</h2>
    </header>
    <Bar v-if="ready" :data="data" :options="opts" />
    <p v-else-if="error" class="err">{{ error }}</p>
    <p v-else>Loading…</p>
  </BaseCard>
</template>

<script>
/**
 * Bar chart of last reported gross margin % for each company.
 * Tooltip includes the source quarter label.
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
import { colorOf } from '../utils/colors';
import { isNum } from '../utils/seriesHelpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default {
  name: 'GrossMarginBar',
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
      const t = ['AAPL', 'AMZN', 'GOOG', 'META', 'MSFT', 'NVDA', 'TSLA'];
      const res = await Promise.allSettled(t.map(x => getCompany(x)));
      const ok = res
        .map((r, i) => (r.status === 'fulfilled' ? { t: t[i], q: r.value.quarters, gm: r.value.grossMargin } : null))
        .filter(Boolean);

      const labels = ok.map(o => o.t);
      const idx = ok.map(o => o.gm.length - 1);
      const values = ok.map((o, i) => (isNum(o.gm[idx[i]]) ? o.gm[idx[i]] : null));
      const latestQ = ok.map((o, i) => o.q[idx[i]] || 'n/a');
      const bg = ok.map(o => colorOf(o.t));

      this.data = { labels, datasets: [{ label: '%', data: values, backgroundColor: bg }] };
      this.opts = {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => ` ${c.label}: ${Number(c.parsed.y).toFixed(2)}% (Q: ${latestQ[c.dataIndex]})` } }
        },
        scales: {
          y: { ticks: { callback: v => `${Number(v).toFixed(0)}%` }, grid: { color: 'rgba(255,255,255,0.08)' } },
          x: { grid: { display: false } }
        }
      };
      this.ready = true;
    } catch {
      this.error = 'Failed to load gross margin';
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
