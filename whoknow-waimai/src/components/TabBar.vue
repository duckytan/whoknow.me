<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const items = [
  { to: '/', icon: '🛵', label: '外卖' },
  { to: '/achievements', icon: '🎫', label: '神券' },
  { to: '/orders', icon: '📋', label: '订单' },
  { to: '/profile', icon: '👤', label: '我的' },
]
function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <nav class="tabbar">
    <router-link
      v-for="it in items"
      :key="it.to"
      :to="it.to"
      class="tb"
      :class="{ on: isActive(it.to) }"
    >
      <span class="ico-wrap">{{ it.icon }}</span>{{ it.label }}
    </router-link>
  </nav>
</template>
