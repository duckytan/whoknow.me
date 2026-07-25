<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { memory } from '../store/memoryStore'
import { ACHIEVEMENTS } from '../data/achievements'
const router = useRouter()
const unlocked = computed(() => memory.getAchievements())
const orderCount = computed(() => memory.getOrderHistory().length)
const achRate = computed(() => `${unlocked.value.length}/${ACHIEVEMENTS.length}`)
</script>

<template>
  <div class="profile-hero">
    <div class="avatar">🤡</div>
    <div class="name">胡闹看客</div>
    <div class="sub">成就 {{ achRate }} · 订单 {{ orderCount }}</div>
  </div>
  <div class="page-pad">
    <div class="entry-list">
      <div class="entry" @click="router.push('/achievements')">🏆 成就墙</div>
      <div class="entry" @click="router.push('/orders')">📋 订单历史</div>
      <div class="entry" @click="router.push('/feed')">🎭 段子流</div>
      <div class="entry" @click="router.push('/settings')">⚙️ 设置</div>
      <div class="entry" @click="router.push('/about')">ℹ️ 关于胡闹</div>
    </div>
  </div>
</template>
