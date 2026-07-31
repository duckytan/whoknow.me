// production.test.ts — 知识产权边界的红线测试
// 这组测试是"加工数据存本地、不出服务器"这条铁律的自动化护栏。
// 任何让内部字段泄漏进公开 envelope 的改动，都必须先让这里变红。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { projectToPublicEnvelope, verifyEnvelopeChecksum, watermarkFor } from './production.ts'
import { validateEnvelopeShape } from './envelope.ts'
import {
  IP_MARKER_FORMULA,
  IP_MARKER_MATERIAL,
  IP_MARKER_PROMPT,
  IP_MARKER_REJECT,
  makeProductionRecord,
} from '../testing/fixtures.ts'

test('P1 投影结果不含任何知识产权标记串（公式本体/素材原文/prompt/驳回理由）', () => {
  const record = makeProductionRecord()
  const text = JSON.stringify(projectToPublicEnvelope(record))
  for (const marker of [IP_MARKER_FORMULA, IP_MARKER_MATERIAL, IP_MARKER_PROMPT, IP_MARKER_REJECT]) {
    assert.ok(!text.includes(marker), `公开 envelope 泄漏了内部字段：${marker}`)
  }
})

test('P2 投影结果不含 provenance / audit 明细顶层键', () => {
  const env = projectToPublicEnvelope(makeProductionRecord()) as unknown as Record<string, unknown>
  assert.equal(env['provenance'], undefined)
  assert.equal(env['quality_signals'], undefined) // 只能出现在 brain_meta 内
  assert.equal((env['audit'] as unknown) ?? undefined, undefined)
})

test('P3 溯源以 ID@版本 的不透明引用出现（C-RULE-3）', () => {
  const env = projectToPublicEnvelope(makeProductionRecord())
  assert.deepEqual(env.brain_meta?.formula_refs, ['F-0001@3'])
  assert.deepEqual(env.brain_meta?.material_refs, ['K-0001@1'])
})

test('P4 审核只留结论摘要（risk_level + approved + 时间），不留过程', () => {
  const env = projectToPublicEnvelope(makeProductionRecord())
  assert.deepEqual(env.brain_meta?.audit, {
    risk_level: 2,
    state: 'approved',
    approved_at: '2026-07-31T04:00:00.000Z',
  })
})

test('P5 质量信号字段位随成品带出（S3「安全但无聊」告警的输入）', () => {
  const env = projectToPublicEnvelope(makeProductionRecord())
  assert.deepEqual(env.brain_meta?.quality_signals, {
    memeability: 0.6,
    spreadability: null, // M0–M2 无上行反馈，如实为空
    contrast_intensity: 0.7,
  })
})

test('P6 content_checksum 自洽且可复算；改一个字即失配', () => {
  const env = projectToPublicEnvelope(makeProductionRecord())
  assert.ok(verifyEnvelopeChecksum(env))
  env.meta.hot_today = 'TAMPERED'
  assert.equal(verifyEnvelopeChecksum(env), false)
})

test('P7 投影自动挂水印，且只进页脚', () => {
  const l1 = projectToPublicEnvelope(makeProductionRecord(), 'L1')
  assert.equal(l1.ui_meta.watermark?.placement, 'footer')
  assert.equal(l1.ui_meta.watermark?.level, 'L1')
  const l2 = projectToPublicEnvelope(makeProductionRecord(), 'L2')
  assert.equal(l2.ui_meta.watermark?.label, watermarkFor('L2').label)
})

test('P8 投影结果仍是合法 envelope（投影不破坏契约）', () => {
  assert.deepEqual(validateEnvelopeShape(projectToPublicEnvelope(makeProductionRecord())), [])
})

test('P9 白名单机制：内部新增的未知顶层键不会被带出去', () => {
  const record = makeProductionRecord()
  ;(record.envelope as unknown as Record<string, unknown>)['secret_internal_notes'] = 'LEAK-ME'
  const text = JSON.stringify(projectToPublicEnvelope(record))
  assert.ok(!text.includes('LEAK-ME'))
  assert.ok(!text.includes('secret_internal_notes'))
})
