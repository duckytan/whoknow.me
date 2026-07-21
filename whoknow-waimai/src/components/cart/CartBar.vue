<script setup lang="ts">
import { useCartStore } from '@/store/cart'
import type { Shop } from '@/types'

defineProps<{
  shop: Shop
}>()

const emit = defineEmits<{
  checkout: []
}>()

const cartStore = useCartStore()
</script>

<template>
  <div class="cart-bar" :class="{ 'has-items': !cartStore.isEmpty }">
    <div class="cart-bar__icon" @click="!cartStore.isEmpty && emit('checkout')">
      <van-icon name="shopping-cart-o" size="26" color="#fff" />
      <van-badge
        v-if="cartStore.totalCount > 0"
        :content="cartStore.totalCount"
        class="cart-badge"
      />
    </div>
    <div class="cart-bar__price">
      <template v-if="cartStore.isEmpty">
        <span class="price-hint">点个菜吧~</span>
      </template>
      <template v-else>
        <span class="price-total">¥{{ cartStore.totalPrice.toFixed(2) }}</span>
        <span class="price-fee">含配送费 ¥{{ shop.deliveryFee }}</span>
      </template>
    </div>
    <van-button
      class="cart-bar__btn"
      :type="cartStore.isEmpty ? 'default' : 'primary'"
      :disabled="cartStore.isEmpty"
      size="small"
      round
      @click="emit('checkout')"
    >
      {{ cartStore.isEmpty ? '未选' : '去下单' }}
    </van-button>
  </div>
</template>

<style lang="scss" scoped>
.cart-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  display: flex;
  align-items: center;
  height: 58px;
  padding: 0 16px;
  background: #333;
  gap: 12px;
  z-index: 100;
  transition: background 0.3s;

  &.has-items { background: #2d2d2d; }

  &__icon {
    position: relative;
    width: 44px;
    height: 44px;
    background: #555;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    transition: background 0.2s;

    .has-items & { background: #ff6b35; }
  }

  &__price {
    flex: 1;
    .price-hint { font-size: 13px; color: #999; }
    .price-total { font-size: 18px; font-weight: 700; color: #fff; }
    .price-fee { font-size: 11px; color: #999; margin-left: 6px; }
  }

  &__btn {
    flex-shrink: 0;
    padding: 0 18px !important;
    font-weight: 700;
  }
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
}
</style>
