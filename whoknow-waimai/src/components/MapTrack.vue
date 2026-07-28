<script setup lang="ts">
// MapTrack.vue — 真实配送路网地图（拟真外壳）
//
// 设计规格：docs/designs/waimai-realism-shell-spec.md §1 / §5.3
//
// 纯渲染组件：inline SVG 真实路网（地块/街道/公园）+ 商家 pin + 目的地 pin
//   + 骑手点（沿 polyline 插值）。骑手点 p 来自 useDramaProgress.phaseProgress；
//   ETA = ceil(etaTotal*(1-p)) → mm:ss，随 p 整数递减即"跳秒"。
// 不承载任何胡闹台词——地图是纯真实放大器（§1.6）。
//
// 配色只引用 style.css 设计令牌 + §1.3 地图灰渐变，禁新色板。
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useDramaProgressInjected } from '../composables/useDramaProgress'
import { etaForAddress, fmtMMSS } from '../lib/eta'
import type { AddressTag } from '../engine/sliceDrama'

const props = defineProps<{
  addressTag?: AddressTag | ''
}>()

const dp = useDramaProgressInjected()
const { currentPhase, phaseProgress } = dp

const ROUTE_D = 'M 60,150 L 60,105 L 265,105 L 265,55 L 345,55'

const EMOJI: Record<string, string> = {
  toilet: '🚽',
  icu: '🏥',
  home: '🏠',
  company: '🏢',
}
const ADDRESS_EMOJI = computed(() => EMOJI[props.addressTag ?? 'home'] ?? '📍')

const PHASE_LABEL: Record<string, string> = {
  accept: '等待接单',
  cook: '商家备餐中',
  deliver: '骑手配送中',
  complete: '已送达',
}
const phaseLabel = computed(() => PHASE_LABEL[currentPhase.value] ?? '等待接单')

// ETA：真实量级总量 × (1 - p)，ceil 后随 p 整数递减即"跳秒"
const etaTotal = computed(() => etaForAddress(props.addressTag))
const etaRemain = computed(() => Math.ceil(etaTotal.value * (1 - phaseProgress.value)))
const etaText = computed(() => fmtMMSS(etaRemain.value))

// 骑手点沿路径插值（每帧 p*L）
const routeRef = ref<SVGPathElement | null>(null)
const rider = ref({ x: 60, y: 150 })

function updateRider(): void {
  const p = routeRef.value
  if (!p) return
  const L = p.getTotalLength()
  const pt = p.getPointAtLength(phaseProgress.value * L)
  rider.value = { x: pt.x, y: pt.y }
}

watch(phaseProgress, updateRider)
onMounted(() => {
  nextTick(updateRider)
})
</script>

<template>
  <div class="maptrack">
    <svg class="map-svg" viewBox="0 0 414 200" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E8EDF2" />
          <stop offset="100%" stop-color="#DCE4EC" />
        </linearGradient>
        <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#FFD100" />
          <stop offset="100%" stop-color="#FF4B10" />
        </linearGradient>
      </defs>

      <!-- 底色 -->
      <rect x="0" y="0" width="414" height="200" fill="url(#mapBg)" />

      <!-- 地块 + 公园（真实路网质感） -->
      <g class="blocks">
        <rect x="14" y="14" width="34" height="30" rx="6" fill="#F4F7FA" stroke="#E2E8EF" />
        <rect x="92" y="14" width="52" height="28" rx="6" fill="#F4F7FA" stroke="#E2E8EF" />
        <rect x="300" y="14" width="42" height="26" rx="6" fill="#F4F7FA" stroke="#E2E8EF" />
        <rect x="14" y="118" width="34" height="56" rx="6" fill="#F4F7FA" stroke="#E2E8EF" />
        <rect x="92" y="118" width="52" height="56" rx="6" fill="#F4F7FA" stroke="#E2E8EF" />
        <rect x="300" y="118" width="100" height="56" rx="6" fill="#F4F7FA" stroke="#E2E8EF" />
        <!-- 街心公园 -->
        <rect x="150" y="118" width="92" height="56" rx="6" fill="#E3F0E6" stroke="#CFE3D4" />
      </g>

      <!-- 街道（白线 = 道路）：次街 + 主路 -->
      <g class="streets" stroke="#FFFFFF" stroke-linecap="round" fill="none">
        <line x1="0" y1="40" x2="414" y2="40" stroke-width="4" opacity="0.7" />
        <line x1="0" y1="160" x2="414" y2="160" stroke-width="4" opacity="0.7" />
        <line x1="110" y1="0" x2="110" y2="200" stroke-width="4" opacity="0.7" />
        <line x1="200" y1="0" x2="200" y2="200" stroke-width="4" opacity="0.7" />
        <line x1="320" y1="0" x2="320" y2="200" stroke-width="4" opacity="0.7" />
        <line x1="0" y1="55" x2="414" y2="55" stroke-width="7" opacity="0.92" />
        <line x1="0" y1="105" x2="414" y2="105" stroke-width="7" opacity="0.92" />
        <line x1="60" y1="0" x2="60" y2="200" stroke-width="7" opacity="0.92" />
        <line x1="265" y1="0" x2="265" y2="200" stroke-width="7" opacity="0.92" />
      </g>

      <!-- 路线（贴路曼哈顿折线）：casing + 芯 + 虚线心 -->
      <path :d="ROUTE_D" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linejoin="round" stroke-linecap="round" />
      <path ref="routeRef" :d="ROUTE_D" fill="none" stroke="url(#routeGrad)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
      <path :d="ROUTE_D" fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-dasharray="2 5" stroke-linecap="round" opacity="0.9" />

      <!-- 商家 pin -->
      <g class="pin-shop">
        <circle cx="60" cy="150" r="16" fill="rgba(255,209,0,0.25)" />
        <circle class="shop-core" cx="60" cy="150" r="10" stroke="#FFFFFF" stroke-width="3" />
        <text x="60" y="150" text-anchor="middle" dominant-baseline="central" font-size="12">🍳</text>
      </g>

      <!-- 目的地 pin（红 + 地址 emoji） -->
      <g class="pin-dest">
        <circle cx="345" cy="55" r="16" fill="rgba(255,75,16,0.22)" />
        <circle class="dest-core" cx="345" cy="55" r="10" stroke="#FFFFFF" stroke-width="3" />
        <text x="345" y="55" text-anchor="middle" dominant-baseline="central" font-size="12">{{ ADDRESS_EMOJI }}</text>
      </g>

      <!-- 骑手点（沿路径插值） -->
      <g class="rider" :transform="`translate(${rider.x},${rider.y})`">
        <circle class="rider-core" r="14" stroke="#FFFFFF" stroke-width="3" />
        <text text-anchor="middle" dominant-baseline="central" font-size="15" fill="#FFFFFF">🛵</text>
      </g>
    </svg>

    <!-- 真实状态条：ETA 胶囊 + 阶段标签（像美团配送追踪页） -->
    <div class="map-status">
      <div class="eta-pill">🛵 预计 {{ etaText }} 到达</div>
      <div class="phase-label">{{ phaseLabel }}</div>
    </div>
  </div>
</template>

<style scoped>
.maptrack {
  position: absolute;
  inset: 0;
}
.map-svg {
  width: 100%;
  height: 100%;
  display: block;
}
/* 令牌着色（presentation attribute 不支持 var，改用 class） */
.shop-core {
  fill: var(--mt-yellow);
}
.dest-core {
  fill: var(--mt-price);
}
.rider-core {
  fill: var(--role-rider);
}
.map-status {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0));
}
.eta-pill {
  background: #fff;
  color: var(--mt-text);
  font-size: 12px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 999px;
  box-shadow: var(--shadow-card);
}
.phase-label {
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}
</style>
