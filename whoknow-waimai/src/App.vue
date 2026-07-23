<script setup lang="ts">
/**
 * App.vue
 *
 * v16 M3 合规 banner（7-23 锡哥拍板 · 决策 #011）
 * 在所有页面顶部挂载半透明合规 banner（隐私政策页 / 用户协议页自身不挂）
 * v18 版本号水印（7-23 锡哥拍板 · 底部固定显示 build hash）
 */
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import ComplianceBanner from '@/components/base/ComplianceBanner.vue'
import AchievementPopup from '@/components/achievement/AchievementPopup.vue'

declare const __APP_VERSION__: string

const route = useRoute()
const showBanner = computed(() => !route.meta.hideBanner)
const appVersion = __APP_VERSION__
</script>

<template>
  <ComplianceBanner v-if="showBanner" />
  <router-view />
  <AchievementPopup />
  <div class="version-badge">{{ appVersion }}</div>
</template>

<style scoped>
.version-badge {
  position: fixed;
  right: 6px;
  bottom: 4px;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.18);
  font-family: monospace;
  pointer-events: none;
  user-select: none;
  z-index: 9999;
}
</style>
