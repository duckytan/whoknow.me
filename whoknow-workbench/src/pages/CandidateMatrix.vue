<script setup lang="ts">
/**
 * 候选矩阵页（T06 · SYSTEM_DESIGN §4.3）。
 * 顶部推进漏斗 + 8 大类 MatrixClusterCard 簇（成员数 / 复用度 / 门禁状态），点击簇进入成员清单。
 */
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useCandidatesStore } from '@/stores/candidates';
import { useAppsStore } from '@/stores/apps';
import { useUniverseStore } from '@/stores/universe';
import { deriveFunnel } from '@/services/derive';
import type { CategoryCluster, LightStatus, NamedValue } from '@/types/metrics';
import SectionCard from '@/components/common/SectionCard.vue';
import FunnelChart from '@/components/charts/FunnelChart.vue';
import StatusLight from '@/components/common/StatusLight.vue';
import { reuseStars } from '@/services/format';

const router = useRouter();
const candidates = useCandidatesStore();
const apps = useAppsStore();
const universe = useUniverseStore();
const { total, categories, gateOpen } = storeToRefs(candidates);
const { list } = storeToRefs(apps);
const { liveCount } = storeToRefs(universe);

function gateLight(open: boolean): LightStatus {
  return open ? 'on' : 'off';
}

function avgReuse(cluster: CategoryCluster): number {
  if (cluster.members.length === 0) return 0;
  return Math.round(cluster.members.reduce((sum, m) => sum + m.reuseLevel, 0) / cluster.members.length);
}

const clustered = computed(() => categories.value.reduce((sum, c) => sum + c.members.length, 0));
const funnelItems = computed<NamedValue[]>(() =>
  deriveFunnel(total.value, clustered.value, list.value.length, liveCount.value),
);

function openCategory(id: string): void {
  router.push(`/candidates/${id}`);
}
</script>

<template>
  <div class="matrix">
    <nav class="matrix__crumb">
      <router-link to="/" class="matrix__crumb-link">宇宙综合面板</router-link>
      <span class="matrix__crumb-sep">/</span>
      <span class="matrix__crumb-cur">候选矩阵</span>
    </nav>

    <SectionCard
      title="候选矩阵"
      :subtitle="`${total} 款候选 · ${categories.length} 大类成簇 · 门禁${gateOpen ? '已解锁' : '冻结中'}`"
      tag="P0"
      tag-color="var(--wb-purple)"
    >
      <FunnelChart :items="funnelItems" :height="200" />
    </SectionCard>

    <SectionCard title="八大类聚类" subtitle="成簇解锁 · 点击进入成员清单" tag="P0" tag-color="var(--wb-purple)">
      <div class="matrix__grid">
        <button
          v-for="cluster in categories"
          :key="cluster.id"
          type="button"
          class="matrix__card"
          @click="openCategory(cluster.id)"
        >
          <div class="matrix__card-head">
            <span class="matrix__name">{{ cluster.name }}</span>
            <StatusLight :status="gateLight(cluster.unlockGate.status)" size="sm" />
          </div>
          <div class="matrix__card-meta">
            <span class="matrix__count wb-mono">{{ cluster.members.length }} 款</span>
            <span class="matrix__reuse" :title="`平均复用度 ${avgReuse(cluster)}`">
              复用 {{ reuseStars(avgReuse(cluster)) }}
            </span>
          </div>
          <p class="matrix__logic wb-note">{{ cluster.unlockGate.condition }}</p>
          <div class="matrix__members">
            <span v-for="member in cluster.members.slice(0, 6)" :key="member.code" class="matrix__member">
              {{ member.name }}
              <span class="matrix__stars" :title="`复用度 ${member.reuseLevel}`">{{ reuseStars(member.reuseLevel) }}</span>
            </span>
            <span v-if="cluster.members.length > 6" class="matrix__more">+{{ cluster.members.length - 6 }}</span>
          </div>
        </button>
        <p v-if="categories.length === 0" class="wb-note">暂无候选聚类数据。</p>
      </div>
    </SectionCard>
  </div>
</template>

<style scoped>
.matrix {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.matrix__crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.matrix__crumb-link {
  color: var(--wb-text-dim);
}

.matrix__crumb-link:hover {
  color: var(--wb-green);
}

.matrix__crumb-sep {
  color: var(--wb-text-muted);
}

.matrix__crumb-cur {
  color: var(--wb-text);
}

.matrix__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.matrix__card {
  text-align: left;
  background: var(--wb-panel-2);
  border: 1px solid var(--wb-border);
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--wb-text);
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.matrix__card:hover {
  border-color: var(--wb-purple);
  transform: translateY(-2px);
}

.matrix__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.matrix__name {
  font-size: 14px;
  font-weight: 600;
}

.matrix__card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.matrix__count {
  font-size: 13px;
  color: var(--wb-purple);
}

.matrix__reuse {
  font-size: 11px;
  color: var(--wb-yellow);
}

.matrix__logic {
  font-size: 11px;
  line-height: 1.5;
  margin: 0;
}

.matrix__members {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-top: 2px;
}

.matrix__member {
  font-size: 11px;
  color: var(--wb-text-dim);
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.matrix__stars {
  color: var(--wb-yellow);
  letter-spacing: -1px;
}

.matrix__more {
  font-size: 11px;
  color: var(--wb-text-muted);
}
</style>
