// fixtures.ts — 测试夹具（非测试文件）
// 只造"形状"，不造业务内容；文本刻意无意义，避免与真实段子/禁忌词混淆。

import type { Envelope } from '../contracts/envelope.ts'
import type { ProductionRecord, RiskLevel } from '../contracts/production.ts'
import type { FormulaBody } from '../storage/formulaRepo.ts'
import type { KnowledgeBody } from '../storage/knowledgeRepo.ts'

export function makeFormulaBody(overrides: Partial<FormulaBody> = {}): FormulaBody {
  return {
    name: '测试公式',
    pattern: '[人物]在[场景]干[离谱事]',
    slots: [
      { key: '人物', role: 'free' },
      { key: '场景', role: 'realness_anchor', desc: '来自天气/节日/新闻的真实元素' },
      { key: '离谱事', role: 'absurd_offset' },
    ],
    contrast: { anchor_slot: '场景', offset_slot: '离谱事', intensity_hint: 0.7 },
    explain: { seed_examples: ['SEED-A'], generated_samples: ['SAMPLE-A'] },
    origin: 'seed',
    ...overrides,
  }
}

export function makeKnowledgeBody(overrides: Partial<KnowledgeBody> = {}): KnowledgeBody {
  return {
    title: '测试素材标题',
    source_id: 'SRC-001',
    source_type: 'news',
    captured_at: '2026-07-31T00:00:00.000Z',
    tier: 'hot',
    weights: {
      hit_rate: 0.8,
      timeliness: 0.9,
      relevance: 0.7,
      authority: 0.6,
      stability: 0.9,
      memeability: 0.5,
    },
    retention_until: null,
    compliance: { level: 'green', hits: [] },
    payload_ref: 'knowledge/payload/SRC-001.txt',
    ...overrides,
  }
}

export function makeEnvelope(overrides: Partial<Envelope> = {}): Envelope {
  return {
    version: '2026-07-31.001',
    generated_at: '2026-07-31T03:00:00.000Z',
    effective_until: '2026-08-01T03:00:00.000Z',
    meta: { hot_today: 'HOT', weather: 'WEATHER', holiday: 'NONE' },
    food: {
      boss: { 's001-测试店': { angry: ['台词一'], gentle: ['台词二'] } },
      branches: [
        {
          id: 'b-test',
          name: '测试分支',
          weight: 1,
          trigger: { condition: 'orderTotal < 20', probability: 1 },
          rarity: 'common',
          chain: [{ phase: 'accept', actor: 'boss', text: '台词三' }],
        },
      ],
    },
    ui_meta: { ai_story_visible: true, last_brain_run: '2026-07-31T03:00:00.000Z', freshness_hours: 1 },
    forbidden_check: { version: '1.0', red_light_count: 0, yellow_light_count: 0, passed: true },
    ...overrides,
  }
}

/** 内部生产记录：provenance 里刻意塞入"绝不能上云"的标记串，供泄露测试断言。 */
export const IP_MARKER_FORMULA = 'IP-FORMULA-PATTERN-MUST-NOT-LEAK'
export const IP_MARKER_MATERIAL = 'IP-MATERIAL-EXCERPT-MUST-NOT-LEAK'
export const IP_MARKER_PROMPT = 'IP-PROMPT-VERSION-MUST-NOT-LEAK'
export const IP_MARKER_REJECT = 'IP-REJECT-REASON-MUST-NOT-LEAK'

export function makeProductionRecord(overrides: Partial<ProductionRecord> = {}): ProductionRecord {
  const risk: RiskLevel = 2
  return {
    envelope: makeEnvelope(),
    provenance: {
      formula_snapshots: [{ id: 'F-0001', version: 3, pattern: IP_MARKER_FORMULA }],
      material_excerpts: [
        { id: 'K-0001', version: 1, title: '素材标题', excerpt: IP_MARKER_MATERIAL },
      ],
      news_ids: ['N-0001'],
      generated_by: { model: 'deepseek-v3', prompt_version: IP_MARKER_PROMPT },
    },
    audit: {
      risk_level: risk,
      forbidden_hits: [],
      state: 'approved',
      reviewer: 'owner',
      reviewed_at: '2026-07-31T04:00:00.000Z',
      reject_reason: IP_MARKER_REJECT,
      substitute_evidence: { formula_pass_rate: 0.9, material_red_level: 'green' },
    },
    quality_signals: { memeability: 0.6, spreadability: null, contrast_intensity: 0.7 },
    ...overrides,
  }
}
