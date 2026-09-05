<script setup lang="ts">
/**
 * 热力图：实例 × 目录 提交密度。
 */
import type { EChartsOption } from 'echarts';
import type { HeatPoint } from '@/types/metrics';
import { useChart } from './useChart';
import { useSkinStore } from '@/stores/skin';
import { BRAND_ANCHORS, HEAT_RAMP_MID, tooltipBase } from './palette';

const props = withDefaults(
  defineProps<{
    xLabels: string[];
    yLabels: string[];
    points: HeatPoint[];
    height?: number;
    unit?: string;
  }>(),
  { height: 220, unit: '次提交' },
);

function buildOption(): EChartsOption {
  const t = useSkinStore().chartTokens;
  const max = props.points.reduce((acc, p) => Math.max(acc, p.value), 1);
  return {
    tooltip: {
      ...tooltipBase(t),
      position: 'top',
      formatter: (param: any) => {
        const [x, y, v] = param.value as [number, number, number];
        return `${props.yLabels[y] ?? ''} · ${props.xLabels[x] ?? ''}<br/><b>${v}</b> ${props.unit}`;
      },
    },
    grid: { left: 92, right: 20, top: 12, bottom: 56 },
    xAxis: {
      type: 'category',
      data: props.xLabels,
      splitArea: { show: true, areaStyle: { color: [t.splitArea, 'transparent'] } },
      axisLine: { lineStyle: { color: t.axisLine } },
      axisTick: { show: false },
      axisLabel: { color: t.muted, fontSize: 11, rotate: 30 },
    },
    yAxis: {
      type: 'category',
      data: props.yLabels,
      splitArea: { show: true, areaStyle: { color: [t.splitArea, 'transparent'] } },
      axisLine: { lineStyle: { color: t.axisLine } },
      axisTick: { show: false },
      axisLabel: { color: t.muted, fontSize: 11, width: 84, overflow: 'truncate' },
    },
    visualMap: {
      min: 0,
      max,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemHeight: 70,
      itemWidth: 12,
      textStyle: { color: t.muted, fontSize: 11 },
      inRange: { color: [t.heatFrom, ...HEAT_RAMP_MID, BRAND_ANCHORS.green] },
    },
    series: [
      {
        type: 'heatmap',
        data: props.points.map((p) => [p.xIndex, p.yIndex, p.value]),
        label: {
          show: true,
          color: t.onAccent,
          fontSize: 11,
          formatter: (param: any) => {
            const v = (param.value as [number, number, number])[2];
            return v > 0 ? String(v) : '';
          },
        },
        itemStyle: { borderColor: t.panel2, borderWidth: 2 },
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowColor: t.shadowColor },
        },
      },
    ],
  };
}

const { chartRef } = useChart(buildOption, () => [props.xLabels, props.yLabels, props.points]);
</script>

<template>
  <div ref="chartRef" class="wb-chart" :style="{ height: `${height}px` }" />
</template>

<style scoped>
.wb-chart {
  width: 100%;
}
</style>
