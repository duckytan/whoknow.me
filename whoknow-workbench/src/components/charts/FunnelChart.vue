<script setup lang="ts">
/**
 * 漏斗图：候选 App 推进转化（候选 → 聚类 → 立项 → 上线）。
 */
import type { EChartsOption } from 'echarts';
import type { NamedValue } from '@/types/metrics';
import { useChart } from './useChart';
import { useSkinStore } from '@/stores/skin';
import { tooltipBase } from './palette';

const props = withDefaults(
  defineProps<{
    items: NamedValue[];
    height?: number;
  }>(),
  { height: 240 },
);

function buildOption(): EChartsOption {
  const t = useSkinStore().chartTokens;
  return {
    color: t.series,
    tooltip: { ...tooltipBase(t), trigger: 'item', formatter: '{b}' },
    series: [
      {
        type: 'funnel',
        left: '6%',
        right: '6%',
        top: 10,
        bottom: 10,
        minSize: '26%',
        maxSize: '100%',
        sort: 'descending',
        gap: 3,
        label: {
          show: true,
          position: 'inside',
          color: t.onAccent,
          fontSize: 12,
          fontWeight: 600,
          formatter: '{b}',
        },
        itemStyle: { borderColor: t.panel2, borderWidth: 2 },
        emphasis: { label: { fontSize: 13 } },
        data: props.items.map((item) => ({
          name: item.name,
          value: item.value,
          itemStyle: item.color ? { color: item.color } : undefined,
        })),
      },
    ],
  };
}

const { chartRef } = useChart(buildOption, () => props.items);
</script>

<template>
  <div ref="chartRef" class="wb-chart" :style="{ height: `${height}px` }" />
</template>

<style scoped>
.wb-chart {
  width: 100%;
}
</style>
