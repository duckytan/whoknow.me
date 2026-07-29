<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { SHOPS } from '../data/shops'
import ShopCard from '../components/ShopCard.vue'

// 金刚区分类筛选：读取 ?cat= 参数，只列该分类店铺（主站 10 类之一）。
const route = useRoute()
const cat = computed(() => {
  const q = route.query.cat
  return typeof q === 'string' ? q : undefined
})
const list = computed(() => (cat.value ? SHOPS.filter((s) => s.cat === cat.value) : SHOPS))
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

    <!-- 金刚区分类标题（来自 ?cat=），置于排序栏上方的小字灰条 -->
    <div v-if="cat" class="cat-banner">📂 {{ cat }}</div>

    <div style="background: #fff; display: flex; border-bottom: 1px solid var(--mt-line)">
      <div style="flex: 1; text-align: center; padding: 11px 0; font-size: 14px; font-weight: 700; color: var(--mt-price); border-bottom: 2px solid var(--mt-price)">综合排序</div>
      <div style="flex: 1; text-align: center; padding: 11px 0; font-size: 14px; color: var(--mt-text-2)">销量优先</div>
      <div style="flex: 1; text-align: center; padding: 11px 0; font-size: 14px; color: var(--mt-text-2)">距离最近</div>
    </div>

    <!-- 空态：该分类暂未上架胡闹商家 -->
    <div v-if="cat && !list.length" class="fine-print">该分类暂未上架胡闹商家</div>

    <div v-for="s in list" :key="s.id"><ShopCard :shop="s" /></div>
  </div>
</template>

<style scoped>
/* 金刚区分类标题：小字灰条，纯展示，不改交互 */
.cat-banner {
  background: var(--mt-line-2);
  color: var(--mt-text-2);
  font-size: 12px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
