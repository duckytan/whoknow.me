<script setup lang="ts">
/**
 * ComplianceBanner.vue
 *
 * v16 M3 合规（7-23 锡哥拍板 · 决策 #011）
 * 顶部半透明固定 banner · 强调"虚构作品 / 不提供真餐饮"
 *
 * 设计原则（个人开发者合规策略）：
 * - 显眼但不挡内容（半透明 + 缩略文案 + 点击展开）
 * - 顶部固定，z-index 高于内容
 * - 提供「隐私政策」「用户协议」两个跳转
 */
import { ref } from 'vue'

const expanded = ref(false)
</script>

<template>
  <div class="compliance-banner" :class="{ expanded }" @click="expanded = !expanded">
    <div class="banner-inner">
      <span class="banner-icon">🎭</span>
      <div class="banner-text">
        <div class="banner-title">
          {{ expanded ? '本应用为虚构娱乐作品，不提供真实餐饮服务' : '虚构作品 · 不提供真实餐饮服务' }}
        </div>
        <div v-if="expanded" class="banner-links">
          <router-link to="/waimai/privacy" class="banner-link">隐私政策</router-link>
          <span class="banner-sep">·</span>
          <router-link to="/waimai/terms" class="banner-link">用户协议</router-link>
        </div>
      </div>
      <span class="banner-toggle">{{ expanded ? '▲' : '▼' }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.compliance-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 247, 237, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 107, 53, 0.2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.compliance-banner:hover {
  background: rgba(255, 240, 226, 0.98);
}

.compliance-banner.expanded {
  background: rgba(255, 240, 226, 0.98);
}

.banner-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 480px;
  margin: 0 auto;
  padding: 6px 16px;
  color: #ff6b35;
}

.banner-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
  min-width: 0;
}

.banner-title {
  font-weight: 600;
  line-height: 1.4;
}

.banner-links {
  margin-top: 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 6px;
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

.banner-toggle {
  font-size: 10px;
  opacity: 0.6;
  flex-shrink: 0;
}
</style>