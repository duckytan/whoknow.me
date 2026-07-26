<script setup lang="ts">
import { L1MART } from '../config/l1mart.static.ts'
import { GUIDE_ANCHORS } from '../config/guideAnchors.ts'
import GuideAvatar from '../components/GuideAvatar.vue'
import GuideChip from '../components/GuideChip.vue'

const RARITY_LABEL: Record<string, string> = {
  common: '普通',
  uncommon: '少见',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
}
</script>

<template>
  <section>
    <header class="host-nav">
      <div class="h-title">导购图鉴</div>
      <div class="h-sub">5 型反骨导购收集</div>
    </header>

    <div class="page-pad">
      <ul class="codex">
        <!-- 每导购三重色盲标识：emoji + 中文名 + 戏精标签 chip（ACCESSIBILITY §5） -->
        <li v-for="g in L1MART.guides" :key="g.id" class="c-card">
          <GuideAvatar :archetype="g.archetype" :size="56" />
          <div class="c-info">
            <div class="c-top">
              <span class="c-name">{{ g.name }}</span>
              <span class="rarity">{{ RARITY_LABEL[g.rarity] }}</span>
            </div>
            <div class="c-row">
              <GuideChip :archetype="g.archetype" />
              <span class="motive">{{ GUIDE_ANCHORS[g.archetype].motiveBadge }}</span>
            </div>
            <p class="c-type">中文型：{{ GUIDE_ANCHORS[g.archetype].cnType }}</p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.codex {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.c-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-2);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 14px;
}
.c-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}
.c-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.c-name {
  font-weight: 800;
  font-size: var(--fs-base);
  color: var(--fg);
}
.rarity {
  font-size: var(--fs-xs);
  color: var(--fg-dim);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 1px 6px;
}
.c-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.motive {
  font-size: var(--fs-xs);
  color: var(--fg-dim);
}
.c-type {
  font-size: var(--fs-xs);
  color: var(--fg-mute);
}
</style>
