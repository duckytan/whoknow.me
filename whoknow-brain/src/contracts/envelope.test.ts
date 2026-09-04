// envelope.test.ts — 数据契约结构校验（对齐 api-spec v2.2）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateEnvelopeShape } from './envelope.ts'
import { makeEnvelope } from '../testing/fixtures.ts'

test('E1 合法 envelope 无问题项', () => {
  assert.deepEqual(validateEnvelopeShape(makeEnvelope()), [])
})

test('E2 version 必须形如 YYYY-MM-DD.NNN（api-spec 版本号格式）', () => {
  const issues = validateEnvelopeShape(makeEnvelope({ version: 'v1' }))
  assert.ok(issues.some((i) => i.includes('version')))
})

test('E3 effective_until 必须晚于 generated_at', () => {
  const issues = validateEnvelopeShape(
    makeEnvelope({ generated_at: '2026-07-31T03:00:00.000Z', effective_until: '2026-07-30T03:00:00.000Z' }),
  )
  assert.ok(issues.some((i) => i.includes('effective_until')))
})

test('E4 forbidden_check 缺失即判不合格（红线门控是发布前置）', () => {
  const env = makeEnvelope()
  delete (env as unknown as Record<string, unknown>)['forbidden_check']
  assert.ok(validateEnvelopeShape(env).some((i) => i.includes('forbidden_check')))
})

test('E5 水印只允许 footer（v2.2 D3：不得覆盖戏精弹层/结局卡）', () => {
  const env = makeEnvelope()
  env.ui_meta.watermark = { level: 'L1', label: 'x', placement: 'overlay' as unknown as 'footer' }
  assert.ok(validateEnvelopeShape(env).some((i) => i.includes('watermark')))
})

test('E6 至少要有一个产品负载', () => {
  const env = makeEnvelope()
  delete (env as unknown as Record<string, unknown>)['food']
  assert.ok(validateEnvelopeShape(env).some((i) => i.includes('产品负载')))
})

test('E7 food.branches 形状与 waimai loader 契约兼容（v2.2 D1）', () => {
  const env = makeEnvelope()
  const b = env.food?.branches?.[0]
  assert.ok(b)
  assert.equal(typeof b.id, 'string')
  assert.equal(typeof b.trigger.condition, 'string')
  assert.ok(Array.isArray(b.chain) && b.chain.length > 0)
  assert.equal(typeof b.chain[0]?.phase, 'string')
  assert.equal(typeof b.chain[0]?.text, 'string')
})

test('E8 非对象输入被拒', () => {
  assert.deepEqual(validateEnvelopeShape(null), ['envelope 必须是对象'])
  assert.deepEqual(validateEnvelopeShape('x'), ['envelope 必须是对象'])
})
