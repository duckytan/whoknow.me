<script setup lang="ts">
import type { OrderStatus } from '@/types'

defineProps<{
  status: OrderStatus
}>()

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending:          { label: '等待接单', color: '#95a5a6', icon: '⏳' },
  accepted:         { label: '已接单', color: '#ff7849', icon: '✅' },
  cooking:          { label: '出餐中', color: '#ff7849', icon: '🍳' },
  boss_complaining: { label: '老板发疯中', color: '#ff7849', icon: '🤬' },
  delivering:       { label: '配送中', color: '#4fc46a', icon: '🛵' },
  rider_lost:       { label: '骑手迷路', color: '#ff7849', icon: '🗺️' },
  completed:        { label: '已送达', color: '#4fc46a', icon: '🎉' },
}
</script>

<template>
  <div class="npc-status" :style="{ background: statusConfig[status].color + '20', borderColor: statusConfig[status].color }">
    <span class="status-icon">{{ statusConfig[status].icon }}</span>
    <span class="status-label" :style="{ color: statusConfig[status].color }">
      {{ statusConfig[status].label }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.npc-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1.5px solid;
  font-size: 13px;
}

.status-icon { font-size: 16px; }
.status-label { font-weight: 700; }
</style>
