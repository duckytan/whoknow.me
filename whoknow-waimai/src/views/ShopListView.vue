<script setup lang="ts">
import { SHOPS } from '../data/shops'
import ShopCard from '../components/ShopCard.vue'
</script>

<template>
  <div>
    <div class="mt-nav">
      <div class="mt-nav__top">
        <router-link to="/" class="mt-nav__back">‹</router-link>
        <div class="mt-search" style="flex: 1">
          <span class="s-ico">🔍</span>
          <input placeholder="烧烤 / 饺子 / 粥 ..." />
          <span class="s-btn">搜索</span>
        </div>
      </div>
    </div>

    <div style="background: #fff; display: flex; border-bottom: 1px solid var(--mt-line)">
      <div style="flex: 1; text-align: center; padding: 11px 0; font-size: 14px; font-weight: 700; color: var(--mt-price); border-bottom: 2px solid var(--mt-price)">综合排序</div>
      <div style="flex: 1; text-align: center; padding: 11px 0; font-size: 14px; color: var(--mt-text-2)">销量优先</div>
      <div style="flex: 1; text-align: center; padding: 11px 0; font-size: 14px; color: var(--mt-text-2)">距离最近</div>
    </div>

    <div v-for="s in SHOPS" :key="s.id"><ShopCard :shop="s" /></div>
  </div>
</template>
