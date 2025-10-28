<template>
  <BaseCard>
    <h1>VueJS Stock Dashboard</h1>
    <p>Willkommen.</p>
  </BaseCard>
</template>

<script>
import BaseCard from './components/BaseCard.vue';
import { stockService } from './services/stockService';

export default {
  name: 'App',
  components: { 
    BaseCard
  },
  async created() {
    this.data = await stockService.fetchData('$AAPL');
    console.log('Loaded data', this.data);
  }
}
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
</style>
