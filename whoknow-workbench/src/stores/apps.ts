/**
 * 子项目 store：waimai / mart / brain 的 A 类采集 + B 类人工维护切片。
 */

import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type {
  AppMetrics,
  AutomationStatus,
  ContractHub,
  HealthScore,
  PlaytestGrade,
  WorkbenchData,
} from '@/types/metrics';
import { createEmptyData } from '@/services/dataLoader';

const ZERO_HEALTH: HealthScore = { progress: 0, quality: 0, risk: 0, collab: 0, business: 0 };

export const useAppsStore = defineStore('apps', () => {
  const list = ref<AppMetrics[]>([]);
  const healthScore = ref<Record<string, HealthScore>>({});
  const playtestResult = ref<Record<string, PlaytestGrade | null>>({});
  const brainEnvelopeAutomation = ref<AutomationStatus>('paused');
  const contract = ref<ContractHub>(createEmptyData().contract);

  const keys = computed(() => list.value.map((a) => a.appKey));

  const byKey = computed<Record<string, AppMetrics>>(() => {
    const out: Record<string, AppMetrics> = {};
    for (const app of list.value) out[app.appKey] = app;
    return out;
  });

  function get(key: string): AppMetrics | null {
    return byKey.value[key] ?? null;
  }

  function health(key: string): HealthScore {
    return healthScore.value[key] ?? ZERO_HEALTH;
  }

  function playtest(key: string): PlaytestGrade | null {
    return playtestResult.value[key] ?? null;
  }

  function hydrate(data: WorkbenchData): void {
    list.value = data.apps;
    healthScore.value = data.manual.healthScore;
    playtestResult.value = data.manual.playtestResult;
    brainEnvelopeAutomation.value = data.manual.brainEnvelopeAutomation;
    contract.value = data.contract;
  }

  return {
    list,
    healthScore,
    playtestResult,
    brainEnvelopeAutomation,
    contract,
    keys,
    byKey,
    get,
    health,
    playtest,
    hydrate,
  };
});
