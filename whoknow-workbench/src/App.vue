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
import { useSkinStore } from '@/stores/skin';
import SkinBackdrop from '@/components/SkinBackdrop.vue';
import SkinPanel from '@/components/SkinPanel.vue';

const route = useRoute();
const skinStore = useSkinStore();
const skinOptions = [
  { id: 'cosmos-dark', label: '宇宙暗色' },
  { id: 'paper-light', label: '纸感浅色' },
  { id: 'legacy', label: '回滚' },
] as const;

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

interface NavItem {
  to: string;
  label: string;
}

/**
 * App 导航项由 store 驱动，顺序与数据一致。
 * 唯一事实源是 gen-metrics.mjs 的 APP_DEFS（导航 / 卡片 / 质量门 / 状态灯均沿用），
 * 避免这里再硬编码一份导致两处顺序漂移。
 */
const appNavItems = computed<NavItem[]>(() =>
  appsStore.list.length > 0
    ? appsStore.list.map((a) => ({ to: `/app/${a.appKey}`, label: a.label ?? a.appKey }))
    : APP_NAV_FALLBACK,
);

/** 主导航：综合面板 + 各 App 详情页（顺序与数据一致） */
const navPrimary = computed<NavItem[]>(() => [
  { to: '/', label: '宇宙综合面板' },
  ...appNavItems.value,
]);

/** 工具导航：跨 App 的治理类页面，与 App 页非同类，用分隔线与主导航隔开 */
const navSecondary = computed<NavItem[]>(() => [
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
    <SkinBackdrop />
    <header class="wb-app__nav">
      <div class="wb-app__brand">
        <span class="wb-app__wordmark">whoknow<span class="wb-app__q">?</span></span>
        <div class="wb-app__brand-text">
          <strong>胡闹宇宙 · 开发工作台</strong>
          <span class="wb-app__brand-sub">宇宙综合面板 / 子项目 / 候选矩阵 / 治理透视</span>
        </div>
      </div>
      <nav class="wb-app__links">
        <router-link
          v-for="item in navPrimary"
          :key="item.to"
          :to="item.to"
          class="wb-app__link"
          active-class="wb-app__link--active"
        >
          {{ item.label }}
        </router-link>
        <span class="wb-app__divider" aria-hidden="true" />
        <div class="wb-app__group">
          <span class="wb-app__group-label">治理</span>
          <router-link
            v-for="item in navSecondary"
            :key="item.to"
            :to="item.to"
            class="wb-app__link wb-app__link--tool"
            active-class="wb-app__link--active"
          >
            {{ item.label }}
          </router-link>
        </div>
      </nav>
      <div class="wb-app__meta">
        <span v-if="dataFresh" class="wb-app__fresh">数据可用</span>
        <span v-else class="wb-app__stale">数据缺失</span>
        <span class="wb-mono wb-app__ts">{{ generatedAt ? generatedAt.slice(0, 10) : '—' }}</span>
      </div>
      <SkinPanel />
      <div class="wb-app__skin" role="group" aria-label="皮肤切换">
        <button
          v-for="opt in skinOptions"
          :key="opt.id"
          type="button"
          class="wb-skin-btn"
          :class="{ 'wb-skin-btn--active': skinStore.skinId === opt.id }"
          :aria-pressed="skinStore.skinId === opt.id"
          @click="skinStore.setSkin(opt.id)"
        >
          {{ opt.label }}
        </button>
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

/* 品牌字标（T8 · BRAND §12.1/§12.4）：Bungee 自托管字体，锚色问号点缀 */
.wb-app__wordmark {
  font-family: var(--wb-font-display);
  font-size: 22px;
  line-height: 1;
  color: var(--wb-text);
  letter-spacing: 0.5px;
  user-select: none;
}

.wb-app__q {
  color: var(--wb-green);
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
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: 13px;
  color: var(--wb-text-dim);
  padding: 6px 12px;
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
  color: var(--wb-on-accent);
  background: var(--wb-green);
  font-weight: 600;
}

/* 主导航（面板 + App 页）与工具导航（候选矩阵 / 治理透视）之间的分组分隔线 */
.wb-app__divider {
  width: 1px;
  height: 24px;
  background: var(--wb-border);
  margin: 0 12px;
  flex-shrink: 0;
}

/* 工具导航分组容器：虚线边框 + 组标签，与主导航在视觉上明确区分为另一栏目 */
.wb-app__group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px 3px 9px;
  border: 1px dashed var(--wb-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  flex-shrink: 0;
}

.wb-app__group-label {
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--wb-text-muted);
  margin-right: 3px;
  user-select: none;
}

.wb-app__link--tool {
  font-size: 12.5px;
}

.wb-app__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

/* 皮肤切换器：分段按钮组，触控区 ≥44×44（BRAND §13.3）；键盘可达（原生 button） */
.wb-app__skin {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--wb-border);
  border-radius: 10px;
  background: var(--wb-bg-soft);
  flex-shrink: 0;
}

.wb-skin-btn {
  min-height: 44px;
  min-width: 44px;
  padding: 0 12px;
  font-size: 12px;
  color: var(--wb-text-dim);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.wb-skin-btn:hover {
  color: var(--wb-text);
}

.wb-skin-btn--active {
  color: var(--wb-on-accent);
  background: var(--wb-green);
  border-color: var(--wb-green);
  font-weight: 600;
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
  position: relative;
  z-index: 1;
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
