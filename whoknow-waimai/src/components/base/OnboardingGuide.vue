<script setup lang="ts">
/**
 * OnboardingGuide.vue
 *
 * v14 P0-5（7-23 锡哥拍板）
 * 新用户首次进站 3 屏引导 —— 让用户 30 秒看懂"这是什么 + 怎么玩 + 有彩蛋"
 *
 * 设计原则：
 * - 30 秒可读完（3 屏 × ≤10 秒）
 * - 文案有"哇"的瞬间，不是说明书
 * - 3 屏只回答 3 个问题（是什么 / 怎么玩 / 彩蛋在哪）
 * - 末屏"开始玩"按钮永远在底部
 *
 * 触发逻辑：
 * - Home.vue onMounted 检查 localStorage.chaos_onboarded
 * - 没标记 → 弹 → 末屏点"开始玩" → 写 true + 关闭
 * - 已标记 → 不弹（不打扰）
 */
import { ref } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const current = ref(0)

const slides = [
  {
    emoji: '🎭',
    title: '假外卖，真段子',
    desc: '这里没有真饭。只有 15 个戏精老板和 5 个奇葩骑手，陪你演一出好戏。',
    bg: 'linear-gradient(135deg, #ff6b35, #ff9a3c)',
  },
  {
    emoji: '🍜',
    title: '随便点，没成本',
    desc: '想点啥点啥，0 元下单不给真吃。放心吐槽、放心给差评，他们都会接住。',
    bg: 'linear-gradient(135deg, #ff4757, #ff6b35)',
  },
  {
    emoji: '🥚',
    title: '彩蛋藏在这',
    desc: '备注栏写点奇葩的 / 地址选"百慕大" / 给 5 星时手抖——NPC 会给你专属演出。',
    bg: 'linear-gradient(135deg, #e55a26, #ff8c42)',
  },
]

function next() {
  if (current.value < slides.length - 1) {
    current.value++
  } else {
    emit('close')
  }
}

function skip() {
  emit('close')
}
</script>

<template>
  <van-popup
    :show="show"
    position="bottom"
    :style="{ height: '100dvh', width: '100vw', maxWidth: '480px', margin: '0 auto' }"
    :close-on-click-overlay="false"
    teleport="body"
  >
    <div class="onboarding">
      <!-- 3 屏轮播 -->
      <van-swipe
        v-model="current"
        class="onboarding-swipe"
        :show-indicators="false"
        :autoplay="0"
        :loop="false"
        :touchable="true"
        :prevent-default="false"
      >
        <van-swipe-item v-for="(s, i) in slides" :key="i">
          <div class="slide" :style="{ background: s.bg }">
            <div class="slide-emoji">{{ s.emoji }}</div>
            <div class="slide-title">{{ s.title }}</div>
            <div class="slide-desc">{{ s.desc }}</div>
          </div>
        </van-swipe-item>
      </van-swipe>

      <!-- 底部控制区 -->
      <div class="onboarding-footer">
        <!-- 进度点 -->
        <div class="dots">
          <span
            v-for="(_, i) in slides"
            :key="i"
            class="dot"
            :class="{ active: i === current }"
            @click="current = i"
          />
        </div>

        <!-- 按钮组 -->
        <div class="btn-row">
          <button v-if="current < slides.length - 1" class="btn-skip" @click="skip">跳过</button>
          <button class="btn-next" @click="next">
            {{ current === slides.length - 1 ? '开始玩 🎭' : '下一步 →' }}
          </button>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<style lang="scss" scoped>
.onboarding {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
}

.onboarding-swipe {
  flex: 1;
  min-height: 0;
}

.slide {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  text-align: center;
  color: #fff;
  gap: 20px;
  box-sizing: border-box;
}

.slide-emoji {
  font-size: clamp(64px, 18vw, 96px);
  line-height: 1;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
  animation: bobble 2s ease-in-out infinite;
}

@keyframes bobble {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.slide-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.slide-desc {
  font-size: 15px;
  line-height: 1.7;
  max-width: 320px;
  opacity: 0.95;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.onboarding-footer {
  background: #fff;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  flex-shrink: 0;
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0));
}

.dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e0e0e0;
  transition: all 0.3s;
  cursor: pointer;

  &.active {
    width: 24px;
    border-radius: 4px;
    background: #ff6b35;
  }
}

.btn-row {
  display: flex;
  gap: 12px;
}

.btn-skip,
.btn-next {
  flex: 1;
  height: clamp(40px, 11vw, 48px);
  border-radius: 24px;
  font-size: clamp(13px, 3.6vw, 15px);
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;

  &:active {
    transform: scale(0.97);
  }
}

.btn-skip {
  background: #f5f5f5;
  color: #666;
  flex: 0 0 88px;
}

.btn-next {
  background: #ff6b35;
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}
</style>