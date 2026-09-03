<script setup lang="ts">
/**
 * 贡献活跃度模块：git 提交周频趋势 + 顶层目录分布 + 作者数。
 */
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUniverseStore } from '@/stores/universe';
import { deriveDirPairs } from '@/services/derive';
import type { NamedSeries } from '@/types/metrics';
import SectionCard from '@/components/common/SectionCard.vue';
import LineChart from '@/components/charts/LineChart.vue';
import BarChart from '@/components/charts/BarChart.vue';
import MetricCard from '@/components/common/MetricCard.vue';
import { formatCount, shortWeek } from '@/services/format';

const universe = useUniverseStore();
const { git } = storeToRefs(universe);

const lineCategories = computed(() => git.value.commitTimeseries.map((w) => shortWeek(w.week)));
const lineSeries = computed<NamedSeries[]>(() => [
  { name: '周提交', values: git.value.commitTimeseries.map((w) => w.count) },
]);

const dirPairs = computed(() => deriveDirPairs(git.value, 8));
const dirCategories = computed(() => dirPairs.value.map((p) => p.name));
const dirSeries = computed<NamedSeries[]>(() => [{ name: '提交', values: dirPairs.value.map((p) => p.value) }]);

const authorCount = computed(() => Object.keys(git.value.authorDist).length);
const hasData = computed(() => git.value.commitsTotal > 0);
</script>

<template>
  <SectionCard
    title="贡献活跃度"
    subtitle="git 提交周频趋势与目录分布"
    tag="P1"
    tag-color="var(--wb-blue)"
    :footnote="git.degraded ? 'git 聚合降级：趋势以占位数据呈现' : `首提交 ${git.firstCommitAt ?? '—'} · 末提交 ${git.lastCommitAt ?? '—'}`"
  >
    <div class="ca">
      <div class="ca__metrics">
        <MetricCard label="总提交" :value="formatCount(git.commitsTotal)" accent="var(--wb-blue)" dot-color="var(--wb-blue)" />
        <MetricCard label="贡献者" :value="formatCount(authorCount)" accent="var(--wb-purple)" dot-color="var(--wb-purple)" />
        <MetricCard label="活跃周" :value="formatCount(git.commitTimeseries.length)" accent="var(--wb-green)" dot-color="var(--wb-green)" />
      </div>

      <LineChart
        :categories="lineCategories"
        :series="lineSeries"
        :height="200"
        :show-legend="false"
      />

      <div v-if="hasData" class="ca__dirs">
        <span class="ca__dirs-label wb-note">目录分布</span>
        <BarChart :categories="dirCategories" :series="dirSeries" :height="170" :show-legend="false" />
      </div>
      <p v-else class="wb-note">暂无提交数据。</p>
    </div>
  </SectionCard>
</template>

<style scoped>
.ca {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ca__metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.ca__dirs {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
