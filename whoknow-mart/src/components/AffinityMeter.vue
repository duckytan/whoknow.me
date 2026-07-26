<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  affinity: number
  min: number
  max: number
  stage: string // 轻劝/狠劝/松动/破防在即/破防（非颜色独载）
}>()

const pct = computed(() => {
  const span = props.max - props.min || 1
  return Math.max(0, Math.min(100, ((props.affinity - props.min) / span) * 100))
})
// 颜色：低值宿主橙红，高值品牌绿（success 语义）；不渲染为财力/智商标尺（ART-BIBLE §9.1 #4）
const barColor = computed(() => (pct.value >= 75 ? 'var(--brand-green)' : 'var(--mart-host)'))
</script>

<template>
  <!-- 破防度 meter（ACCESSIBILITY §7.2 L）：role=progressbar + aria-valuenow + 可见数值 + 阶段文案 -->
  <div
    class="meter"
    role="progressbar"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-valuenow="affinity"
    :aria-label="`破防度 ${affinity}，${stage}`"
  >
    <div class="track">
      <div class="fill" :style="{ width: pct + '%', background: barColor }"></div>
    </div>
    <div class="readout">
      <span class="num">破防 {{ affinity }}</span>
      <span class="stage">{{ stage }}</span>
    </div>
  </div>
</template>

<style scoped>
.meter {
  width: 100%;
}
.track {
  height: 10px;
  background: var(--bg-3);
  border-radius: var(--radius-pill);
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: var(--radius-pill);
  transition:
    width 0.3s var(--ease-smooth),
    background 0.3s;
}
.readout {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 6px;
}
.num {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--fg);
}
.stage {
  font-size: var(--fs-xs);
  color: var(--fg-dim);
  font-weight: 600;
}
</style>
