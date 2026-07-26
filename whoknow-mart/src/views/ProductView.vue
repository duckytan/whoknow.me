<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { L1MART } from '../config/l1mart.static.ts'

const route = useRoute()
const router = useRouter()
const product = computed(
  () => L1MART.products.find((p) => p.id === route.params.id) ?? L1MART.products[0],
)
const guide = computed(() => L1MART.guides.find((g) => g.id === product.value.guideBinding))

function checkout() {
  // 结算移交博弈对线，携带绑定导购（商品舞台 → 博弈）
  router.push({ path: '/checkout', query: { guide: product.value.guideBinding } })
}
</script>

<template>
  <section>
    <!-- 宿主伪装层顶栏（淘宝商品详情皮，L1） -->
    <header class="host-nav">
      <div class="h-title">商品详情</div>
      <div class="h-sub">{{ product.shopName }}</div>
    </header>

    <div class="page-pad">
      <div class="product-card">
        <div class="ph">{{ product.emoji }}</div>
        <div class="body">
          <h2 class="p-name">{{ product.name }}</h2>
          <div class="price-row">
            <!-- 价格红标：#FF0036 ≥19px bold（C2 大文本阈值达标）；价格占位来自 config（红线 #2 禁数字） -->
            <span class="price big">{{ product.pricePlaceholder }}</span>
            <span class="price-tag">{{ product.category }}</span>
          </div>
          <p class="muted">绑定导购：{{ guide?.name }}</p>
          <p v-if="product.compareMaterial" class="compare">比价素材：{{ product.compareMaterial }}</p>
        </div>
      </div>
      <button class="host-cta" style="margin-top: 16px" @click="checkout">去结算</button>
    </div>
  </section>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
}
.ph {
  height: 180px;
  background: linear-gradient(135deg, var(--mart-host-soft), #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72px;
}
.body {
  padding: 14px;
}
.p-name {
  font-size: var(--fs-lg);
  font-weight: 800;
  color: var(--fg);
}
.price-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.price-tag {
  font-size: var(--fs-xs);
  color: var(--mart-price);
  border: 1px solid var(--mart-price);
  border-radius: var(--radius-sm);
  padding: 1px 6px;
  font-weight: 700;
}
.compare {
  margin-top: 10px;
  font-size: var(--fs-xs);
  color: var(--fg-dim);
  line-height: 1.5;
  border-left: 3px solid var(--mart-host);
  padding-left: 8px;
}
</style>
