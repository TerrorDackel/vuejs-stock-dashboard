<template>
  <BaseCard>
    <header class="head">
      <h2 class="title">{{ companyLabel }}</h2>
      <span class="quarter">Quarter: {{ quarterLabel }}</span>
    </header>

    <section class="row">
      <div class="kpi">
        <div class="kpi-label">Revenue</div>
        <div class="kpi-value">{{ currentRevenue }}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Δ vs prev</div>
        <div class="kpi-value">
          <span class="delta">{{ deltaAbs }}</span>
          <span class="delta-pct">({{ deltaPct }})</span>
        </div>
      </div>
    </section>

    <p v-if="error" class="err">{{ error }}</p>
  </BaseCard>
</template>

<script>
/**
 * CurrentRevenueWidget
 * Shows latest quarterly revenue, absolute and relative change vs previous quarter.
 */
import BaseCard from './BaseCard.vue';
import { useFinancialData } from '../composables/useFinancialData';
import { fmtBillionsUSD, fmtPct } from '../utils/format';
import { isNum } from '../utils/seriesHelpers';

export default {
  name: 'CurrentRevenueWidget',
  components: { BaseCard },
  props: {
    ticker: { type: String, required: true },
    label: { type: String, default: '' }
  },
  data() {
    return {
      company: null,
      error: ''
    };
  },
  computed: {
    companyLabel() { return this.label || this.ticker; },
    lastIdx() { return this.getLastValidIndex(this.company?.revenue || []); },
    quarterLabel() { return this.company ? (this.company.quarters[this.lastIdx] || 'n/a') : 'n/a'; },
    currentRevenue() {
      const v = this.company ? this.company.revenue[this.lastIdx] : null;
      return fmtBillionsUSD(v);
    },
    deltaAbs() {
      const [c, p] = this.currPrev();
      return fmtBillionsUSD(isNum(c) && isNum(p) ? c - p : null);
    },
    deltaPct() {
      const [c, p] = this.currPrev();
      if (!isNum(c) || !isNum(p) || p === 0) return 'n/a';
      return fmtPct(((c - p) / p) * 100);
    }
  },
  async created() {
    try {
      const { getCompany } = useFinancialData();
      this.company = await getCompany(this.ticker);
    } catch { this.error = 'Failed to load data'; }
  },
  methods: {
    getLastValidIndex(arr) {
      for (let i = arr.length - 1; i >= 0; i--) if (isNum(arr[i])) return i;
      return arr.length - 1;
    },
    currPrev() {
      if (!this.company) return [null, null];
      const i = this.lastIdx;
      const p = Math.max(0, i - 1);
      return [this.company.revenue[i] ?? null, this.company.revenue[p] ?? null];
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

.quarter {
  opacity: 0.8;
  font-size: 12px;
}

.row {
  display: flex;
  gap: 24px;
  margin-top: 12px;
}

.kpi-label {
  font-size: 12px;
  opacity: 0.8;
}

.kpi-value {
  font-size: 24px;
}

.delta {
  margin-right: 8px;
}

.err {
  color: #f66;
  margin-top: 12px;
}
</style>
