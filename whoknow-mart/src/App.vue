<script setup lang="ts">
import TabBar from './components/TabBar.vue'
import WkMark from './components/WkMark.vue'
import { useMartGate } from './composables/useMart.ts'

const { ok, status } = useMartGate()
</script>

<template>
  <div class="app-shell">
    <WkMark />
    <main class="app-main"><router-view /></main>
    <TabBar />
    <div v-if="!ok" class="gate fail" role="alert">
      内容门控未通过（{{ status }}），已走降级。
    </div>
  </div>
</template>
