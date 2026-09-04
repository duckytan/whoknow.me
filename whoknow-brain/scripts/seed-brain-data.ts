// scripts/seed-brain-data.ts — 灌 A 种子（SEED 示范，待锡哥替换为真实精选）
//
// 数据落 data/（被 .gitignore 忽略，IP 居留本地、不入库、不上云）。
// 跑法：npm run seed
import { join } from 'node:path'
import { FormulaRepo, type FormulaBody } from '../src/storage/formulaRepo.ts'
import { KnowledgeRepo, type KnowledgeBody } from '../src/storage/knowledgeRepo.ts'

const dataRoot = join(process.cwd(), 'data')

async function main(): Promise<void> {
  const formulas: Array<[string, FormulaBody]> = [
    [
      'F-weather',
      {
        name: '真实天气下偏要离谱',
        pattern: '[真实天气]下[人物]偏要[离谱行为]',
        slots: [
          { key: 'weather', role: 'realness_anchor', desc: '真实天气' },
          { key: 'person', role: 'free' },
          { key: 'act', role: 'absurd_offset', desc: '离谱行为' },
        ],
        contrast: { anchor_slot: 'weather', offset_slot: 'act', intensity_hint: 0.8 },
        explain: { seed_examples: ['暴雨天老板非要骑手划船送'], generated_samples: [] },
        origin: 'seed',
        notes: 'SEED 示范，待锡哥替换为真实精选',
      },
    ],
    [
      'F-boss',
      {
        name: '老板奇葩立场',
        pattern: '老板在[离谱立场]上说[胡闹台词]',
        slots: [
          { key: 'stance', role: 'absurd_offset', desc: '离谱立场' },
          { key: 'line', role: 'free' },
        ],
        contrast: { anchor_slot: null, offset_slot: 'stance', intensity_hint: 0.6 },
        explain: { seed_examples: ['老板说这单必须骑着恐龙送'], generated_samples: [] },
        origin: 'seed',
        notes: 'SEED 示范，待锡哥替换为真实精选',
      },
    ],
  ]

  const knowledge: Array<[string, KnowledgeBody]> = [
    [
      'K-rain',
      {
        title: '本市今日遭遇特大暴雨',
        source_id: 'news-local',
        source_type: 'news',
        captured_at: '2026-08-16T08:00:00Z',
        tier: 'hot',
        weights: { hit_rate: 0.9, timeliness: 0.95, relevance: 0.8, authority: 0.7, stability: 0.6, memeability: 0.7 },
        retention_until: '2026-08-23T00:00:00Z',
        compliance: { level: 'green', hits: [] },
        payload_ref: 'local/rain-2026-08-16.txt',
      },
    ],
    [
      'K-drift',
      {
        title: '骑手漂移梗爆火',
        source_id: 'meme-drift',
        source_type: 'meme',
        captured_at: '2026-08-15T12:00:00Z',
        tier: 'hot',
        weights: { hit_rate: 0.85, timeliness: 0.9, relevance: 0.8, authority: 0.5, stability: 0.5, memeability: 0.95 },
        retention_until: null,
        compliance: { level: 'green', hits: [] },
        payload_ref: 'meme/drift.txt',
      },
    ],
  ]

  const fr = new FormulaRepo(dataRoot)
  for (const [id, body] of formulas) {
    await fr.create(id, body)
    console.log(`✓ formula ${id}`)
  }
  const kr = new KnowledgeRepo(dataRoot)
  for (const [id, body] of knowledge) {
    await kr.create(id, body)
    console.log(`✓ knowledge ${id}`)
  }
  console.log(`\n种子已灌入 ${dataRoot}（被 .gitignore 忽略，仅本地居留）`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
