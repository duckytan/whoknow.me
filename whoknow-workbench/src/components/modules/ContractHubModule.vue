<script setup lang="ts">
/**
 * 契约中枢透视模块：brain 信封字段（6 维）+ 四级降级策略 + 自动化状态。
 * 依据 api-spec.md + roadmap §5，manual.json 维护（SYSTEM_DESIGN §4.5）。
 */
import { storeToRefs } from 'pinia';
import { useAppsStore } from '@/stores/apps';
import SectionCard from '@/components/common/SectionCard.vue';
import StatusLight from '@/components/common/StatusLight.vue';
import { automationLabel, automationLight } from '@/services/format';

const apps = useAppsStore();
const { contract, brainEnvelopeAutomation } = storeToRefs(apps);

const degradeColor: Record<number, string> = {
  1: 'var(--wb-green)',
  2: 'var(--wb-blue)',
  3: 'var(--wb-orange)',
  4: 'var(--wb-red)',
};
</script>

<template>
  <SectionCard
    title="契约中枢透视"
    subtitle="brain 信封字段 · 四级降级策略"
    tag="P1"
    tag-color="var(--wb-purple)"
    :footnote="`契约出处 ${contract.specRef} · 版本 ${contract.specVersion}`"
  >
    <div class="ch">
      <div class="ch__automation">
        <StatusLight
          :status="automationLight(brainEnvelopeAutomation)"
          :label="automationLabel(brainEnvelopeAutomation)"
          :caption="`信封自动化 · ${contract.automation}`"
        />
      </div>

      <section class="ch__block">
        <h4 class="ch__h">信封字段（meta 契约）</h4>
        <table class="ch__table">
          <thead>
            <tr>
              <th>字段</th>
              <th>类型</th>
              <th>枚举 / 取值</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dim in contract.envelope" :key="dim.field">
              <td class="wb-mono">{{ dim.field }}</td>
              <td>{{ dim.type }}</td>
              <td class="ch__enum">{{ dim.enumValues.join(' · ') }}</td>
              <td class="wb-note">{{ dim.note }}</td>
            </tr>
            <tr v-if="contract.envelope.length === 0">
              <td colspan="4" class="wb-note">暂无信封字段定义。</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="ch__block">
        <h4 class="ch__h">四级降级策略</h4>
        <ul class="ch__degrade">
          <li v-for="lvl in contract.degrade" :key="lvl.level" class="ch__degrade-item">
            <span class="ch__degrade-dot" :style="{ background: degradeColor[lvl.depth] }" />
            <div class="ch__degrade-body">
              <span class="ch__degrade-lvl">{{ lvl.level }} · {{ lvl.watermark }}</span>
              <span class="wb-note">{{ lvl.trigger }} → 数据源：{{ lvl.dataSource }}</span>
            </div>
          </li>
          <li v-if="contract.degrade.length === 0" class="wb-note">暂无降级策略定义。</li>
        </ul>
      </section>
    </div>
  </SectionCard>
</template>

<style scoped>
.ch {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ch__automation {
  padding: 8px 12px;
  background: var(--wb-panel-2);
  border: 1px solid var(--wb-border);
  border-radius: 8px;
}

.ch__block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ch__h {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--wb-text);
}

.ch__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.ch__table th,
.ch__table td {
  text-align: left;
  padding: 7px 8px;
  border-bottom: 1px solid var(--wb-border-soft);
  color: var(--wb-text-dim);
  vertical-align: top;
}

.ch__table th {
  color: var(--wb-text-muted);
  font-weight: 600;
}

.ch__enum {
  color: var(--wb-text);
}

.ch__degrade {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ch__degrade-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  background: var(--wb-panel-2);
  border: 1px solid var(--wb-border);
  border-radius: 8px;
}

.ch__degrade-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.ch__degrade-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ch__degrade-lvl {
  font-size: 13px;
  color: var(--wb-text);
  font-weight: 600;
}
</style>
