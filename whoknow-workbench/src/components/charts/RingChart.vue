<script setup lang="ts">
/**
 * 环图（pie + radius 内外径）：状态占比 / 进度环。
 */
import type { EChartsOption } from 'echarts';
import type { NamedValue } from '@/types/metrics';
import { useChart } from './useChart';
import { useSkinStore } from '@/stores/skin';
import { legendBase, tooltipBase } from './palette';

const props = withDefaults(
  defineProps<{
    items: NamedValue[];
    height?: number;
    centerLabel?: string;
    centerValue?: string;
    showLegend?: boolean;
  }>(),
  {
    height: 220,
    centerLabel: '',
    centerValue: '',
    showLegend: true,
  },
);

function buildOption(): EChartsOption {
  const t = useSkinStore().chartTokens;
  return {
    color: t.series,
    tooltip: {
      ...tooltipBase(t),
      trigger: 'item',
      formatter: '{b}：{c}（{d}%）',
    },
    legend: props.showLegend
      ? { ...legendBase(t), bottom: 0, left: 'center', icon: 'circle' }
      : { show: false },
    graphic:
      props.centerValue || props.centerLabel
        ? [
            {
              type: 'text',
              left: 'center',
              top: props.showLegend ? '38%' : '44%',
              style: {
                text: props.centerValue,
                fill: t.text,
                fontSize: 24,
                fontWeight: 600,
                fontFamily: t.fontFamily || 'JetBrains Mono, Consolas, monospace',
                align: 'center',
              },
            },
            {
              type: 'text',
              left: 'center',
              top: props.showLegend ? '52%' : '58%',
              style: {
                text: props.centerLabel,
                fill: t.muted,
                fontSize: 12,
                align: 'center',
              },
            },
          ]
        : [],
    series: [
      {
        type: 'pie',
        radius: ['58%', '78%'],
        center: ['50%', props.showLegend ? '45%' : '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: t.panel2,
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 4,
          label: { show: false },
        },
        labelLine: { show: false },
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
