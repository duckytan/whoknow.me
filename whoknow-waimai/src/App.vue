<script setup lang="ts">
/**
 * App.vue
 *
 * v16 M3 合规 banner
 * v17 合规 banner 优化（7-24 锡哥拍板 · 修挡住 Hero）
 * v18 全局 TabBar + 宽屏手机框（7-24 锡哥拍板 · PC 浏览器 TabBar 拉撑 + 漏挂）
 * v19 版本号水印
 *
 * 关键改动 v18:
 * - TabBar 从各页面挪到 App.vue 全局,通过路由 meta.showTabBar 控制
 * - 加 .app-frame 包裹容器,max-width: 460px 居中
 * - 宽屏 (≥768px) 模拟手机框:圆角 + 阴影 + 灰色背景
 * - 各页面不再 import AppTabBar,避免重复挂载
 */
import { useRoute } from 'vue-router'
import { computed, ref } from 'vue'
import ComplianceBanner from '@/components/base/ComplianceBanner.vue'
import AppTabBar from '@/components/base/AppTabBar.vue'
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

// v18: 全局 TabBar 显隐由路由 meta 控制
const showTabBar = computed(() => route.meta.showTabBar === true)

// 推断当前 TabBar active 状态（基于当前路径）
const activeTab = computed<'home' | 'feed' | 'orders' | 'achievements'>(() => {
  const path = route.path
  if (path === '/' || path.startsWith('/shop') || path.startsWith('/shops') || path.startsWith('/checkout') || path.startsWith('/cart')) {
    return 'home'
  }
  if (path.startsWith('/feed')) return 'feed'
  if (path.startsWith('/achievements')) return 'achievements'
  if (path.startsWith('/order')) return 'orders'
  return 'home'
})

const appVersion = __APP_VERSION__
</script>

<template>
  <div class="app-frame">
    <ComplianceBanner
      v-if="showBanner"
      @dismiss="onBannerDismiss"
    />
    <div class="app-content" :class="{ 'with-banner': shouldRenderBanner }">
      <router-view />
    </div>
    <AppTabBar v-if="showTabBar" :active="activeTab" />
    <AchievementPopup />
    <div class="version-badge">{{ appVersion }}</div>
  </div>
</template>

<style scoped>
.app-frame {
  /* 移动端：撑满 */
  width: 100%;
  min-height: 100vh;
  margin: 0 auto;
  background: #f5f5f5;
  position: relative;

  /* 宽屏：模拟手机框 */
  @media (min-width: 768px) {
    max-width: 460px;
    min-height: calc(100vh - 48px);
    margin: 24px auto;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    background: #fff;
  }
}

.app-content {
  padding-top: 0;
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

/* 宽屏时，版本号水印移到手机框内 */
@media (min-width: 768px) {
  .version-badge {
    bottom: 28px;
  }
}
</style>
