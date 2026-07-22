<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOrderStore } from '@/store/order'
const router = useRouter()
const orderStore = useOrderStore()

const orders = computed(() => orderStore.orders)

const statusLabel: Record<string, string> = {
  pending: '等待接单',
  accepted: '已接单',
  cooking: '正在出餐',
  delivering: '配送中',
  completed: '已送达',
  boss_complaining: '老板在叨叨',
  rider_lost: '骑手迷路了',
}

const statusColor: Record<string, string> = {
  pending: '#999',
  accepted: '#ff6b35',
  cooking: '#ff6b35',
  delivering: '#07c160',
  completed: '#999',
  boss_complaining: '#ee0a24',
  rider_lost: '#ee0a24',
}

function goOrder(id: string) {
  router.push(`/order/${id}`)
}

function formatTime(ts: number) {
  const d = new Date(ts)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = d.getHours().toString().padStart(2, '0')
  const min = d.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hour}:${min}`
}
</script>

<template>
  <div class="history-page">
    <AppHeader title="我的订单" show-back />

    <div v-if="orders.length === 0" class="empty-state">
      <van-empty description="还没有下过单呢">
        <template #image>
          <div class="empty-icon">📭</div>
        </template>
        <van-button type="primary" round @click="router.push('/shops')">
          去下第一单
        </van-button>
      </van-empty>
    </div>

    <div v-else class="order-list">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
        @click="goOrder(order.id)"
      >
        <div class="card-top">
          <div class="card-shop">
            <span class="card-emoji">{{ order.shopName.charAt(0) }}</span>
            <span class="card-name">{{ order.shopName }}</span>
          </div>
          <div class="card-status" :style="{ color: statusColor[order.status] }">
            {{ order.status === 'completed' ? '✅' : '⏳' }} {{ statusLabel[order.status] }}
          </div>
        </div>

        <div class="card-items">
          <span v-for="(item, i) in order.items.slice(0, 3)" :key="item.id">
            {{ item.name }}x{{ item.quantity }}<span v-if="i < order.items.slice(0, 3).length - 1">、</span>
          </span>
          <span v-if="order.items.length > 3">…等{{ order.items.length }}件</span>
        </div>

        <div class="card-bottom">
          <span class="card-time">{{ formatTime(order.createdAt) }}</span>
          <div class="card-right">
            <span v-if="order.review" class="review-badge">📝 已评价</span>
            <span class="card-price">¥{{ order.totalPrice.toFixed(2) }}</span>
            <van-icon name="arrow" color="#bbb" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.history-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.empty-state {
  padding-top: 80px;
}

.empty-icon {
  font-size: 64px;
  line-height: 1;
}

.order-list {
  padding: 12px 16px 80px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.order-card:active {
  transform: scale(0.98);
  background: #fafafa;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-shop {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-emoji {
  font-size: 16px;
}

.card-name {
  font-size: 15px;
  font-weight: 700;
  color: #333;
}

.card-status {
  font-size: 12px;
  font-weight: 600;
}

.card-items {
  font-size: 13px;
  color: #888;
  margin-bottom: 10px;
  line-height: 1.5;
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.card-time {
  font-size: 11px;
  color: #bbb;
}

.card-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.review-badge {
  font-size: 11px;
  color: #07c160;
  font-weight: 600;
}

.card-price {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}
</style>
