<template>
  <section class="wrap">
    <h1>VueJS Stock Dashboard</h1>

    <div class="grid">
      <CurrentRevenueWidget ticker="AAPL" label="Apple (AAPL)" />
      <CurrentRevenueWidget ticker="AMZN" label="Amazon (AMZN)" />
      <CurrentRevenueWidget ticker="GOOG" label="Alphabet (GOOG)" />
      <CurrentRevenueWidget ticker="META" label="Meta (META)" />
      <CurrentRevenueWidget ticker="MSFT" label="Microsoft (MSFT)" />
      <CurrentRevenueWidget ticker="NVDA" label="Nvidia (NVDA)" />
      <CurrentRevenueWidget ticker="TSLA" label="Tesla (TSLA)" />
    </div>

    <div class="chart">
      <RevenueLineChart />
    </div>

    <div class="chart">
      <RevenueBreakdownDonut />
    </div>
  </section>
</template>

<script>
/**
 * Dashboard root: KPIs, revenue line chart, and TTM donut.
 */
import CurrentRevenueWidget from './components/CurrentRevenueWidget.vue';
import RevenueLineChart from './components/RevenueLineChart.vue';
import RevenueBreakdownDonut from './components/RevenueBreakdownDonut.vue';

export default {
  name: 'App',
  components: { CurrentRevenueWidget, RevenueLineChart, RevenueBreakdownDonut }
};
</script>

<style>
body {
  width: 100%;
  margin: 0;
}

#app {
  width: 100vw;
  min-height: 100vh;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  box-sizing: border-box;
  padding: 100px;
  background: radial-gradient(71.11% 100% at 50% 0%, #020204 14.6%, #011F35 100%);
}

.wrap {
  width: 100%;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.chart {
  width: 100%;
  height: 380px;
  margin-bottom: 24px;
}

h1 {
  margin: 0 0 16px 0;
}

@media (max-width: 1200px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
