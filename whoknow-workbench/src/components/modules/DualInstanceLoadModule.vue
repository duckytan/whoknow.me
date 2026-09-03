<script setup lang="ts">
/**
 * 双实例负载模块：701-PC（mart + brain）/ DuckyPC（waimai + 根门面）/ 共同改动 的 git 提交分布。
 * 派生自 git 聚合；manual.dualInstanceLoad 非零时以人工值覆盖总量（SYSTEM_DESIGN §6.3）。
 */
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUniverseStore } from '@/stores/universe';
import { deriveInstanceLoad } from '@/services/derive';
import type { InstanceLoadRow, NamedSeries } from '@/types/metrics';
import SectionCard from '@/components/common/SectionCard.vue';
import BarChart from '@/components/charts/BarChart.vue';
import { shortDirName } from '@/services/format';

const universe = useUniverseStore();
const { git, dualInstanceLoad } = storeToRefs(universe);

const rows = computed<InstanceLoadRow[]>(() =>
  deriveInstanceLoad(git.value, dualInstanceLoad.value),
);

const barCategories = computed(() => rows.value.map((r) => r.instance));
const barSeries = computed<NamedSeries[]>(() => [
  { name: '提交数', values: rows.value.map((r) => r.total) },
]);

const hasData = computed(() => git.value.commitsTotal > 0 || rows.value.some((r) => r.total > 0));
</script>

<template>
  <SectionCard
    title="双实例负载"
    subtitle="701-PC / DuckyPC / 共同改动 的 git 提交归属"
    tag="P1"
    tag-color="var(--wb-blue)"
    :footnote="git.degraded ? 'git 聚合降级：提交分布以占位数据呈现' : `仓库总提交 ${git.commitsTotal}`"
  >
    <BarChart
      :categories="barCategories"
      :series="barSeries"
      :height="180"
      horizontal
      :show-legend="false"
    />

    <div class="dil">
      <div v-for="row in rows" :key="row.instance" class="dil__row">
        <div class="dil__head">
          <span class="dil__name">{{ row.instance }}</span>
          <span class="dil__total wb-mono">{{ row.total }}</span>
        </div>
        <p class="dil__scope wb-note">{{ row.scope }}</p>
        <div class="dil__dirs">
          <span v-for="(count, dir) in row.dirs" :key="dir" class="dil__dir">
            {{ shortDirName(dir) }} <b class="wb-mono">{{ count }}</b>
          </span>
          <span v-if="Object.keys(row.dirs).length === 0" class="wb-note">—</span>
        </div>
      </div>
      <p v-if="!hasData" class="wb-note">暂无提交负载数据，请确认仓库可读取 git 历史。</p>
    </div>
  </SectionCard>
</template>

<style scoped>
.dil {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.dil__row {
  background: var(--wb-panel-2);
  border: 1px solid var(--wb-border);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dil__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.dil__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--wb-text);
}

.dil__total {
  font-size: 18px;
  color: var(--wb-blue);
}

.dil__dirs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: 11px;
  color: var(--wb-text-dim);
}

.dil__dir b {
  color: var(--wb-text);
}
</style>
