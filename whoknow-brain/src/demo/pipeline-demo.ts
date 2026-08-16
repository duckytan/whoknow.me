// pipeline-demo.ts — 工厂中段端到端最小演示（M0–M2 手动模式）
//
// 证明"种子公式/知识库 → 手动草稿 → 组装 → 过闸门 → 投影落盘+清单"整条链在本地能跑通，
// 不依赖 LLM、不依赖 Vercel、不碰网络。运行：npm run demo:pipeline
//
// 产物落 .tmp-demo/（已 gitignore，永不进仓库）。

import { join } from 'node:path'
import { rm } from 'node:fs/promises'
import { FormulaRepo, type FormulaBody, type FormulaSlot } from '../storage/formulaRepo.ts'
import {
  KnowledgeRepo,
  type KnowledgeBody,
  type KnowledgeWeights,
} from '../storage/knowledgeRepo.ts'
import { assembleProduct } from '../assemble/assembler.ts'
import { evaluatePublishable } from '../release/gate.ts'
import { deployRelease } from '../deploy/deployer.ts'
import type { ContentDraft, ReleaseMeta } from '../assemble/types.ts'

async function main(): Promise<void> {
  const dataRoot = join(process.cwd(), '.tmp-demo', 'pipeline-data')
  const outDir = join(process.cwd(), '.tmp-demo', 'pipeline-out')
  await rm(dataRoot, { recursive: true, force: true })
  await rm(outDir, { recursive: true, force: true })

  // 1) 种子：公式库 + 知识库（M0 主理人手动精选）
  const slots: FormulaSlot[] = [
    { key: '真实天气', role: 'realness_anchor', desc: '来自天气/节假日的真实元素' },
    { key: '人物', role: 'free' },
    { key: '离谱行为', role: 'absurd_offset', desc: '公式控制的离谱程度' },
  ]
  const fBody: FormulaBody = {
    name: '天气反差公式',
    pattern: '[真实天气]下[人物]偏要[离谱行为]',
    slots,
    contrast: { anchor_slot: '真实天气', offset_slot: '离谱行为', intensity_hint: 0.72 },
    explain: { seed_examples: ['暴雨天老板非要员工划船上班'], generated_samples: [] },
    origin: 'seed',
  }
  const w: KnowledgeWeights = {
    hit_rate: 0.9, timeliness: 0.8, relevance: 0.7, authority: 0.6, stability: 0.9, memeability: 0.85,
  }
  const kBody: KnowledgeBody = {
    title: '今日沙雕新闻：外卖小哥在楼下养了只猫',
    source_id: 'news-1',
    source_type: 'news',
    captured_at: new Date().toISOString(),
    tier: 'hot',
    weights: w,
    retention_until: null,
    compliance: { level: 'green', hits: [] },
    payload_ref: 'knowledge/raw/news-1.txt',
  }
  const formulaRepo = new FormulaRepo(dataRoot)
  const knowledgeRepo = new KnowledgeRepo(dataRoot)
  await formulaRepo.create('F-weather', fBody)
  await knowledgeRepo.create('K-news', kBody)

  // 2) 手动草稿（主理人撰写，引用公式与素材）
  const now = new Date().toISOString()
  const drafts: ContentDraft[] = [
    {
      id: 'D-2026-0731-boss',
      product: 'waimai',
      formula_id: 'F-weather',
      knowledge_refs: ['K-news'],
      payload: {
        boss: { 暴雨天: ['老板：今天划船来上班，迟到者罚蛙泳'] },
        branches: [{ id: 'b-boss', name: '暴雨划船老板', chain: [] }],
      },
      risk_level: 2,
      forbidden_hits: [],
      quality_signals: { memeability: 0.85, spreadability: null, contrast_intensity: 0.72 },
      audit_state: 'approved',
      reviewer: '锡哥',
      reviewed_at: now,
    },
    {
      id: 'D-2026-0731-rider',
      product: 'waimai',
      formula_id: 'F-weather',
      knowledge_refs: ['K-news'],
      payload: {
        rider: { 小雪天: ['骑手：顾客非要给我织围巾，送到手都麻了'] },
        branches: [{ id: 'b-rider', name: '小雪织围巾', chain: [] }],
      },
      risk_level: 3,
      forbidden_hits: [],
      quality_signals: { memeability: 0.8, spreadability: null, contrast_intensity: 0.68 },
      audit_state: 'approved',
      reviewer: '锡哥',
      reviewed_at: now,
    },
  ]

  const release: ReleaseMeta = {
    version: '2026-07-31.001',
    generated_at: now,
    effective_until: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    meta: { hot_today: '暴雨转小雪' },
    ui_meta: { ai_story_visible: true, last_brain_run: now, freshness_hours: 24 },
  }

  // 3) 组装 → 闸门 → 落盘
  const record = await assembleProduct(dataRoot, 'waimai', drafts, release)
  const gate = evaluatePublishable(record)
  if (!gate.ok) {
    console.error('❌ 闸门拦截：', gate.reasons)
    process.exit(2)
  }
  for (const wn of gate.warnings) console.warn('⚠️', wn)

  const res = await deployRelease('waimai', record, { outDir })

  console.log('\n✅ 流水线端到端跑通（M0–M2 手动模式）')
  console.log('   产物:', res.artifactPath)
  console.log('   清单:', res.manifestPath)
  console.log('   版本:', res.entry.version, '| checksum:', res.entry.checksum)
  console.log('   公式引用:', record.provenance.formula_snapshots.map((f) => `${f.id}@${f.version}`).join(', '))
  console.log('   素材引用:', record.provenance.material_excerpts.map((m) => `${m.id}@${m.version}`).join(', '))
  console.log('   红线:', record.envelope.forbidden_check.red_light_count, '红灯 / passed =', record.envelope.forbidden_check.passed)
  console.log('   下一步：在该目录运行 `vercel deploy --prod` 上线（M0–M2 手动部署）')
}

main().catch((e) => {
  console.error('pipeline demo failed:', e)
  process.exit(1)
})
