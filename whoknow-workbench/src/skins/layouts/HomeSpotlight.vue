<script setup lang="ts">
/**
 * 首页布局变体 · 焦点式（T7）。
 * cosmos-dark 默认：宇宙进度独占 hero 放大，状态灯成 rail，
 * 甘特全宽，候选/雷达成对，四个治理模块四联，契约枢纽收尾全宽。
 */
import ModuleHost from '@/components/ModuleHost.vue';
import type { RegionMapping } from '@/skins/types';

const props = defineProps<{
  regions: Record<string, RegionMapping>;
}>();

function m(name: string): string | undefined {
  return props.regions[name]?.module;
}
</script>

<template>
  <div class="lay-spotlight">
    <ModuleHost v-if="m('progress')" :id="m('progress')!" class="sp-hero" />
    <ModuleHost v-if="m('statusLights')" :id="m('statusLights')!" class="sp-rail" />
    <ModuleHost v-if="m('gantt')" :id="m('gantt')!" class="sp-timeline" />
    <ModuleHost v-if="m('candidates')" :id="m('candidates')!" class="sp-pair-l" />
    <ModuleHost v-if="m('radar')" :id="m('radar')!" class="sp-pair-r" />
    <ModuleHost v-if="m('qualityGate')" :id="m('qualityGate')!" class="sp-quad" />
    <ModuleHost v-if="m('riskBoard')" :id="m('riskBoard')!" class="sp-quad" />
    <ModuleHost v-if="m('load')" :id="m('load')!" class="sp-quad" />
    <ModuleHost v-if="m('activity')" :id="m('activity')!" class="sp-quad" />
    <ModuleHost v-if="m('contract')" :id="m('contract')!" class="sp-footer" />
  </div>
</template>

<style scoped>
.lay-spotlight {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--region-gap, 16px);
}

.lay-spotlight > * {
  min-width: 0;
}

.sp-hero { grid-column: span 4; grid-row: span 2; }
.sp-rail { grid-column: span 8; }
.sp-timeline { grid-column: span 12; }
.sp-pair-l { grid-column: span 6; }
.sp-pair-r { grid-column: span 6; }
.sp-quad { grid-column: span 3; }
.sp-footer { grid-column: span 12; }

@media (max-width: 991px) {
  .lay-spotlight > * {
    grid-column: span 12;
    grid-row: auto;
  }
}
</style>
