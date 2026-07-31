<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { SHOPS, type Shop } from '../data/shops'
import ShopCard from '../components/ShopCard.vue'

// 金刚区分类筛选：读取 ?cat= 参数，只列该分类店铺（主站 10 类之一）。
const route = useRoute()
const cat = computed(() => {
  const q = route.query.cat
  return typeof q === 'string' ? q : undefined
})

// 分类过滤后的基础集合（chip 筛选/排序都在这之上做，两者可叠加）
const baseList = computed(() => (cat.value ? SHOPS.filter((s) => s.cat === cat.value) : SHOPS))

// ---- P1-3: 筛选 chip（纯点击，单选） ----
type FilterId = 'all' | 'promo' | 'freeship' | 'sales' | 'distance' | 'new'
const FILTERS: { id: FilterId; label: string; empty: string }[] = [
  { id: 'all', label: '全部', empty: '该分类暂未上架胡闹商家' },
  { id: 'promo', label: '满减优惠', empty: '这批老板今天不想打折' },
  { id: 'freeship', label: '免配送费', empty: '暂无免配送费商家 · 老板们都想赚这几块钱' },
  { id: 'sales', label: '销量优先', empty: '该分类暂未上架胡闹商家' },
  { id: 'distance', label: '距离最近', empty: '该分类暂未上架胡闹商家' },
  { id: 'new', label: '新店', empty: '暂无新店 · 老店们还在硬撑' },
]
const activeFilter = ref<FilterId>('all')

/** 从「月售 5600+」这类文案里取数字；取不到按 0 处理 */
function salesOf(s: Shop): number {
  const n = parseInt(s.monthlySales.replace(/[^\d]/g, ''), 10)
  return Number.isNaN(n) ? 0 : n
}

/** 距离统一折算成米：'1.2km' → 1200，'800m' → 800（混单位下 parseInt 会排错序） */
function distanceOf(s: Shop): number {
  const n = parseFloat(s.distance.replace(/[^\d.]/g, ''))
  if (Number.isNaN(n)) return Number.MAX_SAFE_INTEGER
  return /km/i.test(s.distance) ? n * 1000 : n
}

const list = computed<Shop[]>(() => {
  const src = baseList.value
  switch (activeFilter.value) {
    case 'promo':
      return src.filter((s) => s.promo.includes('减'))
    case 'freeship':
      return src.filter((s) => s.deliveryFee === 0)
    case 'sales':
      return [...src].sort((a, b) => salesOf(b) - salesOf(a))
    case 'distance':
      return [...src].sort((a, b) => distanceOf(a) - distanceOf(b))
    case 'new':
      return src.filter((s) => s.badge === '新店' || s.flash === true)
    case 'all':
    default:
      return src
  }
})

const emptyHint = computed(
  () => FILTERS.find((f) => f.id === activeFilter.value)?.empty ?? '该分类暂未上架胡闹商家'
)

// ---- P1-3: 红包横幅（纯装饰，点击给个 Toast） ----
const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string) {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
  }, 2000)
}
onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
})
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

    <div v-if="toastMsg" class="ph-toast">{{ toastMsg }}</div>
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
