<script setup lang="ts">
/**
 * 首页 · 宇宙综合面板：页头（进度 / 新鲜度提示）+ 皮肤化模块区。
 * 模块区域布局自 T7 起由皮肤配置驱动（SkinPage → 布局变体 → ModuleHost），
 * 数据仍由 App.vue 挂载时统一加载并注入 store，本页仅消费 store。
 */
import { storeToRefs } from 'pinia';
import { useUniverseStore } from '@/stores/universe';
import { formatDateTime } from '@/services/format';
import SkinPage from '@/components/SkinPage.vue';

const universe = useUniverseStore();
const { overallProgressPct, generatedAt, dataFresh, dataAgeDays, isStale } = storeToRefs(universe);
</script>

<template>
  <div class="home">
    <header class="home__head">
      <div>
        <h1 class="home__title">宇宙综合面板</h1>
        <p class="home__sub">胡闹宇宙项目开发工作台</p>
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

    <SkinPage page="home" />
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

.home__fresh--stale {
  color: var(--wb-orange);
  border-color: var(--wb-orange);
}

.home__ts {
  font-size: 12px;
  color: var(--wb-text-muted);
}
</style>
