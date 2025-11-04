<template>
  <BaseCard>
    <header class="head">
      <h2 class="title">Net income (TTM)</h2>
    </header>
    <Bar v-if="ready" :data="data" :options="opts" />
    <p v-else-if="error" class="err">{{ error }}</p>
    <p v-else>Loading…</p>
  </BaseCard>
</template>

<script>
/**
 * Bar chart comparing TTM net income (sum of last 4 quarters)
 * across all selected companies.
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
import { lastN, sumTTM } from '../utils/seriesHelpers';
import { colorOf } from '../utils/colors';
import { fmtBillionsUSD } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default {
  name: 'NetIncomeTTMBar',
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
        .map((r, i) => (r.status === 'fulfilled' ? { t: t[i], s: r.value.netIncome } : null))
        .filter(Boolean);

      const labels = ok.map(o => o.t);
      const values = ok.map(o => sumTTM(lastN(o.s, 4)));
      const bg = ok.map(o => colorOf(o.t));

      this.data = { labels, datasets: [{ label: 'TTM $B', data: values, backgroundColor: bg }] };
      this.opts = {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => fmtBillionsUSD(c.parsed.y) } }
        },
        scales: {
          y: { ticks: { callback: v => `$${Number(v).toFixed(0)}B` }, grid: { color: 'rgba(255,255,255,0.08)' } },
          x: { grid: { display: false } }
        }
      };
      this.ready = true;
    } catch {
      this.error = 'Failed to load net income';
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
