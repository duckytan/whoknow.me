<script setup lang="ts">
import { computed } from 'vue'
import type { Archetype } from '../types/contract.ts'
import { GUIDE_ANCHORS } from '../config/guideAnchors.ts'

const props = withDefaults(
  defineProps<{ archetype: Archetype; emoji?: string; size?: number }>(),
  { size: 48 },
)

const anchor = computed(() => GUIDE_ANCHORS[props.archetype])
const dim = computed(() => `${props.size}px`)
const fontSize = computed(() => `${Math.round(props.size * 0.5)}px`)
</script>

<template>
  <!-- 圆形渐变角色色底 + 居中 emoji + 白边（ASSET-SPECS §1.1）；emoji 为色盲三重标识之一 -->
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
    >{{ emoji ?? anchor.emoji }}</span
  >
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
}
</style>
