<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="mt-nav">
    <div class="mt-nav__top">
      <div class="mt-nav__back" @click="router.back()">‹</div>
      <div class="mt-nav__title">关于胡闹</div>
    </div>
  </div>
  <div class="page-pad about">
    <div class="logo">? 胡闹外卖</div>
    <p>胡闹宇宙 · 段子机产品线。下单是假的，笑是真的。</p>
    <p class="muted">所有剧本由锡哥手编，NPC（老板 / 骑手 / 系统）按 DRAMA 引擎现场演出。数据存你本机，不上云。</p>
    <div class="entry-list" style="margin-top: 16px">
      <div class="entry" @click="router.push('/privacy')">🔒 隐私政策</div>
      <div class="entry" @click="router.push('/terms')">📜 用户条款</div>
      <div class="entry" @click="router.push('/service')">🎧 客服</div>
    </div>
    <div class="muted" style="margin-top: 16px">v2.0.0 · 胡闹宇宙出品 · whoknow.me/waimai</div>
  </div>
</template>
