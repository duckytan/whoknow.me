// versionedStore.test.ts — ADR-001 核心不变量：只增不删改 / 版本化 / 索引可重建
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import { withTempRoot, fileExists } from '../testing/tmpdir.ts'
import { VersionedStore, assertValidId } from './versionedStore.ts'
import { isBrainError } from '../errors.ts'

interface Body {
  text: string
}

function makeStore(root: string): VersionedStore<Body> {
  return new VersionedStore<Body>({ root, store: 'test', schema: 'brain.test/1' })
}

test('V1 create 写出 v1，meta 含 id/version/checksum/supersedes', async () => {
  await withTempRoot(async (root) => {
    const s = makeStore(root)
    const rec = await s.create('R-001', { text: 'one' })
    assert.equal(rec.meta.id, 'R-001')
    assert.equal(rec.meta.version, 1)
    assert.equal(rec.meta.supersedes, null)
    assert.ok(rec.meta.checksum.startsWith('sha256:'))
    assert.ok(await fileExists(s.recordPath('R-001', 1)))
  })
})

test('V2 重复 create 抛 RECORD_EXISTS（改内容必须走 addVersion）', async () => {
  await withTempRoot(async (root) => {
    const s = makeStore(root)
    await s.create('R-001', { text: 'one' })
    await assert.rejects(
      () => s.create('R-001', { text: 'hack' }),
      (e: unknown) => isBrainError(e, 'RECORD_EXISTS'),
    )
  })
})

test('V3 addVersion 递增版本且旧版**原文保留**（只增不删改）', async () => {
  await withTempRoot(async (root) => {
    const s = makeStore(root)
    await s.create('R-001', { text: 'v1-text' })
    const v2 = await s.addVersion('R-001', { text: 'v2-text' })
    assert.equal(v2.meta.version, 2)
    assert.equal(v2.meta.supersedes, 1)

    const old = await s.get('R-001', 1)
    assert.equal(old.body.text, 'v1-text') // 旧版没被改
    assert.deepEqual(await s.listVersions('R-001'), [1, 2])
    assert.equal((await s.getLatest('R-001')).body.text, 'v2-text')
  })
})

test('V4 对未存在记录 addVersion 抛 RECORD_NOT_FOUND', async () => {
  await withTempRoot(async (root) => {
    const s = makeStore(root)
    await assert.rejects(
      () => s.addVersion('R-404', { text: 'x' }),
      (e: unknown) => isBrainError(e, 'RECORD_NOT_FOUND'),
    )
  })
})

test('V5 落盘被篡改时读取抛 CHECKSUM_MISMATCH（I4 兜住"旧版变质"的一半）', async () => {
  await withTempRoot(async (root) => {
    const s = makeStore(root)
    await s.create('R-001', { text: 'clean' })
    const p = s.recordPath('R-001', 1)
    const raw = JSON.parse(await fs.readFile(p, 'utf8')) as { body: Body }
    raw.body.text = 'tampered'
    await fs.writeFile(p, JSON.stringify(raw), 'utf8')
    await assert.rejects(
      () => s.get('R-001', 1),
      (e: unknown) => isBrainError(e, 'CHECKSUM_MISMATCH'),
    )
  })
})

test('V6 setStatus 不改历史文件，只追加事件 + 刷新索引（归档不删）', async () => {
  await withTempRoot(async (root) => {
    const s = makeStore(root)
    await s.create('R-001', { text: 'one' })
    const before = await fs.readFile(s.recordPath('R-001', 1), 'utf8')

    await s.setStatus('R-001', 'archived', '评分过低', 'owner')

    const after = await fs.readFile(s.recordPath('R-001', 1), 'utf8')
    assert.equal(before, after, '归档不得改动记录文件')
    assert.ok(await fileExists(s.recordPath('R-001', 1)), '归档不得物理删除')

    const idx = await s.readIndex()
    assert.equal(idx.entries['R-001']?.status, 'archived')

    const events = await s.readEvents()
    assert.ok(events.some((e) => e.type === 'status_changed' && e.status === 'archived' && e.actor === 'owner'))
  })
})

test('I3 index.json 删掉后可完全重建（含状态与评分回放）', async () => {
  await withTempRoot(async (root) => {
    const s = makeStore(root)
    await s.create('R-001', { text: 'a' })
    await s.addVersion('R-001', { text: 'b' })
    await s.create('R-002', { text: 'c' })
    await s.setStatus('R-002', 'archived', '测试')
    await s.setScore('R-001', 0.42, '测试')

    const before = await s.readIndex()
    await fs.rm(s.indexPath)
    assert.equal(await fileExists(s.indexPath), false)

    const rebuilt = await s.rebuildIndex()
    assert.deepEqual(Object.keys(rebuilt.entries).sort(), ['R-001', 'R-002'])
    assert.equal(rebuilt.entries['R-001']?.latest_version, 2)
    assert.equal(rebuilt.entries['R-001']?.score, 0.42)
    assert.equal(rebuilt.entries['R-002']?.status, 'archived')
    assert.equal(rebuilt.entries['R-001']?.latest_checksum, before.entries['R-001']?.latest_checksum)
  })
})

test('S-SEC 非法 ID 一律拒绝（含路径穿越）', () => {
  for (const bad of ['../escape', 'a/b', 'a\\b', '', '.hidden', 'x'.repeat(65)]) {
    assert.throws(
      () => assertValidId(bad),
      (e: unknown) => isBrainError(e, 'INVALID_ID'),
      `应拒绝：${JSON.stringify(bad)}`,
    )
  }
  assertValidId('F-0001')
  assertValidId('K_2026-07-31_001')
})
