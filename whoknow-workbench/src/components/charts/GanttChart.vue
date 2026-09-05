<script setup lang="ts">
/**
 * 甘特图（custom series + time 轴）：里程碑七阶段 + 8 大类解锁窗口 + 门禁行。
 * 简化实现：单条形 custom 渲染，行按分组顺序自上而下排列，门禁行独立配色标注。
 */
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import type { GanttRow } from '@/types/metrics';
import { useChart } from './useChart';
import { useSkinStore } from '@/stores/skin';
import { tooltipBase } from './palette';
import { ganttColor, ganttLabel } from '@/services/format';

const props = withDefaults(
  defineProps<{
    rows: GanttRow[];
    height?: number;
  }>(),
  { height: 460 },
);

interface BarDatum {
  value: [number, number, number];
  itemStyle: { color: string };
  meta: GanttRow;
}

function toTs(dateText: string): number {
  const ts = new Date(`${dateText}T00:00:00Z`).getTime();
  return Number.isNaN(ts) ? Date.now() : ts;
}

/** custom series 渲染：把 [rowIndex, startTs, endTs] 画成裁剪后的圆角条 */
function renderItem(params: any, api: any): any {
  const categoryIndex = api.value(0);
  const start = api.coord([api.value(1), categoryIndex]);
  const end = api.coord([api.value(2), categoryIndex]);
  const bandHeight = api.size([0, 1])[1];
  const barHeight = Math.max(6, Math.min(16, bandHeight * 0.52));
  const width = Math.max(3, end[0] - start[0]);

  const rect = echarts.graphic.clipRectByRect(
    {
      x: start[0],
      y: start[1] - barHeight / 2,
      width,
      height: barHeight,
    },
    {
      x: params.coordSys.x,
      y: params.coordSys.y,
      width: params.coordSys.width,
      height: params.coordSys.height,
    },
  );

  if (!rect) return undefined;
  return {
    type: 'rect',
    transition: ['shape'],
    shape: { ...rect, r: 3 },
    style: api.style(),
  };
}

function buildOption(): EChartsOption {
  const t = useSkinStore().chartTokens;
  const labels = props.rows.map((row) => row.label);
  const data: BarDatum[] = props.rows.map((row, index) => ({
    value: [index, toTs(row.start), toTs(row.end)],
    itemStyle: { color: ganttColor(row.status) },
    meta: row,
  }));

  return {
    tooltip: {
      ...tooltipBase(t),
      trigger: 'item',
      formatter: (param: any) => {
        const meta: GanttRow | undefined = param?.data?.meta;
        if (!meta) return '';
        const detail = meta.detail ? `<div style="max-width:320px;white-space:normal;opacity:.8">${meta.detail}</div>` : '';
        return `<b>${meta.label}</b><br/>分组：${meta.group}<br/>区间：${meta.start} → ${meta.end}<br/>状态：${ganttLabel(meta.status)}${detail}`;
      },
    },
    grid: {
      left: 168,
      right: 24,
      top: 26,
      bottom: 34,
    },
    xAxis: {
      type: 'time',
      position: 'top',
      axisLine: { lineStyle: { color: t.axisLine } },
      axisTick: { show: false },
      axisLabel: {
        color: t.muted,
        fontSize: 11,
        formatter: '{yyyy}-{MM}',
      },
      splitLine: { lineStyle: { color: t.splitLine, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        color: t.muted,
        fontSize: 11,
        width: 158,
        overflow: 'truncate',
      },
    },
    series: [
      {
        type: 'custom',
        renderItem,
        itemStyle: { opacity: 0.92 },
        encode: { x: [1, 2], y: 0 },
        data,
      },
    ],
  };
}

const { chartRef } = useChart(buildOption, () => props.rows);
</script>

<template>
  <div ref="chartRef" class="wb-chart" :style="{ height: `${height}px` }" />
</template>

<style scoped>
.wb-chart {
  width: 100%;
}
</style>
