<template>
  <BaseCard>
    <h1>VueJS Stock Dashboard</h1>
    <p>Welcome.</p>
    <pre v-if="loaded">{{ preview }}</pre>
    <p v-else>Loading…</p>
  </BaseCard>
</template>

<script>
import BaseCard from './components/BaseCard.vue';
import { stockService } from './services/stockService';

export default {
  name: 'App',
  components: { BaseCard },
  data: () => ({ loaded: false, preview: '' }),
  async created() {
    /* Demo: load Apple revenue to verify pipeline */
    try {
      const { quarters, series } = await stockService.getRevenue('AAPL');
      this.preview = JSON.stringify({ quarters, series: series.slice(-6) }, null, 2);
    } catch (e) {
      this.preview = 'Error loading data';
      console.error(e);
    } finally {
      this.loaded = true;
    }
  }
}
</script>

<style>
body { width: 100%; margin: 0; }
#app {
  width: 100vw; min-height: 100vh;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  box-sizing: border-box; padding: 100px;
  background: radial-gradient(71.11% 100% at 50% 0%, #020204 14.6%, #011F35 100%);
}
</style>
