<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildOrderInput, type OrderForm } from '../core/orderInput'
import { runDrama, type RunResult } from '../engine/dramaEngine'
import { loadSeedBranches, type Branch } from '../config/loader'
import { memory } from '../store/memoryStore'
import { runForbiddenCheck, type TabooList } from '../core/forbiddenCheck'
import { getShop, getRider, pickRider } from '../data/shops'
import { getDish } from '../data/dishes'
import { getItems, dishCount, cartTotal, clearShop } from '../store/cart'
import { getAchievement } from '../data/achievements'
import seedRaw from '../../docs/specs/DRAMA-SEED-v1-2026-07-24.json'
import tabooRaw from '../../tests/taboo-list.json'
import DramaTimeline from '../components/DramaTimeline.vue'
import RiderCard from '../components/RiderCard.vue'
import PersonaBadge from '../components/PersonaBadge.vue'

const branches = loadSeedBranches(seedRaw as unknown)
const taboo = tabooRaw as unknown as TabooList
const route = useRoute()
const router = useRouter()

const shopId = (route.query.shop as string) || 's01'
const shop = getShop(shopId)
const assignedRiderId = pickRider()
const rider = getRider(assignedRiderId)

// 从购物车推导 orderInput（不再手填参数）
const cartItems = computed(() => getItems(shopId))
const dishCountVal = computed(() => dishCount(shopId))
const orderTotalVal = computed(() => cartTotal(shopId))
const avgDishPriceVal = computed(() =>
  dishCountVal.value > 0 ? Math.round(orderTotalVal.value / dishCountVal.value) : 0
)
const selectedDishes = computed(() =>
  Object.entries(cartItems.value).map(([id, q]) => ({ dish: getDish(shopId, id), q }))
)

const remark = ref('')
const address = ref('')
const result = ref<RunResult | null>(null)
const gate = ref<{ pass: boolean; redLightCount: number }>({ pass: true, redLightCount: 0 })

const branchMeta = computed<Branch | undefined>(() =>
  branches.find((b) => b.id === result.value?.selectedBranchId)
)
const shopVisitCount = computed(() =>
  result.value ? memory.getShopMemory(shopId ?? 's01').visitCount : 0
)
const orderAch = computed(() => branchMeta.value?.achievements ?? [])

function submit() {
  if (dishCountVal.value === 0) return
  const oi = buildOrderInput({
    shopId,
    riderId: assignedRiderId,
    orderTotal: orderTotalVal.value,
    avgDishPrice: avgDishPriceVal.value,
    dishCount: dishCountVal.value,
    deliveryFee: shop?.deliveryFee ?? 3,
    remark: remark.value,
    address: address.value,
  } as OrderForm)
  const sid = oi.shopId ?? 's01'
  const hist = memory.getHistoryParams(sid)
  hist.shopVisitCount = (hist.shopVisitCount ?? 0) + 1 // 含本次，驱动同店递进分支(第3/5单)
  const mem = memory.getShopMemory(sid)
  const r = runDrama(branches, oi, { random: Math.random, history: hist, flags: mem.flags })
  result.value = r

  const fg = runForbiddenCheck(r.events.map((e) => e.text), taboo)
  gate.value = { pass: fg.pass, redLightCount: fg.redLightCount }

  if (r.selectedBranchId) {
    memory.recordOrder(sid, { flags: r.newFlags, tags: r.finalState.tags })
    memory.unlockAchievements(orderAch.value)
    memory.recordOrderHistory({
      ts: Date.now(),
      shopId: sid,
      shopName: getShop(sid)?.name ?? sid,
      branchId: r.selectedBranchId,
      branchName: branchMeta.value?.name,
      bossMood: r.finalState.bossMood,
      total: oi.orderTotal,
      achievements: orderAch.value,
    })
    clearShop(sid) // 结算后清空该车
  }
}
function reset() {
  result.value = null
  remark.value = ''
  address.value = ''
}
function back() {
  router.push(`/shop/${shopId}`)
}
</script>

<template>
  <!-- 表单态 -->
  <div v-if="!result">
    <div class="mt-nav">
      <div class="mt-nav__top">
        <div class="mt-nav__back" @click="back">‹</div>
        <div class="mt-nav__title">确认订单 · 看老板演戏</div>
      </div>
    </div>

    <div v-if="dishCountVal === 0" class="empty-cart">
      🛒 购物车是空的，先去点几道菜
      <button class="submit-btn" @click="back">去菜单</button>
    </div>

    <div v-else class="form">
      <div class="shop-line">
        {{ shop?.emoji }} {{ shop?.name }}
        <PersonaBadge v-if="shop" :personality="shop.personality" />
      </div>

      <div class="cart-summary">
        <div class="cs-row" v-for="s in selectedDishes" :key="s.dish?.id">
          <span class="cs-emoji">{{ s.dish?.emoji }}</span>
          <span class="cs-name">{{ s.dish?.name }}</span>
          <span class="cs-q">×{{ s.q }}</span>
          <span class="cs-price">¥{{ (s.dish?.price ?? 0) * s.q }}</span>
        </div>
        <div class="cs-total">
          <span>共 {{ dishCountVal }} 件</span>
          <span class="big">¥{{ orderTotalVal }}</span>
        </div>
      </div>

      <label>备注<input v-model="remark" placeholder="私房菜 / 拉黑 / 多放辣 / 别骂了" /></label>
      <label>地址<input v-model="address" placeholder="奇葩地址会触发彩蛋" /></label>
      <button class="submit-btn" @click="submit">下单 🍜（¥{{ orderTotalVal }}）</button>
    </div>
  </div>

  <!-- 结果态 = 订单详情 -->
  <div v-else class="order-detail">
    <div class="map">
      <div class="road"></div>
      <div class="from"></div>
      <div class="to"></div>
      <div class="route"></div>
      <div class="rider-dot">🛵</div>
      <div class="topbar">
        <span class="back" @click="reset">‹</span>
        <span class="ttl">订单详情</span>
        <span class="ic">📞</span>
      </div>
    </div>

    <div class="eta-bar">
      <div class="big">本店第 <b>{{ shopVisitCount }}</b> 单 · 老板心情 <b>{{ result.finalState.bossMood }}</b></div>
      <div class="bubble" v-if="rider">
        <div class="av">⚡</div>
        <div class="t">
          <b>{{ rider.name }}</b>：这单我骑出了感情
          <span class="sig">— {{ rider.name }} / {{ rider.sub }}</span>
        </div>
      </div>
    </div>

    <RiderCard v-if="rider" :rider="rider" />

    <div style="padding: 10px 14px 0; font-size: 13px; color: var(--mt-text-2)">
      命中：<b style="color: var(--mt-text)">{{ result.selectedBranchId }}</b>
      <span v-if="branchMeta?.name">（{{ branchMeta.name }}）</span>
    </div>

    <DramaTimeline :events="result.events" />

    <div class="story-watermark">
      <span class="badge">🎭 锡哥精选段子</span>
      <span>本单剧本由锡哥手编</span>
    </div>

    <div class="page-pad" style="padding-top: 0" v-if="orderAch.length">
      <div style="font-size: 13px; font-weight: 700; margin-bottom: 6px">🏆 本单解锁成就</div>
      <div v-for="id in orderAch" :key="id" class="muted">· {{ (getAchievement(id)?.name) || id }}</div>
    </div>

    <div class="gate" :class="gate.pass ? 'ok' : 'fail'">
      <template v-if="gate.pass">✅ 红线门控通过（red_light_count = 0）</template>
      <template v-else>⛔ 红线命中 {{ gate.redLightCount }} 处，已拦截</template>
    </div>

    <div class="page-pad">
      <button class="submit-btn" @click="reset">再来一单 🔁</button>
      <div class="muted" style="text-align: center; margin-top: 12px">
        <a @click="back" style="color: var(--mt-text-2)">‹ 回菜单</a>
      </div>
    </div>
  </div>
</template>
