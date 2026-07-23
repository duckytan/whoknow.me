<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useShopStore } from '@/store/shop'
import { useOrderStore } from '@/store/order'
import AppHeader from '@/components/base/AppHeader.vue'
import ShopCard from '@/components/shop/ShopCard.vue'
import OnboardingGuide from '@/components/base/OnboardingGuide.vue'
import { STORAGE_KEYS } from '@/utils/storageKeys'
import { track } from '@/utils/metrics'

const shopStore = useShopStore()
const orderStore = useOrderStore()
const orders = computed(() => orderStore.orders)

const categories = [
  { icon: '🔥', name: '烧烤' },
  { icon: '🧋', name: '奶茶' },
  { icon: '🌶️', name: '麻辣烫' },
  { icon: '🍱', name: '寿司' },
  { icon: '🍗', name: '炸鸡' },
  { icon: '🍲', name: '黄焖鸡' },
  { icon: '🍕', name: '披萨' },
  { icon: '🥟', name: '饺子' },
]

type SortKey = 'default' | 'rating' | 'sales' | 'distance'
const sortKey = ref<SortKey>('default')
const activeCategory = ref('')

const sortedShops = computed(() => {
  let list = [...shopStore.shops]

  if (activeCategory.value) {
    list = list.filter(s => s.type === activeCategory.value)
  }

  if (sortKey.value === 'rating') {
    list.sort((a, b) => b.rating - a.rating)
  } else if (sortKey.value === 'sales') {
    list.sort((a, b) => b.monthlySales - a.monthlySales)
  } else if (sortKey.value === 'distance') {
    list.sort((a, b) => a.distance - b.distance)
  }
  return list
})

function setSort(key: SortKey) {
  sortKey.value = key
}

function clickCategory(name: string) {
  activeCategory.value = activeCategory.value === name ? '' : name
}

const sortOpts = [
  { key: 'default', label: '综合' },
  { key: 'rating', label: '评分最高' },
  { key: 'sales', label: '月销最多' },
  { key: 'distance', label: '距离最近' },
]

// v14 P0-5 onboarding（7-23 锡哥拍板）
// 首次进站检查 localStorage，已看过不弹，未看过弹 3 屏引导
const showOnboarding = ref(false)
function checkOnboarding() {
  try {
    const done = localStorage.getItem(STORAGE_KEYS.onboarded)
    if (!done) showOnboarding.value = true
  } catch {
    showOnboarding.value = true // localStorage 不可用 → 保守弹一次
  }
}
function dismissOnboarding() {
  showOnboarding.value = false
  try {
    localStorage.setItem(STORAGE_KEYS.onboarded, '1')
  } catch {
    // ignore
  }
  // v17 数据埋点：onboarding 完成（决策 #023）
  track('onboarding_complete')
}

onMounted(() => {
  // 300ms 后检查，避免与首屏渲染冲突
  setTimeout(checkOnboarding, 300)
})
</script>

<template>
  <div class="page-container">
    <AppHeader title="胡闹外卖" show-search @search="kw => $router.push('/shops?q=' + encodeURIComponent(kw))" />

    <!-- 品牌 Slogan -->
    <div class="slogan-bar">
      <span class="slogan-icon">🍜</span>
      <span>零卡路里的外卖，越点越瘦</span>
    </div>

    <!-- 轮播 -->
    <van-swipe class="banner" autoplay="3000" indicator-color="#ff6b35">
      <van-swipe-item v-for="i in 3" :key="i">
        <div class="banner-item" :class="`banner-item--${i}`">
          <span>{{ ['胡闹外卖开业啦🎉', '15家戏精老板等你点单🎭', '骑手正在飙车赶来🏍️'][i-1] }}</span>
        </div>
      </van-swipe-item>
    </van-swipe>

    <!-- 分类 icon -->
    <div class="category-grid">
      <div
        v-for="cat in categories"
        :key="cat.name"
        class="category-item"
        :class="{ active: activeCategory === cat.name }"
        @click="clickCategory(cat.name)"
      >
        <div class="category-icon">{{ cat.icon }}</div>
        <span class="category-name">{{ cat.name }}</span>
      </div>
    </div>

    <!-- 排序 Bar -->
    <div class="sort-bar">
      <span
        v-for="opt in sortOpts"
        :key="opt.key"
        class="sort-item"
        :class="{ active: sortKey === opt.key }"
        @click="setSort(opt.key as SortKey)"
      >{{ opt.label }}</span>
    </div>

    <!-- 商家列表 -->
    <div class="section-title">
      {{ activeCategory ? activeCategory : '附近商家' }}
      <span class="section-count">（{{ sortedShops.length }} 家）</span>
    </div>
    <div class="shop-list">
      <van-empty
        v-if="sortedShops.length === 0"
        description="这个分类暂时没有商家哦"
        image="search"
      />
      <ShopCard
        v-for="shop in sortedShops"
        :key="shop.id"
        :shop="shop"
      />
    </div>
  </div>

  <!-- v18: TabBar 移到 App.vue 全局挂载 -->

  <!-- v14 P0-5 onboarding 引导（首次进站弹一次）-->
  <OnboardingGuide :show="showOnboarding" @close="dismissOnboarding" />
</template>



<style lang="scss" scoped>
.slogan-bar {
  background: linear-gradient(135deg, #fff0eb, #fff);
  padding: 10px 16px;
  font-size: 13px;
  color: #ff6b35;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid #ffe4d6;

  .slogan-icon { font-size: 16px; }
}

.banner {
  height: 140px;

  .banner-item {
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    border-radius: 0;

    &--1 { background: linear-gradient(135deg, #ff6b35, #ff9a3c); }
    &--2 { background: linear-gradient(135deg, #ff4757, #ff6b35); }
    &--3 { background: linear-gradient(135deg, #e55a26, #ff8c42); }
  }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 16px 8px;
  background: #fff;
  margin-bottom: 8px;

  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 8px 4px;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s;

    &:active { background: #fff0eb; }
  }

  .category-icon { font-size: 28px; }
  .category-name { font-size: 12px; color: #333; }
}

.category-item {
  &.active {
    .category-icon { transform: scale(1.15); }
    .category-name { color: #ff6b35; font-weight: 700; }
  }
}

.sort-bar {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 0 8px;

  .sort-item {
    flex: 1;
    text-align: center;
    padding: 10px 0;
    font-size: 13px;
    color: #666;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;

    &.active {
      color: #ff6b35;
      font-weight: 700;
      border-bottom-color: #ff6b35;
    }
  }
}

.section-title {
  padding: 12px 16px 8px;
  font-size: 15px;
  font-weight: 700;
  color: #333;
  background: #f5f5f5;

  .section-count {
    font-size: 12px;
    color: #999;
    font-weight: 400;
  }
}

.shop-list {
  background: #f5f5f5;
  min-height: 200px;
}
</style>
