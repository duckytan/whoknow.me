<script setup lang="ts">
/**
 * AchievementWall.vue
 * v18 成就墙页面 · 三分区（普通/稀有/隐藏）
 */
import { useAchievementStore } from '@/store/achievement'
import { showToast } from 'vant'
import { computed } from 'vue'
import AppTabBar from '@/components/base/AppTabBar.vue'

const store = useAchievementStore()

const tiers = computed(() => [
  { label: '普通', list: store.common },
  { label: '稀有', list: store.rare },
  { label: '隐藏', list: store.hidden },
])

function handleClaim(id: string) {
  store.claim(id)
  showToast('🎉 成就已领取')
}
</script>

<template>
  <div class="achievement-page">
    <!-- 头部 -->
    <div class="page-header">
      <h1>🏅 我的成就</h1>
      <div class="summary">
        已解锁 {{ store.unlockedCount }} / {{ store.totalCount }}
        <span class="progress-bar">
          <span class="progress-fill" :style="{ width: (store.unlockedCount / store.totalCount) * 100 + '%' }" />
        </span>
      </div>
    </div>

    <!-- 三分区 -->
    <div v-for="tier in tiers" :key="tier.label" class="tier-section">
      <h2 class="tier-title">{{ tier.label }}</h2>
      <div class="achievement-grid">
        <div
          v-for="ach in tier.list"
          :key="ach.id"
          class="achievement-card"
          :class="{
            unlocked: ach.state.unlocked,
            claimed: ach.state.claimed,
            unclaimed: ach.state.unlocked && !ach.state.claimed,
            locked: !ach.state.unlocked,
          }"
        >
          <div class="card-icon">{{ ach.state.unlocked ? ach.icon : '🔒' }}</div>
          <div class="card-info">
            <div class="card-name">{{ ach.state.unlocked ? ach.name : '???' }}</div>
            <div class="card-desc">
              <template v-if="ach.state.unlocked">{{ ach.description }}</template>
              <template v-else-if="ach.tier === 'hidden' && ach.hint">{{ ach.hint }}</template>
              <template v-else>{{ ach.state.progress }}/{{ ach.condition.value }}</template>
            </div>
            <div v-if="!ach.state.unlocked" class="progress-track">
              <span class="track-fill" :style="{ width: (ach.state.progress / ach.condition.value) * 100 + '%' }" />
            </div>
          </div>
          <button
            v-if="ach.state.unlocked && !ach.state.claimed"
            class="claim-btn"
            @click="handleClaim(ach.id)"
          >
            领取
          </button>
          <div v-else-if="ach.state.claimed" class="claimed-badge">✅</div>
        </div>
      </div>
    </div>

    <AppTabBar active="achievements" />
  </div>
</template>

<style scoped>
.achievement-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.page-header {
  background: #fff;
  padding: 20px 16px 16px;
  text-align: center;
}
.page-header h1 {
  margin: 0 0 8px;
  font-size: 20px;
}

.summary {
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.progress-bar {
  display: inline-block;
  width: 80px;
  height: 6px;
  background: #eee;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #ffa94d);
  border-radius: 3px;
  transition: width 0.3s;
}

.tier-section {
  margin: 12px 12px 0;
}
.tier-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 4px;
}

.achievement-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.achievement-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  transition: all 0.2s;
  border: 1px solid #eee;
}

.achievement-card.locked {
  opacity: 0.55;
}
.achievement-card.unclaimed {
  border-color: #ffa94d;
  background: #fffbe6;
  animation: pulse-border 1.5s ease-in-out infinite;
}
@keyframes pulse-border {
  0%, 100% { border-color: #ffa94d; }
  50% { border-color: #ffd43b; }
}

.card-icon {
  font-size: 28px;
  width: 44px;
  text-align: center;
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  min-width: 0;
}
.card-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}
.card-desc {
  font-size: 11px;
  color: #888;
  line-height: 1.4;
}

.progress-track {
  display: block;
  height: 4px;
  background: #eee;
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}
.track-fill {
  display: block;
  height: 100%;
  background: #ddd;
  border-radius: 2px;
  transition: width 0.3s;
}

.claim-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #ff6b6b, #ffa94d);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s;
}
.claim-btn:active {
  transform: scale(0.95);
}

.claimed-badge {
  flex-shrink: 0;
  font-size: 20px;
}
</style>
