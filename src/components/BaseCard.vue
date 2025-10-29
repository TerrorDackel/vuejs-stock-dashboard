<template>
  <div class="card"><slot></slot></div>
</template>

<script>
/**
 * BaseCard
 * Layout wrapper for dashboard widgets.
 * Single responsibility: provide padded, rounded container.
 */
export default { name: 'BaseCard' };
</script>

<style scoped>
.card {
  width: 100%;
  padding: 24px 32px;
  border-radius: 1rem;
  background: #011F35;
}
</style>
