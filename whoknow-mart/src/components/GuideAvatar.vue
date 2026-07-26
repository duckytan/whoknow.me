<script setup lang="ts">
import { computed } from 'vue'
import type { Archetype } from '../types/contract.ts'
import { GUIDE_ANCHORS } from '../config/guideAnchors.ts'
// 立绘 SVG（文件名用 HYPHEN，Archetype 用 UNDERSCORE —— 显式映射，不靠字符串推导）
import guidePoisonTongue from '../assets/guide-poison-tongue.svg'
import guideRational from '../assets/guide-rational.svg'
import guideLazy from '../assets/guide-lazy.svg'
import guidePhilosopher from '../assets/guide-philosopher.svg'
import guideDark from '../assets/guide-dark.svg'

const props = withDefaults(
  defineProps<{ archetype: Archetype; emoji?: string; size?: number }>(),
  { size: 48 },
)

// 文件名(HYPHEN) ↔ Archetype(UNDERSCORE) 显式映射表
const ARCHETYPE_SVG: Record<Archetype, string> = {
  poison_tongue: guidePoisonTongue,
  rational: guideRational,
  lazy: guideLazy,
  philosopher: guidePhilosopher,
  dark: guideDark,
}

const anchor = computed(() => GUIDE_ANCHORS[props.archetype])
const dim = computed(() => `${props.size}px`)
const fontSize = computed(() => `${Math.round(props.size * 0.5)}px`)
const svgSrc = computed(() => ARCHETYPE_SVG[props.archetype])
</script>

<template>
  <!-- 圆形渐变角色色底（色盲三重标识之一）+ 立绘/emoji 居中 + 白边 -->
  <span
    class="g-av"
    :style="{
      width: dim,
      height: dim,
      fontSize,
      background: `linear-gradient(135deg, ${anchor.roleHex}, ${anchor.roleHex}cc)`,
    }"
    :aria-label="`${anchor.cnType}头像`"
    role="img"
  >
    <img v-if="svgSrc" :src="svgSrc" alt="" class="g-av-img" />
    <template v-else>{{ emoji ?? anchor.emoji }}</template>
  </span>
</template>

<style scoped>
.g-av {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: var(--shadow-md);
  flex-shrink: 0;
  overflow: hidden;
}
.g-av-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}
</style>
