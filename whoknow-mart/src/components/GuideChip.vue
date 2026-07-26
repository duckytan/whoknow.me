<script setup lang="ts">
import type { Archetype } from '../types/contract.ts'
import { GUIDE_ANCHORS } from '../config/guideAnchors.ts'

const props = defineProps<{ archetype: Archetype; text?: string }>()
const anchor = GUIDE_ANCHORS[props.archetype]
</script>

<template>
  <!-- 戏精标签 chip：文本 --fg#222 + 角色色 3px 左边框 + 6px 圆点 accent（C3）
       色盲三重标识之一（与 emoji + 中文名并用） -->
  <span class="g-chip" :style="{ borderLeftColor: anchor.roleHex }">
    <span class="dot" :style="{ background: anchor.roleHex }" aria-hidden="true"></span>
    {{ text ?? anchor.chip }}
  </span>
</template>

<style scoped>
.g-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-left: 3px solid var(--role-angry);
  border-radius: var(--radius-pill);
  padding: 6px 12px;
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--fg); /* #222 达标对比度（C3 ≈14:1） */
  min-height: 28px;
}
.g-chip .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
