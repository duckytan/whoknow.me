<script setup lang="ts">
/**
 * 子项目详情页（T05 · SYSTEM_DESIGN §4.2 + PRD §3.4）。
 * 顶部：标题 + 状态灯 + 负责实例 + 关键指标。
 * el-tabs 五 Tab：进度（七阶段 el-steps）/ 质量（测试·构建门）/ 协作（双实例 lane）/ 文档 / 指标（DORA·业务）。
 * brain 专属：契约信封 Tab（6 字段 el-tree + 4 级降级流 + 自动化状态灯）。
 */
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAppsStore } from '@/stores/apps';
import { useUniverseStore } from '@/stores/universe';
import type { EnvelopeDimension, HealthScore, QualityGateRow } from '@/types/metrics';
import SectionCard from '@/components/common/SectionCard.vue';
import StatusLight from '@/components/common/StatusLight.vue';
import MetricCard from '@/components/common/MetricCard.vue';
import {
  appStatusColor,
  appStatusLabel,
  automationLabel,
  automationLight,
  buildStatusColor,
  buildStatusLabel,
  formatPassRatio,
  passPct,
} from '@/services/format';

const route = useRoute();
const apps = useAppsStore();
const universe = useUniverseStore();
const { qualityGate, dualInstanceLoad } = storeToRefs(universe);

const key = computed(() => String(route.params.key ?? ''));
const app = computed(() => apps.get(key.value));
const isBrain = computed(() => key.value === 'brain');
const activeTab = ref('progress');

/** 负责实例：优先取采集值，缺失时按 ROLES 归属兜底（waimai→DuckyPC，mart/brain→701-PC） */
const ownerInstance = computed(() =>
  app.value?.ownerInstance ?? (key.value === 'waimai' ? 'DuckyPC' : '701-PC'),
);

const health = computed<HealthScore | null>(() => (app.value ? apps.health(app.value.appKey) : null));
const qg = computed<QualityGateRow | undefined>(() =>
  qualityGate.value.find((g) => g.app === key.value),
);

// ── 进度：七阶段里程碑 ──────────────────────────────────────
interface PhaseStep {
  title: string;
  status: 'finish' | 'process' | 'wait';
}

const phaseSteps = computed<PhaseStep[]>(() => {
  if (!app.value) return [];
  // waimai：使用真实七阶段表（PROJECT-STATUS 抽取）
  if (key.value === 'waimai' && universe.milestoneGantt.length > 0) {
    return universe.milestoneGantt.map((row) => ({
      title: row.phase,
      status: row.done ? 'finish' : row.status === 'designing' ? 'process' : 'wait',
    }));
  }
  // mart / brain：按 milestonePhase 合成 7 阶段（gen 基线 phase=5 / 2）
  const done = app.value.milestonePhase;
  return Array.from({ length: 7 }, (_, i) => {
    const idx = i + 1;
    if (idx <= done) return { title: `阶段 ${idx}`, status: 'finish' as const };
    if (idx === done + 1) return { title: `阶段 ${idx}`, status: 'process' as const };
    return { title: `阶段 ${idx}`, status: 'wait' as const };
  });
});

// ── 文档：仓库内参考链接（MVP 不对外服务，URL 缺失显示「待补」）────
interface DocLink {
  title: string;
  path: string | null;
}

const docLinks = computed<DocLink[]>(() => {
  const map: Record<string, DocLink[]> = {
    waimai: [
      { title: 'PROJECT-STATUS（七阶段锚）', path: 'docs/studio/PROJECT-STATUS.md' },
      { title: 'STUDIO-PROGRESS', path: 'docs/studio/STUDIO-PROGRESS.md' },
      { title: 'APP-MATRIX-ROADMAP', path: 'docs/studio/APP-MATRIX-ROADMAP.md' },
    ],
    mart: [
      { title: 'GDD · PHASE5-QA', path: 'whoknow-mart/docs/gdd/PHASE5-QA.md' },
      { title: 'PHASE4-GATE', path: 'whoknow-mart/docs/gdd/PHASE4-GATE.md' },
      { title: 'GDD 目录', path: 'whoknow-mart/docs/gdd/' },
    ],
    brain: [
      { title: 'api-spec.md（信封契约）', path: 'whoknow-brain/docs/api-spec.md' },
      { title: 'brain 文档目录', path: 'whoknow-brain/docs/' },
    ],
  };
  return map[key.value] ?? [];
});

// ── 指标：DORA / 业务（null 显示「待建管道」）────────────────
function fmtMetric(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '待建管道';
}

// ── brain 契约信封：el-tree 数据 + 降级流 ─────────────────────
const envelopeTree = computed(() => [
  {
    label: `meta 信封（${apps.contract.envelope.length} 字段）`,
    children: apps.contract.envelope.map((dim: EnvelopeDimension) => ({
      label: `${dim.field} · ${dim.type}`,
      children: [
        { label: `路径：${dim.path}` },
        { label: `枚举：${dim.enumValues.join(' / ') || '—'}` },
        { label: `说明：${dim.note}` },
      ],
    })),
  },
]);

const degradeColor: Record<number, string> = {
  1: 'var(--wb-green)',
  2: 'var(--wb-blue)',
  3: 'var(--wb-orange)',
  4: 'var(--wb-red)',
};

const laneTotal = (instance: '701-PC' | 'DuckyPC'): number =>
  dualInstanceLoad.value[instance] ?? 0;
</script>

<template>
  <div class="detail">
    <nav class="detail__crumb">
      <router-link to="/" class="detail__crumb-link">宇宙综合面板</router-link>
      <span class="detail__crumb-sep">/</span>
      <span class="detail__crumb-cur">子项目详情</span>
    </nav>

    <template v-if="app">
      <!-- 顶部概览 -->
      <SectionCard
        :title="app.label ?? app.appKey"
        :subtitle="`子项目详情 · ${app.appKey}`"
        tag="P0"
        tag-color="var(--wb-green)"
      >
        <div class="detail__head">
          <StatusLight :color="appStatusColor(app.appStatus)" :label="appStatusLabel(app.appStatus)" size="lg" />
          <div class="detail__facts">
            <MetricCard label="阶段完成" :value="`${app.milestonePhase}/7`" :accent="appStatusColor(app.appStatus)" dot-color="var(--wb-green)" />
            <MetricCard label="自动化测试" :value="formatPassRatio(app.testPass, app.testTotal)" accent="var(--wb-purple)" dot-color="var(--wb-purple)" />
            <MetricCard label="通过率" :value="`${passPct(app.testPass, app.testTotal)}%`" accent="var(--wb-text)" />
            <MetricCard label="构建" :value="buildStatusLabel(app.buildStatus)" :accent="buildStatusColor(app.buildStatus)" dot-color="var(--wb-green)" />
            <MetricCard label="负责实例" :value="ownerInstance" accent="var(--wb-blue)" dot-color="var(--wb-blue)" />
          </div>
        </div>
      </SectionCard>

      <!-- Tab 区 -->
      <el-tabs v-model="activeTab" class="detail__tabs">
        <!-- 1. 进度 -->
        <el-tab-pane label="进度" name="progress">
          <div class="detail__pane">
            <h4 class="detail__h">七阶段里程碑</h4>
            <el-steps :active="0" align-center finish-status="success" class="detail__steps">
              <el-step
                v-for="(step, i) in phaseSteps"
                :key="i"
                :title="step.title"
                :status="step.status"
              />
            </el-steps>
            <p class="wb-note">waimai 七阶段由 PROJECT-STATUS 实采；mart / brain 按采集基线合成展示。</p>
          </div>
        </el-tab-pane>

        <!-- 2. 质量 -->
        <el-tab-pane label="质量" name="quality">
          <div class="detail__pane">
            <div class="detail__metric-row">
              <MetricCard
                label="测试通过 / 总数"
                :value="formatPassRatio(app.testPass, app.testTotal)"
                :accent="app.testTotal > 0 && app.testPass === app.testTotal ? 'var(--wb-green)' : 'var(--wb-orange)'"
                dot-color="var(--wb-green)"
              />
              <MetricCard label="通过率" :value="`${passPct(app.testPass, app.testTotal)}%`" accent="var(--wb-text)" />
              <MetricCard label="构建" :value="buildStatusLabel(app.buildStatus)" :accent="buildStatusColor(app.buildStatus)" dot-color="var(--wb-green)" />
            </div>
            <p v-if="qg" class="detail__verdict" :class="qg.verdict === '全绿' ? 'detail__verdict--ok' : 'detail__verdict--warn'">
              质量门结论：{{ qg.verdict }}
            </p>
            <div v-if="health" class="detail__metric-row detail__metric-row--sub">
              <MetricCard label="进度" :value="health.progress" accent="var(--wb-green)" dot-color="var(--wb-green)" />
              <MetricCard label="质量" :value="health.quality" accent="var(--wb-purple)" dot-color="var(--wb-purple)" />
              <MetricCard label="风险" :value="health.risk" accent="var(--wb-orange)" dot-color="var(--wb-orange)" />
              <MetricCard label="协作" :value="health.collab" accent="var(--wb-blue)" dot-color="var(--wb-blue)" />
              <MetricCard label="商业" :value="health.business" accent="var(--wb-text)" dot-color="var(--wb-gray)" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 3. 协作 -->
        <el-tab-pane label="协作" name="collab">
          <div class="detail__pane">
            <div class="detail__lanes">
              <div
                v-for="inst in (['701-PC', 'DuckyPC'] as const)"
                :key="inst"
                class="detail__lane"
                :class="{ 'detail__lane--owner': inst === ownerInstance }"
              >
                <div class="detail__lane-head">
                  <span class="detail__lane-name">{{ inst }}</span>
                  <span v-if="inst === ownerInstance" class="detail__lane-badge">负责</span>
                </div>
                <span class="detail__lane-total wb-mono">{{ laneTotal(inst) }}</span>
                <span class="wb-note">提交（双实例负载派生）</span>
              </div>
            </div>
            <p class="wb-note">
              归属依据 ROLES.md §6.5：waimai→DuckyPC，mart / brain→701-PC；manual.dualInstanceLoad 非零时以人工值覆盖。
            </p>
          </div>
        </el-tab-pane>

        <!-- 4. 文档 -->
        <el-tab-pane label="文档" name="docs">
          <div class="detail__pane">
            <div class="detail__docs">
              <article v-for="doc in docLinks" :key="doc.title" class="detail__doc">
                <span class="detail__doc-title">{{ doc.title }}</span>
                <code v-if="doc.path" class="detail__doc-path wb-mono">{{ doc.path }}</code>
                <span v-else class="detail__doc-missing">待补</span>
              </article>
              <p v-if="docLinks.length === 0" class="wb-note">暂无文档索引。</p>
            </div>
            <p class="wb-note">以上为仓库内相对路径参考（MVP 不对外服务），接入文档站后改为可点击链接。</p>
          </div>
        </el-tab-pane>

        <!-- 5. 指标 -->
        <el-tab-pane label="指标" name="metrics">
          <div class="detail__pane">
            <h4 class="detail__h">DORA</h4>
            <div class="detail__metric-row">
              <MetricCard label="部署频率（次/周期）" :value="fmtMetric(app.dora?.deployFreq)" accent="var(--wb-blue)" dot-color="var(--wb-blue)" />
              <MetricCard label="前置时长（h）" :value="fmtMetric(app.dora?.leadTime)" accent="var(--wb-purple)" dot-color="var(--wb-purple)" />
              <MetricCard label="MTBF（h）" :value="fmtMetric(app.dora?.mtbf)" accent="var(--wb-green)" dot-color="var(--wb-green)" />
              <MetricCard label="MTTR（h）" :value="fmtMetric(app.dora?.mttr)" accent="var(--wb-orange)" dot-color="var(--wb-orange)" />
            </div>
            <h4 class="detail__h">业务指标</h4>
            <div class="detail__metric-row">
              <MetricCard label="笑率" :value="fmtMetric(app.bizMetrics?.laughRate)" accent="var(--wb-yellow)" dot-color="var(--wb-yellow)" />
              <MetricCard label="留存" :value="fmtMetric(app.bizMetrics?.retention)" accent="var(--wb-text)" dot-color="var(--wb-gray)" />
              <MetricCard label="实时进度（%）" :value="fmtMetric(app.realtimeProgressPct)" accent="var(--wb-green)" dot-color="var(--wb-green)" />
            </div>
            <p class="wb-note">无 CI / 业务埋点，DORA 与业务指标管道待建，字段当前为 null。</p>
          </div>
        </el-tab-pane>

        <!-- brain 专属：契约信封 -->
        <el-tab-pane v-if="isBrain" label="契约信封" name="envelope">
          <div class="detail__pane">
            <div class="detail__env-head">
              <StatusLight
                :status="automationLight(apps.brainEnvelopeAutomation)"
                :label="automationLabel(apps.brainEnvelopeAutomation)"
                :caption="`信封自动化 · ${apps.contract.automation}`"
              />
              <span class="wb-note">{{ apps.contract.specRef }} · {{ apps.contract.specVersion }}</span>
            </div>
            <el-tree :data="envelopeTree" :props="{ label: 'label', children: 'children' }" default-expand-all class="detail__tree" />
            <h4 class="detail__h">四级降级策略</h4>
            <ul class="detail__degrade">
              <li v-for="lvl in apps.contract.degrade" :key="lvl.level" class="detail__degrade-item">
                <span class="detail__degrade-dot" :style="{ background: degradeColor[lvl.depth] }" />
                <div class="detail__degrade-body">
                  <span class="detail__degrade-lvl">{{ lvl.level }} · {{ lvl.watermark }}</span>
                  <span class="wb-note">{{ lvl.trigger }} → 数据源：{{ lvl.dataSource }}</span>
                </div>
              </li>
            </ul>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <SectionCard v-else title="未找到子项目" :subtitle="`key=${key || '空'}`">
      <p class="wb-note">该子项目不在已立项清单（waimai / mart / brain）中。请从导航栏或首页卡片进入。</p>
    </SectionCard>
  </div>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail__crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.detail__crumb-link {
  color: var(--wb-text-dim);
}

.detail__crumb-link:hover {
  color: var(--wb-green);
}

.detail__crumb-sep {
  color: var(--wb-text-muted);
}

.detail__crumb-cur {
  color: var(--wb-text);
}

.detail__head {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.detail__facts {
  display: grid;
  grid-template-columns: repeat(5, minmax(110px, 1fr));
  gap: 10px;
  flex: 1 1 auto;
  min-width: 280px;
}

.detail__tabs {
  --el-color-primary: var(--wb-green);
}

.detail__tabs :deep(.el-tabs__item) {
  color: var(--wb-text-dim);
}

.detail__tabs :deep(.el-tabs__item.is-active) {
  color: var(--wb-green);
}

.detail__tabs :deep(.el-tabs__nav-wrap::after) {
  background: var(--wb-border);
}

.detail__pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 6px;
}

.detail__h {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--wb-text);
}

.detail__steps {
  margin: 8px 0 4px;
}

.detail__steps :deep(.el-step__title) {
  font-size: 12px;
}

.detail__metric-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.detail__metric-row--sub {
  margin-top: 4px;
}

.detail__verdict {
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--wb-border);
}

.detail__verdict--ok {
  color: var(--wb-green);
  border-color: var(--wb-green);
}

.detail__verdict--warn {
  color: var(--wb-orange);
  border-color: var(--wb-orange);
}

.detail__lanes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.detail__lane {
  background: var(--wb-panel-2);
  border: 1px solid var(--wb-border);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail__lane--owner {
  border-color: var(--wb-blue);
  box-shadow: 0 0 0 1px var(--wb-blue) inset;
}

.detail__lane-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail__lane-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--wb-text);
}

.detail__lane-badge {
  font-size: 11px;
  color: #0f1117;
  background: var(--wb-blue);
  border-radius: 4px;
  padding: 1px 6px;
}

.detail__lane-total {
  font-size: 22px;
  color: var(--wb-blue);
}

.detail__docs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.detail__doc {
  background: var(--wb-panel-2);
  border: 1px solid var(--wb-border);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail__doc-title {
  font-size: 13px;
  color: var(--wb-text);
}

.detail__doc-path {
  font-size: 11px;
  color: var(--wb-text-muted);
  word-break: break-all;
}

.detail__doc-missing {
  font-size: 12px;
  color: var(--wb-orange);
}

.detail__env-head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.detail__tree {
  background: var(--wb-panel-2);
  border: 1px solid var(--wb-border);
  border-radius: 8px;
  padding: 8px 12px;
  --el-color-primary: var(--wb-green);
}

.detail__tree :deep(.el-tree-node__label) {
  color: var(--wb-text-dim);
  font-size: 12px;
}

.detail__degrade {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail__degrade-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  background: var(--wb-panel-2);
  border: 1px solid var(--wb-border);
  border-radius: 8px;
}

.detail__degrade-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.detail__degrade-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.detail__degrade-lvl {
  font-size: 13px;
  color: var(--wb-text);
  font-weight: 600;
}
</style>
