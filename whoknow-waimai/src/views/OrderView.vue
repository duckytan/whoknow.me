<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  sliceDrama,
  type SliceResult,
  type AddressTag,
  type RemarkTag,
  ADDRESS_OFFSETS,
  REMARK_OFFSETS,
} from '../engine/sliceDrama'
import { runForbiddenCheck, type TabooList } from '../core/forbiddenCheck'
import { getShop, getRider, pickRider } from '../data/shops'
import { getDish } from '../data/dishes'
import { getItems, dishCount, cartTotal, clearShop } from '../store/cart'
import tabooRaw from '../../tests/taboo-list.json'
import MapTrack from '../components/MapTrack.vue'
import DramaChat from '../components/DramaChat.vue'
import PushNotifier from '../components/PushNotifier.vue'
import { provideDramaProgress } from '../composables/useDramaProgress'
import RiderCard from '../components/RiderCard.vue'
import PersonaBadge from '../components/PersonaBadge.vue'

const taboo = tabooRaw as unknown as TabooList
const route = useRoute()
const router = useRouter()

const shopId = (route.query.shop as string) || 's01'
const shop = getShop(shopId)
const assignedRiderId = pickRider()
const rider = getRider(assignedRiderId)

// 从购物车推导展示（菜品在切片为装饰性，不进因果）
const cartItems = computed(() => getItems(shopId))
const dishCountVal = computed(() => dishCount(shopId))
const orderTotalVal = computed(() => cartTotal(shopId))
const selectedDishes = computed(() =>
  Object.entries(cartItems.value).map(([id, q]) => ({ dish: getDish(shopId, id), q }))
)

// 地址 chip（严格 4 个）+ 备注 chip（6 个）；纯点击、零自由文本（宇宙级原则）
const addressChips: { id: AddressTag; label: string; emoji: string }[] = [
  { id: 'toilet', label: '公厕', emoji: '🚽' },
  { id: 'icu', label: 'ICU 病房', emoji: '🏥' },
  { id: 'home', label: '家庭', emoji: '🏠' },
  { id: 'company', label: '公司', emoji: '🏢' },
]
const remarkChips: { id: RemarkTag; label: string; emoji: string }[] = [
  { id: 'more_spicy', label: '多放辣', emoji: '🌶️' },
  { id: 'less_spicy', label: '少放辣', emoji: '🥱' },
  { id: 'no_cilantro', label: '不要香菜', emoji: '🌿' },
  { id: 'no_scold', label: '别骂了', emoji: '🤐' },
  { id: 'perform', label: '表演才艺', emoji: '🎤' },
  { id: 'boss_thx', label: '老板辛苦了', emoji: '🙏' },
]

function fmtOffset(n: number): { text: string; cls: string } {
  if (n === 0) return { text: '0', cls: 'zero' }
  return n > 0 ? { text: `+${n}`, cls: 'up' } : { text: `${n}`, cls: 'down' }
}

const addressTag = ref<AddressTag | ''>('')
const remarkTag = ref<RemarkTag | ''>('')
const result = ref<SliceResult | null>(null)
// 统一 reveal 时钟：结果态 events 共享给 MapTrack / DramaChat / PushNotifier（唯一事实时钟）
provideDramaProgress(() => result.value?.events ?? [])
const gate = ref<{ pass: boolean; redLightCount: number }>({ pass: true, redLightCount: 0 })

// 红线门控：prod 隐藏，仅 dev 显示（用户拍板·决策3）
const isDev = import.meta.env.DEV

function submit() {
  if (dishCountVal.value === 0) return
  if (!addressTag.value || !remarkTag.value) return
  const r = sliceDrama({
    addressTag: addressTag.value,
    remarkTag: remarkTag.value,
    dishCount: dishCountVal.value,
    totalPrice: orderTotalVal.value,
  })
  result.value = r

  // 红线门控（可保留调用，非切片重点）
  const fg = runForbiddenCheck(r.events.map((e) => e.text), taboo)
  gate.value = { pass: fg.pass, redLightCount: fg.redLightCount }

  clearShop(shopId) // 结算后清空该车
}
function reset() {
  result.value = null
  addressTag.value = ''
  remarkTag.value = ''
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

      <!-- 纯点击 chip：地址 4 + 备注 6，零自由文本 -->
      <div class="chip-block">
        <div class="chip-label">送到哪 <span class="hint">（点一下，别打字）</span></div>
        <div class="chips">
          <button
            v-for="a in addressChips"
            :key="a.id"
            type="button"
            class="chip"
            :class="{ on: addressTag === a.id }"
            @click="addressTag = a.id"
          >
            <span class="ce">{{ a.emoji }}</span>
            <span class="cl">{{ a.label }}</span>
            <span class="cs" :class="fmtOffset(ADDRESS_OFFSETS[a.id]).cls">{{ fmtOffset(ADDRESS_OFFSETS[a.id]).text }}</span>
          </button>
        </div>
      </div>

      <div class="chip-block">
        <div class="chip-label">给老板捎句话</div>
        <div class="chips">
          <button
            v-for="r in remarkChips"
            :key="r.id"
            type="button"
            class="chip"
            :class="{ on: remarkTag === r.id }"
            @click="remarkTag = r.id"
          >
            <span class="ce">{{ r.emoji }}</span>
            <span class="cl">{{ r.label }}</span>
            <span class="cs" :class="fmtOffset(REMARK_OFFSETS[r.id]).cls">{{ fmtOffset(REMARK_OFFSETS[r.id]).text }}</span>
          </button>
        </div>
      </div>

      <button class="submit-btn" @click="submit">确认下单，让 NPC 演戏 · ¥{{ orderTotalVal }}</button>
    </div>
  </div>

  <!-- 结果态 = 订单详情 -->
  <div v-else class="order-detail">
    <div class="map">
      <MapTrack :address-tag="addressTag" />
      <div class="topbar" style="z-index: 5">
        <span class="back" @click="reset">‹</span>
        <span class="ttl">订单详情</span>
        <span class="ic">📞</span>
      </div>
    </div>

    <RiderCard v-if="rider" :rider="rider" />

    <DramaChat
      :events="result.events"
      :address-chip="addressChips.find((c) => c.id === addressTag) || null"
      :remark-chip="remarkChips.find((c) => c.id === remarkTag) || null"
    />

    <PushNotifier :address-tag="addressTag" :shop-name="shop?.name" />

    <div class="page-pad">
      <button class="submit-btn" @click="reset">再来一单 🔁</button>

      <div class="story-watermark">
        <span class="badge">🎭 锡哥精选段子</span>
        <span>本单剧本由锡哥手编 · 仅供娱乐</span>
      </div>

      <div class="gate" v-if="isDev" :class="gate.pass ? 'ok' : 'fail'">
        <template v-if="gate.pass">✅ 红线门控通过（red_light_count = 0）</template>
        <template v-else>⛔ 红线命中 {{ gate.redLightCount }} 处，已拦截</template>
      </div>

      <div class="muted" style="text-align: center; margin-top: 12px">
        <a @click="back" style="color: var(--mt-text-2)">‹ 回菜单</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chip-block { margin: 14px 0 4px; }
.chip-label { font-size: 14px; font-weight: 700; color: var(--mt-text); margin-bottom: 8px; }
.chip-label .hint { font-size: 11px; font-weight: 400; color: var(--mt-text-3); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 6px 12px;
  background: #fff;
  border: 1px solid var(--mt-line);
  border-radius: 999px;
  font-size: 13px;
  color: var(--mt-text);
  font-family: inherit;
  transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
}
.chip:active { transform: scale(0.96); }
.chip:focus-visible { outline: 3px solid var(--brand-orange); outline-offset: 2px; }
.chip .ce { font-size: 16px; }
.chip .cs { font-size: 11px; font-weight: 700; }
.chip .cs.up { color: var(--role-gentle); }
.chip .cs.down { color: var(--mt-price); }
.chip .cs.zero { color: var(--mt-text-3); }
.chip.on {
  background: var(--mt-yellow);
  border-color: var(--mt-yellow-deep);
  color: #1a1a1a;
  box-shadow: 0 2px 8px rgba(255, 193, 0, 0.35);
}
.chip.on .cs.up,
.chip.on .cs.down,
.chip.on .cs.zero { color: #1a1a1a; }

/* 水印（锡哥手编）落位环境页脚：fine-print 化（对齐规格 §4.5 / GDD §9.5） */
.story-watermark {
  margin: 14px auto 0;
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: var(--mt-text-3);
  text-align: center;
}
.story-watermark .badge {
  background: transparent;
  color: var(--mt-text-3);
  font-size: 11px;
  padding: 0;
  font-weight: 700;
}
</style>
