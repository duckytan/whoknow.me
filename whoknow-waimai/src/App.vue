<template>
  <div class="app-shell">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 应用根壳：仅承载路由视图。
</script>

<style scoped>
.app-shell {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--wk-bg, #0f0f12);
}
</style>
