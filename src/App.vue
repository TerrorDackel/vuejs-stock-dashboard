<template>
  <BaseCard>
    <h1>VueJS Stock Dashboard</h1>
    <p>Welcome.</p>
    <pre v-if="loaded">{{ preview }}</pre>
    <p v-else>Loading…</p>
  </BaseCard>
</template>

<script>
/**
 * Root application component.
 * Demonstrates data loading via stockService and prints a compact preview.
 * All labels, colors, and UI details are aligned with Figma in later steps.
 */
import BaseCard from './components/BaseCard.vue';
import { stockService } from './services/stockService';

export default {
  name: 'App',
  components: { BaseCard },

  /**
   * Local reactive state.
   * @returns {{ loaded: boolean, preview: string }}
   */
  data() { return { loaded: false, preview: '' }; },

  /**
   * Lifecycle: load a minimal demo dataset for verification.
   * Single responsibility: fetch Apple revenue and render a short preview.
   * Errors are logged and shown as a short message.
   * @returns {Promise<void>}
   */
  async created() {
    try {
      const { quarters, series } = await stockService.getRevenue('AAPL');
      this.preview = JSON.stringify({ quarters, series: series.slice(-6) }, null, 2);
    } catch (e) {
      console.error('[App] load error', e);
      this.preview = 'Error loading data';
    } finally {
      this.loaded = true;
    }
  }
};
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
