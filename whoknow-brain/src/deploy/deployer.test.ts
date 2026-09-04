// deployer.test.ts — 投影落盘 + 版本清单治理验证
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FormulaRepo, type FormulaBody, type FormulaSlot } from '../storage/formulaRepo.ts'
import {
  KnowledgeRepo,
  type KnowledgeBody,
  type KnowledgeWeights,
} from '../storage/knowledgeRepo.ts'
import { assembleProduct } from '../assemble/assembler.ts'
import { deployRelease } from './deployer.ts'
import { projectToPublicEnvelope, verifyEnvelopeChecksum } from '../contracts/production.ts'
import type { ContentDraft, ReleaseMeta } from '../assemble/types.ts'

const GEN = '2026-07-31T10:00:00.000Z'
const EFF = '2026-08-01T10:00:00.000Z'

function release(v: string): ReleaseMeta {
  return {
    version: v,
    generated_at: GEN,
    effective_until: EFF,
    meta: { hot_today: '暴雨' },
    ui_meta: { ai_story_visible: true, last_brain_run: GEN, freshness_hours: 24 },
  }
}

const slots: FormulaSlot[] = [{ key: '真实天气', role: 'realness_anchor' }]
const fBody: FormulaBody = {
  name: 'f',
  pattern: '[真实天气]下[人物]偏要[离谱行为]',
  slots,
  contrast: { anchor_slot: '真实天气', offset_slot: '离谱行为', intensity_hint: 0.7 },
  explain: { seed_examples: [], generated_samples: [] },
  origin: 'seed',
}
const w: KnowledgeWeights = {
  hit_rate: 0.9, timeliness: 0.8, relevance: 0.7, authority: 0.6, stability: 0.9, memeability: 0.85,
}
const kBody: KnowledgeBody = {
  title: '新闻标题',
  source_id: 'n', source_type: 'news', captured_at: GEN, tier: 'hot',
  weights: w, retention_until: null, compliance: { level: 'green', hits: [] }, payload_ref: 'x',
}
const draft: ContentDraft = {
  id: 'D-1', product: 'waimai', formula_id: 'F1', knowledge_refs: ['K1'],
  payload: { branches: [{ id: 'b1', name: '暴雨划船', chain: [] }] },
  risk_level: 2, forbidden_hits: [], quality_signals: { memeability: 0.8, spreadability: null, contrast_intensity: 0.7 },
  audit_state: 'approved', reviewer: '锡哥', reviewed_at: GEN,
}

async function seedAndAssemble(dataRoot: string, version: string) {
  await new FormulaRepo(dataRoot).create('F1', fBody)
  await new KnowledgeRepo(dataRoot).create('K1', kBody)
  return assembleProduct(dataRoot, 'waimai', [draft], release(version))
}

test('投影+落盘：产物文件存在 + 版本清单 current 指向本版 + checksum 自洽', async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), 'brain-dep-'))
  const outDir = await mkdtemp(join(tmpdir(), 'brain-out-'))
  const rec = await seedAndAssemble(dataRoot, '2026-07-31.001')

  const res = await deployRelease('waimai', rec, { outDir })

  // 产物文件真的写了
  const raw = await readFile(res.artifactPath, 'utf8')
  const env = JSON.parse(raw)
  assert.ok(verifyEnvelopeChecksum(env), '落盘产物 checksum 应自洽')

  // 清单 current 指向本版
  const manifestRaw = await readFile(res.manifestPath, 'utf8')
  const manifest = JSON.parse(manifestRaw)
  assert.equal(manifest.current, '2026-07-31.001')
  assert.equal(manifest.entries.length, 1)

  // 与 projectToPublicEnvelope 投影一致
  const direct = projectToPublicEnvelope(rec, 'L1')
  assert.equal(env.version, direct.version)
  assert.equal(env.brain_meta?.content_checksum, direct.brain_meta?.content_checksum)
})

test('幂等：重复部署同版本只留一条清单条目', async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), 'brain-dep2-'))
  const outDir = await mkdtemp(join(tmpdir(), 'brain-out2-'))
  const rec = await seedAndAssemble(dataRoot, '2026-07-31.002')

  await deployRelease('waimai', rec, { outDir })
  await deployRelease('waimai', rec, { outDir }) // 重复部署同版本

  const manifest = JSON.parse(await readFile(join(outDir, 'releases', 'waimai', 'manifest.json'), 'utf8'))
  assert.equal(manifest.entries.length, 1, '同版本重复部署应幂等覆盖')
  assert.equal(manifest.current, '2026-07-31.002')

  const files = await readdir(join(outDir, 'releases', 'waimai'))
  assert.equal(files.filter((f) => f.endsWith('.json') && f !== 'manifest.json').length, 1)
})

test('闸门拦截的内容绝不落盘', async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), 'brain-dep3-'))
  const outDir = await mkdtemp(join(tmpdir(), 'brain-out3-'))
  const rec = await seedAndAssemble(dataRoot, '2026-07-31.003')
  rec.audit.risk_level = 5
  rec.audit.state = 'pending' // 高危未审 → 闸门应拦

  await assert.rejects(() => deployRelease('waimai', rec, { outDir }))
  const dir = join(outDir, 'releases', 'waimai')
  // 目录不应被创建（无产物落盘）
  await assert.rejects(() => readdir(dir))
})
