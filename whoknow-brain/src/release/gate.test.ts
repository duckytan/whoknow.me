// gate.test.ts — 发布闸门规则（ADR-003：失败不发布 / 红线 0 容忍 / 高危必人工审）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluatePublishable, assertPublishable } from './gate.ts'
import { makeProductionRecord, makeEnvelope } from '../testing/fixtures.ts'
import { isBrainError } from '../errors.ts'

test('G1 合法记录（风险2 + 已审 + 无红线）通过闸门', () => {
  const r = makeProductionRecord()
  const res = evaluatePublishable(r)
  assert.equal(res.ok, true)
  assert.deepEqual(res.reasons, [])
})

test('G2 红线命中（red_light_count>0）禁止发布', () => {
  const r = makeProductionRecord({
    envelope: makeEnvelope({
      forbidden_check: { version: '1.0', red_light_count: 1, yellow_light_count: 0, passed: false },
    }),
  })
  const res = evaluatePublishable(r)
  assert.equal(res.ok, false)
  assert.match(res.reasons.join(' '), /红线|passed/)
})

test('G3 审核记录内红线命中亦禁发', () => {
  const r = makeProductionRecord({
    audit: {
      risk_level: 2,
      forbidden_hits: [{ term: '禁忌词X', level: 'red' }],
      state: 'approved',
      reviewer: 'owner',
      reviewed_at: '2026-07-31T04:00:00.000Z',
      reject_reason: null,
    },
  })
  const res = evaluatePublishable(r)
  assert.equal(res.ok, false)
  assert.match(res.reasons.join(' '), /红线/)
})

test('G4 高危（风险4）未人工审通过 → 禁发', () => {
  const r = makeProductionRecord({
    audit: {
      risk_level: 4,
      forbidden_hits: [],
      state: 'pending',
      reviewer: null,
      reviewed_at: null,
      reject_reason: null,
    },
  })
  const res = evaluatePublishable(r)
  assert.equal(res.ok, false)
  assert.match(res.reasons.join(' '), /高危/)
})

test('G5 已驳回内容永不部署', () => {
  const r = makeProductionRecord({
    audit: {
      risk_level: 2,
      forbidden_hits: [],
      state: 'rejected',
      reviewer: 'owner',
      reviewed_at: '2026-07-31T04:00:00.000Z',
      reject_reason: '太油腻',
    },
  })
  const res = evaluatePublishable(r)
  assert.equal(res.ok, false)
  assert.match(res.reasons.join(' '), /驳回/)
})

test('G6 契约非法（version 错）阻断 + 列出问题', () => {
  const r = makeProductionRecord({ envelope: makeEnvelope({ version: 'not-a-version' }) })
  const res = evaluatePublishable(r)
  assert.equal(res.ok, false)
  assert.match(res.reasons.join(' '), /version/)
})

test('G7 assertPublishable 不合格抛 PUBLISH_BLOCKED', () => {
  const r = makeProductionRecord({
    audit: {
      risk_level: 5,
      forbidden_hits: [],
      state: 'pending',
      reviewer: null,
      reviewed_at: null,
      reject_reason: null,
    },
  })
  let err: unknown
  try {
    assertPublishable(r)
  } catch (e) {
    err = e
  }
  assert.ok(err !== undefined)
  assert.equal(isBrainError(err), true)
})

test('G8 M0–M2 质量信号缺失只告警不阻断（spreadability 恒 null 符合预期）', () => {
  const r = makeProductionRecord({
    quality_signals: { memeability: null, spreadability: null, contrast_intensity: null },
  })
  const res = evaluatePublishable(r)
  assert.equal(res.ok, true)
  assert.ok(res.warnings.length >= 1)
})
