import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ACHIEVEMENTS, getAchievement } from './achievements.ts'

test('A1 成就目录含 15 条且 ID 与引擎分支对齐', () => {
  assert.equal(ACHIEVEMENTS.length, 15)
  const ids = ACHIEVEMENTS.map((a) => a.id)
  for (const id of [
    'poor_meal', 'cheap_ghost', 'bankrupt_legend', 'overeat_warn', 'dark_chef',
    'fate_bound', 'reconciled', 'spicy_soul', 'peace_please', 'lost_rider',
    'local_regular', 'old_shop_roast', 'rider_buddy',
  ])
    assert.ok(ids.includes(id), `缺成就 ${id}`)
})

test('A2 getAchievement 按 id 取回，未知返回 undefined', () => {
  assert.equal(getAchievement('poor_meal')?.name, '穷鬼套餐大师')
  assert.equal(getAchievement('nope'), undefined)
})
