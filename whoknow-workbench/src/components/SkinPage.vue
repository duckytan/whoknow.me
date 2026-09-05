<script setup lang="ts">
/**
 * 皮肤页面入口（T6 · 架构 §4.3；T11 接入 Dev 面板覆盖）。
 * 布局/密度优先级：layoutOverride（localStorage['wb.layout.<page>']，Dev 面板写入）
 *   > 皮肤 JSON 声明 > 兜底 home-classic。
 * 未知 layout id → 降级 home-classic + console.warn（PRD R-P0-06 验收④）。
 * hidden 列表中的区域被过滤（模块集合仍 100% 在 store，仅呈现隐藏）。
 */
import { computed } from 'vue';
import { useSkinStore } from '@/stores/skin';
import { LAYOUT_REGISTRY, FALLBACK_HOME_LAYOUT } from '@/skins/registry';
import type { RegionMapping } from '@/skins/types';

const props = defineProps<{
  /** 页面 id（当前 MVP 仅 home 有布局变体） */
  page: 'home';
}>();

const skinStore = useSkinStore();

const pageConfig = computed(() => skinStore.config.pages[props.page]);
const override = computed(() => skinStore.layoutOverride[props.page]);

const declaredLayout = computed(
  () => override.value?.layout ?? pageConfig.value?.layout ?? FALLBACK_HOME_LAYOUT,
);

const layoutId = computed(() => {
  if (!LAYOUT_REGISTRY[declaredLayout.value]) {
    console.warn(`[skin] unknown layout variant: ${declaredLayout.value}`);
    return FALLBACK_HOME_LAYOUT;
  }
  return declaredLayout.value;
});

const layoutComp = computed(() => LAYOUT_REGISTRY[layoutId.value].component);

/** regions 数组转 region→slot 映射，过滤 Dev 面板隐藏的模块 */
const regionMap = computed<Record<string, RegionMapping>>(() => {
  const hidden = new Set(override.value?.hidden ?? []);
  const map: Record<string, RegionMapping> = {};
  for (const r of pageConfig.value?.regions ?? []) {
    if (!hidden.has(r.module)) map[r.region] = r;
  }
  return map;
});

const density = computed(() => override.value?.density ?? pageConfig.value?.density ?? 'comfortable');
</script>

<template>
  <component
    :is="layoutComp"
    :regions="regionMap"
    :style="{ '--region-gap': density === 'compact' ? '10px' : '16px' }"
  />
</template>
