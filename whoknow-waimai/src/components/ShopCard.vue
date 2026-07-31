<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Shop } from '../data/shops'
import PersonaBadge from './PersonaBadge.vue'

const props = defineProps<{ shop: Shop }>()
const router = useRouter()
function go() {
  router.push(`/shop/${props.shop.id}`)
}
</script>

<template>
  <div class="shop-card" @click="go">
    <div class="logo">
      <div class="img">{{ shop.emoji }}</div>
      <div v-if="shop.badge" class="badge">{{ shop.badge }}</div>
    </div>
    <div class="info">
      <div class="name">{{ shop.name }} <PersonaBadge :personality="shop.personality" /></div>
      <div class="meta">
        <span class="score">{{ shop.score }}</span>
        <span class="tag-x2">{{ shop.monthlySales }}</span>
        <span class="tag-x2">{{ shop.deliveryTime }}</span>
        <span class="tag-x3">{{ shop.distance }}</span>
      </div>
      <div class="row3">
        <span>起送 ¥{{ shop.minOrder }}</span>
        <span>配送 ¥{{ shop.deliveryFee }}</span>
      </div>
      <!-- P1-3: 优惠行 + 右侧黄色 CTA（点击进店，纯点击） -->
      <div class="promo-line">
        <div class="promo-bar">
          <span class="ico">满减</span>
          <span class="t">{{ shop.promo }}</span>
        </div>
        <button class="card-cta" :aria-label="`进入${shop.name}领券`" @click.stop="go">领券</button>
      </div>
    </div>
  </div>
</template>
