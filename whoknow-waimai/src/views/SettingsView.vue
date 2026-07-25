<script setup lang="ts">
import { useRouter } from 'vue-router'
import { memory } from '../store/memoryStore'
import { SHOPS } from '../data/shops'
const router = useRouter()
function clearAll() {
  if (!confirm('确定清空所有数据（成就 / 订单 / 访问记录）？此操作不可恢复')) return
  memory.reset()
  for (const s of SHOPS) memory.reset(s.id)
  alert('已清空，欢迎重新开演。')
  router.push('/shops')
}
</script>

<template>
  <div class="mt-nav">
    <div class="mt-nav__top">
      <div class="mt-nav__back" @click="router.back()">‹</div>
      <div class="mt-nav__title">设置</div>
    </div>
  </div>
  <div class="page-pad">
    <div class="entry-list">
      <div class="entry" @click="router.push('/about')">ℹ️ 关于胡闹</div>
      <div class="entry" @click="router.push('/privacy')">🔒 隐私政策</div>
      <div class="entry" @click="router.push('/terms')">📜 用户条款</div>
      <div class="entry" @click="router.push('/service')">🎧 客服</div>
    </div>
    <button class="submit-btn danger" @click="clearAll">清空所有数据</button>
    <div class="muted" style="margin-top: 12px">数据仅存于本机，清空不影响任何真实交易。</div>
  </div>
</template>
