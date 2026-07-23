<script setup lang="ts">
/**
 * ComplianceBanner.vue
 *
 * v17 M3 合规优化（7-24 锡哥拍板 · 修挡住 Hero 问题）
 * 顶部超薄半透明 banner · 强调"虚构作品 / 不提供真餐饮"
 *
 * 设计原则（个人开发者合规策略）：
 * - 显眼但不挡内容（极薄 · 3px padding · 12px 字号 · 半透明）
 * - 提供「隐私政策」「用户协议」两个跳转
 * - 提供「×」关闭按钮 · 关闭后写 localStorage（key: waimai_banner_dismissed）
 * - 不再遮挡 Hero 轮播首图
 */
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'dismiss'): void
}>()

const expanded = ref(false)
const dismissed = ref(false)

function toggleExpand() {
  if (dismissed.value) return
  expanded.value = !expanded.value
}

function close() {
  dismissed.value = true
  expanded.value = false
  try {
    localStorage.setItem('waimai_banner_dismissed', '1')
  } catch {
    // 隐私模式 / quota 满 → 静默兜底
  }
  emit('dismiss')
}

function restore() {
  try {
    if (localStorage.getItem('waimai_banner_dismissed') === '1') {
      dismissed.value = true
    }
  } catch {
    // 静默
  }
}

onMounted(restore)
</script>

<template>
  <Transition name="banner-fade">
    <div
      v-if="!dismissed"
      class="compliance-banner"
      :class="{ expanded }"
      @click="toggleExpand"
    >
      <div class="banner-inner">
        <span class="banner-icon">🎭</span>
        <div class="banner-text">
          <div class="banner-title">
            {{ expanded ? '本应用为虚构娱乐作品，不提供真实餐饮服务' : '虚构作品 · 不提供真实餐饮服务' }}
          </div>
          <div v-if="expanded" class="banner-links">
            <router-link to="/waimai/privacy" class="banner-link" @click.stop>隐私政策</router-link>
            <span class="banner-sep">·</span>
            <router-link to="/waimai/terms" class="banner-link" @click.stop>用户协议</router-link>
            <span class="banner-sep">·</span>
            <span class="banner-sep-text">纯娱乐 · 零卡路里</span>
          </div>
        </div>
        <span class="banner-toggle">{{ expanded ? '▲' : '▼' }}</span>
        <button class="banner-close" aria-label="关闭" @click.stop="close">×</button>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.compliance-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  /* 极薄半透明 · 不抢戏 */
  background: rgba(255, 247, 237, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(255, 107, 53, 0.15);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.compliance-banner:hover {
  background: rgba(255, 240, 226, 0.85);
}

.compliance-banner.expanded {
  background: rgba(255, 240, 226, 0.95);
}

.banner-inner {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 480px;
  margin: 0 auto;
  padding: 3px 28px 3px 16px;
  color: #ff6b35;
  position: relative;
}

.banner-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
  min-width: 0;
}

.banner-title {
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0.2px;
}

.banner-links {
  margin-top: 3px;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.banner-link {
  color: #ff6b35;
  text-decoration: underline;
  cursor: pointer;
}

.banner-link:hover {
  color: #e55a26;
}

.banner-sep {
  color: #ff6b35;
  opacity: 0.5;
}

.banner-sep-text {
  color: #ff6b35;
  opacity: 0.6;
}

.banner-toggle {
  font-size: 9px;
  opacity: 0.6;
  flex-shrink: 0;
  margin-right: 4px;
}

.banner-close {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #ff6b35;
  font-size: 16px;
  line-height: 1;
  padding: 2px 6px;
  cursor: pointer;
  opacity: 0.6;
  border-radius: 2px;
  transition: opacity 0.15s;
}

.banner-close:hover {
  opacity: 1;
  background: rgba(255, 107, 53, 0.1);
}

/* 折叠/淡出动画 */
.banner-fade-leave-active {
  transition: all 0.25s ease;
}

.banner-fade-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
