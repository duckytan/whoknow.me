/**
 * 宇宙总览 store：整体进度 / App 状态灯 / 里程碑 / 质量门 / 风险 / git 聚合。
 */

import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type {
  AppMetrics,
  DataNote,
  DualInstanceLoad,
  GitAggregate,
  MetricsSource,
  MilestonePhaseRow,
  QualityGateRow,
  RedLight,
  WorkbenchData,
} from '@/types/metrics';
import { createEmptyBundle } from '@/services/dataLoader';

const EMPTY_LOAD: DualInstanceLoad = { '701-PC': 0, DuckyPC: 0 };

export const useUniverseStore = defineStore('universe', () => {
  const empty = createEmptyBundle();

  const loaded = ref(false);
  const loading = ref(false);
  const errorMessages = ref<string[]>([]);
  const schemaVersion = ref(empty.schemaVersion);
  const generatedAt = ref(empty.generatedAt);
  const source = ref<MetricsSource>(empty.source);
  const overallProgressPct = ref(empty.universe.overallProgressPct);
  const appStatusLights = ref<AppMetrics[]>([]);
  const milestoneGantt = ref<MilestonePhaseRow[]>([]);
  const riskBoard = ref<RedLight[]>([]);
  const qualityGate = ref<QualityGateRow[]>([]);
  const git = ref<GitAggregate>(empty.universe.git);
  const dualInstanceLoad = ref<DualInstanceLoad>(EMPTY_LOAD);
  const notes = ref<DataNote[]>([]);

  const liveCount = computed(() => appStatusLights.value.filter((a) => a.appStatus === 'live').length);
  const designingCount = computed(
    () => appStatusLights.value.filter((a) => a.appStatus === 'designing').length,
  );
  const planningCount = computed(
    () => appStatusLights.value.filter((a) => a.appStatus === 'planning').length,
  );

  const totalTestPass = computed(() => qualityGate.value.reduce((sum, g) => sum + g.pass, 0));
  const totalTestTotal = computed(() => qualityGate.value.reduce((sum, g) => sum + g.total, 0));

  const dataFresh = computed(() => Boolean(generatedAt.value) && schemaVersion.value !== 'unavailable');

  function hydrate(data: WorkbenchData): void {
    schemaVersion.value = data.schemaVersion;
    generatedAt.value = data.generatedAt;
    source.value = data.source;
    overallProgressPct.value = data.universe.overallProgressPct;
    appStatusLights.value = data.universe.appStatusLights;
    milestoneGantt.value = data.universe.milestoneGantt;
    riskBoard.value = data.universe.riskBoard;
    qualityGate.value = data.universe.qualityGate;
    git.value = data.universe.git;
    dualInstanceLoad.value = data.manual.dualInstanceLoad;
    notes.value = data.notes;
    loaded.value = true;
  }

  function setLoading(value: boolean): void {
    loading.value = value;
  }

  function setErrors(messages: string[]): void {
    errorMessages.value = messages;
  }

  return {
    loaded,
    loading,
    errorMessages,
    schemaVersion,
    generatedAt,
    source,
    overallProgressPct,
    appStatusLights,
    milestoneGantt,
    riskBoard,
    qualityGate,
    git,
    dualInstanceLoad,
    notes,
    liveCount,
    designingCount,
    planningCount,
    totalTestPass,
    totalTestTotal,
    dataFresh,
    hydrate,
    setLoading,
    setErrors,
  };
});
