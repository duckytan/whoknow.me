<script setup lang="ts">
import type { Archetype } from '../types/contract.ts'
import GuideAvatar from './GuideAvatar.vue'
import GuideChip from './GuideChip.vue'

defineProps<{
  archetype: Archetype
  name: string
  line: string
  glow?: boolean // 命中弱点绿光晕（瞬时游戏反馈，非红叉）
}>()
</script>

<template>
  <!-- 对线气泡（ASSET-SPECS §2.1）：头像 + 中文名 + 戏精标签 chip；金句手写体 + 品牌绿高亮底；
       截图爆点，无水印（api-spec v2.2 D3） -->
  <div class="bubble" :class="{ glow }">
    <div class="head">
      <GuideAvatar :archetype="archetype" :size="48" />
      <div class="id">
        <span class="nm">{{ name }}</span>
        <GuideChip :archetype="archetype" />
      </div>
    </div>
    <p class="line">{{ line }}</p>
  </div>
</template>

<style scoped>
.bubble {
  background: var(--bg-2);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 14px;
  transition: box-shadow 0.2s var(--ease-smooth);
}
.bubble.glow {
  box-shadow: var(--shadow-glow-green);
}
.head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.id {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.nm {
  font-weight: 800;
  color: var(--brand-orange);
  font-size: var(--fs-base);
}
.line {
  font-family: var(--font-script);
  font-size: var(--fs-base);
  line-height: 1.65;
  color: var(--fg);
  margin-top: 10px;
  background: rgba(110, 218, 120, 0.08);
  border-radius: var(--radius-md);
  padding: 8px 10px;
}
</style>
