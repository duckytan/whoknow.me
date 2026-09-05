<script setup lang="ts">
/**
 * 首页布局变体 · 经典六行（T7）。
 * 2026-09-05 现状六行栅格的令牌化等价版（paper-light / legacy 默认）。
 * 区域栅格用原生 CSS grid（12 列，<992px 退化为单列），区域间距由 --region-gap 驱动。
 */
import ModuleHost from '@/components/ModuleHost.vue';
import type { RegionMapping } from '@/skins/types';

const props = defineProps<{
  regions: Record<string, RegionMapping>;
}>();

/** 取区域对应的模块 id（未配置返回 undefined，模板侧跳过该区域） */
function m(name: string): string | undefined {
  return props.regions[name]?.module;
}
</script>

<template>
  <div class="lay-classic">
    <ModuleHost v-if="m('progress')" :id="m('progress')!" class="lc-progress" />
    <ModuleHost v-if="m('statusLights')" :id="m('statusLights')!" class="lc-status" />
    <ModuleHost v-if="m('gantt')" :id="m('gantt')!" class="lc-gantt" />
    <ModuleHost v-if="m('candidates')" :id="m('candidates')!" class="lc-candidates" />
    <ModuleHost v-if="m('radar')" :id="m('radar')!" class="lc-radar" />
    <ModuleHost v-if="m('qualityGate')" :id="m('qualityGate')!" class="lc-quality" />
    <ModuleHost v-if="m('riskBoard')" :id="m('riskBoard')!" class="lc-risk" />
    <ModuleHost v-if="m('load')" :id="m('load')!" class="lc-load" />
    <ModuleHost v-if="m('activity')" :id="m('activity')!" class="lc-activity" />
    <ModuleHost v-if="m('contract')" :id="m('contract')!" class="lc-contract" />
  </div>
</template>

<style scoped>
.lay-classic {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--region-gap, 16px);
}

.lay-classic > * {
  min-width: 0;
}

.lc-progress { grid-column: span 4; }
.lc-status { grid-column: span 8; }
.lc-gantt { grid-column: span 12; }
.lc-candidates { grid-column: span 6; }
.lc-radar { grid-column: span 6; }
.lc-quality { grid-column: span 5; }
.lc-risk { grid-column: span 7; }
.lc-load { grid-column: span 6; }
.lc-activity { grid-column: span 6; }
.lc-contract { grid-column: span 12; }

@media (max-width: 991px) {
  .lay-classic > * {
    grid-column: span 12;
  }
}
</style>
