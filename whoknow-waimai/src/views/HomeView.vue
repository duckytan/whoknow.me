<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const cats = [
  { ico: '🍜', txt: '美食', cls: 'cat-yellow' },
  { ico: '🛒', txt: '超市', cls: 'cat-green' },
  { ico: '🍱', txt: '便当', cls: 'cat-orange' },
  { ico: '🍰', txt: '甜点', cls: 'cat-pink' },
  { ico: '🥤', txt: '饮品', cls: 'cat-cyan' },
  { ico: '🍢', txt: '烧烤', cls: 'cat-red' },
  { ico: '🍲', txt: '火锅', cls: 'cat-red2' },
  { ico: '🍣', txt: '寿司', cls: 'cat-blue' },
  { ico: '🥟', txt: '饺子', cls: 'cat-purple' },
  { ico: '🍳', txt: '早餐', cls: 'cat-amber' },
]
</script>

<template>
  <div>
    <div class="yellow-zone">
      <div class="mt-nav">
        <div class="mt-nav__top">
          <div class="mt-search" style="flex: 1">
            <span class="s-ico">🔍</span>
            <input placeholder="搜索 胡闹外卖 店铺" />
            <span class="s-btn">搜索</span>
          </div>
        </div>
      </div>
      <div class="cat-grid">
        <div class="cat-item" v-for="c in cats" :key="c.txt">
          <div class="ico-wrap" :class="c.cls">{{ c.ico }}</div>
          <div class="txt">{{ c.txt }}</div>
        </div>
      </div>
    </div>

    <div class="hot-bar" style="margin-top: 14px">
      <div class="title">附近好店 <span class="badge" style="background: linear-gradient(90deg, #ff7e45, #ff4b10); color: #fff; font-size: 12px; padding: 3px 8px; border-radius: 999px; margin-left: 6px; font-weight: 600">戏精出品</span></div>
      <router-link to="/shops" class="more" style="font-size: 13px; color: var(--mt-text-2)">全部 ›</router-link>
    </div>

    <div class="page-pad">
      <button class="submit-btn" @click="router.push('/shops')">🍜 去胡闹外卖选店</button>
    </div>

    <div class="story-watermark">
      <span class="badge">🎭 锡哥精选段子</span>
      <span>剧本由锡哥手编，非每日 AI 生成</span>
    </div>

    <div class="page-pad muted">这是「胡闹宇宙」的外卖分区。点单后老板会演戏，骑手会吐槽，系统会补刀。</div>
  </div>
</template>
