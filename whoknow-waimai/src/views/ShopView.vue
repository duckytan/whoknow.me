<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getShop } from '../data/shops'
import { getMenu, type Dish } from '../data/dishes'
import { cart, addItem, decItem, dishCount, cartTotal } from '../store/cart'
import { discountLabel, monthlyLabel, reviewLabel } from '../lib/dishLabel'
import PersonaBadge from '../components/PersonaBadge.vue'
import { showToast } from '../lib/toast'

const route = useRoute()
const router = useRouter()
const shop = getShop(route.params.id as string)
const menu = computed(() => (shop ? getMenu(shop.id) : []))
const items = computed(() => (shop ? cart[shop.id] ?? {} : {}))
const count = computed(() => (shop ? dishCount(shop.id) : 0))
const total = computed(() => (shop ? cartTotal(shop.id) : 0))

// 外送/自取
const deliveryMode = ref<'delivery' | 'pickup'>('delivery')

// 菜单 Tab
const menuTab = ref('dishes')

// 分类侧栏：从菜品提取唯一分类，无 category 的归入"招牌"
const categories = computed(() => {
  const cats = new Set<string>()
  for (const d of menu.value) {
    cats.add(d.category || '招牌')
  }
  return Array.from(cats)
})
const activeCat = computed(() => categories.value[0] || '招牌')
const selectedCategory = ref(activeCat.value)

// 当前分类下的菜品 → 一次性派生成视图行（文案全部走 src/lib/dishLabel 纯函数，
// 模板里零内联逻辑，缺陷才测得到；见 P1-AUDIT §10 风险 R1）。
const dishRows = computed(() =>
  menu.value
    .filter((d) => (d.category || '招牌') === selectedCategory.value)
    .map((d) => {
      const monthly = monthlyLabel(d.tags)
      const review = reviewLabel(d.tags)
      return {
        dish: d,
        monthly,
        review,
        // 无月售/好评数据时整行不渲染，避免空 flex 子项撑出 2px 间距（行距不一致 = 塑料感）
        hasSub: Boolean(monthly || review),
        discount: discountLabel(d.price, d.originalPrice),
      }
    })
)

function goCheckout() {
  if (shop && count.value > 0) router.push(`/order?shop=${shop.id}`)
}

// 促销横条真数据（#2 缺口）：从本店 menu 派生两组，替代写死占位卡。
// 神抢手 = 有折价的菜（按折扣力度降序）；大家都在说好 = 招牌/月售高，不足则补 menu 前若干。
const flashSale = computed(() =>
  menu.value
    .filter((d) => d.originalPrice)
    .sort((a, b) => b.originalPrice! - b.price - (a.originalPrice! - a.price))
)
const popular = computed(() => {
  const p = menu.value.filter((d) => d.tags?.includes('招牌') || d.tags?.some((t) => t.includes('月售')))
  if (p.length >= 3) return p
  const rest = menu.value.filter((d) => !p.includes(d))
  return [...p, ...rest].slice(0, 4)
})

function onPromoAdd(d: Dish) {
  if (!shop) return
  addItem(shop.id, d.id)
  showToast(`已加购：${d.name}`)
}
</script>

<template>
  <div v-if="shop" class="shop-page">
    <!-- Hero 大图 -->
    <div class="shop-top">
      <div class="pic">{{ shop.emoji }}</div>
      <div class="nav">
        <div class="icon-btn" @click="router.push('/shops')">‹</div>
        <div class="title">{{ shop.name }}</div>
        <span style="font-size:18px;cursor:pointer">⭐</span>
        <span style="font-size:18px;cursor:pointer;margin-left:10px">⋯</span>
      </div>
    </div>

    <!-- 店铺信息卡 -->
    <div class="shop-info">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:50px;height:50px;border-radius:8px;background:linear-gradient(135deg,#FFE08A,#FFC93C);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">{{ shop.emoji }}</div>
        <div class="nm" style="padding-right:60px">{{ shop.name }} <PersonaBadge :personality="shop.personality" /></div>
      </div>
      <div class="stats" style="margin-top:8px">
        <span><span class="v" style="color:var(--mt-price);font-weight:800">{{ shop.score }}</span> 分</span>
        <span>{{ shop.monthlySales }}</span>
        <span>{{ shop.deliveryTime }}</span>
        <span style="color:var(--mt-text-2)">商家自配</span>
        <span class="price">配送 ¥{{ shop.deliveryFee }}</span>
      </div>
      <div class="new-cust">新客减2</div>
    </div>

    <!-- 外送 / 自取 分段控件 -->
    <div class="shop-seg">
      <button
        class="ss-pill"
        :class="{ on: deliveryMode === 'delivery', off: deliveryMode !== 'delivery' }"
        @click="deliveryMode = 'delivery'"
      >外送</button>
      <button
        class="ss-pill"
        :class="{ on: deliveryMode === 'pickup', off: deliveryMode !== 'pickup' }"
        @click="deliveryMode = 'pickup'"
      >自取</button>
      <span class="ss-dist">距您 {{ shop.distance }}</span>
    </div>

    <!-- 优惠公告行 -->
    <div class="promo-row">
      <span class="promo-tag red" v-for="(p, i) in shop.promo.split('|')" :key="i">{{ p.trim() }}</span>
      <span class="promo-tag yellow">免配送费</span>
      <span class="promo-tag yellow">0元起送</span>
    </div>

    <!-- 点菜 / 评价 / 商家 Tab -->
    <div class="shop-tabs">
      <button class="st" :class="{ on: menuTab === 'dishes' }" @click="menuTab = 'dishes'">点菜</button>
      <button class="st" :class="{ on: menuTab === 'review' }" @click="menuTab = 'review'">评价</button>
      <button class="st" :class="{ on: menuTab === 'merchant' }" @click="menuTab = 'merchant'">商家</button>
    </div>

    <!-- 菜单区：左侧分类 + 右侧菜品 -->
    <template v-if="menuTab === 'dishes'">
      <div class="menu-two-col">
        <!-- 左侧分类侧栏 -->
        <div class="cat-side">
          <div
            v-for="cat in categories"
            :key="cat"
            class="cat-side__item"
            :class="{ on: selectedCategory === cat }"
            @click="selectedCategory = cat"
          >
            {{ cat }}
          </div>
        </div>

        <!-- 右侧菜品列表 -->
        <div class="dish-list-r">
          <!-- 横向促销区（神抢手 / 大家都在说好 · 真数据） -->
          <div class="promo-h">
            <!-- 神抢手：有折价的菜 -->
            <div class="ph-title">神抢手<span class="ph-badge">限时秒杀中</span></div>
            <div class="ph-scroll">
              <div class="ph-card" v-for="d in flashSale" :key="d.id" @click="onPromoAdd(d)">
                <div class="ph-emoji">{{ d.emoji }}</div>
                <div class="ph-t">{{ d.name }}</div>
                <div class="ph-price">
                  <span class="ph-now">¥{{ d.price }}</span>
                  <span class="ph-old" v-if="d.originalPrice">¥{{ d.originalPrice }}</span>
                </div>
                <div class="ph-add" @click.stop="onPromoAdd(d)">＋</div>
              </div>
              <div v-if="!flashSale.length" class="ph-empty">本店暂无特价</div>
            </div>

            <!-- 大家都在说好：招牌 / 月售高，不足补 menu 前若干 -->
            <div class="ph-title ph-title-2">大家都在说好<span class="ph-badge">口碑推荐</span></div>
            <div class="ph-scroll">
              <div class="ph-card" v-for="d in popular" :key="d.id" @click="onPromoAdd(d)">
                <div class="ph-emoji">{{ d.emoji }}</div>
                <div class="ph-t">{{ d.name }}</div>
                <div class="ph-price">
                  <span class="ph-now">¥{{ d.price }}</span>
                  <span class="ph-old" v-if="d.originalPrice">¥{{ d.originalPrice }}</span>
                </div>
                <div class="ph-add" @click.stop="onPromoAdd(d)">＋</div>
              </div>
              <div v-if="!popular.length" class="ph-empty">本店暂无推荐</div>
            </div>
          </div>

          <!-- 菜品卡片列表 -->
          <div v-for="row in dishRows" :key="row.dish.id" class="dish-card">
            <div class="dish-thumb">{{ row.dish.emoji }}</div>
            <div class="dish-info-c">
              <div class="dc-name">{{ row.dish.name }}</div>
              <div class="dc-sub" v-if="row.hasSub">
                <span v-if="row.monthly" class="dc-monthly">{{ row.monthly }}</span>
                <span v-if="row.review" class="dc-review">{{ row.review }}</span>
              </div>
              <div class="dish-tags" v-if="row.dish.tags?.length">
                <span v-for="t in row.dish.tags" :key="t" class="dt" :class="{ 'dt-hot': t === '招牌', 'dt-safe': t === '买贵必赔', 'dt-promo': !['招牌','买贵必赔'].includes(t) }">{{ t }}</span>
              </div>
              <div class="dish-price-row">
                <span class="dc-now">¥{{ row.dish.price }}</span>
                <span v-if="row.dish.originalPrice" class="dc-old">¥{{ row.dish.originalPrice }}</span>
                <span v-if="row.discount" class="dc-off">{{ row.discount }}</span>
              </div>
            </div>
            <!-- 加购按钮 / Stepper -->
            <template v-if="items[row.dish.id]">
              <div class="stepper" style="margin-top:22px">
                <button class="st" @click="decItem(shop.id, row.dish.id)">−</button>
                <span class="q">{{ items[row.dish.id] }}</span>
                <button class="st add" @click="addItem(shop.id, row.dish.id)">＋</button>
              </div>
            </template>
            <template v-else>
              <button class="dish-cta" @click="addItem(shop.id, row.dish.id)">+</button>
            </template>
          </div>

          <!-- 温馨提示 -->
          <div style="text-align:center;padding:16px;color:var(--mt-text-3);font-size:12px;border-top:1px solid var(--mt-line);margin-top:4px">
            温馨提示：请适量点餐
          </div>
        </div>
      </div>
    </template>

    <!-- 评价 tab 占位 -->
    <div v-else-if="menuTab === 'review'" style="padding:30px 14px;text-align:center;color:var(--mt-text-3);font-size:14px;background:#fff">
      暂无评价——老板说「好评都是刷的，差评才是真的」🤷
    </div>

    <!-- 商家 tab 占位 -->
    <div v-else style="padding:30px 14px;text-align:center;color:var(--mt-text-3);font-size:14px;background:#fff">
      {{ shop.greeting }}
    </div>

    <!-- 底部购物车栏 -->
    <div class="cart-bar" :class="{ empty: count === 0 }">
      <div class="cart-ico">🛒<span v-if="count" class="badge">{{ count }}</span></div>
      <div class="cart-total">
        <template v-if="count">¥{{ total }}<span class="tip">另需配送费 ¥{{ shop.deliveryFee }}</span></template>
        <template v-else>还没选菜</template>
      </div>
      <button class="cart-go" :disabled="count === 0" @click="goCheckout">去结算</button>
    </div>

  </div>
  <div v-else class="page-pad">
    店铺不存在。<router-link to="/shops" style="color: var(--mt-price)">返回列表</router-link>
  </div>
</template>

<style scoped>
/* 店铺大图暗色遮罩：保证白字店名/评分在亮色 emoji 大图上清晰可读（仅视觉增强，不改布局与文案） */
.shop-top::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.05) 60%, rgba(0, 0, 0, 0.25));
  pointer-events: none;
  z-index: 1;
}
.shop-top .nav { z-index: 2; }
.shop-top .title { text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5); }
</style>
