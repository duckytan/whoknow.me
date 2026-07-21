<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Shop } from '@/types'

const props = defineProps<{ shop: Shop }>()

const currentMotto = ref(props.shop.bossMottos[0])
const mottoIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const personalityColor: Record<Shop['bossPersonality'], string> = {
  angry: '#ff4d4f',
  gentle: '#40a9ff',
  weird: '#9254de',
  lazy: '#faad14',
  philosophical: '#52c41a',
}

const personalityLabel: Record<Shop['bossPersonality'], string> = {
  angry: '暴躁老板',
  gentle: '温柔老板',
  weird: '奇葩老板',
  lazy: '佛系老板',
  philosophical: '哲学老板',
}

const personalityBgColor: Record<Shop['bossPersonality'], string> = {
  angry: '#fff3f0',
  gentle: '#f0f9ff',
  weird: '#f9f0ff',
  lazy: '#fffbe6',
  philosophical: '#f6ffed',
}

// 轮换老板语录
onMounted(() => {
  if (props.shop.bossMottos.length > 1) {
    timer = setInterval(() => {
      mottoIndex.value = (mottoIndex.value + 1) % props.shop.bossMottos.length
      currentMotto.value = props.shop.bossMottos[mottoIndex.value]
    }, 4000)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="shop-header">
    <!-- 封面背景 -->
    <div
      class="shop-header__cover"
      :style="{ background: `linear-gradient(135deg, ${personalityColor[shop.bossPersonality]}33, ${personalityColor[shop.bossPersonality]}11)` }"
    >
      <img
        class="shop-header__avatar"
        :src="shop.avatar"
        :alt="shop.name"
      />
      <div class="shop-header__info">
        <h1 class="shop-header__name">{{ shop.name }}</h1>
        <div class="shop-header__tags">
          <van-tag
            :color="personalityColor[shop.bossPersonality]"
            text-color="#fff"
            size="medium"
          >
            {{ personalityLabel[shop.bossPersonality] }}
          </van-tag>
          <van-tag plain size="medium" color="#999">{{ shop.type }}</van-tag>
        </div>
        <div class="shop-header__stats">
          <van-rate :model-value="shop.rating" readonly allow-half size="13" />
          <span class="stat">{{ shop.rating }}</span>
          <span class="divider">|</span>
          <span class="stat">月售 {{ shop.monthlySales }}</span>
          <span class="divider">|</span>
          <span class="stat">{{ shop.distance }} km</span>
        </div>
      </div>
    </div>

    <!-- 配送信息条 -->
    <div class="shop-header__delivery">
      <div class="delivery-item">
        <span class="delivery-icon">🛵</span>
        <span>配送费 ¥{{ shop.deliveryFee }}</span>
      </div>
      <div class="delivery-divider" />
      <div class="delivery-item">
        <span class="delivery-icon">⏱️</span>
        <span>约 {{ shop.deliveryTime }} 分钟</span>
      </div>
      <div class="delivery-divider" />
      <div class="delivery-item">
        <span class="delivery-icon">📍</span>
        <span>{{ shop.distance }} km</span>
      </div>
    </div>

    <!-- 老板说话气泡 -->
    <div
      class="boss-bubble"
      :style="{
        background: personalityBgColor[shop.bossPersonality],
        borderLeftColor: personalityColor[shop.bossPersonality],
      }"
    >
      <div class="boss-bubble__head">
        <img class="boss-bubble__avatar" :src="shop.avatar" :alt="shop.name" />
        <span class="boss-bubble__title" :style="{ color: personalityColor[shop.bossPersonality] }">
          老板说
        </span>
      </div>
      <transition name="motto-fade" mode="out-in">
        <p :key="currentMotto" class="boss-bubble__text">「{{ currentMotto }}」</p>
      </transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shop-header {
  background: #fff;
  margin-bottom: 8px;

  &__cover {
    display: flex;
    gap: 12px;
    padding: 16px;
    align-items: flex-start;
  }

  &__avatar {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    object-fit: cover;
    flex-shrink: 0;
    background: #f5f5f5;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 18px;
    font-weight: 800;
    color: #333;
    margin: 0 0 8px;
  }

  &__tags {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;

    .stat {
      font-size: 12px;
      color: #666;
    }
    .divider {
      font-size: 12px;
      color: #ddd;
    }
  }

  &__delivery {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    border-top: 1px solid #f5f5f5;
    border-bottom: 1px solid #f5f5f5;
    gap: 8px;

    .delivery-item {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 12px;
      color: #666;

      .delivery-icon { font-size: 14px; }
    }

    .delivery-divider {
      width: 1px;
      height: 16px;
      background: #eee;
    }
  }
}

.boss-bubble {
  margin: 0 16px 16px;
  border-radius: 10px;
  padding: 12px 14px;
  border-left: 3px solid;
  margin-top: 12px;

  &__head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  &__avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    object-fit: cover;
  }

  &__title {
    font-size: 12px;
    font-weight: 700;
  }

  &__text {
    margin: 0;
    font-size: 13px;
    color: #444;
    line-height: 1.6;
    font-style: italic;
  }
}

// 语录切换动画
.motto-fade-enter-active,
.motto-fade-leave-active {
  transition: all 0.4s ease;
}
.motto-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.motto-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
