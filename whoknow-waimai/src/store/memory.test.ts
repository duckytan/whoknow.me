// memory.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MemoryEngine, MemStore } from './memory.ts'
import { runDrama } from '../engine/dramaEngine.ts'
import { loadSeedBranches } from '../config/loader.ts'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const seedPath = join(here, '../../docs/specs/DRAMA-SEED-v1-2026-07-24.json')
const branches = loadSeedBranches(JSON.parse(readFileSync(seedPath, 'utf8')))

test('M1 首单：visitCount=1，history 同步', () => {
  const eng = new MemoryEngine(new MemStore())
  const { memory, history } = eng.recordOrder('s01')
  assert.equal(memory.visitCount, 1)
  assert.equal(history.shopVisitCount, 1)
  assert.equal(history.totalOrders, 1)
  assert.equal(history.todayOrderCount, 1)
})

test('M2 同店第二单：visitCount=2，全局计数累加', () => {
  const eng = new MemoryEngine(new MemStore())
  eng.recordOrder('s01')
  const { memory, history } = eng.recordOrder('s01')
  assert.equal(memory.visitCount, 2)
  assert.equal(history.shopVisitCount, 2)
  assert.equal(history.totalOrders, 2)
})

test('M3 flags 累积：写入的 flag 持久化', () => {
  const eng = new MemoryEngine(new MemStore())
  eng.recordOrder('s01', { flags: ['odd_eats_s01'] })
  eng.recordOrder('s01', { flags: ['boss_cares_s01'] })
  const mem = eng.getShopMemory('s01')
  assert.ok(mem.flags.includes('odd_eats_s01'))
  assert.ok(mem.flags.includes('boss_cares_s01'))
  assert.equal(mem.flags.length, 2)
})

test('M4 跨店隔离：s01 与 s02 互不污染', () => {
  const eng = new MemoryEngine(new MemStore())
  eng.recordOrder('s01', { flags: ['odd_eats_s01'] })
  assert.equal(eng.getShopMemory('s02').visitCount, 0)
  assert.equal(eng.getShopMemory('s01').visitCount, 1)
})

test('M5 集成：第二单携带 odd_eats flag → 引擎可触发 odd_eats 分支', () => {
  const eng = new MemoryEngine(new MemStore())
  eng.recordOrder('s01', { flags: ['odd_eats_s01'] }) // 首单写入 flag
  eng.recordOrder('s01') // 第二单
  const history = eng.getHistoryParams('s01')
  const mem = eng.getShopMemory('s01')
  const r = runDrama(branches, { shopId: 's01' }, { random: () => 0, flags: mem.flags, history })
  assert.equal(r.selectedBranchId, 'odd_eats') // 回访触发隐藏私房菜
  assert.equal(r.events.length, 4)
})

test('M6 成就追踪：unlockAchievements 累积且不重复', () => {
  const eng = new MemoryEngine(new MemStore())
  const a1 = eng.unlockAchievements(['poor_meal'])
  assert.deepEqual(a1, ['poor_meal'])
  const a2 = eng.unlockAchievements(['poor_meal', 'cheap_ghost']) // 重复 + 新增
  assert.deepEqual(a2, ['poor_meal', 'cheap_ghost'])
  assert.equal(eng.getAchievements().length, 2)
})

test('M7 订单历史：recordOrderHistory 后 getOrderHistory 可取回（最新在前）', () => {
  const eng = new MemoryEngine(new MemStore())
  eng.recordOrderHistory({ ts: 1, shopId: 's01', shopName: '老王烧烤', branchId: 'poor', branchName: '穷鬼套餐', bossMood: 20, total: 10, achievements: ['poor_meal'] })
  eng.recordOrderHistory({ ts: 2, shopId: 's02', shopName: '孔子饺子馆', branchId: 'default', bossMood: 50, achievements: [] })
  const h = eng.getOrderHistory()
  assert.equal(h.length, 2)
  assert.equal(h[0].shopId, 's02') // 最新在前
  assert.equal(h[1].branchId, 'poor')
})

test('M8 riderVisitCount 契约：memory HistoryParams 核心三字段不变，注入 riderVisitCount 可驱动引擎骑手认人', () => {
  const eng = new MemoryEngine(new MemStore())
  eng.recordOrder('s01')
  const history = eng.getHistoryParams('s01')
  assert.equal(history.shopVisitCount, 1)
  assert.equal(history.todayOrderCount, 1)
  assert.equal(history.totalOrders, 1)
  // 派生命名参数（与 shopVisitCount 平行）可由 L3 注入后驱动 engine 的 rider_r001_recog
  const r = runDrama(branches, { riderId: 'r001', orderTotal: 50, avgDishPrice: 99 } as any, {
    random: () => 0.6, history: { ...history, riderVisitCount: 2 } as any, flags: [],
  })
  assert.equal(r.selectedBranchId, 'rider_r001_recog')
})

test('M9 骑手计数真实派生（跨实例从 KV 存储读取，非注入）', () => {
  const store = new MemStore()
  const eng1 = new MemoryEngine(store)
  // 第1单落库：riderVisitCount 存储 0 → 1
  assert.equal(eng1.recordRider('r001'), 1)
  // 新引擎实例复用同一存储：证明计数来自持久化 KV，而非手动注入到 history 对象
  const eng2 = new MemoryEngine(store)
  // 第2单读取：含本次 +1 => 2（命中 rider_r001_recog 阈值 >=2）
  assert.equal(eng2.getHistoryParams('s01', 'r001').riderVisitCount, 2)
  // 第2单落库：存储 1 → 2
  assert.equal(eng2.recordRider('r001'), 2)
  // 第3单读取：含本次 +1 => 3
  assert.equal(eng2.getHistoryParams('s01', 'r001').riderVisitCount, 3)
  // 不传 riderId：向后兼容，不含该字段
  assert.equal(eng2.getHistoryParams('s01').riderVisitCount, undefined)
})

test('M10 订单历史带 items：recordOrderHistory 后 items 原样保留，Σqty 可算；recordOrder 后 visitCount +1', () => {
  const eng = new MemoryEngine(new MemStore())
  const items = [
    { dishId: 's01_d1', name: '羊肉串', emoji: '🍢', qty: 2, price: 6 },
    { dishId: 's01_d2', name: '烤茄子', emoji: '🍆', qty: 1, price: 12 },
  ]
  eng.recordOrderHistory({
    ts: 100,
    shopId: 's01',
    shopName: '老王烧烤',
    branchId: null,
    bossMood: 30,
    total: 24,
    achievements: ['poor_meal'],
    items,
  })
  const h = eng.getOrderHistory()
  assert.equal(h.length, 1)
  assert.ok(h[0].items, 'items 字段应被保留')
  assert.deepEqual(h[0].items, items, 'items 应原样保留')
  assert.equal(h[0].items!.reduce((a, b) => a + b.qty, 0), 3, 'Σqty 应为 3')

  // recordOrder 后 visitCount +1（跨单记忆，骑手认人 M8 依赖）
  const before = eng.getShopMemory('s01').visitCount
  const { memory } = eng.recordOrder('s01')
  assert.equal(memory.visitCount, before + 1)
  assert.equal(eng.getShopMemory('s01').visitCount, before + 1)
})

// ---- D7 加固：脏 localStorage 只降级、不抛（P1 审计缺陷 D7）----
// 场景来源：用户手改 / 浏览器插件写入 / 旧版本残留 / 写入被截断。
// 改造前这几处是裸 JSON.parse，异常会冒泡到 setup() → 订单页、客服页直接白屏。

/** 造一个预置脏值的 KV 存储。 */
function dirtyStore(entries: Record<string, string>): MemStore {
  const s = new MemStore()
  for (const [k, v] of Object.entries(entries)) s.setItem(k, v)
  return s
}

test('M11 脏订单历史（截断 JSON / 非数组 / 含 null 元素）读取不抛，降级为可用数组', () => {
  for (const bad of ['[{"ts":1', '{"notAnArray":true}', 'null', '乱码', '"月售28"']) {
    const eng = new MemoryEngine(dirtyStore({ 'waimai:history': bad }))
    assert.doesNotThrow(() => eng.getOrderHistory(), `脏值 ${bad} 不该抛`)
    assert.deepEqual(eng.getOrderHistory(), [], `脏值 ${bad} 应降级为空数组`)
    // 脏数据之上还能继续写新单（客服页/订单页照常工作）
    assert.doesNotThrow(() =>
      eng.recordOrderHistory({
        ts: 1,
        shopId: 's01',
        shopName: '老王烧烤',
        branchId: null,
        bossMood: 0,
        achievements: [],
      }),
    )
    assert.equal(eng.getOrderHistory().length, 1)
  }
})

test('M12 脏历史数组里的非对象元素被滤掉，合法条目仍可读', () => {
  const eng = new MemoryEngine(
    dirtyStore({ 'waimai:history': '[null,"x",42,{"ts":9,"shopId":"s01"}]' }),
  )
  const h = eng.getOrderHistory()
  assert.equal(h.length, 1, '只应留下合法对象条目')
  assert.equal(h[0].shopId, 's01')
})

test('M13 脏成就数据不抛，解锁流程仍可继续', () => {
  for (const bad of ['{"a":1}', '坏数据', 'null', '[1,2]']) {
    const eng = new MemoryEngine(dirtyStore({ 'waimai:achievements': bad }))
    assert.doesNotThrow(() => eng.getAchievements(), `脏值 ${bad} 不该抛`)
    assert.ok(Array.isArray(eng.getAchievements()))
    const after = eng.unlockAchievements(['poor_meal'])
    assert.deepEqual(after, ['poor_meal'], `脏值 ${bad} 之后解锁应正常`)
  }
})

test('M14 脏全局计数不抛，且不会污染出 NaN', () => {
  for (const bad of ['{"totalOrders":', '[]', '"x"', '{"totalOrders":"多","todayOrderCount":null}']) {
    const eng = new MemoryEngine(dirtyStore({ 'waimai:global': bad }))
    const { history } = eng.recordOrder('s01')
    assert.equal(Number.isFinite(history.totalOrders), true, `脏值 ${bad} 产生了 NaN`)
    assert.equal(history.totalOrders, 1)
    assert.equal(history.todayOrderCount, 1)
  }
})

test('M15 脏店铺/骑手记忆不抛，visitCount 从 0 重新起算而非 NaN', () => {
  const eng = new MemoryEngine(
    dirtyStore({ 'waimai:memory:s01': '{"visitCount":"三","flags":"坏","tags":[1,"ok"]}' }),
  )
  const mem = eng.getShopMemory('s01')
  assert.equal(mem.visitCount, 0)
  assert.deepEqual(mem.flags, [])
  assert.deepEqual(mem.tags, ['ok'], '数组里的非字符串元素应被滤掉')
  assert.equal(eng.recordOrder('s01').memory.visitCount, 1)

  const eng2 = new MemoryEngine(dirtyStore({ 'waimai:rider:r001': '截断{' }))
  assert.doesNotThrow(() => eng2.recordRider('r001'))
  assert.equal(eng2.getHistoryParams('s01', 'r001').riderVisitCount, 2)
})
