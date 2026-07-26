<script setup lang="ts">
import { MemoryEngine, MemStore } from '../store/memory.ts'
const mem = new MemoryEngine(new MemStore())
function reset() {
  mem.reset()
}
</script>

<template>
  <section>
    <h2>我的</h2>
    <p>记忆分级 / 重置入口（P3 零负担，入口藏深）</p>
    <button @click="reset">重置进度</button>
  </section>
</template>
