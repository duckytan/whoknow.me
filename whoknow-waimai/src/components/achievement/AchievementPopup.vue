<script setup lang="ts">
/**
 * AchievementPopup.vue
 * v18 成解锁弹窗 · 用户领取后弹出庆祝
 */
import { ref, watch } from 'vue'
import type { AchievementConfig } from '@/types/achievement'
import { useAchievementStore } from '@/store/achievement'

const store = useAchievementStore()
const show = ref(false)
const currentAchievement = ref<AchievementConfig | null>(null)

// 监听是否有新到未领取的成就 → 弹窗提示
watch(() => store.hasUnclaimed, (val) => {
  if (!val) return
  // 找到第一个未领取的弹
  const unclaimed = store.list.value.find(a => a.state.unlocked && !a.state.claimed)
  if (unclaimed) {
    currentAchievement.value = unclaimed
    show.value = true
  }
})

function handleClaim() {
  if (currentAchievement.value) {
    store.claim(currentAchievement.value.id)
    show.value = false
  }
}

function handleClose() {
  show.value = false
}
</script>

<template>
  <div v-if="show && currentAchievement" class="popup-overlay" @click.self="handleClose">
    <div class="popup-card">
      <div class="popup-icon">{{ currentAchievement.icon }}</div>
      <div class="popup-title">🎉 成！就！解！锁！</div>
      <div class="popup-name">{{ currentAchievement.name }}</div>
      <div class="popup-desc">{{ currentAchievement.description }}</div>
      <button class="popup-btn" @click="handleClaim">领取勋章</button>
    </div>
  </div>
</template>

<style scoped>
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.popup-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px 24px 24px;
  text-align: center;
  width: 280px;
  animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pop {
  from { transform: scale(0.7); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.popup-icon {
  font-size: 56px;
  margin-bottom: 8px;
}
.popup-title {
  font-size: 14px;
  color: #8b5cf6;
  font-weight: 700;
  margin-bottom: 8px;
}
.popup-name {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 6px;
}
.popup-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 20px;
}
.popup-btn {
  padding: 10px 32px;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #6eda78, #8b5cf6);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s;
}
.popup-btn:active {
  transform: scale(0.95);
}
</style>
