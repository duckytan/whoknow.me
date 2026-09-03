/**
 * 治理 store：宪法三层（L1 真铁律 / L2 强约定 / L3 当前纪律）+ 红线清单 + 解锁门禁。
 * L1 红线按 SYSTEM_DESIGN §4.4 逐条绑定状态灯（已采纳默认决策 5）。
 */

import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { DataNote, GateInfo, LawStatus, RedLight, WorkbenchData } from '@/types/metrics';

const DEFAULT_GATE: GateInfo = {
  status: false,
  condition: '金克木硬约束：waimai 真机 playtest PASS + mart v1 跑通',
  prerequisites: ['waimai 真机 playtest 硬闸门 PASS', 'mart v1 跑通验证'],
  frozenBy: '总纲 §2 金克木·克制扩张',
};

export const useGovernanceStore = defineStore('governance', () => {
  const l1 = ref<LawStatus[]>([]);
  const l2 = ref<LawStatus[]>([]);
  const l3 = ref<LawStatus[]>([]);
  const redLights = ref<RedLight[]>([]);
  const gate = ref<GateInfo>(DEFAULT_GATE);
  const notes = ref<DataNote[]>([]);

  const redOnCount = computed(() => redLights.value.filter((r) => r.status === 'on').length);
  const redPartialCount = computed(() => redLights.value.filter((r) => r.status === 'partial').length);
  const redOffCount = computed(() => redLights.value.filter((r) => r.status === 'off').length);

  /** 整体灯：存在 off 即红，存在 partial 即黄，否则绿 */
  function overallLight(items: LawStatus[]): 'on' | 'partial' | 'off' {
    if (items.length === 0) return 'off';
    if (items.some((i) => i.status === 'off')) return 'off';
    if (items.some((i) => i.status === 'partial')) return 'partial';
    return 'on';
  }

  const l1Light = computed(() => overallLight(l1.value));
  const l2Light = computed(() => overallLight(l2.value));
  const l3Light = computed(() => overallLight(l3.value));

  const warnNotes = computed(() => notes.value.filter((n) => n.severity === 'warn'));

  function hydrate(data: WorkbenchData): void {
    l1.value = data.governance.l1;
    l2.value = data.governance.l2;
    l3.value = data.governance.l3;
    redLights.value = data.governance.redLights;
    gate.value = data.governance.gate ?? DEFAULT_GATE;
    notes.value = data.notes;
  }

  return {
    l1,
    l2,
    l3,
    redLights,
    gate,
    notes,
    redOnCount,
    redPartialCount,
    redOffCount,
    l1Light,
    l2Light,
    l3Light,
    warnNotes,
    overallLight,
    hydrate,
  };
});
