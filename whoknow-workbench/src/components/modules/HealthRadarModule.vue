<script setup lang="ts">
/**
 * 健康度雷达模块：waimai / mart / brain 五维（进度 / 质量 / 风险 / 协作 / 商业）雷达对比。
 * 人工维护层 healthScore 为权威（SYSTEM_DESIGN §6.3）。
 */
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppsStore } from '@/stores/apps';
import type { NamedSeries, RadarIndicator } from '@/types/metrics';
import SectionCard from '@/components/common/SectionCard.vue';
import RadarChart from '@/components/charts/RadarChart.vue';

const apps = useAppsStore();
const { list } = storeToRefs(apps);

const indicators: RadarIndicator[] = [
  { name: '进度', max: 100 },
  { name: '质量', max: 100 },
  { name: '风险', max: 100 },
  { name: '协作', max: 100 },
  { name: '商业', max: 100 },
];

const series = computed<NamedSeries[]>(() =>
  list.value.map((app) => {
    const h = apps.health(app.appKey);
    return {
      name: app.label ?? app.appKey,
      values: [h.progress, h.quality, h.risk, h.collab, h.business],
    };
  }),
);
</script>

<template>
  <SectionCard
    title="子项目健康度雷达"
    subtitle="五维健康度（人工维护层为权威）"
    tag="P1"
    tag-color="var(--wb-purple)"
  >
    <RadarChart :indicators="indicators" :series="series" :height="280" />
    <p v-if="list.length === 0" class="wb-note">暂无健康度数据。</p>
  </SectionCard>
</template>
