<script setup lang="ts">
import { ref, computed } from 'vue'
import { L1MART } from '../config/l1mart.static.ts'
import { MemoryEngine } from '../store/memory.ts'
import { BrowserKVStore } from '../store/localStore.ts'

// PWA 单机持久化（localStorage 后端注入 MemoryEngine）
const mem = new MemoryEngine(new BrowserKVStore())

const tierLabel: Record<string, string> = { first: '首触', regular: '回头客', vip: '真爱粉' }

interface Row {
  id: string
  name: string
  visit: number
  tier: string
  affinity: number
}
function buildRows(): Row[] {
  return L1MART.guides.map((g) => ({
    id: g.id,
    name: g.name,
    visit: mem.getVisitCount(g.id),
    tier: mem.getMemoryTier(g.id),
    affinity: mem.getAffinity(g.id),
  }))
}
const rows = ref<Row[]>(buildRows())

// 「已破防导购」= 峰值破防度达到 max（WIN_BREAK）的导购数
const cleared = computed(() => rows.value.filter((r) => r.affinity >= L1MART.affinity.max).length)

function reset() {
  mem.reset()
  rows.value = buildRows()
}
</script>

<template>
  <section>
    <header class="host-nav">
      <div class="h-title">我的</div>
      <div class="h-sub">记忆分级与战绩</div>
    </header>

    <div class="page-pad">
      <div class="card stats">
        <div class="stat">
          <span class="v">{{ rows.reduce((s, r) => s + r.visit, 0) }}</span>
          <span class="n">总对线次数</span>
        </div>
        <div class="stat">
          <span class="v">{{ cleared }}</span>
          <span class="n">已破防导购</span>
        </div>
      </div>

      <ul class="mem-list">
        <li v-for="r in rows" :key="r.id" class="m-card">
          <div class="m-name">{{ r.name }}</div>
          <div class="m-row">
            <span class="tier" :class="r.tier">{{ tierLabel[r.tier] }}</span>
            <span class="muted">对线 {{ r.visit }} 次</span>
            <span class="muted">峰值破防 {{ r.affinity }}</span>
          </div>
        </li>
      </ul>

      <button class="host-cta" style="margin-top: 16px; background: var(--bg-3); color: var(--fg)" @click="reset">
        重置进度
      </button>
      <p class="muted" style="margin-top: 10px; text-align: center">
        进度仅存于本机浏览器（whoknow:mart: 键前缀隔离）。
      </p>
    </div>
  </section>
</template>

<style scoped>
.stats {
  display: flex;
  gap: 12px;
}
.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat .v {
  font-size: var(--fs-3xl);
  font-weight: 800;
  color: var(--brand-orange);
  line-height: 1;
}
.stat .n {
  font-size: var(--fs-xs);
  color: var(--fg-dim);
  margin-top: 4px;
}
.mem-list {
  list-style: none;
  padding: 0;
  margin: 14px 0 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.m-card {
  background: var(--bg-2);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 12px 14px;
}
.m-name {
  font-weight: 800;
  font-size: var(--fs-base);
  color: var(--fg);
}
.m-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
  flex-wrap: wrap;
}
.tier {
  font-size: var(--fs-xs);
  font-weight: 700;
  border-radius: var(--radius-sm);
  padding: 1px 8px;
  color: #fff;
}
.tier.first {
  background: var(--fg-mute);
}
.tier.regular {
  background: var(--brand-orange);
}
.tier.vip {
  background: var(--brand-green);
}
</style>
