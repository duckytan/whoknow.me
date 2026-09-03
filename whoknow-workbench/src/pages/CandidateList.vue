<script setup lang="ts">
/**
 * 候选清单页（T06 · SYSTEM_DESIGN §4.3）。
 * 接收 :categoryId，列出该大类候选 App 行（code / name / 外衣 / 复用度 / 分档）+ unlockGate 徽标。
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useCandidatesStore } from '@/stores/candidates';
import type { LightStatus } from '@/types/metrics';
import SectionCard from '@/components/common/SectionCard.vue';
import StatusLight from '@/components/common/StatusLight.vue';
import { reuseStars } from '@/services/format';

const route = useRoute();
const candidates = useCandidatesStore();
const { categories } = storeToRefs(candidates);

const categoryId = computed(() => String(route.params.categoryId ?? ''));
const cluster = computed(() => candidates.byCategory(categoryId.value));

function gateLight(open: boolean): LightStatus {
  return open ? 'on' : 'off';
}
</script>

<template>
  <div class="clist">
    <nav class="clist__crumb">
      <router-link to="/" class="clist__crumb-link">宇宙综合面板</router-link>
      <span class="clist__crumb-sep">/</span>
      <router-link to="/candidates" class="clist__crumb-link">候选矩阵</router-link>
      <span class="clist__crumb-sep">/</span>
      <span class="clist__crumb-cur">{{ cluster ? cluster.id : categoryId }}</span>
    </nav>

    <SectionCard
      v-if="cluster"
      :title="cluster.name"
      :subtitle="`${cluster.members.length} 款候选`"
      tag="P0"
      tag-color="var(--wb-purple)"
      :footnote="cluster.unlockGate.condition"
    >
      <div class="clist__gate">
        <StatusLight
          :status="gateLight(cluster.unlockGate.status)"
          :label="cluster.unlockGate.status ? '成簇解锁门禁已满足' : '门禁冻结（金克木）'"
          size="md"
        />
      </div>

      <table class="clist__table">
        <thead>
          <tr>
            <th>代号</th>
            <th>中文名</th>
            <th>外衣品类</th>
            <th>复用度</th>
            <th>解锁档位</th>
            <th>路线图</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in cluster.members" :key="member.code">
            <td class="wb-mono">{{ member.code }}</td>
            <td>{{ member.name }}</td>
            <td>{{ member.shell ?? '—' }}</td>
            <td class="clist__stars" :title="`复用度 ${member.reuseLevel}`">{{ reuseStars(member.reuseLevel) }}</td>
            <td>
              <span class="clist__tier" :class="`clist__tier--${member.unlockTier ?? 'M4'}`">
                {{ member.unlockTier ?? 'M4' }}
              </span>
            </td>
            <td class="wb-mono">§{{ member.section ?? '—' }}</td>
          </tr>
          <tr v-if="cluster.members.length === 0">
            <td colspan="6" class="wb-note">该类暂无候选成员。</td>
          </tr>
        </tbody>
      </table>
    </SectionCard>

    <SectionCard v-else title="未找到候选大类" :subtitle="`categoryId=${categoryId || '空'}`">
      <p class="wb-note">该大类不在 8 大类聚类（A–H）中。请从候选矩阵页选择。</p>
    </SectionCard>
  </div>
</template>

<style scoped>
.clist {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.clist__crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  flex-wrap: wrap;
}

.clist__crumb-link {
  color: var(--wb-text-dim);
}

.clist__crumb-link:hover {
  color: var(--wb-green);
}

.clist__crumb-sep {
  color: var(--wb-text-muted);
}

.clist__crumb-cur {
  color: var(--wb-text);
}

.clist__gate {
  margin-bottom: 12px;
}

.clist__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.clist__table th,
.clist__table td {
  text-align: left;
  padding: 8px;
  border-bottom: 1px solid var(--wb-border-soft);
  color: var(--wb-text-dim);
  vertical-align: top;
}

.clist__table th {
  color: var(--wb-text-muted);
  font-weight: 600;
}

.clist__table td {
  color: var(--wb-text);
}

.clist__stars {
  color: var(--wb-yellow);
  letter-spacing: -1px;
}

.clist__tier {
  font-size: 11px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  padding: 1px 7px;
  border-radius: 4px;
  border: 1px solid var(--wb-border);
  color: var(--wb-text-dim);
}

.clist__tier--M2 {
  color: var(--wb-green);
  border-color: var(--wb-green);
}

.clist__tier--M3 {
  color: var(--wb-blue);
  border-color: var(--wb-blue);
}

.clist__tier--M4 {
  color: var(--wb-text-muted);
}
</style>
