<script setup lang="ts">
/**
 * 首页布局变体 · 紧凑瀑布（T7）。
 * 10 模块 auto-fill 等宽瀑布，备用 / Dev 面板可选。
 * 顺序：进度 → 状态灯 → 甘特 → 候选 → 雷达 → 质量门 → 风险 → 负载 → 活跃 → 契约。
 */
import ModuleHost from '@/components/ModuleHost.vue';
import type { RegionMapping } from '@/skins/types';

const props = defineProps<{
  regions: Record<string, RegionMapping>;
}>();

/** 瀑布流固定取模块顺序（region 名序列），未配置的区域自动跳过 */
const ORDER = [
  'progress',
  'statusLights',
  'gantt',
  'candidates',
  'radar',
  'qualityGate',
  'riskBoard',
  'load',
  'activity',
  'contract',
] as const;

const slots = ORDER;
</script>

<template>
  <div class="lay-dense">
    <template v-for="name in slots" :key="name">
      <ModuleHost v-if="props.regions[name]?.module" :id="props.regions[name].module" />
    </template>
  </div>
</template>

<style scoped>
.lay-dense {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--region-gap, 16px);
  align-items: start;
}

.lay-dense > * {
  min-width: 0;
}
</style>
