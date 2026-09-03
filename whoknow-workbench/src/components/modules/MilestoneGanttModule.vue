<script setup lang="ts">
/**
 * 里程碑甘特模块：waimai 七阶段 + 候选 8 大类解锁窗口 + 金克木解锁门禁行。
 */
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUniverseStore } from '@/stores/universe';
import { useCandidatesStore } from '@/stores/candidates';
import { deriveGanttRows } from '@/services/derive';
import type { GanttRow } from '@/types/metrics';
import SectionCard from '@/components/common/SectionCard.vue';
import GanttChart from '@/components/charts/GanttChart.vue';

const universe = useUniverseStore();
const candidates = useCandidatesStore();
const { milestoneGantt } = storeToRefs(universe);
const { categories, gateOpen } = storeToRefs(candidates);

const rows = computed<GanttRow[]>(() =>
  deriveGanttRows(milestoneGantt.value, categories.value, gateOpen.value),
);

const height = computed(() => Math.max(260, rows.value.length * 30 + 60));
</script>

<template>
  <SectionCard
    title="里程碑甘特"
    subtitle="胡闹外卖七阶段 · 8 大类成簇解锁 · 金克木门禁"
    tag="P0"
    tag-color="var(--wb-green)"
    :footnote="gateOpen ? '解锁门禁：已满足前置条件' : '金克木硬约束：waimai 真机 playtest PASS + mart v1 跑通前禁止候选进入 Phase 1'"
  >
    <GanttChart :rows="rows" :height="height" />
  </SectionCard>
</template>
