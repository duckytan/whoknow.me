<script setup lang="ts">
/**
 * App 状态灯模块：brain / waimai / mart 三张卡（顺序由 gen-metrics APP_DEFS 决定），
 * 含状态灯、阶段进度、测试通过率、构建结论。
 */
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useAppsStore } from '@/stores/apps';
import type { AppMetrics } from '@/types/metrics';
import SectionCard from '@/components/common/SectionCard.vue';
import StatusLight from '@/components/common/StatusLight.vue';
import {
  appStatusColor,
  appStatusLabel,
  buildStatusLabel,
  buildStatusColor,
  formatPassRatio,
  passPct,
} from '@/services/format';

const router = useRouter();
const apps = useAppsStore();
const { list } = storeToRefs(apps);

function phaseText(app: AppMetrics): string {
  return `阶段 ${app.milestonePhase} / 7 · ${app.progressPct ?? Math.round((app.milestonePhase / 7) * 100)}%`;
}

function openApp(key: string): void {
  router.push(`/app/${key}`);
}
</script>

<template>
  <SectionCard
    title="子项目状态灯"
    subtitle="brain / waimai / mart 运行态一览"
    tag="P0"
    tag-color="var(--wb-green)"
  >
    <div class="asl">
      <article
        v-for="app in list"
        :key="app.appKey"
        class="asl__card asl__card--click"
        role="button"
        tabindex="0"
        @click="openApp(app.appKey)"
        @keyup.enter="openApp(app.appKey)"
      >
        <header class="asl__head">
          <div class="asl__title">
            <span class="asl__name">{{ app.label ?? app.appKey }}</span>
            <span class="asl__key wb-mono">{{ app.appKey }}</span>
          </div>
          <StatusLight :color="appStatusColor(app.appStatus)" :label="appStatusLabel(app.appStatus)" size="md" />
        </header>

        <div class="asl__phase">
          <div class="asl__phase-bar">
            <span
              class="asl__phase-fill"
              :style="{ width: `${app.progressPct ?? 0}%`, background: appStatusColor(app.appStatus) }"
            />
          </div>
          <span class="asl__phase-text">{{ phaseText(app) }}</span>
        </div>

        <dl class="asl__rows">
          <div class="asl__row">
            <dt>自动化测试</dt>
            <dd :class="{ 'asl__ok': app.testTotal > 0 && app.testPass === app.testTotal }">
              {{ formatPassRatio(app.testPass, app.testTotal) }}
            </dd>
          </div>
          <div class="asl__row">
            <dt>构建</dt>
            <dd :style="{ color: buildStatusColor(app.buildStatus) }">{{ buildStatusLabel(app.buildStatus) }}</dd>
          </div>
          <div class="asl__row">
            <dt>通过率</dt>
            <dd>{{ passPct(app.testPass, app.testTotal) }}%</dd>
          </div>
          <div class="asl__row">
            <dt>归属实例</dt>
            <dd>{{ app.ownerInstance ?? '—' }}</dd>
          </div>
        </dl>
        <span class="asl__hint">查看详情 →</span>
      </article>

      <p v-if="list.length === 0" class="wb-note">暂无子项目数据，请确认 metrics.json 已生成。</p>
    </div>
  </SectionCard>
</template>

<style scoped>
.asl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.asl__card {
  background: var(--wb-panel-2);
  border: 1px solid var(--wb-border);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.asl__card--click {
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.asl__card--click:hover {
  border-color: var(--wb-green);
  transform: translateY(-2px);
}

.asl__hint {
  font-size: 11px;
  color: var(--wb-green);
  opacity: 0.8;
}

.asl__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.asl__title {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.asl__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--wb-text);
}

.asl__key {
  font-size: 11px;
  color: var(--wb-text-muted);
}

.asl__phase {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.asl__phase-bar {
  height: 6px;
  border-radius: 3px;
  background: #2a3040;
  overflow: hidden;
}

.asl__phase-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.asl__phase-text {
  font-size: 11px;
  color: var(--wb-text-muted);
}

.asl__rows {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 14px;
  margin: 0;
}

.asl__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.asl__row dt {
  color: var(--wb-text-muted);
}

.asl__row dd {
  margin: 0;
  color: var(--wb-text);
  font-family: 'JetBrains Mono', Consolas, monospace;
}

.asl__ok {
  color: var(--wb-green);
}
</style>
