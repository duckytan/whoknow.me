<script setup lang="ts">
import { memory } from '../store/memoryStore'
import { getAchievement } from '../data/achievements'

const history = memory.getOrderHistory()
</script>

<template>
  <div>
    <div class="order-head"><div class="ttl">我的订单</div></div>

    <div v-if="!history.length" class="page-pad muted">
      还没有订单。去 <router-link to="/shops" style="color: var(--mt-price)">选店下单</router-link> 看老板演戏吧。
    </div>

    <div v-for="(h, i) in history" :key="i" class="order-card">
      <div class="top">
        <div class="logo">🍜</div>
        <div class="nm">{{ h.shopName }}</div>
        <span class="status">已完成</span>
      </div>
      <div class="chips">
        <span class="ch">命中 {{ h.branchId || 'default' }}</span>
        <span v-if="h.branchName" class="ch">{{ h.branchName }}</span>
        <span v-for="a in h.achievements" :key="a" class="ch">🏆 {{ (getAchievement(a)?.name) || a }}</span>
      </div>
      <div class="btn-row">
        <router-link :to="`/order?shop=${h.shopId}`" class="b b-y">再来一单</router-link>
      </div>
    </div>
  </div>
</template>
