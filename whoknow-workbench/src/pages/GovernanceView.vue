<script setup lang="ts">
/**
 * 治理透视页（T06 · SYSTEM_DESIGN §4.4）。
 * L1Panel（RedLight 五条逐条状态灯）+ L2/L3Panel（整体灯 + 列表）+ GatePanel（金克木冻结 + 解锁前提）
 * + 数据口径备注（客观呈现 brain src 口径冲突）。
 */
import { storeToRefs } from 'pinia';
import { useGovernanceStore } from '@/stores/governance';
import SectionCard from '@/components/common/SectionCard.vue';
import StatusLight from '@/components/common/StatusLight.vue';
import { lightLabel } from '@/services/format';

const governance = useGovernanceStore();
const { l1, l2, l3, redLights, gate, notes, l1Light, l2Light, l3Light } = storeToRefs(governance);

const subPanels = [
  { key: 'l2' as const, title: 'L2 强约定', caption: '工程硬约束', light: l2Light, list: l2 },
  { key: 'l3' as const, title: 'L3 当前纪律', caption: '协作纪律', light: l3Light, list: l3 },
];
</script>

<template>
  <div class="gov">
    <nav class="gov__crumb">
      <router-link to="/" class="gov__crumb-link">宇宙综合面板</router-link>
      <span class="gov__crumb-sep">/</span>
      <span class="gov__crumb-cur">治理透视</span>
    </nav>

    <!-- GatePanel：金克木冻结 + 解锁前提 -->
    <SectionCard
      title="解锁门禁 GatePanel"
      :subtitle="gate.frozenBy"
      tag="P0"
      tag-color="var(--wb-red)"
      :footnote="gate.condition"
    >
      <div class="gov__gate">
        <StatusLight
          :status="gate.status ? 'on' : 'off'"
          :label="gate.status ? '门禁已解锁' : '门禁冻结（金克木）'"
          size="lg"
        />
        <ul class="gov__prereq">
          <li v-for="pre in gate.prerequisites" :key="pre" class="wb-note">前置：{{ pre }}</li>
        </ul>
      </div>
    </SectionCard>

    <!-- L1Panel：RedLight 五条逐条状态灯 -->
    <SectionCard
      title="L1Panel · 风险红线"
      :subtitle="`RedLight 五条逐条绑定状态灯 · 整体${lightLabel(l1Light)}`"
      tag="P0"
      tag-color="var(--wb-red)"
    >
      <ul class="gov__list">
        <li v-for="light in redLights" :key="light.id" class="gov__item">
          <StatusLight :status="light.status" size="sm" :caption="light.id" />
          <div class="gov__body">
            <span class="gov__title">{{ light.title }}</span>
            <span class="gov__evidence">{{ light.evidence }}</span>
          </div>
        </li>
        <li v-if="redLights.length === 0" class="wb-note">暂无红线数据。</li>
      </ul>
    </SectionCard>

    <!-- L2Panel -->
    <SectionCard
      title="L2Panel · 强约定"
      :subtitle="`工程硬约束 · 整体${lightLabel(l2Light)}`"
      tag="P1"
      tag-color="var(--wb-purple)"
    >
      <ul class="gov__list">
        <li v-for="law in l2" :key="law.id" class="gov__item">
          <StatusLight :status="law.status" size="sm" :caption="law.id" />
          <span class="gov__title">{{ law.title }}</span>
        </li>
        <li v-if="l2.length === 0" class="wb-note">暂无条目。</li>
      </ul>
    </SectionCard>

    <!-- L3Panel -->
    <SectionCard
      title="L3Panel · 当前纪律"
      :subtitle="`协作纪律 · 整体${lightLabel(l3Light)}`"
      tag="P1"
      tag-color="var(--wb-purple)"
    >
      <ul class="gov__list">
        <li v-for="law in l3" :key="law.id" class="gov__item">
          <StatusLight :status="law.status" size="sm" :caption="law.id" />
          <span class="gov__title">{{ law.title }}</span>
        </li>
        <li v-if="l3.length === 0" class="wb-note">暂无条目。</li>
      </ul>
    </SectionCard>

    <!-- 数据口径备注：客观呈现 brain src 冲突等 -->
    <SectionCard title="数据口径备注" subtitle="冲突与待核实项（客观呈现）" tag="P1" tag-color="var(--wb-orange)">
      <ul class="gov__notes">
        <li v-for="note in notes" :key="note.id" class="gov__note" :class="note.severity === 'warn' ? 'gov__note--warn' : ''">
          <span class="gov__note-scope">[{{ note.scope }}]</span> {{ note.text }}
        </li>
        <li v-if="notes.length === 0" class="wb-note">暂无备注。</li>
      </ul>
    </SectionCard>
  </div>
</template>

<style scoped>
.gov {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.gov__crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.gov__crumb-link {
  color: var(--wb-text-dim);
}

.gov__crumb-link:hover {
  color: var(--wb-green);
}

.gov__crumb-sep {
  color: var(--wb-text-muted);
}

.gov__crumb-cur {
  color: var(--wb-text);
}

.gov__gate {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gov__prereq {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.gov__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
}

.gov__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  background: var(--wb-panel-2);
  border: 1px solid var(--wb-border);
  border-radius: 8px;
}

.gov__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.gov__title {
  font-size: 13px;
  color: var(--wb-text);
}

.gov__evidence {
  font-size: 11px;
  line-height: 1.45;
  color: var(--wb-text-muted);
}

.gov__notes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gov__note {
  font-size: 12px;
  line-height: 1.55;
  color: var(--wb-text-dim);
  padding: 8px 10px;
  background: var(--wb-panel-2);
  border: 1px solid var(--wb-border);
  border-radius: 8px;
}

.gov__note--warn {
  border-color: var(--wb-orange);
  color: var(--wb-text);
}

.gov__note-scope {
  color: var(--wb-purple);
  font-family: 'JetBrains Mono', Consolas, monospace;
}
</style>
