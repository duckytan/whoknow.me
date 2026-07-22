<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShopStore } from '@/store/shop'
import { useCartStore } from '@/store/cart'
import ShopHeader from '@/components/shop/ShopHeader.vue'
import DishList from '@/components/dish/DishList.vue'
import CartBar from '@/components/cart/CartBar.vue'

const route = useRoute()
const router = useRouter()
const shopStore = useShopStore()
const cartStore = useCartStore()

const shopId = computed(() => route.params.id as string)
const shop = computed(() => shopStore.getShopById(shopId.value))
const dishes = computed(() => shopStore.getDishesByShop(shopId.value))

onMounted(() => {
  if (!shop.value) {
    router.replace('/')
    return
  }
  shopStore.setCurrentShop(shopId.value)
})
</script>

<template>
  <div v-if="shop" class="shop-detail-page">
    <!-- 顶部导航 -->
    <van-nav-bar
      :title="shop.name"
      left-arrow
      class="shop-nav"
      @click-left="router.back()"
    />

    <!-- 可滚动内容 -->
    <div class="page-scroll">
      <!-- 商家头部组件 -->
      <ShopHeader :shop="shop" />

      <!-- 菜品列表（Day 3 实现） -->
      <DishList :dishes="dishes" :shop-id="shopId" />
    </div>

    <!-- 底部购物车 Bar（Day 3 实现） -->
    <CartBar :shop="shop" />
  </div>

  <!-- 商家不存在 -->
  <div v-else class="not-found">
    <van-empty description="商家不存在" />
    <van-button type="primary" @click="router.push('/')">回首页</van-button>
  </div>
</template>

<style lang="scss" scoped>
.shop-detail-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.shop-nav {
  flex-shrink: 0;
}

.page-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 70px;
}

.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 16px;
}
</style>
