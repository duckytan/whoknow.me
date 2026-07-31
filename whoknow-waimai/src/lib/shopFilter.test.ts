// shopFilter.test.ts — Tier 1（正常值 / 边界 / 脏输入 / 真实数据现状锁）
// 对应审计：P1 根因「外壳逻辑埋在 .vue 里零覆盖」；顺带把 D4/D5 的事实钉成断言
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chipFilter, salesOf, distanceOf, emptyHintFor, FILTERS } from './shopFilter.ts'
import { SHOPS, type Shop } from '../data/shops.ts'

/** 造一个最小可用店铺，只覆盖被测字段。 */
function mk(over: Partial<Shop>): Shop {
  return {
    id: 'x',
    name: '测试店',
    emoji: '🍜',
    personality: 'lazy',
    score: 4.5,
    monthlySales: '月售100',
    deliveryTime: '30分钟',
    minOrder: 10,
    deliveryFee: 3,
    distance: '500m',
    promo: '满20减5',
    greeting: 'hi',
    ...over,
  }
}

// ---------- 取值函数 ----------

test('CF1 salesOf 从「月售 5600+」抠数字，取不到按 0', () => {
  assert.equal(salesOf(mk({ monthlySales: '月售 5600+' })), 5600)
  assert.equal(salesOf(mk({ monthlySales: '月售28' })), 28)
  assert.equal(salesOf(mk({ monthlySales: '销量火爆' })), 0)
  assert.equal(salesOf(mk({ monthlySales: '' })), 0)
})

test('CF2 distanceOf 统一折算成米，km/m 混排不会排错序', () => {
  assert.equal(distanceOf(mk({ distance: '1.2km' })), 1200)
  assert.equal(distanceOf(mk({ distance: '800m' })), 800)
  assert.equal(distanceOf(mk({ distance: '2KM' })), 2000)
  assert.equal(distanceOf(mk({ distance: '未知' })), Number.MAX_SAFE_INTEGER)
})

// ---------- chipFilter 正常值 ----------

test('CF3 promo / freeship / new 三个 chip 的筛选口径', () => {
  const list = [
    mk({ id: 'a', promo: '满50减15', deliveryFee: 3 }),
    mk({ id: 'b', promo: '无优惠', deliveryFee: 0 }),
    mk({ id: 'c', promo: '满30减8', deliveryFee: 2, badge: '新店' }),
    mk({ id: 'd', promo: '无优惠', deliveryFee: 1, flash: true }),
  ]
  assert.deepEqual(chipFilter(list, 'promo').map((s) => s.id), ['a', 'c'])
  assert.deepEqual(chipFilter(list, 'freeship').map((s) => s.id), ['b'])
  assert.deepEqual(chipFilter(list, 'new').map((s) => s.id), ['c', 'd'])
  assert.deepEqual(chipFilter(list, 'all').map((s) => s.id), ['a', 'b', 'c', 'd'])
})

test('CF4 sales 降序 / distance 升序（跨 km 与 m 单位）', () => {
  const list = [
    mk({ id: 'a', monthlySales: '月售 300', distance: '1.2km' }),
    mk({ id: 'b', monthlySales: '月售 5600+', distance: '800m' }),
    mk({ id: 'c', monthlySales: '月售 90', distance: '300m' }),
  ]
  assert.deepEqual(chipFilter(list, 'sales').map((s) => s.id), ['b', 'a', 'c'])
  assert.deepEqual(chipFilter(list, 'distance').map((s) => s.id), ['c', 'b', 'a'])
})

// ---------- chipFilter 边界 / 纯度 ----------

test('CF5 纯函数：排序不改入参顺序，返回的是新数组', () => {
  const list = [mk({ id: 'a', monthlySales: '月售1' }), mk({ id: 'b', monthlySales: '月售9' })]
  const out = chipFilter(list, 'sales')
  assert.deepEqual(list.map((s) => s.id), ['a', 'b'], '入参被就地排序了')
  assert.deepEqual(out.map((s) => s.id), ['b', 'a'])
  assert.notEqual(out, list)
})

test('CF6 空列表 / 未知 id / 脏入参一律降级，不抛异常', () => {
  assert.deepEqual(chipFilter([], 'promo'), [])
  assert.deepEqual(chipFilter(null as unknown as Shop[], 'all'), [])
  const list = [mk({ id: 'a' })]
  assert.deepEqual(chipFilter(list, 'nope' as never).map((s) => s.id), ['a'])
  const dirty = [{ id: 'z' } as unknown as Shop]
  assert.deepEqual(chipFilter(dirty, 'promo'), [])
  assert.equal(chipFilter(dirty, 'sales').length, 1)
})

test('CF7 每个 chip 都有空态文案，未知 id 有兜底', () => {
  for (const f of FILTERS) assert.ok(emptyHintFor(f.id).length > 0, `${f.id} 缺空态文案`)
  assert.equal(emptyHintFor('nope' as never), '该分类暂未上架胡闹商家')
})

// ---------- 真实数据现状锁（D4/D5 本轮未修，此处把事实钉住） ----------

test('CF8 现状锁 · D5：满减优惠 chip 对当前数据无筛选力（5 家店 promo 全含「减」）', () => {
  // 本轮 A 方案不修 D5，仅把事实钉成断言。
  // 若将来数据或口径变化导致此断言失败 → 说明 D5 已被处理，请同步更新本测试。
  assert.equal(chipFilter(SHOPS, 'promo').length, SHOPS.length)
})

test('CF9 现状锁 · D5：免配送费 chip 对当前数据恒空（无一家 deliveryFee=0）', () => {
  // 同上：恒空 → 用户只会看到空态段子，chip 事实上不可用。
  assert.equal(chipFilter(SHOPS, 'freeship').length, 0)
})

test('CF10 销量 / 距离 / 新店 chip 在真实数据上确实有区分度', () => {
  assert.equal(chipFilter(SHOPS, 'sales').length, SHOPS.length)
  const bySales = chipFilter(SHOPS, 'sales').map(salesOf)
  assert.deepEqual(bySales, [...bySales].sort((a, b) => b - a), '销量未按降序')
  const byDist = chipFilter(SHOPS, 'distance').map(distanceOf)
  assert.deepEqual(byDist, [...byDist].sort((a, b) => a - b), '距离未按升序')
  const news = chipFilter(SHOPS, 'new')
  assert.ok(news.length > 0 && news.length < SHOPS.length, '新店 chip 应有真实区分度')
})
