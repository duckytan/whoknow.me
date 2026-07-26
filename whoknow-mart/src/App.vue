<script setup lang="ts">
import TabBar from './components/TabBar.vue'
</script>

<template>
  <div class="app-shell">
    <main class="app-main"><router-view /></main>
    <TabBar />
  </div>
</template>
