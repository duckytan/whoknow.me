<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { memory } from '../store/memoryStore'
import { getShop } from '../data/shops'
import { getMenu } from '../data/dishes'

const router = useRouter()
const history = memory.getOrderHistory()

// Tab 状态
const activeTab = ref('all')

// 按Tab过滤
const filteredHistory = computed(() => {
  if (activeTab.value === 'all') return history
  // 待评价/退款售后：当前无数据，返回空（戏精空态）
  return []
})

// 补充商品信息：若 history 无 items，用 shopId 反查菜单取前2道菜作为缩略图（向后兼容）
function getShopDishes(shopId: string) {
  return getMenu(shopId).slice(0, 3)
}

// 真实件数：有 items 时取 Σqty，否则回退到反查菜单的道数（“共 3 件”）
function itemCount(h: (typeof history)[0]): number {
  if (h.items?.length) return h.items.reduce((a, b) => a + b.qty, 0)
  return getShopDishes(h.shopId).length
}

// Toast 状态
const toastMsg = ref('')

function showToast(msg: string) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 2000)
}

function goReorder(h: typeof history[0]) {
  router.push(`/order?shop=${h.shopId}`)
}
</script>

<template>
  <div>
    <!-- 黄色头部 -->
    <div class="order-head-mt">
      <div style="width:24px"></div>
      <div class="ohm-title">订单</div>
      <div class="ohm-icons">
        <span class="ohm-ico" @click="router.push('/shops')">🔍</span>
        <span class="ohm-ico" @click="router.push('/service')">💬<span class="ohm-dot">88</span></span>
      </div>
    </div>

    <!-- 顶部 Tab pills -->
    <div class="order-tabs">
      <button class="ot-pill white" :class="{ white: true, yellow: false }" :style="{ background: activeTab === 'all' ? '#fff' : 'rgba(255,255,255,0.7)' }" @click="activeTab = 'all'">全部订单</button>
      <button class="ot-pill" :class="{ yellow: activeTab === 'review', white: activeTab !== 'review' }" :style="{ background: activeTab === 'review' ? '#fff' : 'rgba(255,255,255,0.75)' }" @click="activeTab = 'review'">
        待评价<span class="ot-dot" v-if="history.length">1</span>
      </button>
      <button class="ot-pill" :class="{ yellow: activeTab === 'refund', white: activeTab !== 'refund' }" :style="{ background: activeTab === 'refund' ? '#fff' : 'rgba(255,255,255,0.75)' }" @click="activeTab = 'refund'">退款/售后</button>
    </div>

    <!-- 订单列表 -->
    <template v-if="filteredHistory.length">
      <div v-for="(h, i) in filteredHistory" :key="i" class="order-card-rich">
        <!-- 顶部：logo + 店名 + 状态 -->
        <div class="ocr-top">
          <div class="ocr-logo">{{ getShop(h.shopId)?.emoji || '🍜' }}</div>
          <div class="ocr-shop">{{ h.shopName }}</div>
          <span class="ocr-status">已完成</span>
          <span class="ocr-arrow">›</span>
        </div>

        <!-- 促销标签行 -->
        <div class="ocr-promos" v-if="getShop(h.shopId)?.promo">
          <span class="op" v-for="(p, pi) in getShop(h.shopId)!.promo.split('|').slice(0, 4)" :key="pi">{{ p.trim() }}</span>
        </div>

        <!-- 商品缩略图 + 价格 -->
        <div class="ocr-items">
          <template v-if="h.items?.length">
            <div class="ocr-thumb" v-for="it in h.items" :key="it.dishId">{{ it.emoji }}</div>
          </template>
          <template v-else>
            <div class="ocr-thumb" v-for="d in getShopDishes(h.shopId)" :key="d.id">{{ d.emoji }}</div>
          </template>
          <div class="ocr-detail">
            <div class="ocr-names">
              <template v-if="h.items?.length">{{ h.items.map(it => it.name).join(' · ') }}</template>
              <template v-else>{{ getShopDishes(h.shopId).map(d => d.name).join(' · ') }}</template>
            </div>
            <div class="ocr-price-row">
              <span class="ocr-price">¥{{ h.total?.toFixed(2) || '--' }}</span>
              <span class="ocr-count">共 {{ itemCount(h) }} 件</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮行 -->
        <div class="ocr-btns">
          <button class="ob ob-ghost" @click="showToast('用药问问：本店不卖药，但老板会骂人 🤷')">用药问问</button>
          <button class="ob ob-ghost" @click="showToast('评价功能开发中，老板说「你评个屁」😤')">评价</button>
          <button class="ob ob-y" @click="goReorder(h)">再来一单</button>
        </div>
      </div>
    </template>

    <!-- 空态 -->
    <div v-else-if="activeTab === 'all'" class="page-pad muted" style="padding-top:30px">
      还没有订单。去 <router-link to="/" style="color: var(--mt-price)">首页选店</router-link> 下单看老板演戏吧。
    </div>

    <!-- 待评价/退款售后空态（戏精） -->
    <div v-else style="padding:40px 14px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">{{ activeTab === 'review' ? '⭐' : '🔄' }}</div>
      <div style="font-size:15px;font-weight:700;color:var(--mt-text);margin-bottom:6px">
        {{ activeTab === 'review' ? '暂无待评价订单' : '暂无退款/售后记录' }}
      </div>
      <div style="font-size:13px;color:var(--mt-text-3);line-height:1.6">
        {{ activeTab === 'review' ? '老板说：「我的菜这么好吃，你居然没给好评？」😤' : '骑手说：「送得飞快，哪来的退？」🏃‍♂️💨' }}
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toastMsg" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.75);color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;z-index:200;pointer-events:none;">{{ toastMsg }}</div>
  </div>
</template>
