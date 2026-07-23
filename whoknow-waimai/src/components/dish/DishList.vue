<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Dish } from '@/types'
import { useCartStore } from '@/store/cart'
import { trackEvent } from '@/utils/metrics'

const props = defineProps<{
  dishes: Dish[]
  shopId: string
}>()

const cartStore = useCartStore()

// 获取所有分类（去重，保持顺序）
const categories = computed(() => {
  const seen = new Set<string>()
  const list: string[] = []
  for (const dish of props.dishes) {
    if (!seen.has(dish.category)) {
      seen.add(dish.category)
      list.push(dish.category)
    }
  }
  return list
})

const activeCategory = ref(0)

// 当前分类下的菜品
const currentDishes = computed(() => {
  const cat = categories.value[activeCategory.value]
  return cat ? props.dishes.filter(d => d.category === cat) : props.dishes
})

function add(dish: Dish) {
  cartStore.addItem(dish)
  // v17 数据埋点（决策 #023）
  trackEvent('dish_add', { dishId: dish.id, category: dish.category, price: dish.price })
}

function remove(dish: Dish) {
  cartStore.removeItem(dish.id)
}
</script>

<template>
  <div v-if="dishes.length === 0" class="empty-dishes">
    <van-empty image="default" description="暂无菜品" />
  </div>

  <div v-else class="dish-list">
    <!-- 左侧分类 Sidebar -->
    <van-sidebar v-model="activeCategory" class="dish-sidebar">
      <van-sidebar-item
        v-for="(cat, idx) in categories"
        :key="cat"
        :title="cat"
        :badge="cartStore.items.filter(i => props.dishes.find(d => d.id === i.id && d.category === cat)).reduce((s, i) => s + i.quantity, 0) || undefined"
      />
    </van-sidebar>

    <!-- 右侧菜品列表 -->
    <div class="dish-content">
      <div
        v-for="dish in currentDishes"
        :key="dish.id"
        class="dish-item"
      >
        <div class="dish-image">{{ dish.image }}</div>
        <div class="dish-info">
          <div class="dish-name">{{ dish.name }}</div>
          <div class="dish-desc">{{ dish.description }}</div>
          <div class="dish-sales">月售 {{ dish.monthlySales }}</div>
          <div class="dish-footer">
            <span class="dish-price">¥{{ dish.price }}</span>
            <div class="dish-stepper">
              <van-button
                v-if="cartStore.getItemCount(dish.id) > 0"
                class="stepper-btn minus"
                size="mini"
                icon="minus"
                round
                plain
                @click="remove(dish)"
              />
              <span
                v-if="cartStore.getItemCount(dish.id) > 0"
                class="stepper-count"
              >{{ cartStore.getItemCount(dish.id) }}</span>
              <van-button
                class="stepper-btn plus"
                size="mini"
                icon="plus"
                round
                type="primary"
                @click="add(dish)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.empty-dishes {
  background: #fff;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dish-list {
  display: flex;
  background: #fff;
  min-height: calc(100vh - 260px);
}

.dish-sidebar {
  width: 80px;
  flex-shrink: 0;
  background: #f7f7f7;
  height: 100%;

  :deep(.van-sidebar-item) {
    padding: 14px 8px;
    font-size: 12px;
    text-align: center;
    line-height: 1.4;
  }

  :deep(.van-sidebar-item--select) {
    background: #fff;
    color: #ff6b35;
    font-weight: 700;

    &::before {
      background: #ff6b35;
    }
  }
}

.dish-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 80px;
}

.dish-item {
  display: flex;
  padding: 14px 12px;
  border-bottom: 1px solid #f5f5f5;
  gap: 10px;
  align-items: flex-start;
}

.dish-image {
  font-size: 44px;
  width: 68px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef6f1;
  border-radius: 8px;
  flex-shrink: 0;
  line-height: 1;
}

.dish-info {
  flex: 1;
  min-width: 0;
}

.dish-name {
  font-size: 14px;
  font-weight: 600;
  color: #222;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dish-desc {
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dish-sales {
  font-size: 11px;
  color: #bbb;
  margin-bottom: 6px;
}

.dish-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dish-price {
  font-size: 16px;
  font-weight: 700;
  color: #ff6b35;
}

.dish-stepper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stepper-btn {
  width: 24px !important;
  height: 24px !important;
  padding: 0 !important;

  :deep(.van-icon) {
    font-size: 12px;
  }

  &.minus {
    border-color: #ddd !important;
    color: #666 !important;
  }

  &.plus {
    background: #ff6b35 !important;
    border-color: #ff6b35 !important;
  }
}

.stepper-count {
  font-size: 14px;
  font-weight: 700;
  color: #ff6b35;
  min-width: 18px;
  text-align: center;
}
</style>
