<script setup lang="ts">
import { useRouter } from 'vue-router'
import { L1MART } from '../config/l1mart.static.ts'
import { GUIDE_ANCHORS } from '../config/guideAnchors.ts'
import GuideAvatar from '../components/GuideAvatar.vue'
import GuideChip from '../components/GuideChip.vue'
import { useMartGate } from '../composables/useMart.ts'

const router = useRouter()
const { scanTexts } = useMartGate()
// 演示红线门控在 UI 层存活（真实 taboo 词表为 design-strategist 交付物）
const gate = scanTexts(
  L1MART.guides.flatMap((g) => [g.name, ...g.hiddenWeakness, ...g.thunderMine]),
)

function start(guideId: string) {
  router.push(`/game/${guideId}`)
}
</script>

<template>
  <section>
    <!-- 宿主伪装层：橙红顶栏 + 搜索框（淘宝皮，L1） -->
    <header class="host-nav">
      <div class="h-title">某宝 · 反骨导购</div>
      <div class="h-sub">胡闹宇宙 · 选招制对线</div>
      <div class="host-search">
        <input aria-label="搜索商品" placeholder="搜离谱好物…" />
        <button class="s-btn">搜索</button>
      </div>
    </header>

    <div class="page-pad">
      <h3 class="sec">挑个导购开整</h3>
      <p class="muted">每位导购有不同反骨人设，用对招式才能破防或劝退。</p>

      <ul class="guide-list">
        <li
          v-for="g in L1MART.guides"
          :key="g.id"
          class="g-card"
          tabindex="0"
          role="button"
          :aria-label="`开始与${g.name}对线`"
          @click="start(g.id)"
          @keyup.enter="start(g.id)"
        >
          <GuideAvatar :archetype="g.archetype" :size="48" />
          <div class="g-info">
            <div class="g-name">{{ g.name }}</div>
            <div class="g-row">
              <GuideChip :archetype="g.archetype" />
              <span class="motive">{{ GUIDE_ANCHORS[g.archetype].motiveBadge }}</span>
            </div>
          </div>
          <span class="arrow" aria-hidden="true">›</span>
        </li>
      </ul>

      <p v-if="!gate.pass" class="gate fail" role="alert">红线扫描命中，内容待清洗。</p>
    </div>
  </section>
</template>

<style scoped>
.sec {
  font-size: var(--fs-lg);
  font-weight: 800;
  margin: 4px 0;
}
.guide-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.g-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-2);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 12px 14px;
  cursor: pointer;
  min-height: 44px;
  transition:
    transform 0.15s var(--ease-smooth),
    box-shadow 0.15s;
}
.g-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
.g-card:active {
  transform: scale(0.98);
}
.g-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}
.g-name {
  font-weight: 800;
  font-size: var(--fs-base);
  color: var(--fg);
}
.g-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.motive {
  font-size: var(--fs-xs);
  color: var(--fg-dim);
}
.arrow {
  font-size: 22px;
  color: var(--fg-mute);
}
</style>
