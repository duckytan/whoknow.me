// formulaRepo.test.ts — BRAIN-PLAN ① 公式存管落地验证
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withTempRoot } from '../testing/tmpdir.ts'
import { FormulaRepo } from './formulaRepo.ts'
import { makeFormulaBody } from '../testing/fixtures.ts'

test('F1 公式记录含"唯一ID+版本号+创建时间+状态"四要素', async () => {
  await withTempRoot(async (root) => {
    const repo = new FormulaRepo(root)
    const rec = await repo.create('F-0001', makeFormulaBody())
    assert.equal(rec.meta.id, 'F-0001')
    assert.equal(rec.meta.version, 1)
    assert.ok(Date.parse(rec.meta.created_at) > 0)
    const idx = await repo.store.readIndex()
    assert.equal(idx.entries['F-0001']?.status, 'active')
    // 效果评分 M0–M2 无反馈通道 → 必须为 null，不得伪造默认分
    assert.equal(idx.entries['F-0001']?.score, null)
  })
})

test('F2 可解释单元：来源模范段子 + 生成样例 随版本保存（融 D）', async () => {
  await withTempRoot(async (root) => {
    const repo = new FormulaRepo(root)
    await repo.create('F-0001', makeFormulaBody({ explain: { seed_examples: ['S1'], generated_samples: [] } }))
    await repo.revise('F-0001', makeFormulaBody({ explain: { seed_examples: ['S1'], generated_samples: ['G1'] } }))
    assert.deepEqual((await repo.version('F-0001', 1)).body.explain.generated_samples, [])
    assert.deepEqual((await repo.latest('F-0001')).body.explain.generated_samples, ['G1'])
  })
})

test('F3 B2 反差轴字段可落地：现实锚点 / 胡闹偏移 / 反差强度', async () => {
  await withTempRoot(async (root) => {
    const repo = new FormulaRepo(root)
    const rec = await repo.create('F-0001', makeFormulaBody())
    const anchors = rec.body.slots.filter((s) => s.role === 'realness_anchor')
    const offsets = rec.body.slots.filter((s) => s.role === 'absurd_offset')
    assert.equal(anchors.length, 1)
    assert.equal(offsets.length, 1)
    assert.equal(rec.body.contrast.anchor_slot, '场景')
    assert.equal(rec.body.contrast.offset_slot, '离谱事')
    assert.equal(rec.body.contrast.intensity_hint, 0.7)
  })
})

test('F4 淘汰 = 标记归档，历史版本仍可读（留底备查 + 支持回退）', async () => {
  await withTempRoot(async (root) => {
    const repo = new FormulaRepo(root)
    await repo.create('F-0001', makeFormulaBody({ name: '一版' }))
    await repo.revise('F-0001', makeFormulaBody({ name: '二版' }))
    await repo.archive('F-0001', '反馈评分过低')

    const idx = await repo.store.readIndex()
    assert.equal(idx.entries['F-0001']?.status, 'archived')
    assert.equal((await repo.version('F-0001', 1)).body.name, '一版')
    assert.deepEqual(await repo.history('F-0001'), [1, 2])
  })
})

test('F5 ⑥ A→B 规模门槛埋点可读（200 条判据）', async () => {
  await withTempRoot(async (root) => {
    const repo = new FormulaRepo(root)
    await repo.create('F-0001', makeFormulaBody())
    await repo.create('F-0002', makeFormulaBody())
    await repo.archive('F-0002', '测试')
    const stats = await repo.stats()
    assert.equal(stats.total, 2)
    assert.equal(stats.active, 1)
    assert.equal(stats.archived, 1)
    assert.equal(stats.ab_switch_size_threshold, 200)
    assert.equal(stats.ab_switch_size_met, false)
  })
})

test('F6 引用串只暴露 ID@版本（不泄露 pattern 本体）', async () => {
  await withTempRoot(async (root) => {
    const repo = new FormulaRepo(root)
    const rec = await repo.create('F-0001', makeFormulaBody())
    const ref = FormulaRepo.ref(rec)
    assert.equal(ref, 'F-0001@1')
    assert.ok(!ref.includes(rec.body.pattern))
  })
})
