<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '@/store/order'
import { getRiderName, getRiderAvatar } from '@/utils/npcEngine'
import type { ReviewContext } from '@/utils/reviewGenerator'
import NpcStatus from '@/components/npc/NpcStatus.vue'
import BossBubble from '@/components/npc/BossBubble.vue'
import RiderBubble from '@/components/npc/RiderBubble.vue'
import RiderMap from '@/components/order/RiderMap.vue'
import ReviewModal from '@/components/review/ReviewModal.vue'
import ReviewCard from '@/components/review/ReviewCard.vue'
import type { OrderStatus } from '@/types'
import quotesData from '@/data/quotes.json'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

const orderId = computed(() => route.params.id as string)
const order = computed(() => orderStore.getOrderById(orderId.value))

// 滚动到最新消息
const timelineRef = ref<HTMLElement>()
watch(
  () => order.value?.timeline.length,
  () => {
    setTimeout(() => {
      if (timelineRef.value) {
        timelineRef.value.scrollTop = timelineRef.value.scrollHeight
      }
    }, 100)
  }
)

// 当前步骤 index（用于 Vant Steps）
const STATUS_STEPS: OrderStatus[] = ['pending', 'accepted', 'cooking', 'delivering', 'completed']
const currentStep = computed(() => {
  const status = order.value?.status
  if (!status) return 0
  if (status === 'boss_complaining') return STATUS_STEPS.indexOf('cooking')
  if (status === 'rider_lost') return STATUS_STEPS.indexOf('delivering')
  return Math.max(0, STATUS_STEPS.indexOf(status))
})

// 判断气泡类型
function isBossQuote(quote: string) {
  return quote.startsWith('【老板') || quote.startsWith('【厨房')
}
function isRiderQuote(quote: string) {
  return quote.startsWith('【骑手')
}
function stripPrefix(quote: string) {
  return quote.replace(/^【.*?】/, '').trim()
}

const isCompleted = computed(() => order.value?.status === 'completed')

// 是否在配送中（显示地图）
const showMap = computed(() => {
  const s = order.value?.status
  return s === 'delivering' || s === 'rider_lost' || s === 'completed'
})

// ============ 彩蛋卡片 ============
const showEasterEgg = ref(false)
const easterEggText = ref('')

watch(isCompleted, (v) => {
  if (v) {
    setTimeout(() => {
      const eggs = quotesData.easter_eggs
      const template = eggs[Math.floor(Math.random() * eggs.length)]
      const o = order.value!
      easterEggText.value = template
        .replace(/\{shopName\}/g, o.shopName)
        .replace(/\{riderName\}/g, getRiderName(o.riderId))
        .replace(/\{orderNum\}/g, String(Math.floor(Math.random() * 20) + 3))
        .replace(/\{eventCount\}/g, String(o.timeline.length))
        .replace(/\{dishName\}/g, o.items[0]?.name || '美食')
      showEasterEgg.value = true
    }, 600)
  }
})

// ============ 评价弹窗 ============
const showReviewModal = ref(false)

const reviewCtx = computed<ReviewContext>(() => {
  const o = order.value
  if (!o) return {
    shopName: '', dishName: '', riderName: '', riderAvatar: '',
    bossPersonality: 'angry', totalPrice: 0, deliveryMinutes: 15,
  }
  const createdMs = o.createdAt
  const completedEvent = o.timeline.find(t => t.action === '已送达')
  const deliveryMin = completedEvent
    ? Math.round((Date.now() - createdMs) / 60000)
    : 15
  return {
    shopName: o.shopName,
    dishName: o.items[0]?.name || '美食',
    riderName: getRiderName(o.riderId),
    riderAvatar: getRiderAvatar(o.riderId),
    bossPersonality: o.bossPersonality,
    totalPrice: o.totalPrice,
    deliveryMinutes: deliveryMin,
  }
})

function handleReviewSubmit(payload: { rating: number; tags: string[]; text: string; bossReply: string }) {
  orderStore.addReview(orderId.value, {
    rating: payload.rating,
    tags: payload.tags,
    text: payload.text,
    bossReply: payload.bossReply,
    createdAt: new Date().toLocaleDateString('zh-CN'),
  })
  showReviewModal.value = false
}
</script>

<template>
  <div v-if="order" class="order-page">
    <van-nav-bar
      :title="`订单 ${order.id}`"
      left-arrow
      @click-left="router.push('/')"
    />

    <div class="order-body">

      <!-- 订单状态卡片 -->
      <div class="status-card">
        <div class="status-top">
          <NpcStatus :status="order.status" />
          <span class="order-time">{{ new Date(order.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</span>
        </div>
        <div class="order-shop">🏪 {{ order.shopName }}</div>
        <div class="order-address">📍 {{ order.address }}</div>
      </div>

      <!-- 进度条 -->
      <div class="progress-card">
        <van-steps :active="currentStep" active-color="#ff6b35">
          <van-step>等待接单</van-step>
          <van-step>已接单</van-step>
          <van-step>出餐中</van-step>
          <van-step>配送中</van-step>
          <van-step>已送达</van-step>
        </van-steps>
      </div>

      <!-- 骑手地图（配送中才显示）-->
      <div v-if="showMap">
        <div class="section-title">🗺️ 骑手实时地图</div>
        <RiderMap
          :rider-avatar="getRiderAvatar(order.riderId)"
          :rider-name="getRiderName(order.riderId)"
          :status="order.status"
        />
      </div>

      <!-- NPC 对话流 -->
      <div class="section-title">📺 NPC 直播间</div>
      <div class="timeline" ref="timelineRef">
        <div
          v-for="(event, idx) in order.timeline"
          :key="idx"
          class="timeline-item"
        >
          <div class="timeline-meta">
            <span class="timeline-time">{{ event.time }}</span>
            <span class="timeline-action">{{ event.action }}</span>
          </div>

          <BossBubble
            v-if="event.npcQuote && isBossQuote(event.npcQuote)"
            :personality="order.bossPersonality"
            :shop-name="order.shopName"
            :quote="stripPrefix(event.npcQuote)"
          />

          <RiderBubble
            v-else-if="event.npcQuote && isRiderQuote(event.npcQuote)"
            :rider-id="order.riderId"
            :rider-name="getRiderName(order.riderId) || '神秘骑手'"
            :rider-avatar="getRiderAvatar(order.riderId)"
            :quote="stripPrefix(event.npcQuote)"
          />

          <div v-else-if="event.npcQuote" class="system-quote">
            💬 {{ stripPrefix(event.npcQuote) }}
          </div>
        </div>

        <div v-if="!isCompleted" class="loading-hint">
          <van-loading size="16" color="#ff6b35" />
          <span>NPC 正在剧情中，请等待下一幕...</span>
        </div>
      </div>

      <!-- 彩蛋卡片（送达后） -->
      <van-popup
        v-model:show="showEasterEgg"
        round
        position="center"
        :style="{ width: '80%' }"
      >
        <div class="easter-egg-card">
          <div class="egg-emoji">🎉</div>
          <div class="egg-title">外卖到达！</div>
          <div class="egg-text">{{ easterEggText }}</div>
          <van-button type="primary" round size="small" class="egg-btn" @click="showEasterEgg = false">
            收到，开吃！
          </van-button>
        </div>
      </van-popup>

      <!-- 送达后：订单明细 -->
      <div v-if="isCompleted" class="order-detail-card">
        <div class="section-title">🧾 订单明细</div>
        <van-cell-group inset>
          <van-cell
            v-for="item in order.items"
            :key="item.id"
            :title="item.name"
            :value="`¥${(item.price * item.quantity).toFixed(2)}`"
          >
            <template #label>
              <span style="font-size:11px;color:#aaa">x{{ item.quantity }}</span>
            </template>
          </van-cell>
          <van-cell title="配送费" :value="`¥${(order.totalPrice - order.items.reduce((s,i)=>s+i.price*i.quantity,0)).toFixed(2)}`" />
          <van-cell>
            <template #title><span class="total-label">合计</span></template>
            <template #value><span class="total-price">¥{{ order.totalPrice.toFixed(2) }}</span></template>
          </van-cell>
        </van-cell-group>

        <div v-if="order.remark" class="remark-block">
          <span class="remark-tag">备注</span>{{ order.remark }}
        </div>
      </div>

      <!-- 已评价展示 -->
      <div v-if="isCompleted && order.review">
        <div class="section-title">🎭 我的戏精评价</div>
        <ReviewCard
          :review="order.review"
          :shop-name="order.shopName"
          :boss-personality="order.bossPersonality"
        />
      </div>

      <!-- 去评价按钮 -->
      <div v-if="isCompleted && !order.review" class="action-bar">
        <van-button type="primary" block round class="review-btn" @click="showReviewModal = true">
          🎭 给这出戏打个分
        </van-button>
      </div>

    </div>
  </div>

  <!-- 找不到订单 -->
  <div v-else class="not-found">
    <van-empty description="订单不存在，可能是宇宙吃掉了" />
    <van-button type="primary" @click="router.push('/')">回首页</van-button>
  </div>

  <!-- 评价弹窗 -->
  <ReviewModal
    :show="showReviewModal"
    :ctx="reviewCtx"
    @close="showReviewModal = false"
    @submit="handleReviewSubmit"
  />
</template>

<style lang="scss" scoped>
.order-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.order-body {
  padding-bottom: 80px;
}

.status-card {
  background: linear-gradient(135deg, #ff6b35, #ff9a5c);
  color: #fff;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.order-time { font-size: 12px; opacity: 0.8; }
.order-shop { font-size: 15px; font-weight: 700; }
.order-address { font-size: 12px; opacity: 0.85; }

.progress-card {
  background: #fff;
  padding: 16px 8px;
  margin-bottom: 2px;
}

.section-title {
  padding: 12px 16px 6px;
  font-size: 13px;
  font-weight: 700;
  color: #666;
  background: #f5f5f5;
}

.timeline {
  background: #fff;
  padding: 12px 16px;
  max-height: 420px;
  overflow-y: auto;
}

.timeline-item {
  margin-bottom: 12px;
}

.timeline-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.timeline-time { font-size: 11px; color: #bbb; flex-shrink: 0; }
.timeline-action { font-size: 12px; color: #888; font-weight: 600; }

.system-quote {
  font-size: 12px;
  color: #666;
  background: #f9f9f9;
  padding: 8px 12px;
  border-radius: 6px;
  line-height: 1.5;
}

.loading-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #aaa;
  padding: 8px 0;
}

// 彩蛋卡片
.easter-egg-card {
  padding: 28px 20px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.egg-emoji { font-size: 44px; }

.egg-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.egg-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.egg-btn {
  background: #ff6b35 !important;
  border-color: #ff6b35 !important;
  margin-top: 8px;
  padding: 0 28px;
  font-weight: 700;
}

.order-detail-card {
  margin-top: 8px;
}

.total-label { font-size: 15px; font-weight: 700; }
.total-price { font-size: 16px; font-weight: 700; color: #ff6b35; }

.remark-block {
  padding: 8px 16px 12px;
  font-size: 12px;
  color: #888;
}

.remark-tag {
  display: inline-block;
  background: #f5f5f5;
  color: #999;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  margin-right: 6px;
}

.action-bar {
  padding: 16px;
}

.review-btn {
  background: #ff6b35 !important;
  border-color: #ff6b35 !important;
  font-weight: 700;
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
