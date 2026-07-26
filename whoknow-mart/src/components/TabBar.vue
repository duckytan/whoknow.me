<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
const router = useRouter()
const route = useRoute()
const tabs = [
  { label: '逛街', path: '/' },
  { label: '图鉴', path: '/codex' },
  { label: '我的', path: '/profile' },
]
</script>

<template>
  <nav class="tab-bar">
    <button
      v-for="t in tabs"
      :key="t.path"
      :class="{ active: route.path === t.path }"
      @click="router.push(t.path)"
    >
      {{ t.label }}
    </button>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--tabbar-h);
  display: flex;
  border-top: 1px solid var(--border);
  background: var(--surface);
}
.tab-bar button {
  flex: 1;
  border: none;
  background: none;
  color: var(--text-sub);
  font-size: 13px;
}
.tab-bar button.active {
  color: var(--brand-orange);
  font-weight: 600;
}
</style>
