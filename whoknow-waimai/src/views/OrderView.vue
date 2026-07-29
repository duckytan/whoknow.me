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

// 从购物车推导展示
const cartItems = computed(() => getItems(shopId))
const dishCountVal = computed(() => dishCount(shopId))
const orderTotalVal = computed(() => cartTotal(shopId))
const selectedDishes = computed(() =>
  Object.entries(cartItems.value).map(([id, q]) => ({ dish: getDish(shopId, id), q }))
)

// ---- 纯点击选择器（地址/备注/餐具/发票） ----
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
const utensilOptions = ['无需餐具', '1份餐具', '2份餐具', '3份餐具']

// 选择状态
const addressTag = ref<AddressTag | ''>('')
const remarkTag = ref<RemarkTag | ''>('')
const selectedUtensil = ref('无需餐具')
const payMethod = ref('极速支付')

// 顶部 Tab
const orderMode = ref<'delivery' | 'pickup'>('delivery')

// 时间选择
const timeSlot = ref('auto')

// ---- 底部抽屉选择器 ----
interface SheetOption { id: string; label: string; sub?: string }
interface SheetState { title: string; options: SheetOption[]; selected: string; onPick: (id: string) => void }
const sheet = ref<SheetState | null>(null)

function openSheet(title: string, options: SheetOption[], selected: string, onPick: (id: string) => void) {
  sheet.value = { title, options, selected, onPick }
}
function closeSheet() { sheet.value = null }

// 地址选择
function pickAddress(id: string) {
  addressTag.value = id as AddressTag
  closeSheet()
}
function openAddressSheet() {
  openSheet('选择地址',
    addressChips.map(a => ({ id: a.id, label: `${a.emoji} ${a.label}`, sub: fmtOffset(ADDRESS_OFFSETS[a.id]).text })),
    addressTag.value || '', pickAddress)
}

// 备注选择
function pickRemark(id: string) {
  remarkTag.value = id as RemarkTag
  closeSheet()
}
function openRemarkSheet() {
  openSheet('给老板捎句话',
    remarkChips.map(r => ({ id: r.id, label: `${r.emoji} ${r.label}`, sub: fmtOffset(REMARK_OFFSETS[r.id]).text })),
    remarkTag.value || '', pickRemark)
}

// 餐具选择
function pickUtensil(id: string) {
  selectedUtensil.value = id
  closeSheet()
}
function openUtensilSheet() {
  openSheet('餐具数量',
    utensilOptions.map(u => ({ id: u, label: u })),
    selectedUtensil.value, pickUtensil)
}

// 发票（戏精提示）
function onInvoiceClick() {
  alert('本单戏票不支持报销 🎭')
}

// 价格明细计算
const basePrice = computed(() => orderTotalVal.value)
const deliveryFeeVal = computed(() => shop?.deliveryFee ?? 3)
const packingFee = computed(() => Math.max(2, dishCountVal.value)) // 每件1元，最低2元
const mtCoupon = computed(() => Math.min(10, Math.round(basePrice.value * 0.12)))
const shopCoupon = computed(() => shop?.promo.includes('满') ? 3 : 0)
const itemDiscount = computed(() => Math.round(basePrice.value * 0.05))
const totalDiscount = computed(() => mtCoupon.value + shopCoupon.value + itemDiscount.value)
const finalPay = computed(() => basePrice.value + deliveryFeeVal.value + packingFee.value - totalDiscount.value)

function fmtOffset(n: number): { text: string; cls: string } {
  if (n === 0) return { text: '0', cls: 'zero' }
  return n > 0 ? { text: `+${n}`, cls: 'up' } : { text: `${n}`, cls: 'down' }
}

// 提交
const result = ref<SliceResult | null>(null)
provideDramaProgress(() => result.value?.events ?? [])
const gate = ref<{ pass: boolean; redLightCount: number }>({ pass: true, redLightCount: 0 })
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
  const fg = runForbiddenCheck(r.events.map((e) => e.text), taboo)
  gate.value = { pass: fg.pass, redLightCount: fg.redLightCount }
  clearShop(shopId)
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
  <!-- ====== 表单态 ====== -->
  <div v-if="!result" class="order-form-wrap">
    <!-- 顶部导航 -->
    <div class="mt-nav">
      <div class="mt-nav__top">
        <div class="mt-nav__back" @click="back">‹</div>
        <div class="mt-nav__title">确认订单</div>
      </div>
    </div>

    <!-- 顶部 Tab：外卖配送 / 到店自取 -->
    <div class="pay-top">
      <button class="pt-item on" :class="{ on: orderMode === 'delivery' }" @click="orderMode = 'delivery'">外卖配送</button>
      <button class="pt-item" :class="{ on: orderMode === 'pickup' }" @click="orderMode = 'pickup'">到店自取<span class="pt-bonus" v-if="orderMode !== 'pickup'">[新客减2]</span></button>
    </div>

    <div v-if="dishCountVal === 0" class="empty-cart">
      🛒 购物车是空的，先去点几道菜
      <button class="submit-btn" @click="back">去菜单</button>
    </div>

    <div v-else style="padding-bottom: 80px;">
      <!-- 地址 Cell -->
      <div class="cell" @click="openAddressSheet">
        <div class="cell-main">
          <div class="cell-label">{{ addressTag ? addressChips.find(a => a.id === addressTag)?.label : '选择地址' }}</div>
          <div class="cell-sub" v-if="addressTag">{{ addressTag === 'home' ? '锡哥精选段子路 88 号' : addressTag === 'company' ? '胡闹大厦 A 座 18 层' : addressTag === 'icu' ? '市第一人民医院 3 号楼' : '公厕旁小树林' }} · 135****3389</div>
        </div>
        <span class="cell-val"><span class="cell-arrow">›</span></span>
      </div>

      <!-- 时间选择 -->
      <div class="time-cells">
        <div class="time-cell on" @click="timeSlot = timeSlot === 'auto' ? 'auto' : 'auto'">
          <div class="tc-top">商家自配 {{ String(new Date().getHours()).padStart(2,'0') }}:{{ String(Math.floor(Math.random()*30)+18).padStart(2,'0') }}~{{ String(Math.floor(Math.random()*15)+30).padStart(2,'0') }}</div>
          <div class="tc-time">约 {{ shop?.deliveryTime || '25分钟' }}</div>
        </div>
        <div class="time-cell" @click="timeSlot = timeSlot === 'reserve' ? 'auto' : 'reserve'">
          <div class="tc-top">预约配送</div>
          <div class="tc-pick">选择时间 ›</div>
        </div>
      </div>

      <!-- 商品清单 -->
      <div style="background:#fff;margin-top:10px;padding:12px 14px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:var(--mt-text);margin-bottom:8px">
          {{ shop?.emoji }} {{ shop?.name }}
          <PersonaBadge v-if="shop" :personality="shop.personality" />
          <span style="margin-left:auto;font-size:11px;color:var(--mt-text-3);font-weight:400">商家自配</span>
        </div>
        <div class="cs-row" v-for="s in selectedDishes" :key="s.dish?.id" style="padding:8px 0;border-bottom:1px solid var(--mt-line)">
          <span class="cs-emoji" style="font-size:22px;width:48px;height:48px;display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#FFE08A,#FFC93C);border-radius:8px;">{{ s.dish?.emoji }}</span>
          <span class="cs-name" style="flex:1;padding-left:8px">{{ s.dish?.name }}</span>
          <span class="cs-q" style="color:var(--mt-text-3)">×{{ s.q }}</span>
          <span class="cs-price" style="font-weight:600;color:var(--mt-text)">¥{{ (s.dish?.price ?? 0) * s.q }}</span>
        </div>
      </div>

      <!-- 价格明细 -->
      <div class="price-section">
        <div class="price-rows">
          <div class="price-row"><span class="pr-l">商品原价</span><span class="pr-v strike">¥{{ basePrice.toFixed(1) }}</span></div>
          <div class="price-row"><span class="pr-l">配送费</span><span class="pr-v">¥{{ deliveryFeeVal }}<template v-if="deliveryFeeVal === 0"> 免配送</template></span></div>
          <div class="price-row"><span class="pr-l">包装费</span><span class="pr-v">¥{{ packingFee }}</span></div>
          <div class="price-row"><span class="pr-l">美团红包</span><span class="pr-v red">-¥{{ mtCoupon.toFixed(1) }}</span></div>
          <div class="price-row" v-if="shopCoupon > 0"><span class="pr-l">商家代金券</span><span class="pr-v red">-¥{{ shopCoupon.toFixed(1) }}</span></div>
          <div class="price-row"><span class="pr-l">商品优惠</span><span class="pr-v red">-¥{{ itemDiscount.toFixed(1) }}</span></div>
          <div class="price-row pr-save">已优惠 ¥{{ totalDiscount.toFixed(1) }}</div>
          <div class="price-row pr-total"><span>合计</span><span style="font-size:20px;color:var(--mt-price)">¥{{ finalPay.toFixed(1) }}</span></div>
        </div>
      </div>

      <!-- 备注 Cell -->
      <div class="cell" @click="openRemarkSheet">
        <div class="cell-main">
          <div class="cell-label">备注</div>
        </div>
        <span class="cell-val">{{ remarkTag ? remarkChips.find(r => r.id === remarkTag)?.label : '请选择' }} <span class="cell-arrow">›</span></span>
      </div>

      <!-- 餐具 Cell -->
      <div class="cell" @click="openUtensilSheet">
        <div class="cell-main">
          <div class="cell-label">餐具</div>
        </div>
        <span class="cell-val">{{ selectedUtensil }} <span class="cell-arrow">›</span></span>
      </div>

      <!-- 支付方式列表 -->
      <div class="pay-list">
        <div class="pay-item" :class="{ on: payMethod === '极速支付' }" @click="payMethod = '极速支付'">
          <span class="pi-check"></span>
          <span class="pi-name">极速支付 ✓</span>
        </div>
        <div class="pay-item" :class="{ on: payMethod === '美团支付' }" @click="payMethod = '美团支付'">
          <span class="pi-check"></span>
          <span class="pi-name">美团支付</span>
        </div>
        <div class="pay-item" :class="{ on: payMethod === '微信支付' }" @click="payMethod = '微信支付'">
          <span class="pi-check"></span>
          <span class="pi-name">微信支付</span>
        </div>
        <div class="pay-item" :class="{ on: payMethod === '支付宝' }" @click="payMethod = '支付宝'">
          <span class="pi-check"></span>
          <span class="pi-name">支付宝</span>
        </div>
        <div class="pay-item" :class="{ on: payMethod === '找人代付' }" @click="payMethod = '找人代付'">
          <span class="pi-check"></span>
          <span class="pi-name">找人代付</span>
        </div>
      </div>

      <!-- 发票 Cell -->
      <div class="cell" @click="onInvoiceClick">
        <div class="cell-main">
          <div class="cell-label">开发票</div>
        </div>
        <span class="cell-val">未选择 <span class="cell-arrow">›</span></span>
      </div>

      <!-- 可享权益 -->
      <div class="rights">
        <div class="ri on"><span class="ri-ico">✓</span> 买贵必赔</div>
        <div class="ri"><span class="ri-ico">🔒</span> 号码保护</div>
        <div class="ri"><span class="ri-ico">😋</span> 放心吃</div>
      </div>
    </div>

    <!-- 粘性结算栏（z-index:11 覆盖 TabBar） -->
    <div class="pay-bar" v-if="dishCountVal > 0">
      <div class="pb-left">
        <span class="pb-price">¥{{ finalPay.toFixed(1) }}</span>
        <span class="pb-save">共减<b>¥{{ totalDiscount.toFixed(1) }}</b></span>
      </div>
      <button class="pb-btn" @click="submit">极速支付</button>
    </div>

    <!-- 底部抽屉选择器 -->
    <Teleport to="body">
      <div v-if="sheet" class="sheet-overlay" @click.self="closeSheet">
        <div class="sheet-panel">
          <div class="sheet-handle"></div>
          <div class="sheet-title">{{ sheet.title }}</div>
          <div class="sheet-options">
            <div
              v-for="opt in sheet.options"
              :key="opt.id"
              class="sheet-opt"
              :class="{ on: sheet.selected === opt.id }"
              @click="sheet.onPick(opt.id)"
            >
              {{ opt.label }}
              <span v-if="opt.sub" style="display:block;font-size:11px;color:var(--mt-text-3);margin-top:2px;font-weight:400">{{ opt.sub }}</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>

  <!-- ====== 结果态（不变） ====== -->
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
.order-form-wrap { background: var(--mt-bg); min-height: calc(100vh - 100px); }

/* 复用 chip 样式 */
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
  box-shadow: 0 2px 8px rgba(255, 193, 0, 35);
}
.chip.on .cs.up,
.chip.on .cs.down,
.chip.on .cs.zero { color: #1a1a1a; }

/* 水印 */
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
