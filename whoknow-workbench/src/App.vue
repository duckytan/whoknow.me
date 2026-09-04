<script setup lang="ts">
/**
 * 工作台根壳：挂载即拉取并合并数据，注入 4 个 Pinia store；
 * 顶部导航 + 主内容区承载路由视图（router-view）。
 */
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { loadWorkbenchData } from '@/services/dataLoader';
import { useUniverseStore } from '@/stores/universe';
import { useAppsStore } from '@/stores/apps';
import { useCandidatesStore } from '@/stores/candidates';
import { useGovernanceStore } from '@/stores/governance';

const route = useRoute();

const loading = ref(true);
const messages = ref<string[]>([]);

/**
 * 降级菜单：仅在数据未就绪（首次加载中 / metrics.json 完全缺失）时兜底，
 * 正常路径走 store，顺序仍以 gen-metrics.mjs 的 APP_DEFS 为准。
 */
const APP_NAV_FALLBACK = [
  { to: '/app/brain', label: '胡闹大脑' },
  { to: '/app/waimai', label: '胡闹外卖' },
  { to: '/app/mart', label: '胡闹导购' },
];

const dataFresh = computed(() => useUniverseStore().dataFresh);
const generatedAt = computed(() => useUniverseStore().generatedAt);
const appsStore = useAppsStore();

/**
 * App 导航项由 store 驱动，顺序与数据一致。
 * 唯一事实源是 gen-metrics.mjs 的 APP_DEFS（导航 / 卡片 / 质量门 / 状态灯均沿用），
 * 避免这里再硬编码一份导致两处顺序漂移。
 */
const appNavItems = computed(() =>
  appsStore.list.length > 0
    ? appsStore.list.map((a) => ({ to: `/app/${a.appKey}`, label: a.label ?? a.appKey }))
    : APP_NAV_FALLBACK,
);

const navItems = computed(() => [
  { to: '/', label: '宇宙综合面板' },
  ...appNavItems.value,
  { to: '/candidates', label: '候选矩阵' },
  { to: '/governance', label: '治理透视' },
]);

async function bootstrap(): Promise<void> {
  const { data, diagnostics } = await loadWorkbenchData();
  useUniverseStore().hydrate(data);
  useAppsStore().hydrate(data);
  useCandidatesStore().hydrate(data);
  useGovernanceStore().hydrate(data);
  messages.value = diagnostics.messages;
  loading.value = false;
}

onMounted(bootstrap);
</script>

<template>
  <div class="wb-app">
    <header class="wb-app__nav">
      <div class="wb-app__brand">
        <span class="wb-app__logo">🛰️</span>
        <div class="wb-app__brand-text">
          <strong>胡闹宇宙 · 开发工作台</strong>
          <span class="wb-app__brand-sub">宇宙综合面板 / 子项目 / 候选矩阵 / 治理透视</span>
        </div>
      </div>
      <nav class="wb-app__links">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="wb-app__link"
          active-class="wb-app__link--active"
        >
          {{ item.label }}
        </router-link>
      </nav>
      <div class="wb-app__meta">
        <span v-if="dataFresh" class="wb-app__fresh">数据可用</span>
        <span v-else class="wb-app__stale">数据缺失</span>
        <span class="wb-mono wb-app__ts">{{ generatedAt ? generatedAt.slice(0, 10) : '—' }}</span>
      </div>
    </header>

    <main class="wb-app__main">
      <div v-if="loading" class="wb-app__loading">
        <p>正在加载工作台数据…</p>
        <p class="wb-note">首次运行请先执行 npm run gen 生成 metrics.json</p>
      </div>
      <template v-else>
        <div v-if="messages.length" class="wb-app__warn">
          <span v-for="(msg, idx) in messages" :key="idx" class="wb-note">⚠ {{ msg }}</span>
        </div>
        <router-view v-slot="{ Component }">
          <component :is="Component" :key="route.fullPath" />
        </router-view>
      </template>
    </main>
  </div>
</template>

<style scoped>
.wb-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.wb-app__nav {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 12px 22px;
  background: var(--wb-panel);
  border-bottom: 1px solid var(--wb-border);
  position: sticky;
  top: 0;
  z-index: 10;
  flex-wrap: wrap;
}

.wb-app__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wb-app__logo {
  font-size: 22px;
}

.wb-app__brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.wb-app__brand-text strong {
  font-size: 15px;
  color: var(--wb-text);
}

.wb-app__brand-sub {
  font-size: 11px;
  color: var(--wb-text-muted);
}

.wb-app__links {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 auto;
  flex-wrap: wrap;
}

.wb-app__link {
  font-size: 13px;
  color: var(--wb-text-dim);
  padding: 5px 11px;
  border-radius: 6px;
  border: 1px solid transparent;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.wb-app__link:hover {
  color: var(--wb-text);
  border-color: var(--wb-border);
}

.wb-app__link--active {
  color: #0f1117;
  background: var(--wb-green);
  font-weight: 600;
}

.wb-app__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.wb-app__fresh {
  color: var(--wb-green);
}

.wb-app__stale {
  color: var(--wb-orange);
}

.wb-app__ts {
  color: var(--wb-text-muted);
}

.wb-app__main {
  flex: 1 1 auto;
  padding: 18px 22px 40px;
  max-width: 1480px;
  width: 100%;
  margin: 0 auto;
}

.wb-app__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 80px 0;
  color: var(--wb-text-dim);
}

.wb-app__warn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  margin-bottom: 16px;
  border: 1px solid var(--wb-orange);
  border-radius: var(--wb-radius);
  background: rgba(255, 120, 73, 0.08);
}
</style>
