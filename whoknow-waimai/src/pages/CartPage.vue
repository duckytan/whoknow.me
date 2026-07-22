<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/store/cart'
import { useShopStore } from '@/store/shop'
const router = useRouter()
const cartStore = useCartStore()
const shopStore = useShopStore()

const shop = computed(() => shopStore.currentShop)

const totalWithFee = computed(() => {
  if (!shop.value) return cartStore.totalPrice
  return cartStore.totalPrice + shop.value.deliveryFee
})

function removeItem(itemId: string) {
  cartStore.removeItem(itemId)
}

function goCheckout() {
  router.push('/checkout')
}
</script>

<template>
  <div class="cart-page">
    <van-nav-bar title="购物车" left-arrow @click-left="router.back()" />

    <div v-if="cartStore.isEmpty" class="empty-cart">
      <van-empty image="shopping" description="购物车还是空的">
        <van-button type="primary" round @click="router.push('/')">去点菜</van-button>
      </van-empty>
    </div>

    <div v-else class="cart-body">
      <!-- 商家信息 -->
      <div v-if="shop" class="cart-shop">
        <img class="cart-shop__avatar" :src="shop.avatar" :alt="shop.name" />
        <div class="cart-shop__info">
          <div class="cart-shop__name">{{ shop.name }}</div>
          <div class="cart-shop__label">{{ shop.type }} · {{ shop.bossPersonality }}老板</div>
        </div>
        <van-icon name="delete" color="#ee0a24" size="18" class="cart-clear" @click="cartStore.clearCart()" />
      </div>

      <!-- 菜品列表 -->
      <div class="cart-items">
        <div v-for="item in cartStore.items" :key="item.id" class="cart-item">
          <div class="cart-item__img">{{ item.image }}</div>
          <div class="cart-item__info">
            <div class="cart-item__name">{{ item.name }}</div>
            <div class="cart-item__price">¥{{ item.price.toFixed(2) }}</div>
          </div>
          <div class="cart-item__qty">
            <van-button
              size="mini"
              round
              icon="minus"
              @click="cartStore.decrement(item.id)"
            />
            <span class="qty-num">{{ item.quantity }}</span>
            <van-button
              size="mini"
              round
              icon="plus"
              @click="cartStore.increment(item.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 下单栏 -->
    <div v-if="!cartStore.isEmpty" class="submit-bar">
      <div class="submit-total">
        <span class="submit-count">{{ cartStore.totalCount }} 件</span>
        <span class="submit-price">¥{{ totalWithFee.toFixed(2) }}</span>
      </div>
      <van-button type="primary" size="large" class="submit-btn" round @click="goCheckout">
        去下单
      </van-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cart-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.empty-cart {
  padding-top: 80px;
}

.cart-body {
  padding: 12px;
}

.cart-shop {
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.cart-shop__avatar {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
}

.cart-shop__info { flex: 1; }

.cart-shop__name {
  font-size: 15px;
  font-weight: 700;
  color: #333;
}

.cart-shop__label {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.cart-clear { cursor: pointer; }

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cart-item {
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.cart-item__img {
  font-size: 32px;
  line-height: 1;
  flex-shrink: 0;
}

.cart-item__info { flex: 1; }

.cart-item__name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.cart-item__price {
  font-size: 12px;
  color: #ff6b35;
  font-weight: 700;
  margin-top: 2px;
}

.cart-item__qty {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-num {
  font-size: 15px;
  font-weight: 700;
  color: #333;
  min-width: 20px;
  text-align: center;
}

.submit-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: #fff;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.submit-total { flex: 1; }

.submit-count { font-size: 12px; color: #999; }
.submit-price {
  font-size: 20px;
  font-weight: 700;
  color: #ff6b35;
  margin-left: 8px;
}

.submit-btn {
  flex-shrink: 0;
  padding: 0 24px !important;
}
</style>
