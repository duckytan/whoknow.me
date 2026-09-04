<script setup lang="ts">
// Statusbar.vue — 真机观感系统状态栏（P1-6）
// 纯装饰：不接任何系统 API。信号 / WiFi / 电池均为内联 SVG 静态图形，
// 唯一「真实」的是时间（本地时钟，HH:MM）。整条对 AT 隐藏（手机外壳装饰，非内容）。
import { onMounted, onUnmounted, ref } from 'vue'

/** 电池电量（装饰常量，非系统读数） */
const BATTERY = 86
/** 电池内条最大宽度 16 用户单位，按电量线性缩放 */
const batteryWidth = (16 * BATTERY) / 100

function fmtClock(d: Date): string {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

const clock = ref(fmtClock(new Date()))
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // 每秒采样、按分钟变化：ref 赋同值不触发重渲染，代价可忽略
  timer = setInterval(() => {
    clock.value = fmtClock(new Date())
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <div class="statusbar" aria-hidden="true">
    <!-- 左：信号格 + 运营商 + WiFi -->
    <div class="sb-side sb-left">
      <svg class="sb-ico" width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
        <rect x="0" y="7.5" width="3" height="3.5" rx="1" />
        <rect x="4.5" y="5" width="3" height="6" rx="1" />
        <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
        <rect x="13.5" y="0" width="3" height="11" rx="1" opacity="0.3" />
      </svg>
      <span class="sb-carrier">胡闹移动</span>
      <svg
        class="sb-ico"
        width="15"
        height="11"
        viewBox="0 0 16 12"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      >
        <path d="M1.3 3.9a10 10 0 0 1 13.4 0" />
        <path d="M3.7 6.4a6.4 6.4 0 0 1 8.6 0" />
        <path d="M6.1 8.9a3 3 0 0 1 3.8 0" />
        <circle cx="8" cy="10.9" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    </div>

    <!-- 中：实时时间 -->
    <div class="sb-time">{{ clock }}</div>

    <!-- 右：电量数字 + 电池（含充电标） -->
    <div class="sb-side sb-right">
      <span class="sb-batt-num">{{ BATTERY }}</span>
      <svg class="sb-ico" width="25" height="12" viewBox="0 0 25 12" fill="none">
        <rect
          x="0.7"
          y="0.7"
          width="20.6"
          height="10.6"
          rx="3.2"
          stroke="currentColor"
          stroke-opacity="0.4"
          stroke-width="1.1"
        />
        <rect x="2.4" y="2.4" :width="batteryWidth" height="7.2" rx="1.8" fill="currentColor" />
        <path d="M22.6 4.1c1.5.5 1.5 3.3 0 3.8z" fill="currentColor" fill-opacity="0.4" />
        <path d="M11.6 3.4 8.6 6.9h2.2l-.6 2.6 3.2-3.7h-2.3z" fill="#fff" />
      </svg>
    </div>
  </div>
</template>
