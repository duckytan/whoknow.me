<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { getShop } from '../data/shops'
import PersonaBadge from '../components/PersonaBadge.vue'

const route = useRoute()
const router = useRouter()
const shop = getShop(route.params.id as string)
function order() {
  if (shop) router.push(`/order?shop=${shop.id}`)
}
</script>

<template>
  <div v-if="shop">
    <div class="shop-top">
      <div class="pic">{{ shop.emoji }}</div>
      <div class="nav">
        <div class="icon-btn" @click="router.push('/shops')">‹</div>
        <div class="title">{{ shop.name }}</div>
      </div>
    </div>
    <div class="shop-info">
      <div class="nm">{{ shop.name }} <PersonaBadge :personality="shop.personality" /></div>
      <div class="stats">
        <span><span class="v">{{ shop.score }}</span> 分</span>
        <span>{{ shop.monthlySales }}</span>
        <span>约 {{ shop.deliveryTime }}</span>
      </div>
    </div>
    <div class="shop-greeting">
      <div class="av">{{ shop.emoji }}</div>
      <div>{{ shop.greeting }}</div>
    </div>
    <button class="order-cta" @click="order">🍜 去下单（看老板演戏）</button>
  </div>
  <div v-else class="page-pad">
    店铺不存在。<router-link to="/shops" style="color: var(--mt-price)">返回列表</router-link>
  </div>
</template>
