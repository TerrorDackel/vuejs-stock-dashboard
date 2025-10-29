<template>
  <BaseCard>
    <header class="head">
      <h2 class="title">Revenue breakdown (TTM)</h2>
    </header>
    <Doughnut v-if="ready" :data="chartData" :options="options" />
    <p v-else-if="error" class="err">{{ error }}</p>
    <p v-else>Loading…</p>
  </BaseCard>
</template>

<script>
/**
 * Donut: TTM revenue per company. Tooltip shows TTM and newest quarter.
 */
import BaseCard from './BaseCard.vue';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useFinancialData } from '../composables/useFinancialData';
import { colorOf } from '../utils/colors';
import { lastN, isNum, sumTTM } from '../utils/seriesHelpers';
import { fmtBillionsUSD } from '../utils/format';

ChartJS.register(ArcElement, Tooltip, Legend);

export default {
  name: 'RevenueBreakdownDonut',
  components: { BaseCard, Doughnut },
  data() { return { chartData: null, options: {}, ready: false, error: '' }; },
  async created() {
    try {
      const payloads = await this.loadAll(['AAPL','AMZN','GOOG','META','MSFT','NVDA','TSLA']);
      const ok = payloads.filter(p => p && p.revenue.some(isNum));
      if (!ok.length) { this.error = 'No revenue available'; return; }
      this.chartData = this.buildData(ok);
      this.options = this.buildOptions(ok);
      this.ready = true;
    } catch { this.error = 'Failed to load TTM'; }
  },
  methods: {
    /** Load each ticker; ignore failures. */
    async loadAll(tickers) {
      const { getCompany } = useFinancialData();
      const res = await Promise.allSettled(tickers.map(t => getCompany(t)));
      return res.map((r,i)=> r.status==='fulfilled'?{ ticker: tickers[i], ...r.value }:null).filter(Boolean);
    },
    /** Dataset for donut. */
    buildData(payloads) {
      const labels = payloads.map(p => p.ticker);
      const data = payloads.map(p => sumTTM(lastN(p.revenue, 4)));
      const bg = payloads.map(p => colorOf(p.ticker));
      return { labels, datasets: [{ data, backgroundColor: bg }] };
    },
    /** Options with tooltip showing TTM and latest quarter. */
    buildOptions(payloads) {
      const latestQ = this.latestQuarter(payloads);
      return {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'bottom' },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${fmtBillionsUSD(ctx.parsed)} (latest: ${latestQ})`
            }
          }
        }
      };
    },
    /** Newest quarter string across payloads. */
    latestQuarter(payloads) {
      const list = payloads.map(p => p.quarters[p.quarters.length - 1]).filter(Boolean);
      return list.length ? list.sort().slice(-1)[0] : 'n/a';
    }
  }
};
</script>

<style scoped>
.head { 
  display:flex; 
  justify-content:space-between; 
  align-items:baseline; 
  margin-bottom:8px; 
}
.title { 
  margin:0; 
  font-size:18px; 
}
.err { 
  color:#f66; 
}
:deep(canvas) { 
  width:100% !important; 
  height:360px !important; 
}
</style>
