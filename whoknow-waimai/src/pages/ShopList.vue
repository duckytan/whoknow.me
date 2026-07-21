<script setup lang="ts">
import { ref, computed } from 'vue'
import { useShopStore } from '@/store/shop'
import AppTabBar from '@/components/base/AppTabBar.vue'
import ShopCard from '@/components/shop/ShopCard.vue'
import type { Shop } from '@/types'

const shopStore = useShopStore()
const keyword = ref('')
const activePersonality = ref<Shop['bossPersonality'] | ''>('')

const personalityOpts: Array<{ key: Shop['bossPersonality'] | ''; label: string; icon: string }> = [
  { key: '', label: '全部', icon: '🍽️' },
  { key: 'angry', label: '暴躁', icon: '😤' },
  { key: 'gentle', label: '温柔', icon: '😊' },
  { key: 'weird', label: '奇葩', icon: '🤪' },
  { key: 'lazy', label: '佛系', icon: '😴' },
  { key: 'philosophical', label: '哲学', icon: '🧐' },
]

const filteredShops = computed(() => {
  let list = [...shopStore.shops]
  const kw = keyword.value.trim().toLowerCase()

  if (kw) {
    list = list.filter(s =>
      s.name.toLowerCase().includes(kw) ||
      s.type.toLowerCase().includes(kw) ||
      s.bossMottos.some(m => m.includes(keyword.value.trim()))
    )
  }

  if (activePersonality.value) {
    list = list.filter(s => s.bossPersonality === activePersonality.value)
  }

  return list
})
</script>

<template>
  <div class="page-container">
    <van-nav-bar title="全部商家" left-arrow @click-left="$router.back()" />

    <!-- 搜索框 -->
    <van-search
      v-model="keyword"
      placeholder="搜索商家、菜系或老板语录"
      shape="round"
      background="#fff"
    />

    <!-- 性格筛选 -->
    <div class="personality-bar">
      <div
        v-for="opt in personalityOpts"
        :key="opt.key"
        class="personality-chip"
        :class="{ active: activePersonality === opt.key }"
        @click="activePersonality = opt.key as typeof activePersonality"
      >
        <span>{{ opt.icon }}</span>
        <span>{{ opt.label }}</span>
      </div>
    </div>

    <!-- 结果数量 -->
    <div class="result-bar">
      共 <strong>{{ filteredShops.length }}</strong> 家商家
      <span v-if="keyword" class="keyword-hint">「{{ keyword }}」</span>
    </div>

    <!-- 商家列表 -->
    <div class="shop-list">
      <van-empty
        v-if="filteredShops.length === 0"
        description="没找到匹配的商家，换个词试试？"
        image="search"
      />
      <ShopCard
        v-for="shop in filteredShops"
        :key="shop.id"
        :shop="shop"
      />
    </div>
  </div>

  <AppTabBar active="home" />
</template>

<style lang="scss" scoped>
.personality-bar {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  overflow-x: auto;
  background: #fff;
  border-bottom: 1px solid #eee;

  &::-webkit-scrollbar { display: none; }

  .personality-chip {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 13px;
    color: #666;
    background: #f5f5f5;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &.active {
      background: #fff0eb;
      color: #ff6b35;
      font-weight: 700;
    }
  }
}

.result-bar {
  padding: 10px 16px;
  font-size: 13px;
  color: #999;
  background: #f5f5f5;

  strong { color: #ff6b35; }
  .keyword-hint { margin-left: 4px; color: #666; }
}

.shop-list {
  background: #f5f5f5;
  min-height: 300px;
}
</style>
