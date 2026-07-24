<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  riderAvatar: string
  riderName: string
  status: string // 'delivering' | 'rider_lost' | 'completed'
}>()

// 骑手位置 0→1（0=商家，1=顾客）
const progress = ref(0)
let animTimer: ReturnType<typeof setInterval> | null = null

function startAnimation() {
  if (animTimer) clearInterval(animTimer)
  if (props.status === 'completed') {
    progress.value = 1
    return
  }
  // 从当前进度开始，慢慢移动到 0.9
  animTimer = setInterval(() => {
    if (progress.value < 0.9) {
      progress.value = Math.min(0.9, progress.value + 0.003)
    } else {
      clearInterval(animTimer!)
    }
  }, 100)
}

watch(() => props.status, (s) => {
  if (s === 'delivering' || s === 'rider_lost') {
    if (progress.value === 0) progress.value = 0.05
    startAnimation()
  }
  if (s === 'completed') {
    if (animTimer) clearInterval(animTimer)
    // 快速移到终点
    const finish = setInterval(() => {
      progress.value = Math.min(1, progress.value + 0.02)
      if (progress.value >= 1) clearInterval(finish)
    }, 30)
  }
})

onMounted(() => {
  if (props.status === 'delivering' || props.status === 'rider_lost') {
    startAnimation()
  }
  if (props.status === 'completed') {
    progress.value = 1
  }
})

onUnmounted(() => {
  if (animTimer) clearInterval(animTimer)
})

// SVG 路径：从 (30,100) 到 (270,100)，中间几个弯道
const PATH = 'M 30,100 C 80,60 120,140 160,100 C 200,60 240,120 270,100'

// 根据 progress 估算骑手在 SVG 上的坐标（用 cubic bezier 参数化）
function bezierPoint(t: number) {
  // P0(30,100) P1(80,60) P2(120,140) P3(160,100)  第一段 0→0.5
  // P0(160,100) P1(200,60) P2(240,120) P3(270,100) 第二段 0.5→1
  let p: [number, number]
  if (t <= 0.5) {
    const u = t * 2
    const mt = 1 - u
    const x = mt**3*30 + 3*mt**2*u*80 + 3*mt*u**2*120 + u**3*160
    const y = mt**3*100 + 3*mt**2*u*60 + 3*mt*u**2*140 + u**3*100
    p = [x, y]
  } else {
    const u = (t - 0.5) * 2
    const mt = 1 - u
    const x = mt**3*160 + 3*mt**2*u*200 + 3*mt*u**2*240 + u**3*270
    const y = mt**3*100 + 3*mt**2*u*60 + 3*mt*u**2*120 + u**3*100
    p = [x, y]
  }
  return p
}

const riderPos = computed(() => bezierPoint(progress.value))

// 骑手抖动（rider_lost 时）
const isLost = computed(() => props.status === 'rider_lost')
const shake = ref(false)

let shakeTimer: ReturnType<typeof setInterval> | null = null
watch(isLost, (v) => {
  if (v) {
    shakeTimer = setInterval(() => { shake.value = !shake.value }, 400)
  } else {
    if (shakeTimer) clearInterval(shakeTimer)
    shake.value = false
  }
})
onUnmounted(() => { if (shakeTimer) clearInterval(shakeTimer) })
</script>

<template>
  <div class="rider-map">
    <div class="map-label">
      <span>🏪 {{ riderName.slice(0, 1) }}老板</span>
      <span class="map-status" :class="status">
        {{ status === 'completed' ? '已送达 🎉' : status === 'rider_lost' ? '迷路中 🗺️' : '配送中 🛵' }}
      </span>
      <span>🏠 你家</span>
    </div>

    <svg viewBox="0 0 300 200" class="map-svg">
      <!-- 背景街道 -->
      <rect x="0" y="0" width="300" height="200" rx="12" fill="#f8f4ee" />

      <!-- 街道线 -->
      <line x1="0" y1="100" x2="300" y2="100" stroke="#e0d5c5" stroke-width="20" />
      <line x1="100" y1="0" x2="100" y2="200" stroke="#e0d5c5" stroke-width="12" />
      <line x1="200" y1="0" x2="200" y2="200" stroke="#e0d5c5" stroke-width="12" />

      <!-- 路径 -->
      <path
        :d="PATH"
        fill="none"
        stroke="#ff7849"
        stroke-width="3"
        stroke-dasharray="6 4"
        opacity="0.6"
      />

      <!-- 已走过的路径（进度）-->
      <path
        :d="PATH"
        fill="none"
        stroke="#ff7849"
        stroke-width="4"
        :stroke-dasharray="`${progress * 280} 280`"
        opacity="0.9"
      />

      <!-- 终点（顾客家） -->
      <g transform="translate(260, 88)">
        <rect x="-10" y="-10" width="22" height="22" rx="4" fill="#4caf50" opacity="0.9" />
        <text x="1" y="7" font-size="14" text-anchor="middle" dominant-baseline="middle">🏠</text>
      </g>

      <!-- 起点（商家） -->
      <g transform="translate(30, 88)">
        <rect x="-10" y="-10" width="22" height="22" rx="4" fill="#ff7849" opacity="0.9" />
        <text x="1" y="7" font-size="14" text-anchor="middle" dominant-baseline="middle">🏪</text>
      </g>

      <!-- 骑手图标 -->
      <g
        :transform="`translate(${riderPos[0] + (shake ? 3 : 0)}, ${riderPos[1] - 18})`"
        class="rider-icon"
      >
        <circle cx="0" cy="0" r="16" fill="#fff" stroke="#ff7849" stroke-width="2" />
        <text x="0" y="6" font-size="16" text-anchor="middle" dominant-baseline="middle">
          {{ riderAvatar }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style lang="scss" scoped>
.rider-map {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin: 0 16px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}

.map-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px 4px;
  font-size: 11px;
  color: #888;
}

.map-status {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  background: #fff3ee;
  color: #ff7849;

  &.completed {
    background: #e8f5e9;
    color: #4caf50;
  }

  &.rider_lost {
    background: #fff8e1;
    color: #ff9800;
    animation: blink 0.8s infinite;
  }
}

.map-svg {
  width: 100%;
  height: 130px;
  display: block;
}

.rider-icon {
  transition: transform 0.1s;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,.2));
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
