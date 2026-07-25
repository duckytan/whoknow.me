<script setup lang="ts">
import { memory } from '../store/memoryStore'
import { ACHIEVEMENTS } from '../data/achievements'
import AchievementCard from '../components/AchievementCard.vue'

const unlocked = memory.getAchievements()
const orderCount = memory.getOrderHistory().length
const calory = orderCount * 800
const level = Math.max(1, Math.floor(orderCount / 5) + 1)
</script>

<template>
  <div>
    <div class="achv-hero">
      <div class="nav-row">
        <router-link to="/shops" class="back">‹</router-link>
        <div class="ttl">我的成就</div>
        <span class="ic">⚙️</span>
      </div>
      <div class="level">胡闹等级 <b>Lv.{{ level }} · 干饭哲学家</b></div>
      <div class="title">零卡路里大师</div>
      <div class="stats">
        <div class="it"><div class="v">{{ calory }}</div><div class="n">累计卡路里 (kcal)</div></div>
        <div class="it"><div class="v">{{ orderCount }}</div><div class="n">累计订单</div></div>
        <div class="it"><div class="v">{{ unlocked.length }}</div><div class="n">解锁成就</div></div>
      </div>
    </div>

    <div class="achv-tabs">
      <div class="t on">已解锁 {{ unlocked.length }}</div>
      <div class="t">全部 {{ ACHIEVEMENTS.length }}</div>
    </div>

    <div class="achv-list">
      <AchievementCard
        v-for="a in ACHIEVEMENTS"
        :key="a.id"
        :meta="a"
        :unlocked="unlocked.includes(a.id)"
      />
    </div>
  </div>
</template>
