<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Shop } from '@/types'
import { trackEvent } from '@/utils/metrics'

const props = defineProps<{
  shop: Shop
}>()

const router = useRouter()

const personalityLabel: Record<Shop['bossPersonality'], string> = {
  angry: '暴躁老板',
  gentle: '温柔老板',
  weird: '奇葩老板',
  lazy: '佛系老板',
  philosophical: '哲学老板',
}

const personalityColor: Record<Shop['bossPersonality'], string> = {
  angry: '#ff4d4f',
  gentle: '#40a9ff',
  weird: '#9254de',
  lazy: '#faad14',
  philosophical: '#52c41a',
}

function goShop() {
  // v17 数据埋点（决策 #023）
  trackEvent('shop_click', { shopId: props.shop.id, personality: props.shop.bossPersonality })
  router.push(`/shop/${props.shop.id}`)
}
</script>

<template>
  <div class="shop-card" @click="goShop">
    <div class="shop-card__main">
      <img class="shop-card__avatar" :src="shop.avatar" :alt="shop.name" />
      <div class="shop-card__info">
        <div class="shop-card__name">
          {{ shop.name }}
          <span
            class="shop-card__tag"
            :style="{ color: personalityColor[shop.bossPersonality], borderColor: personalityColor[shop.bossPersonality] }"
          >
            {{ personalityLabel[shop.bossPersonality] }}
          </span>
        </div>
        <div class="shop-card__meta">
          <van-rate :model-value="shop.rating" readonly allow-half size="12" />
          <span class="meta-text">{{ shop.rating }}</span>
          <span class="meta-sep">|</span>
          <span class="meta-text">月售 {{ shop.monthlySales }}</span>
        </div>
        <div class="shop-card__delivery">
          <span class="delivery-fee">配送费 ¥{{ shop.deliveryFee }}</span>
          <span class="delivery-sep">·</span>
          <span>约 {{ shop.deliveryTime }} 分钟</span>
          <span class="delivery-sep">·</span>
          <span>{{ shop.distance }} km</span>
        </div>
        <div class="shop-card__motto">
          老板说：「{{ shop.bossMottos[0] }}」
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shop-card {
  background: #fff;
  margin-bottom: 8px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;

  &:active { background: #fafafa; }

  &__main {
    display: flex;
    gap: 12px;
  }

  &__avatar {
    width: 72px;
    height: 72px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
    background: #f5f5f5;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 15px;
    font-weight: 700;
    color: #333;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__tag {
    font-size: 10px;
    padding: 1px 5px;
    border: 1px solid;
    border-radius: 4px;
    font-weight: 400;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;

    .meta-text { font-size: 12px; color: #666; }
    .meta-sep { font-size: 12px; color: #ddd; }
  }

  &__delivery {
    font-size: 12px;
    color: #999;
    display: flex;
    gap: 4px;
    margin-bottom: 4px;

    .delivery-fee { color: #ff7849; }
    .delivery-sep { color: #ddd; }
  }

  &__motto {
    font-size: 11px;
    color: #999;
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
