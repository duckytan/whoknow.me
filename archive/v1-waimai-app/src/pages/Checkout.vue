<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/store/cart'
import { useShopStore } from '@/store/shop'
import { useOrderStore } from '@/store/order'
import { triggerOrderFlow } from '@/utils/npcEngine'
import { trackEvent } from '@/utils/metrics'
import type { Order } from '@/types'

const router = useRouter()
const cartStore = useCartStore()
const shopStore = useShopStore()
const orderStore = useOrderStore()

const shop = computed(() => shopStore.currentShop)
const remark = ref('')
const submitting = ref(false)

const ADDRESS_OPTIONS = [
  { value: '家庭', icon: '🏠', text: '温馨小家' },
  { value: '学校', icon: '🎒', text: '学生宿舍' },
  { value: '公司', icon: '💼', text: '公司楼下' },
  { value: '公厕', icon: '🚽', text: '公共厕所' },
  { value: '百慕大', icon: '🗺️', text: '百慕大三角' },
  { value: 'ICU', icon: '🏥', text: 'ICU 病房' },
]
const REMARK_OPTIONS = [
  { value: '多放辣', text: '🌶️ 多放辣' },
  { value: '少放辣', text: '🥒 少放辣' },
  { value: '不要香菜', text: '🚫 不要香菜' },
  { value: '别骂了', text: '🙏 别骂了' },
  { value: '表演才艺', text: '🎤 表演才艺' },
  { value: '老板辛苦了', text: '😊 老板辛苦了' },
]
const address = ref(ADDRESS_OPTIONS[0].value)

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

  // v17 数据埋点（决策 #023）
  trackEvent('order_submit', {
    shopId: shop.value.id,
    itemCount: cartStore.totalCount,
    totalPrice: totalWithFee.value,
    hasRemark: !!remark.value,
    address: address.value,
  })

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
        <div class="section-title">📍 送到哪？<span class="section-hint">选一个，老板的反应不一样</span></div>
        <div class="address-grid">
          <div
            v-for="opt in ADDRESS_OPTIONS"
            :key="opt.value"
            class="address-chip"
            :class="{ selected: address === opt.value }"
            @click="address = opt.value"
          >
            <span class="address-icon">{{ opt.icon }}</span>
            <span class="address-label">{{ opt.text }}</span>
          </div>
        </div>
      </div>

      <!-- 商家信息 -->
      <div class="section">
        <div class="section-title">🏪 外卖来自</div>
        <van-cell-group inset>
          <van-cell :title="shop.name" :label="`预计 ${shop.deliveryTime} 分钟送达`">
            <template #icon>
              <img class="shop-avatar" :src="shop.avatar" :alt="shop.name" style="width:40px;height:40px;border-radius:8px;margin-right:8px;object-fit:cover" />
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
            :value="`¥${(item.price * item.quantity).toFixed(2)}`"
          >
            <template #title>
              <span class="dish-name">
                <span class="dish-img">{{ item.image }}</span>
                {{ item.name }}
              </span>
            </template>
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
        <div class="section-title">📝 给老板留言（不是必须，但选了有彩蛋）</div>
        <div class="remark-grid">
          <div
            v-for="opt in REMARK_OPTIONS"
            :key="opt.value"
            class="remark-chip"
            :class="{ selected: remark === opt.value }"
            @click="remark = remark === opt.value ? '' : opt.value"
          >
            {{ opt.text }}
          </div>
        </div>
        <p class="remark-hint">💡 选一个备注，NPC 会回应你；再点一次取消</p>
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



.dish-name { display: flex; align-items: center; gap: 8px; }
.dish-img { font-size: 22px; line-height: 1; }
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
  color: #ff7849;
}

.section-hint {
  font-size: 11px;
  font-weight: 400;
  color: #999;
  margin-left: 6px;
}

.address-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 16px 10px;
}

.address-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1.5px solid #e0e0e0;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}
.address-chip.selected {
  border-color: #ff7849;
  background: #fff5f0;
  color: #ff7849;
  font-weight: 600;
}
.address-chip:active {
  transform: scale(0.96);
}

.address-icon { font-size: 16px; }
.address-label { line-height: 1; }

.remark-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 16px 10px;
}

.remark-chip {
  padding: 7px 14px;
  border-radius: 18px;
  border: 1.5px solid #e0e0e0;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}
.remark-chip.selected {
  border-color: #07c160;
  background: #f0fff4;
  color: #07c160;
  font-weight: 600;
}
.remark-chip:active {
  transform: scale(0.96);
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
.submit-price { font-size: 18px; font-weight: 700; color: #ff7849; }

.submit-btn {
  flex-shrink: 0;
  padding: 0 20px !important;
  background: #ff7849 !important;
  border-color: #ff7849 !important;
  font-weight: 700;
}
</style>
