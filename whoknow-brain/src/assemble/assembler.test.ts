// assembler.test.ts — 工厂中段组装逻辑验证
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FormulaRepo, type FormulaBody, type FormulaSlot } from '../storage/formulaRepo.ts'
import {
  KnowledgeRepo,
  type KnowledgeBody,
  type KnowledgeWeights,
} from '../storage/knowledgeRepo.ts'
import { assembleProduct } from './assembler.ts'
import { evaluatePublishable } from '../release/gate.ts'
import type { ContentDraft, ReleaseMeta } from './types.ts'

const GEN = '2026-07-31T10:00:00.000Z'
const EFF = '2026-08-01T10:00:00.000Z'

function freshRelease(version = '2026-07-31.001'): ReleaseMeta {
  return {
    version,
    generated_at: GEN,
    effective_until: EFF,
    meta: { hot_today: '暴雨' },
    ui_meta: { ai_story_visible: true, last_brain_run: GEN, freshness_hours: 24 },
  }
}

const formulaSlots: FormulaSlot[] = [
  { key: '真实天气', role: 'realness_anchor' },
  { key: '人物', role: 'free' },
  { key: '离谱行为', role: 'absurd_offset' },
]
const formulaBody: FormulaBody = {
  name: '天气反差公式',
  pattern: '[真实天气]下[人物]偏要[离谱行为]',
  slots: formulaSlots,
  contrast: { anchor_slot: '真实天气', offset_slot: '离谱行为', intensity_hint: 0.7 },
  explain: { seed_examples: ['暴雨天老板划船上班'], generated_samples: [] },
  origin: 'seed',
}
const weights: KnowledgeWeights = {
  hit_rate: 0.9,
  timeliness: 0.8,
  relevance: 0.7,
  authority: 0.6,
  stability: 0.9,
  memeability: 0.85,
}
const knowledgeBody: KnowledgeBody = {
  title: '今日沙雕新闻：外卖小哥养猫',
  source_id: 'news-1',
  source_type: 'news',
  captured_at: GEN,
  tier: 'hot',
  weights,
  retention_until: null,
  compliance: { level: 'green', hits: [] },
  payload_ref: 'knowledge/raw/news-1.txt',
}

function draft(over: Partial<ContentDraft> & Pick<ContentDraft, 'id' | 'payload'>): ContentDraft {
  return {
    product: 'waimai',
    formula_id: 'F-weather',
    knowledge_refs: ['K-news'],
    risk_level: 2,
    forbidden_hits: [],
    quality_signals: { memeability: 0.8, spreadability: null, contrast_intensity: 0.7 },
    audit_state: 'approved',
    reviewer: '锡哥',
    reviewed_at: GEN,
    ...over,
  }
}

test('合并多草稿：branches 合并 + 红线/审核/质量聚合', async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), 'brain-asm-'))
  await new FormulaRepo(dataRoot).create('F-weather', formulaBody)
  await new KnowledgeRepo(dataRoot).create('K-news', knowledgeBody)

  const d1 = draft({
    id: 'D-1',
    payload: { boss: { x: ['老板划船'] }, branches: [{ id: 'b1', name: '暴雨划船', chain: [] }] },
  })
  const d2 = draft({
    id: 'D-2',
    risk_level: 3,
    payload: { branches: [{ id: 'b2', name: '小雪织围巾', chain: [] }] },
  })

  const rec = await assembleProduct(dataRoot, 'waimai', [d1, d2], freshRelease())
  const env = rec.envelope
  const food = env.food as Record<string, any>

  assert.equal(env.version, '2026-07-31.001')
  assert.ok(Array.isArray(food.branches))
  assert.equal(food.branches.length, 2, '两个草稿的 branches 应合并')
  assert.equal(food.boss.x[0], '老板划船', '非 branches 字段应浅合并')

  // 红线聚合
  assert.equal(env.forbidden_check.red_light_count, 0)
  assert.equal(env.forbidden_check.passed, true)

  // 审核聚合：风险取最大(3)，状态 approved
  assert.equal(rec.audit.risk_level, 3)
  assert.equal(rec.audit.state, 'approved')

  // 溯源：公式快照 1 条 + 素材摘录 1 条（去重）
  assert.equal(rec.provenance.formula_snapshots.length, 1)
  assert.equal(rec.provenance.formula_snapshots[0]?.pattern, '[真实天气]下[人物]偏要[离谱行为]')
  assert.equal(rec.provenance.material_excerpts.length, 1)
  assert.equal(rec.provenance.material_excerpts[0]?.title, knowledgeBody.title)

  // 质量聚合：取最大非空
  assert.equal(rec.quality_signals.memeability, 0.8)
  assert.equal(rec.quality_signals.contrast_intensity, 0.7)

  const gate = evaluatePublishable(rec)
  assert.equal(gate.ok, true, '无红线、approved → 应可发布')
})

test('高危(4–5级)未审 → 闸门拦截', async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), 'brain-asm2-'))
  await new FormulaRepo(dataRoot).create('F-weather', formulaBody)
  await new KnowledgeRepo(dataRoot).create('K-news', knowledgeBody)

  const d = draft({ id: 'D-risk', risk_level: 5, audit_state: 'pending', payload: { branches: [] } })
  const rec = await assembleProduct(dataRoot, 'waimai', [d], freshRelease())
  const gate = evaluatePublishable(rec)
  assert.equal(gate.ok, false)
  assert.ok(gate.reasons.some((r) => r.includes('高危')), '应提示高危必人工审')
})

test('含红线命中 → 闸门拦截', async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), 'brain-asm3-'))
  await new FormulaRepo(dataRoot).create('F-weather', formulaBody)
  await new KnowledgeRepo(dataRoot).create('K-news', knowledgeBody)

  const d = draft({ id: 'D-red', forbidden_hits: [{ term: '违规词X', level: 'red' }], payload: { branches: [] } })
  const rec = await assembleProduct(dataRoot, 'waimai', [d], freshRelease())
  const gate = evaluatePublishable(rec)
  assert.equal(gate.ok, false)
  assert.ok(gate.reasons.some((r) => r.includes('红线')))
})

test('product 不一致 → 抛错', async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), 'brain-asm4-'))
  await new FormulaRepo(dataRoot).create('F-weather', formulaBody)
  const d = draft({ id: 'D-1', product: 'mart', payload: { branches: [] } })
  await assert.rejects(() => assembleProduct(dataRoot, 'waimai', [d], freshRelease()))
})
