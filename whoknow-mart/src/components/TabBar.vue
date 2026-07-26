<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
const router = useRouter()
const route = useRoute()
const tabs = [
  { label: '逛街', icon: '🛍️', path: '/' },
  { label: '图鉴', icon: '📖', path: '/codex' },
  { label: '我的', icon: '👤', path: '/profile' },
]
</script>

<template>
  <!-- 底部 TabBar（ART-BIBLE §5.1 / ASSET-SPECS §2.5）：白底 + 顶边线；
       选中态 --brand-orange 填充图标 + 上凸（逐字对齐 waimai .tabbar .tb.on） -->
  <nav class="tab-bar" aria-label="主导航">
    <button
      v-for="t in tabs"
      :key="t.path"
      :class="{ on: route.path === t.path }"
      :aria-current="route.path === t.path ? 'page' : undefined"
      @click="router.push(t.path)"
    >
      <span class="ico-wrap" aria-hidden="true">{{ t.icon }}</span>
      <span class="lbl">{{ t.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  width: 100%;
  max-width: var(--maxw);
  height: var(--tabbar-h);
  display: flex;
  border-top: 1px solid var(--line);
  background: var(--bg-2);
  z-index: 20;
}
.tab-bar button {
  flex: 1;
  border: none;
  background: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--fg-dim);
  font-size: var(--fs-xs);
  min-height: 44px;
}
.tab-bar .ico-wrap {
  width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: var(--fg);
  border-radius: 18px;
  transition: all 0.15s var(--ease-smooth);
}
.tab-bar button.on {
  color: var(--fg);
  font-weight: 700;
}
.tab-bar button.on .ico-wrap {
  background: var(--brand-orange);
  color: #fff;
  margin-top: -6px;
  height: 38px;
  box-shadow: 0 2px 6px rgba(255, 120, 73, 0.4);
}
</style>
