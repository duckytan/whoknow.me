<script setup lang="ts">
/**
 * 首页 · 宇宙综合面板：组装全部 10 个首页模块（P0 全量 + P1 图表）。
 * 数据由 App.vue 在挂载时统一加载并注入 4 个 store，本页仅消费 store。
 */
import { storeToRefs } from 'pinia';
import { useUniverseStore } from '@/stores/universe';
import { formatDateTime } from '@/services/format';

import UniverseProgressModule from '@/components/modules/UniverseProgressModule.vue';
import AppStatusLightsModule from '@/components/modules/AppStatusLightsModule.vue';
import MilestoneGanttModule from '@/components/modules/MilestoneGanttModule.vue';
import CandidateMatrixModule from '@/components/modules/CandidateMatrixModule.vue';
import RiskBoardModule from '@/components/modules/RiskBoardModule.vue';
import QualityGateModule from '@/components/modules/QualityGateModule.vue';
import HealthRadarModule from '@/components/modules/HealthRadarModule.vue';
import DualInstanceLoadModule from '@/components/modules/DualInstanceLoadModule.vue';
import ContributionActivityModule from '@/components/modules/ContributionActivityModule.vue';
import ContractHubModule from '@/components/modules/ContractHubModule.vue';

const universe = useUniverseStore();
const { overallProgressPct, generatedAt, dataFresh, dataAgeDays, isStale } = storeToRefs(universe);
</script>

<template>
  <div class="home">
    <header class="home__head">
      <div>
        <h1 class="home__title">宇宙综合面板</h1>
        <p class="home__sub">胡闹宇宙项目开发工作台 · 首页 MVP（T01–T04）</p>
      </div>
      <div class="home__status">
        <span class="home__pct wb-mono">{{ overallProgressPct }}%</span>
        <span v-if="isStale" class="home__fresh home__fresh--stale">
          ⚠️ 数据已滞后 {{ dataAgeDays }} 天 · 请在 whoknow-workbench 重跑 npm run gen 并重新部署
        </span>
        <span v-else-if="dataFresh" class="home__ts">数据截至 {{ formatDateTime(generatedAt) }}</span>
        <span v-else class="home__fresh home__fresh--stale">数据缺失</span>
      </div>
    </header>

    <el-row :gutter="16" class="home__row">
      <el-col :xs="24" :lg="8"><UniverseProgressModule /></el-col>
      <el-col :xs="24" :lg="16"><AppStatusLightsModule /></el-col>
    </el-row>

    <el-row :gutter="16" class="home__row">
      <el-col :xs="24"><MilestoneGanttModule /></el-col>
    </el-row>

    <el-row :gutter="16" class="home__row">
      <el-col :xs="24" :lg="12"><CandidateMatrixModule /></el-col>
      <el-col :xs="24" :lg="12"><HealthRadarModule /></el-col>
    </el-row>

    <el-row :gutter="16" class="home__row">
      <el-col :xs="24" :lg="10"><QualityGateModule /></el-col>
      <el-col :xs="24" :lg="14"><RiskBoardModule /></el-col>
    </el-row>

    <el-row :gutter="16" class="home__row">
      <el-col :xs="24" :lg="12"><DualInstanceLoadModule /></el-col>
      <el-col :xs="24" :lg="12"><ContributionActivityModule /></el-col>
    </el-row>

    <el-row :gutter="16" class="home__row">
      <el-col :xs="24"><ContractHubModule /></el-col>
    </el-row>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.home__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.home__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--wb-text);
}

.home__sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--wb-text-muted);
}

.home__status {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.home__pct {
  font-size: 26px;
  font-weight: 700;
  color: var(--wb-green);
}

.home__fresh {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid;
}

.home__fresh--ok {
  color: var(--wb-green);
  border-color: var(--wb-green);
}

.home__fresh--stale {
  color: var(--wb-orange);
  border-color: var(--wb-orange);
}

.home__ts {
  font-size: 12px;
  color: var(--wb-text-muted);
}

.home__row {
  margin-bottom: 0 !important;
}

.home__row :deep(.el-col) {
  margin-bottom: 16px;
}
</style>
