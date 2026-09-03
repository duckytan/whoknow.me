<script setup lang="ts">
/**
 * 风险红线看板模块：L1 真铁律 5 条状态灯 + 整体落地统计。
 * L1 五条逐条绑定状态灯（SYSTEM_DESIGN §4.4 + 默认决策 5）。
 */
import { storeToRefs } from 'pinia';
import { useGovernanceStore } from '@/stores/governance';
import SectionCard from '@/components/common/SectionCard.vue';
import StatusLight from '@/components/common/StatusLight.vue';
import MetricCard from '@/components/common/MetricCard.vue';
import { lightColor } from '@/services/format';

const governance = useGovernanceStore();
const { redLights, redOnCount, redPartialCount, redOffCount, l1Light } = storeToRefs(governance);
</script>

<template>
  <SectionCard
    title="风险红线看板"
    subtitle="L1 真铁律 5 条 · 逐条绑定状态灯"
    tag="P0"
    tag-color="var(--wb-red)"
    :footnote="`整体落地灯：${l1Light === 'on' ? '全绿' : l1Light === 'partial' ? '部分落地' : '存在未落地'}`"
  >
    <div class="rb">
      <div class="rb__summary">
        <MetricCard label="已落地" :value="redOnCount" unit="条" accent="var(--wb-green)" dot-color="var(--wb-green)" />
        <MetricCard
          label="部分落地"
          :value="redPartialCount"
          unit="条"
          accent="var(--wb-orange)"
          dot-color="var(--wb-orange)"
        />
        <MetricCard label="未落地" :value="redOffCount" unit="条" accent="var(--wb-red)" dot-color="var(--wb-red)" />
      </div>
      <ul class="rb__list">
        <li v-for="light in redLights" :key="light.id" class="rb__item">
          <StatusLight :status="light.status" size="sm" :caption="light.id" />
          <div class="rb__body">
            <span class="rb__title">{{ light.title }}</span>
            <span class="rb__evidence" :style="{ color: lightColor(light.status) }">{{ light.evidence }}</span>
          </div>
        </li>
        <li v-if="redLights.length === 0" class="rb__empty wb-note">暂无红线数据。</li>
      </ul>
    </div>
  </SectionCard>
</template>

<style scoped>
.rb {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rb__summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.rb__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rb__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  background: var(--wb-panel-2);
  border: 1px solid var(--wb-border);
  border-radius: 8px;
}

.rb__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.rb__title {
  font-size: 13px;
  color: var(--wb-text);
}

.rb__evidence {
  font-size: 11px;
  line-height: 1.45;
  opacity: 0.85;
}

.rb__empty {
  padding: 8px 0;
}
</style>
