<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { SHOPS } from '../data/shops'
import ShopCard from '../components/ShopCard.vue'
import { nextHomeSeg } from '../lib/homeSegment'

const router = useRouter()

// 三段导航状态
const segActive = ref('首页')

function onSegClick(seg: string) {
  // 自取是占位频道：只提示、不切高亮（状态与内容始终一致，避免"高亮自取/内容外卖"的塑料感）。
  // 仅在 nextHomeSeg 返回非 null 时才改 segActive——自取返回 null，高亮留在首页。
  const next = nextHomeSeg(seg)
  if (next === null) {
    showToast('自取功能暂未开放，继续胡闹外卖')
    return
  }
  segActive.value = next
}

// 定位行点击
function onLocClick() {
  showToast('地址由锡哥随机分配，无法修改')
}

// 金刚区（对齐美团 10 分类）
const categories = [
  { ico: '🍴', txt: '美食', cls: 'cat-yellow' },
  { ico: '🧋', txt: '甜点饮品', cls: 'cat-pink' },
  { ico: '🛒', txt: '超市便利', cls: 'cat-green' },
  { ico: '🍎', txt: '蔬菜水果', cls: 'cat-green' },
  { ico: '💊', txt: '看病买药', cls: 'cat-red' },
  { ico: '🌙', txt: '夜宵', cls: 'cat-purple' },
  { ico: '🍱', txt: '拼好饭', cls: 'cat-orange' },
  { ico: '🏃', txt: '跑腿', cls: 'cat-blue' },
  { ico: '🧧', txt: '天天津贴', cls: 'cat-red2' },
  { ico: '🍳', txt: '家常菜', cls: 'cat-amber' },
]

// 神抢手：复用 flash:true 的店铺
const flashShops = computed(() => SHOPS.filter(s => s.flash))

// Feed Tab
const feedTab = ref('nearby')
const nearbyShops = computed(() => SHOPS)
const promoShops = computed(() => SHOPS.filter(s => s.promo.includes('满')))

// Toast 状态
const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2000)
}

function goSearch() {
  router.push('/shops')
}
</script>

<template>
  <div>
    <!-- 黄色大区 -->
    <div class="yellow-zone">
      <!-- 三段导航 -->
      <div class="seg-3">
        <span class="seg-3__item">‹ 外卖</span>
        <button class="seg-3__item" :class="{ on: segActive === '首页' }" @click="onSegClick('首页')">首页</button>
        <button class="seg-3__item" :class="{ on: segActive === '自取' }" @click="onSegClick('自取')">自取</button>
      </div>

      <!-- 定位行 -->
      <div class="loc-row" @click="onLocClick">
        <span class="loc-icon">📍</span>
        <span>汇展华城</span>
        <span class="loc-arrow">›</span>
      </div>

      <!-- 搜索栏 -->
      <div class="mt-nav">
        <div class="mt-search" style="flex: 1">
          <span class="s-ico">🔍</span>
          <input placeholder="肯德基" readonly @click="goSearch" />
          <span class="s-btn" @click="goSearch">搜索</span>
        </div>
      </div>

      <!-- 金刚区 5×2 -->
      <div class="cat-grid">
        <div class="cat-item" v-for="c in categories" :key="c.txt" @click="router.push(`/shops?cat=${c.txt}`)">
          <div class="ico-wrap" :class="c.cls">{{ c.ico }}</div>
          <div class="txt">{{ c.txt }}</div>
        </div>
      </div>
    </div>

    <!-- 神抢手 横向滚动 -->
    <div class="flash-row" v-if="flashShops.length">
      <div class="flash-title">
        神抢手<span class="flash-badge">限时秒杀中</span>
      </div>
      <router-link to="/shops" class="flash-more">更多 ›</router-link>
    </div>
    <div class="flash-scroll" v-if="flashShops.length">
      <router-link v-for="s in flashShops" :key="s.id" :to="`/shop/${s.id}`" class="flash-card">
        <div class="fc-img">{{ s.emoji }}</div>
        <div class="fc-body">
          <div class="fc-name">{{ s.name }}</div>
          <div class="fc-price">¥{{ s.minOrder }}起</div>
          <div class="fc-tag">{{ s.promo.split('|')[0] }}</div>
        </div>
      </router-link>
    </div>

    <!-- Feed Tabs -->
    <div class="feed-tabs">
      <button class="ft" :class="{ on: feedTab === 'nearby' }" @click="feedTab = 'nearby'">附近商家</button>
      <button class="ft" :class="{ on: feedTab === 'promo' }" @click="feedTab = 'promo'">特价外卖</button>
    </div>

    <!-- 商家列表 -->
    <template v-if="feedTab === 'nearby'">
      <ShopCard v-for="s in nearbyShops.slice(0, 4)" :key="s.id" :shop="s" />
    </template>
    <template v-else>
      <ShopCard v-for="s in promoShops.slice(0, 3)" :key="s.id" :shop="s" />
    </template>

    <div class="page-pad">
      <router-link to="/shops" class="more" style="font-size: 13px; color: var(--mt-text-2); display: block; text-align: center; padding: 10px 0;">查看全部店铺 ›</router-link>
    </div>

    <!-- 锡哥精选段子水印（fine-print，页面最底部） -->
    <div class="fine-print">
      <span class="fp-badge">🎭 锡哥精选段子</span><br />
      剧本由锡哥手编，非每日 AI 生成
    </div>

    <div class="page-pad">
      <div class="more-links">
        <span @click="router.push('/feed')">🎭 段子流</span>
        <span @click="router.push('/service')">🎧 客服</span>
        <span @click="router.push('/about')">ℹ️ 关于</span>
        <span @click="router.push('/privacy')">🔒 隐私</span>
        <span @click="router.push('/terms')">📜 条款</span>
      </div>
    </div>

    <div class="page-pad muted">这是「胡闹宇宙」的外卖分区。点单后老板会演戏，骑手会吐槽，系统会补刀。</div>

    <!-- Toast -->
    <div v-if="toastMsg" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.75); color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 14px; z-index: 200; pointer-events: none;">{{ toastMsg }}</div>
  </div>
</template>
