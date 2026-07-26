<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { L1MART } from '../config/l1mart.static.ts'

const route = useRoute()
const router = useRouter()
const guideId = computed(() => (route.query.guide as string) ?? L1MART.guides[0].id)
const guide = computed(() => L1MART.guides.find((g) => g.id === guideId.value) ?? L1MART.guides[0])

function enterGame() {
  // 结算 → 移交博弈对线（L1 商品舞台 → L2 胡闹反骨层）
  router.push(`/game/${guideId.value}`)
}
</script>

<template>
  <section>
    <header class="host-nav">
      <div class="h-title">结算</div>
      <div class="h-sub">某宝杂货铺</div>
    </header>

    <div class="page-pad">
      <div class="card">
        <h2 style="font-size: var(--fs-lg); font-weight: 800; margin-bottom: 8px">确认订单</h2>
        <p class="muted">商品：{{ L1MART.products[0].name }}</p>
        <p>即将触发与 <b style="color: var(--brand-orange)">{{ guide.name }}</b> 的选招对线。</p>
      </div>
      <button class="host-cta" style="margin-top: 16px" @click="enterGame">开始对线</button>
    </div>
  </section>
</template>
