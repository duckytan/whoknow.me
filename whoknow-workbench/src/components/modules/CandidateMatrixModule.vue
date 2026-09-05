<script setup lang="ts">
/**
 * 候选矩阵聚类模块：16 款候选 / 8 大类成簇解锁总览，含每类成员数与门禁状态 + 推进漏斗。
 */
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useCandidatesStore } from '@/stores/candidates';
import { useAppsStore } from '@/stores/apps';
import { useUniverseStore } from '@/stores/universe';
import { useRouter } from 'vue-router';
import { deriveFunnel } from '@/services/derive';
import type { LightStatus, NamedValue } from '@/types/metrics';
import SectionCard from '@/components/common/SectionCard.vue';
import RingChart from '@/components/charts/RingChart.vue';
import FunnelChart from '@/components/charts/FunnelChart.vue';
import StatusLight from '@/components/common/StatusLight.vue';
import { reuseStars } from '@/services/format';
import { useSkinStore } from '@/stores/skin';

const router = useRouter();
const candidates = useCandidatesStore();
const apps = useAppsStore();
const universe = useUniverseStore();
const { total, categories, gateOpen } = storeToRefs(candidates);
const { list } = storeToRefs(apps);
const { liveCount } = storeToRefs(universe);

/* 数据序列色单一真源 = skin store 的 chartTokens.series（跨皮肤恒定，由 --wb-* 解析） */
const ringColor = useSkinStore().chartTokens.series;

const ringItems = computed<NamedValue[]>(() =>
  categories.value.map((cluster, idx) => ({
    name: cluster.id,
    value: cluster.members.length,
    color: ringColor[idx % ringColor.length],
  })),
);

const clustered = computed(() => categories.value.reduce((sum, c) => sum + c.members.length, 0));
const funnelItems = computed<NamedValue[]>(() =>
  deriveFunnel(total.value, clustered.value, list.value.length, liveCount.value),
);

function gateLight(open: boolean): LightStatus {
  return open ? 'on' : 'off';
}

function openCategory(id: string): void {
  router.push(`/candidates/${id}`);
}
</script>

<template>
  <SectionCard
    title="候选矩阵聚类"
    :subtitle="`${total} 款候选 · ${categories.length} 大类成簇 · 门禁${gateOpen ? '已解锁' : '冻结中'}`"
    tag="P0"
    tag-color="var(--wb-purple)"
  >
    <div class="cm">
      <div class="cm__charts">
        <div class="cm__ring">
          <RingChart :items="ringItems" :height="190" center-label="各大类成员数" />
        </div>
        <div class="cm__funnel">
          <FunnelChart :items="funnelItems" :height="190" />
        </div>
      </div>
      <div class="cm__list">
        <button
          v-for="cluster in categories"
          :key="cluster.id"
          type="button"
          class="cm__item"
          @click="openCategory(cluster.id)"
        >
          <div class="cm__item-head">
            <span class="cm__item-name">{{ cluster.name }}</span>
            <StatusLight :status="gateLight(cluster.unlockGate.status)" size="sm" />
          </div>
          <span class="cm__item-count">{{ cluster.members.length }} 款</span>
          <div class="cm__members">
            <span v-for="member in cluster.members.slice(0, 6)" :key="member.code" class="cm__member">
              {{ member.name }}
              <span class="cm__stars" :title="`复用度 ${member.reuseLevel}`">{{ reuseStars(member.reuseLevel) }}</span>
            </span>
            <span v-if="cluster.members.length > 6" class="cm__more">+{{ cluster.members.length - 6 }}</span>
          </div>
        </button>
        <p v-if="categories.length === 0" class="wb-note">暂无候选聚类数据。</p>
      </div>
    </div>
  </SectionCard>
</template>

<style scoped>
.cm {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cm__charts {
  display: flex;
  gap: 16px;
  align-items: center;
}

.cm__ring,
.cm__funnel {
  flex: 1 1 50%;
  min-width: 0;
}

.cm__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.cm__item {
  text-align: left;
  background: var(--wb-panel-2);
  border: 1px solid var(--wb-border);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--wb-text);
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.cm__item:hover {
  border-color: var(--wb-purple);
  transform: translateY(-2px);
}

.cm__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cm__item-name {
  font-size: 13px;
  font-weight: 600;
}

.cm__item-count {
  font-size: 12px;
  color: var(--wb-text-muted);
  font-family: 'JetBrains Mono', Consolas, monospace;
}

.cm__members {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.cm__member {
  font-size: 11px;
  color: var(--wb-text-dim);
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.cm__stars {
  color: var(--wb-yellow);
  letter-spacing: -1px;
}

.cm__more {
  font-size: 11px;
  color: var(--wb-text-muted);
}

@media (max-width: 760px) {
  .cm__charts {
    flex-direction: column;
  }
}
</style>
