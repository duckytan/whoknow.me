<script setup lang="ts">
/**
 * Dev 布局编排面板（T11 · R-P1-01）：可视化切换（非拖拽）。
 * 能力：首页布局变体切换 / 密度档位 / 模块显隐 / 导出当前配置 JSON。
 * 覆盖写入 skin store（persist localStorage['wb.layout.home']），实时生效。
 * 触控 ≥44px、键盘可达（原生 button + focus-visible 全局焦点环）。
 */
import { computed, ref } from 'vue';
import { useSkinStore } from '@/stores/skin';
import { LAYOUT_REGISTRY, MODULE_REGISTRY } from '@/skins/registry';
import WbIcon from '@/components/common/WbIcon.vue';

const PAGE = 'home' as const;

const skinStore = useSkinStore();
const open = ref(false);

const layoutOptions = Object.entries(LAYOUT_REGISTRY).map(([id, entry]) => ({
  id,
  label: entry.label,
}));

const moduleIds = Object.keys(MODULE_REGISTRY);

const override = computed(() => skinStore.layoutOverride[PAGE] ?? {});
const currentLayout = computed(
  () => override.value.layout ?? skinStore.config.pages.home?.layout ?? 'home-classic',
);
const currentDensity = computed(
  () => override.value.density ?? skinStore.config.pages.home?.density ?? 'comfortable',
);
const hidden = computed(() => new Set(override.value.hidden ?? []));

function setLayout(id: string): void {
  skinStore.setLayoutOverride(PAGE, { layout: id });
}

function setDensity(density: 'comfortable' | 'compact'): void {
  skinStore.setLayoutOverride(PAGE, { density });
}

function toggleModule(id: string): void {
  const next = new Set(hidden.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  skinStore.setLayoutOverride(PAGE, { hidden: [...next] });
}

function resetOverride(): void {
  skinStore.setLayoutOverride(PAGE, { layout: undefined, density: undefined, hidden: [] });
}

/** 导出当前生效配置 JSON（与手改配置等效，PRD R-P1-01 验收②） */
function exportJson(): void {
  const payload = {
    page: PAGE,
    layout: currentLayout.value,
    density: currentDensity.value,
    hiddenModules: [...hidden.value],
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `skin-layout-${PAGE}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="skin-panel">
    <button
      type="button"
      class="skin-panel__toggle"
      :aria-expanded="open"
      aria-label="布局编排面板"
      @click="open = !open"
    >
      <WbIcon name="gauge" :size="16" />
      <span>布局</span>
    </button>

    <div v-if="open" class="skin-panel__body">
      <fieldset class="skin-panel__group">
        <legend>首页布局变体</legend>
        <button
          v-for="opt in layoutOptions"
          :key="opt.id"
          type="button"
          class="skin-panel__opt"
          :class="{ 'skin-panel__opt--on': currentLayout === opt.id }"
          :aria-pressed="currentLayout === opt.id"
          @click="setLayout(opt.id)"
        >
          {{ opt.label }}
        </button>
      </fieldset>

      <fieldset class="skin-panel__group">
        <legend>密度</legend>
        <button
          type="button"
          class="skin-panel__opt"
          :class="{ 'skin-panel__opt--on': currentDensity === 'comfortable' }"
          :aria-pressed="currentDensity === 'comfortable'"
          @click="setDensity('comfortable')"
        >
          宽松
        </button>
        <button
          type="button"
          class="skin-panel__opt"
          :class="{ 'skin-panel__opt--on': currentDensity === 'compact' }"
          :aria-pressed="currentDensity === 'compact'"
          @click="setDensity('compact')"
        >
          紧凑
        </button>
      </fieldset>

      <fieldset class="skin-panel__group">
        <legend>模块显隐</legend>
        <label v-for="id in moduleIds" :key="id" class="skin-panel__mod">
          <input
            type="checkbox"
            :checked="!hidden.has(id)"
            @change="toggleModule(id)"
          />
          <span class="wb-mono">{{ id }}</span>
        </label>
      </fieldset>

      <div class="skin-panel__actions">
        <button type="button" class="skin-panel__opt" @click="exportJson">导出 JSON</button>
        <button type="button" class="skin-panel__opt" @click="resetOverride">重置</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skin-panel {
  position: relative;
}

.skin-panel__toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--wb-border);
  border-radius: 8px;
  color: var(--wb-text-dim);
  font-size: 13px;
  cursor: pointer;
}

.skin-panel__toggle:hover {
  color: var(--wb-text);
  border-color: var(--wb-border-strong);
}

.skin-panel__body {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 280px;
  max-height: 70vh;
  overflow: auto;
  padding: 14px;
  background: var(--wb-panel);
  border: 1px solid var(--wb-border-strong);
  border-radius: 12px;
  box-shadow: var(--wb-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.35));
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skin-panel__group {
  border: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skin-panel__group legend {
  font-size: 11px;
  color: var(--wb-text-muted);
  padding: 0 0 4px;
  width: 100%;
}

.skin-panel__opt {
  padding: 6px 10px;
  min-height: 36px;
  background: transparent;
  border: 1px solid var(--wb-border);
  border-radius: 8px;
  color: var(--wb-text-dim);
  font-size: 12px;
  cursor: pointer;
}

.skin-panel__opt--on {
  background: var(--wb-green);
  border-color: var(--wb-green);
  color: var(--wb-on-accent);
  font-weight: 600;
}

.skin-panel__mod {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--wb-text-dim);
  cursor: pointer;
  min-height: 24px;
}

.skin-panel__actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
</style>
