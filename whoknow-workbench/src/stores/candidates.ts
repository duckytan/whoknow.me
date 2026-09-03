/**
 * 候选矩阵 store：16 款候选 / 8 大类聚类 / 成簇解锁门禁。
 */

import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { CandidateApp, CategoryCluster, WorkbenchData } from '@/types/metrics';

export const useCandidatesStore = defineStore('candidates', () => {
  const total = ref(0);
  const categories = ref<CategoryCluster[]>([]);

  const categoryCount = computed(() => categories.value.length);

  const members = computed<CandidateApp[]>(() =>
    categories.value.flatMap((cluster) => cluster.members),
  );

  const gateOpen = computed(() => categories.value.some((c) => c.unlockGate.status));

  const tierBuckets = computed<Record<string, CandidateApp[]>>(() => {
    const out: Record<string, CandidateApp[]> = { M2: [], M3: [], M4: [] };
    for (const member of members.value) {
      const tier = member.unlockTier ?? 'M4';
      (out[tier] ??= []).push(member);
    }
    return out;
  });

  function byCategory(categoryId: string): CategoryCluster | null {
    return categories.value.find((c) => c.id === categoryId) ?? null;
  }

  function hydrate(data: WorkbenchData): void {
    total.value = data.candidates.total;
    categories.value = data.candidates.categories;
  }

  return {
    total,
    categories,
    categoryCount,
    members,
    gateOpen,
    tierBuckets,
    byCategory,
    hydrate,
  };
});
