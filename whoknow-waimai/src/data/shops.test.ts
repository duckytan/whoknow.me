import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SHOPS, RIDERS, getShop, getRider, PERSONA_LABEL, PERSONA_CLASS, type BossPersonality } from './shops.ts'

test('S1 商店目录覆盖全部 5 种老板人格', () => {
  const seen = new Set<unknown>(SHOPS.map((s) => s.personality))
  for (const p of ['angry', 'gentle', 'weird', 'lazy', 'philo'] as BossPersonality[])
    assert.ok(seen.has(p), `缺人格 ${p}`)
})

test('S2 getShop / getRider 按 id 取回，未知返回 undefined', () => {
  assert.equal(getShop('s01')?.name, '老王烧烤')
  assert.equal(getRider('r001')?.name, '雷速飞')
  assert.equal(getShop('nope'), undefined)
  assert.equal(RIDERS.length, 3)
})

test('S3 persona 标签与 class 映射完整', () => {
  for (const p of Object.keys(PERSONA_LABEL))
    assert.ok(PERSONA_CLASS[p as keyof typeof PERSONA_CLASS], `缺 class ${p}`)
})
