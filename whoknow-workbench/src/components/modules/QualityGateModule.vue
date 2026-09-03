<script setup lang="ts">
/**
 * 质量门总览模块：各子项目测试通过 / 总数 / 通过率 / 构建结论。
 */
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUniverseStore } from '@/stores/universe';
import type { NamedSeries, QualityGateRow } from '@/types/metrics';
import SectionCard from '@/components/common/SectionCard.vue';
import BarChart from '@/components/charts/BarChart.vue';
import MetricCard from '@/components/common/MetricCard.vue';
import { buildStatusColor, buildStatusLabel, formatPassRatio, passPct } from '@/services/format';

const universe = useUniverseStore();
const { qualityGate, totalTestPass, totalTestTotal } = storeToRefs(universe);

const passSeries = computed<NamedSeries[]>(() => [
  { name: '通过用例', values: qualityGate.value.map((g) => g.pass) },
]);

const categories = computed(() => qualityGate.value.map((g) => g.app));

const overallPct = computed(() => passPct(totalTestPass.value, totalTestTotal.value));

function verdictClass(row: QualityGateRow): string {
  if (row.total === 0) return 'qg__verdict--none';
  return row.pass === row.total ? 'qg__verdict--ok' : 'qg__verdict--warn';
}
</script>

<template>
  <SectionCard
    title="质量门总览"
    subtitle="自动化测试与构建结论"
    tag="P0"
    tag-color="var(--wb-green)"
  >
    <div class="qg">
      <div class="qg__summary">
        <MetricCard
          label="累计通过"
          :value="formatPassRatio(totalTestPass, totalTestTotal)"
          accent="var(--wb-green)"
          dot-color="var(--wb-green)"
          caption="全部子项目单测"
        />
        <MetricCard label="整体通过率" :value="`${overallPct}%`" accent="var(--wb-text)" />
      </div>

      <BarChart
        :categories="categories"
        :series="passSeries"
        :height="170"
        :show-legend="false"
        :max-value="Math.max(1, totalTestTotal)"
      />

      <table class="qg__table">
        <thead>
          <tr>
            <th>子项目</th>
            <th>通过 / 总数</th>
            <th>通过率</th>
            <th>构建</th>
            <th>结论</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in qualityGate" :key="row.app">
            <td class="wb-mono">{{ row.app }}</td>
            <td>{{ formatPassRatio(row.pass, row.total) }}</td>
            <td>{{ passPct(row.pass, row.total) }}%</td>
            <td :style="{ color: buildStatusColor(row.buildStatus) }">{{ buildStatusLabel(row.buildStatus) }}</td>
            <td :class="verdictClass(row)">{{ row.verdict }}</td>
          </tr>
          <tr v-if="qualityGate.length === 0">
            <td colspan="5" class="wb-note">暂无质量门数据。</td>
          </tr>
        </tbody>
      </table>
    </div>
  </SectionCard>
</template>

<style scoped>
.qg {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qg__summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.qg__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.qg__table th,
.qg__table td {
  text-align: left;
  padding: 7px 8px;
  border-bottom: 1px solid var(--wb-border-soft);
  color: var(--wb-text-dim);
}

.qg__table th {
  color: var(--wb-text-muted);
  font-weight: 600;
}

.qg__table td {
  color: var(--wb-text);
}

.qg__verdict--ok {
  color: var(--wb-green);
}

.qg__verdict--warn {
  color: var(--wb-orange);
}

.qg__verdict--none {
  color: var(--wb-text-muted);
}
</style>
