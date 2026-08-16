<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { SHOPS, type Shop } from '../data/shops'
import { FILTERS, chipFilter, emptyHintFor, type FilterId } from '../lib/shopFilter'
import ShopCard from '../components/ShopCard.vue'
import { showToast } from '../lib/toast'

// 金刚区分类筛选：读取 ?cat= 参数，只列该分类店铺（主站 10 类之一）。
const route = useRoute()
const cat = computed(() => {
  const q = route.query.cat
  return typeof q === 'string' ? q : undefined
})

// 分类过滤后的基础集合（chip 筛选/排序都在这之上做，两者可叠加）
const baseList = computed(() => (cat.value ? SHOPS.filter((s) => s.cat === cat.value) : SHOPS))

// ---- P1-3: 筛选 chip（纯点击，单选） ----
// 筛选/排序判定与空态文案已抽到 src/lib/shopFilter.ts（可被 node:test 覆盖），
// 此处只留状态与派生，模板零内联逻辑。
const activeFilter = ref<FilterId>('all')

const list = computed<Shop[]>(() => chipFilter(baseList.value, activeFilter.value))

const emptyHint = computed(() => emptyHintFor(activeFilter.value))

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

    <!-- P1-3: 红包优惠横幅（红/橙渐变，纯装饰） -->
    <div class="rp-banner" @click="showToast('戏票红包已自动领取')">
      <span class="rp-ico">🧧</span>
      <span class="rp-text">红包到账 满20减5 · 天天领<i class="rp-sub">戏票通用 · 不可提现</i></span>
      <span class="rp-btn">领取</span>
    </div>

    <div style="background: #fff; display: flex; border-bottom: 1px solid var(--mt-line)">
      <div style="flex: 1; text-align: center; padding: 11px 0; font-size: 14px; font-weight: 700; color: var(--mt-price); border-bottom: 2px solid var(--mt-price)">综合排序</div>
      <div style="flex: 1; text-align: center; padding: 11px 0; font-size: 14px; color: var(--mt-text-2)">销量优先</div>
      <div style="flex: 1; text-align: center; padding: 11px 0; font-size: 14px; color: var(--mt-text-2)">距离最近</div>
    </div>

    <!-- P1-3: 横向滚动筛选 chip 行 -->
    <div class="filter-chips">
      <button
        v-for="f in FILTERS"
        :key="f.id"
        class="fc-chip"
        :class="{ on: activeFilter === f.id }"
        :aria-pressed="activeFilter === f.id"
        @click="activeFilter = f.id"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- 空态：分类 / 筛选条件下都没店 -->
    <div v-if="!list.length" class="fine-print">{{ emptyHint }}</div>

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
