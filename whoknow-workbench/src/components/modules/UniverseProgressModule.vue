<script setup lang="ts">
/**
 * 宇宙整体进度模块：整体完成度环图 + 三态（已上线 / 设计中 / 规划中）计数。
 */
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUniverseStore } from '@/stores/universe';
import type { NamedValue } from '@/types/metrics';
import { BRAND_ANCHORS, FIXED_COLORS } from '@/components/charts/palette';
import SectionCard from '@/components/common/SectionCard.vue';
import RingChart from '@/components/charts/RingChart.vue';
import MetricCard from '@/components/common/MetricCard.vue';
import { formatPercent } from '@/services/format';

const universe = useUniverseStore();
const { overallProgressPct, liveCount, designingCount, planningCount } = storeToRefs(universe);

const ringItems = computed<NamedValue[]>(() => [
  { name: '已上线', value: liveCount.value, color: BRAND_ANCHORS.green },
  { name: '设计中', value: designingCount.value, color: BRAND_ANCHORS.orange },
  { name: '规划中', value: planningCount.value, color: FIXED_COLORS.gray },
]);
</script>

<template>
  <SectionCard
    title="宇宙整体进度"
    :subtitle="`三子项目平均阶段完成度 · ${formatPercent(overallProgressPct)}`"
    tag="P0"
    tag-color="var(--wb-green)"
  >
    <div class="up">
      <div class="up__ring">
        <RingChart
          :items="ringItems"
          :height="200"
          :center-value="`${overallProgressPct}%`"
          center-label="整体进度"
          :show-legend="true"
        />
      </div>
      <div class="up__metrics">
        <MetricCard
          label="已上线"
          :value="liveCount"
          unit="个"
          accent="var(--wb-green)"
          dot-color="var(--wb-green)"
          caption="waimai 已交付"
        />
        <MetricCard
          label="设计中"
          :value="designingCount"
          unit="个"
          accent="var(--wb-orange)"
          dot-color="var(--wb-orange)"
          caption="mart 设计推进"
        />
        <MetricCard
          label="规划中"
          :value="planningCount"
          unit="个"
          accent="var(--wb-text-muted)"
          dot-color="var(--wb-gray)"
          caption="brain 规划基线"
        />
      </div>
    </div>
  </SectionCard>
</template>

<style scoped>
.up {
  display: flex;
  gap: 14px;
  align-items: center;
}

.up__ring {
  flex: 1 1 52%;
  min-width: 0;
}

.up__metrics {
  flex: 1 1 48%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

@media (max-width: 760px) {
  .up {
    flex-direction: column;
  }
}
</style>
