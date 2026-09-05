<script setup lang="ts">
/**
 * 皮肤页面入口（T6 · 架构 §4.3）：按 page 读取皮肤配置 → 解析布局变体 → 渲染区域。
 * 未知 layout id → 降级 home-classic + console.warn（PRD R-P0-06 验收④）。
 * 密度档位经 CSS 变量注入布局组件（T11 Dev 面板可覆盖）。
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

const layoutId = computed(() => {
  const declared = pageConfig.value?.layout ?? FALLBACK_HOME_LAYOUT;
  if (!LAYOUT_REGISTRY[declared]) {
    console.warn(`[skin] unknown layout variant: ${declared}`);
    return FALLBACK_HOME_LAYOUT;
  }
  return declared;
});

const layoutComp = computed(() => LAYOUT_REGISTRY[layoutId.value].component);

/** regions 数组转 region→slot 映射，供布局组件按名取模块 */
const regionMap = computed<Record<string, RegionMapping>>(() => {
  const map: Record<string, RegionMapping> = {};
  for (const r of pageConfig.value?.regions ?? []) map[r.region] = r;
  return map;
});

const density = computed(() => pageConfig.value?.density ?? 'comfortable');
</script>

<template>
  <component
    :is="layoutComp"
    :regions="regionMap"
    :style="{ '--region-gap': density === 'compact' ? '10px' : '16px' }"
  />
</template>
