<template>
  <div class="card">
    <slot></slot>
  </div>
</template>

<script>
/**
 * Base surface container used by all dashboard widgets.
 * Provides a consistent background, padding and radius.
 */
export default {
  name: 'BaseCard'
};
</script>

<style scoped>
.card {
  width: 100%;
  padding: 24px 32px;
  border-radius: 1rem;
  background: #011F35;
}
</style>
