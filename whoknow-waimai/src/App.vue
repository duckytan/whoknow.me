<script setup lang="ts">
/**
 * App.vue
 *
 * v16 M3 合规 banner（7-23 锡哥拍板 · 决策 #011）
 * v17 合规 banner 优化（7-24 锡哥拍板 · 修挡住 Hero）
 *   - 用户关闭后写 localStorage，下次不再显示
 *   - banner 关闭后页面顶上去，不留白条
 * v18 版本号水印（7-23 锡哥拍板 · 底部固定显示 build hash）
 */
import { useRoute } from 'vue-router'
import { computed, ref } from 'vue'
import ComplianceBanner from '@/components/base/ComplianceBanner.vue'
import AchievementPopup from '@/components/achievement/AchievementPopup.vue'

declare const __APP_VERSION__: string

const route = useRoute()
const showBanner = computed(() => !route.meta.hideBanner)

// 局部状态：banner 是否被用户关闭（带 localStorage 持久化）
const bannerDismissed = ref(false)

function onBannerDismiss() {
  bannerDismissed.value = true
}

// 实际是否渲染 banner（合规页自身不挂 + 用户关闭后不挂）
const shouldRenderBanner = computed(() => showBanner.value && !bannerDismissed.value)

const appVersion = __APP_VERSION__
</script>

<template>
  <ComplianceBanner
    v-if="showBanner"
    @dismiss="onBannerDismiss"
  />
  <div class="app-content" :class="{ 'with-banner': shouldRenderBanner }">
    <router-view />
  </div>
  <AchievementPopup />
  <div class="version-badge">{{ appVersion }}</div>
</template>

<style scoped>
.app-content {
  /* 默认无 padding,banner 关闭后页面顶上去 */
  padding-top: 0;
  /* 避免被 banner 压 */
  min-height: 100vh;
}

.app-content.with-banner {
  /* banner 极薄半透明 · 高度约 22px */
  padding-top: 22px;
}

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
