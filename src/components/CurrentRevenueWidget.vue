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
 * Displays the latest quarterly revenue for a company including
 * absolute and relative delta vs the previous quarter.
 */
import BaseCard from './BaseCard.vue';
import { useFinancialData } from '../composables/useFinancialData';
import { fmtBillionsUSD, fmtPct } from '../utils/format';
import { isNum } from '../utils/seriesHelpers';

export default {
  name: 'CurrentRevenueWidget',
  components: { BaseCard },
  props: {
    /** Stock ticker, e.g. "AAPL". */
    ticker: { type: String, required: true },
    /** Optional human-friendly label to display. */
    label: { type: String, default: '' }
  },
  data() {
    return {
      company: null,
      error: ''
    };
  },
  computed: {
    /** Label to display in the header. */
    companyLabel() {
      return this.label || this.ticker;
    },
    /** Index of the last valid (numeric) revenue entry. */
    lastIdx() {
      return this.getLastValidIndex(this.company?.revenue || []);
    },
    /** Quarter label of the last valid revenue entry. */
    quarterLabel() {
      return this.company ? (this.company.quarters[this.lastIdx] || 'n/a') : 'n/a';
    },
    /** Latest revenue formatted in $ billions (2 decimals). */
    currentRevenue() {
      const v = this.company ? this.company.revenue[this.lastIdx] : null;
      return fmtBillionsUSD(v);
    },
    /** Absolute delta vs previous quarter, formatted. */
    deltaAbs() {
      const [c, p] = this.currPrev();
      return fmtBillionsUSD(isNum(c) && isNum(p) ? c - p : null);
    },
    /** Relative delta vs previous quarter, formatted in %. */
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
    } catch {
      this.error = 'Failed to load data';
    }
  },
  methods: {
    /**
     * Find last index in array that contains a numeric value.
     * @param {Array<unknown>} arr - Series values.
     * @returns {number}
     */
    getLastValidIndex(arr) {
      for (let i = arr.length - 1; i >= 0; i--) if (isNum(arr[i])) return i;
      return arr.length - 1;
    },
    /**
     * Get current and previous revenue values (may be nulls).
     * @returns {[number|null, number|null]}
     */
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
