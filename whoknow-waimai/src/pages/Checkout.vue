<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/store/cart'
import { useShopStore } from '@/store/shop'
import { useOrderStore } from '@/store/order'
import { triggerOrderFlow } from '@/utils/npcEngine'
import type { Order } from '@/types'

const router = useRouter()
const cartStore = useCartStore()
const shopStore = useShopStore()
const orderStore = useOrderStore()

const shop = computed(() => shopStore.currentShop)
const remark = ref('')
const submitting = ref(false)

// 假地址列表（随机选一个让它有点戏）
const addresses = [
  '宇宙路 404 号，迷失公寓 3 楼，找不到门牌那个',
  '幸福小区 B 栋 2102，按门铃没人应就敲门',
  '城北大道 88 号，在麦当劳旁边那个没有招牌的楼',
  '学府路 1 号研究生宿舍，门卫很凶，麻烦放门口',
  '天河路 999 号，金碧辉煌大厦 32F，开电梯要刷卡',
]
const address = ref(addresses[Math.floor(Math.random() * addresses.length)])

const totalWithFee = computed(() => {
  if (!shop.value) return cartStore.totalPrice
  return cartStore.totalPrice + shop.value.deliveryFee
})

function generateOrderId(): string {
  return 'ORD' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase()
}

async function submitOrder() {
  if (!shop.value || cartStore.isEmpty) return
  submitting.value = true

  const orderId = generateOrderId()
  const newOrder: Order = {
    id: orderId,
    shopId: shop.value.id,
    shopName: shop.value.name,
    bossPersonality: shop.value.bossPersonality,
    riderId: '',
    riderName: '',
    riderAvatar: '',
    items: [...cartStore.items],
    status: 'pending',
    timeline: [{
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      action: '订单已提交',
      npcQuote: '你的外卖已进入「命运系统」，请耐心等待 NPC 演出。',
    }],
    totalPrice: totalWithFee.value,
    address: address.value,
    remark: remark.value,
    createdAt: Date.now(),
  }

  orderStore.createOrder(newOrder)
  cartStore.clearCart()

  // 触发 NPC 状态机
  triggerOrderFlow(orderId)

  submitting.value = false
  router.replace(`/order/${orderId}`)
}
</script>

<template>
  <div class="checkout-page">
    <van-nav-bar title="确认下单" left-arrow @click-left="router.back()" />

    <div class="checkout-body" v-if="shop && !cartStore.isEmpty">

      <!-- 收货地址 -->
      <div class="section">
        <div class="section-title">📍 收货地址</div>
        <van-cell-group inset>
          <van-field
            v-model="address"
            type="textarea"
            rows="2"
            autosize
            placeholder="输入地址"
          />
        </van-cell-group>
      </div>

      <!-- 商家信息 -->
      <div class="section">
        <div class="section-title">🏪 外卖来自</div>
        <van-cell-group inset>
          <van-cell :title="shop.name" :label="`预计 ${shop.deliveryTime} 分钟送达`">
            <template #icon>
              <span class="shop-avatar">{{ shop.avatar }}</span>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 商品列表 -->
      <div class="section">
        <div class="section-title">🍽️ 你点的菜</div>
        <van-cell-group inset>
          <van-cell
            v-for="item in cartStore.items"
            :key="item.id"
            :title="item.name"
            :value="`¥${(item.price * item.quantity).toFixed(2)}`"
          >
            <template #label>
              <span class="item-qty">x{{ item.quantity }}  ·  ¥{{ item.price }}/份</span>
            </template>
          </van-cell>
          <van-cell title="配送费" :value="`¥${shop.deliveryFee}`" />
          <van-cell class="total-cell">
            <template #title>
              <span class="total-label">合计</span>
            </template>
            <template #value>
              <span class="total-price">¥{{ totalWithFee.toFixed(2) }}</span>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 备注 -->
      <div class="section">
        <div class="section-title">📝 给老板留言</div>
        <van-cell-group inset>
          <van-field
            v-model="remark"
            placeholder="比如：不要香菜 / 多放辣 / 老板你好"
            rows="2"
            type="textarea"
            autosize
            maxlength="50"
            show-word-limit
          />
        </van-cell-group>
        <p class="remark-hint">⚠️ 提示：如果你骂老板，老板可能会骂回来</p>
      </div>

    </div>

    <!-- 购物车为空 -->
    <div v-else class="empty-cart">
      <van-empty image="shopping" description="购物车是空的，先去点菜吧" />
      <van-button type="primary" @click="router.push('/')">去逛逛</van-button>
    </div>

    <!-- 提交按钮 -->
    <div v-if="shop && !cartStore.isEmpty" class="submit-bar">
      <div class="submit-total">
        <span class="submit-count">共 {{ cartStore.totalCount }} 件</span>
        <span class="submit-price">¥{{ totalWithFee.toFixed(2) }}</span>
      </div>
      <van-button
        type="primary"
        size="large"
        class="submit-btn"
        :loading="submitting"
        loading-text="下单中..."
        @click="submitOrder"
      >
        确认下单，让 NPC 演戏
      </van-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.checkout-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.checkout-body {
  padding: 0 0 16px;
}

.section {
  margin-top: 12px;
}

.section-title {
  padding: 10px 16px 6px;
  font-size: 13px;
  font-weight: 700;
  color: #666;
}

.shop-avatar {
  font-size: 26px;
  margin-right: 8px;
  line-height: 1;
}

.item-qty {
  font-size: 11px;
  color: #aaa;
}

.total-cell {
  :deep(.van-cell__title) { font-weight: 700; }
}

.total-label { font-size: 15px; font-weight: 700; color: #222; }
.total-price {
  font-size: 18px;
  font-weight: 700;
  color: #ff6b35;
}

.remark-hint {
  font-size: 11px;
  color: #f39c12;
  padding: 4px 16px 0;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-top: 80px;
}

.submit-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 16px;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.08);
  gap: 12px;
  z-index: 100;
}

.submit-total {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.submit-count { font-size: 11px; color: #999; }
.submit-price { font-size: 18px; font-weight: 700; color: #ff6b35; }

.submit-btn {
  flex-shrink: 0;
  padding: 0 20px !important;
  background: #ff6b35 !important;
  border-color: #ff6b35 !important;
  font-weight: 700;
}
</style>
