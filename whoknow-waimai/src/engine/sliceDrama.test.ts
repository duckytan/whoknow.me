// sliceDrama.test.ts — 切片确定性推演验收（node --test --experimental-strip-types）
//
// 设计锁定：docs/designs/waimai-life-sim-slice-2026-07-27.md §B2
// 核心断言：公厕+多放辣 与文档示例逐字一致（确定性）；同一输入连跑 2 次深相等（无随机）。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sliceDrama } from './sliceDrama.ts'

test('S1 公厕+多放辣：与文档 B2 示例逐字一致（确定性）', () => {
  const r = sliceDrama({ addressTag: 'toilet', remarkTag: 'more_spicy' })

  // 4 阶段顺序固定
  assert.equal(r.events.length, 4)
  assert.deepEqual(
    r.events.map((e) => e.phase),
    ['accept', 'cook', 'deliver', 'complete']
  )

  // 逐字台词（对齐 B2 四阶段示例）
  assert.equal(
    r.events[0].text,
    '公厕？？你住化粪池啊……行，多放辣是吧，辣得你忘了在哪儿吃的。'
  )
  assert.equal(r.events[1].text, '（啧，公厕的单我故意慢慢做，锅都不想洗）辣子现舂，等着。')
  assert.equal(r.events[2].text, '这老板又摆烂，我急疯了狂飙……公厕我找了半天。')
  assert.equal(
    r.events[3].text,
    '拿好，公厕……趁热吃（别真趁热）。下次点正常地址行不行。'
  )

  // 因果量（B2：50 - 30 + 5 = 25 带；出餐慢 45s；骑手 -10；配送 25s）
  assert.equal(r.dramaState.bossMood, 25)
  assert.equal(r.dramaState.riderMorale, 50)
  assert.equal(r.dramaState.totalDelay, 70_000)
  assert.equal(r.events[0].moodDelta, -25)
  assert.equal(r.events[1].delay, 45_000) // 出餐慢 45s
  assert.equal(r.events[2].delay, 25_000) // 配送 25s
  assert.equal(r.events[3].moodDelta, 5) // 送达叙事微回弹
})

test('S2 无随机：同一输入连跑 2 次结果深相等', () => {
  const a = sliceDrama({ addressTag: 'toilet', remarkTag: 'more_spicy' })
  const b = sliceDrama({ addressTag: 'toilet', remarkTag: 'more_spicy' })
  assert.deepEqual(a, b)
})

test('S3 复合可解释：公厕+别骂了 → 出餐转快、老板收敛（符号变化）', () => {
  const slow = sliceDrama({ addressTag: 'toilet', remarkTag: 'more_spicy' }) // 25 → 出餐慢
  const gentle = sliceDrama({ addressTag: 'toilet', remarkTag: 'no_scold' }) // 35 → 出餐快

  assert.equal(slow.dramaState.totalDelay, 70_000) // 公厕+多放辣：出餐慢
  assert.equal(gentle.dramaState.totalDelay, 0) // 别骂了把情绪带到 35 → 出餐快
  assert.equal(gentle.dramaState.bossMood, 35)

  // 第2阶段（出餐）gentle 备注把 moodDelta 转正（被戳中收敛）→ 符号变化
  assert.equal(gentle.events[1].moodDelta, 5)
  assert.equal(slow.events[1].moodDelta, undefined)
})

test('S4 开场即分：4 地址 base（无备注）接单台词一眼可分', () => {
  const lines = (['toilet', 'icu', 'home', 'company'] as const).map(
    (a) => sliceDrama({ addressTag: a, remarkTag: 'less_spicy' }).events[0].text
  )
  assert.ok(lines[0].includes('公厕'))
  assert.ok(lines[1].includes('ICU 病房'))
  assert.ok(lines[2].includes('家庭'))
  assert.ok(lines[3].includes('公司'))
  assert.equal(new Set(lines).size, 4) // 四句互不相同
})

test('S5 高带地址（ICU+别骂了）：出餐快、骑手平稳、无出餐慢 delay', () => {
  const r = sliceDrama({ addressTag: 'icu', remarkTag: 'no_scold' })
  assert.equal(r.dramaState.bossMood, 85)
  assert.equal(r.dramaState.riderMorale, 60)
  assert.equal(r.dramaState.totalDelay, 0)
  assert.equal(r.events[1].delay, 0)
})

test('S6 表演才艺：出餐额外 delay（换装）叠加，但骑手不因此掉士气', () => {
  const r = sliceDrama({ addressTag: 'home', remarkTag: 'perform' })
  // home(+5)+perform(+10)=65 → 出餐快；但 perform 换装 +20s
  assert.equal(r.dramaState.bossMood, 65)
  assert.equal(r.dramaState.totalDelay, 20_000)
  assert.equal(r.dramaState.riderMorale, 60) // 非「出餐慢」(情绪带>30)，骑手不掉
})
