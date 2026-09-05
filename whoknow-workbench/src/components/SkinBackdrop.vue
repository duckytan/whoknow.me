<script setup lang="ts">
/**
 * 深色皮肤背景氛围层（T9 · BRAND §2.2）：
 * 左上紫晕 / 右下绿晕 / 中部橙晕，三处径向渐变。
 * pointer-events:none 点击穿透、aria-hidden 装饰、浅色皮肤不渲染、
 * 静态渐变无动画（reduced-motion 天然合规）。
 */
import { computed } from 'vue';
import { useSkinStore } from '@/stores/skin';

const skinStore = useSkinStore();
const visible = computed(() => skinStore.skinId !== 'paper-light');
</script>

<template>
  <div v-if="visible" class="skin-backdrop" aria-hidden="true">
    <div class="skin-backdrop__glow skin-backdrop__glow--purple" />
    <div class="skin-backdrop__glow skin-backdrop__glow--green" />
    <div class="skin-backdrop__glow skin-backdrop__glow--orange" />
  </div>
</template>

<style scoped>
.skin-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.skin-backdrop__glow {
  position: absolute;
  border-radius: 50%;
}

/* 左上紫晕 rgba(139,92,246,.18) */
.skin-backdrop__glow--purple {
  width: 900px;
  height: 900px;
  left: -280px;
  top: -320px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.18), transparent 62%);
}

/* 右下绿晕 rgba(110,218,120,.10) */
.skin-backdrop__glow--green {
  width: 1000px;
  height: 1000px;
  right: -320px;
  bottom: -360px;
  background: radial-gradient(circle, rgba(110, 218, 120, 0.10), transparent 62%);
}

/* 中部橙晕 rgba(255,120,73,.06) */
.skin-backdrop__glow--orange {
  width: 720px;
  height: 720px;
  left: 30%;
  top: 38%;
  background: radial-gradient(circle, rgba(255, 120, 73, 0.06), transparent 60%);
}
</style>
