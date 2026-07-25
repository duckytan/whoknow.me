<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getShop } from '../data/shops'
import { getMenu } from '../data/dishes'
import { cart, addItem, decItem, dishCount, cartTotal } from '../store/cart'
import PersonaBadge from '../components/PersonaBadge.vue'

const route = useRoute()
const router = useRouter()
const shop = getShop(route.params.id as string)
const menu = computed(() => (shop ? getMenu(shop.id) : []))
const items = computed(() => (shop ? cart[shop.id] ?? {} : {}))
const count = computed(() => (shop ? dishCount(shop.id) : 0))
const total = computed(() => (shop ? cartTotal(shop.id) : 0))

function goCheckout() {
  if (shop && count.value > 0) router.push(`/order?shop=${shop.id}`)
}
</script>

<template>
  <div v-if="shop" class="shop-page">
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
        <span class="price">配送 {{ shop.deliveryFee }} 元</span>
      </div>
    </div>
    <div class="shop-greeting">
      <div class="av">{{ shop.emoji }}</div>
      <div>{{ shop.greeting }}</div>
    </div>

    <div class="menu-head">🍽️ 招牌菜单</div>
    <div class="menu-list">
      <div class="dish-row" v-for="d in menu" :key="d.id">
        <div class="dish-emoji">{{ d.emoji }}</div>
        <div class="dish-info">
          <div class="dish-name">{{ d.name }}</div>
          <div class="dish-desc">{{ d.desc }}</div>
          <div class="dish-price">¥{{ d.price }}</div>
        </div>
        <div class="stepper">
          <button v-if="items[d.id]" class="st" @click="decItem(shop.id, d.id)">−</button>
          <span v-if="items[d.id]" class="q">{{ items[d.id] }}</span>
          <button class="st add" @click="addItem(shop.id, d.id)">＋</button>
        </div>
      </div>
    </div>

    <!-- 底部购物车栏 -->
    <div class="cart-bar" :class="{ empty: count === 0 }">
      <div class="cart-ico">🛒<span v-if="count" class="badge">{{ count }}</span></div>
      <div class="cart-total">
        <template v-if="count">¥{{ total }}<span class="tip">另需配送费 ¥{{ shop.deliveryFee }}</span></template>
        <template v-else>还没选菜</template>
      </div>
      <button class="cart-go" :disabled="count === 0" @click="goCheckout">去结算</button>
    </div>
  </div>
  <div v-else class="page-pad">
    店铺不存在。<router-link to="/shops" style="color: var(--mt-price)">返回列表</router-link>
  </div>
</template>
