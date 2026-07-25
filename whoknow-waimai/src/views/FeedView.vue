<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { memory } from '../store/memoryStore'
const router = useRouter()
const feed = computed(() => memory.getOrderHistory().slice(0, 30))
</script>

<template>
  <div class="mt-nav">
    <div class="mt-nav__top">
      <div class="mt-nav__back" @click="router.back()">‹</div>
      <div class="mt-nav__title">段子流 · 最近笑点</div>
    </div>
  </div>
  <div class="page-pad">
    <div v-if="!feed.length" class="muted">还没有段子。去选店下第一单，让老板演给你看～</div>
    <div v-for="(h, i) in feed" :key="i" class="feed-card">
      <div class="feed-top">
        <span>{{ h.shopName }}</span>
        <span class="muted">第 {{ i + 1 }} 单</span>
      </div>
      <div class="feed-branch">{{ h.branchName || h.branchId }}</div>
      <div class="feed-mood">老板心情 {{ h.bossMood }} · 消费 ¥{{ h.total }}</div>
    </div>
  </div>
</template>
