<template>
  <div class="order-view">
    <header class="bar">
      <router-link to="/" class="back">←</router-link>
      <span class="title">下单 · 看老板演戏</span>
    </header>

    <!-- 表单 -->
    <section v-if="!result" class="form">
      <label>店铺 ID<input v-model="form.shopId" placeholder="s01" /></label>
      <label>骑手 ID<input v-model="form.riderId" placeholder="r001" /></label>
      <label>订单金额 ¥<input v-model.number="form.orderTotal" type="number" /></label>
      <label>客单价 ¥<input v-model.number="form.avgDishPrice" type="number" /></label>
      <label>菜品数<input v-model.number="form.dishCount" type="number" /></label>
      <label>配送费 ¥<input v-model.number="form.deliveryFee" type="number" /></label>
      <label>备注<input v-model="form.remark" placeholder="别骂了 / 多放辣" /></label>
      <label>地址<input v-model="form.address" placeholder="奇葩地址会触发彩蛋" /></label>
      <button class="submit" @click="submit">下单 🍜</button>
    </section>

    <!-- 结果：四阶段反应 -->
    <section v-else class="result">
      <div class="summary">
        <span>本店第 <b>{{ shopVisitCount }}</b> 单</span>
        <span>命中：<b>{{ result.selectedBranchId }}</b></span>
        <span>老板心情：<b :class="result.finalState.bossMood >= 50 ? 'up' : 'down'">{{ result.finalState.bossMood }}</b></span>
      </div>

      <DramaStage v-for="(ev, i) in result.events" :key="i" :event="ev" />

      <!-- 红线门控 -->
      <div class="gate" :class="gate.pass ? 'ok' : 'fail'">
        <template v-if="gate.pass">✅ 红线门控通过（red_light_count = 0）</template>
        <template v-else>⛔ 红线命中 {{ gate.redLightCount }} 处，已拦截（不会发布）</template>
      </div>

      <button class="again" @click="reset">再来一单 🔁</button>
      <router-link to="/" class="home-link">← 回首页</router-link>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { buildOrderInput, type OrderForm } from '../core/orderInput'
import { runDrama, type RunResult } from '../engine/dramaEngine'
import { loadSeedBranches } from '../config/loader'
import { memory } from '../store/memoryStore'
import { runForbiddenCheck, type TabooList } from '../core/forbiddenCheck'
import DramaStage from '../components/DramaStage.vue'
import seedRaw from '../../docs/specs/DRAMA-SEED-v1-2026-07-24.json'
import tabooRaw from '../../tests/taboo-list.json'

const branches = loadSeedBranches(seedRaw as unknown)
const taboo = tabooRaw as unknown as TabooList

const form = ref<OrderForm>({
  shopId: 's01',
  riderId: 'r001',
  orderTotal: 32,
  avgDishPrice: 16,
  dishCount: 2,
  deliveryFee: 4,
  remark: '',
  address: '',
})

const result = ref<RunResult | null>(null)
const gate = ref<{ pass: boolean; redLightCount: number }>({ pass: true, redLightCount: 0 })
const shopVisitCount = computed(() => (result.value ? memory.getShopMemory(form.value.shopId ?? 's01').visitCount : 0))

function submit() {
  const oi = buildOrderInput(form.value)
  const shopId = oi.shopId ?? 's01'
  const hist = memory.getHistoryParams(shopId)
  const mem = memory.getShopMemory(shopId)
  const r = runDrama(branches, oi, { random: Math.random, history: hist, flags: mem.flags })
  result.value = r

  // 红线门控：渲染后检查所有台词
  const fg = runForbiddenCheck(r.events.map((e) => e.text), taboo)
  gate.value = { pass: fg.pass, redLightCount: fg.redLightCount }

  // 记录记忆（驱动同店第 N 单差异）
  if (r.selectedBranchId) {
    memory.recordOrder(shopId, { flags: r.newFlags, tags: r.finalState.tags })
  }
}

function reset() {
  result.value = null
}
</script>

<style scoped>
.order-view {
  min-height: 100vh;
  padding-bottom: 40px;
}
.bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  position: sticky;
  top: 0;
  background: var(--wk-bg);
  border-bottom: 1px solid #222;
}
.back {
  color: var(--wk-text);
  text-decoration: none;
  font-size: 20px;
}
.title {
  font-weight: 600;
}
.form,
.result {
  padding: 16px;
}
.form label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  font-size: 14px;
  color: var(--wk-dim);
}
.form input {
  flex: 1;
  max-width: 60%;
  background: var(--wk-surface);
  border: 1px solid #2a2a32;
  color: var(--wk-text);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
}
.submit {
  width: 100%;
  margin-top: 16px;
  padding: 14px;
  background: var(--wk-accent);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}
.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: var(--wk-dim);
  margin-bottom: 8px;
}
.summary b {
  color: var(--wk-text);
}
.summary b.up {
  color: #6ee7a0;
}
.summary b.down {
  color: #ff7a7a;
}
.gate {
  margin: 14px 0;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
}
.gate.ok {
  background: rgba(110, 231, 160, 0.12);
  color: #6ee7a0;
}
.gate.fail {
  background: rgba(255, 122, 122, 0.14);
  color: #ff7a7a;
}
.again {
  width: 100%;
  margin-top: 8px;
  padding: 13px;
  background: var(--wk-surface);
  color: var(--wk-text);
  border: 1px solid #2a2a32;
  border-radius: 12px;
  font-size: 15px;
}
.home-link {
  display: block;
  text-align: center;
  margin-top: 14px;
  color: var(--wk-dim);
  text-decoration: none;
  font-size: 13px;
}
</style>
