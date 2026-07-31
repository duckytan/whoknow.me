// knowledgeRepo.test.ts — BRAIN-PLAN ③ 知识库存储（分层 + 6 维权重；升降属 M3）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withTempRoot } from '../testing/tmpdir.ts'
import { KnowledgeRepo, WEIGHT_KEYS, assertWeights } from './knowledgeRepo.ts'
import { makeKnowledgeBody } from '../testing/fixtures.ts'

test('K1 6 维权重齐全（OpenClaw 5 维 + 大脑「梗性」）', () => {
  assert.deepEqual([...WEIGHT_KEYS], [
    'hit_rate',
    'timeliness',
    'relevance',
    'authority',
    'stability',
    'memeability',
  ])
})

test('K2 权重越界被拒（结构校验，不做业务打分）', () => {
  const body = makeKnowledgeBody()
  assertWeights(body.weights)
  assert.throws(() => assertWeights({ ...body.weights, memeability: 1.5 }), /memeability/)
  assert.throws(() => assertWeights({ ...body.weights, hit_rate: -0.1 }), /hit_rate/)
})

test('K3 分层为元数据字段（ADR-001-A），改层 = 新版本，旧层历史保留', async () => {
  await withTempRoot(async (root) => {
    const repo = new KnowledgeRepo(root)
    await repo.create('K-0001', makeKnowledgeBody({ tier: 'hot' }))
    await repo.revise('K-0001', makeKnowledgeBody({ tier: 'cold' }))
    assert.equal((await repo.store.get('K-0001', 1)).body.tier, 'hot')
    assert.equal((await repo.latest('K-0001')).body.tier, 'cold')
    assert.deepEqual(await repo.listByTier('cold'), ['K-0001'])
    assert.deepEqual(await repo.listByTier('hot'), [])
  })
})

test('K4 归档不物理删（冷层留底，保住公式归纳所需历史样本）', async () => {
  await withTempRoot(async (root) => {
    const repo = new KnowledgeRepo(root)
    await repo.create('K-0001', makeKnowledgeBody())
    await repo.archive('K-0001', '长期不命中')
    const idx = await repo.store.readIndex()
    assert.equal(idx.entries['K-0001']?.status, 'archived')
    assert.ok((await repo.latest('K-0001')).body.title.length > 0)
  })
})

test('K5 素材只存引用不存正文（知识产权铁律的存储侧落点）', async () => {
  await withTempRoot(async (root) => {
    const repo = new KnowledgeRepo(root)
    const rec = await repo.create('K-0001', makeKnowledgeBody())
    assert.ok(rec.body.payload_ref.length > 0)
    assert.ok(!('payload' in rec.body), 'KnowledgeBody 不应承载原文正文字段')
  })
})
