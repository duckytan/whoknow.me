// fsx.test.ts — 存储原语不变量测试（I1/I2/I4）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { promises as fs } from 'node:fs'
import { withTempRoot } from '../testing/tmpdir.ts'
import {
  appendJsonl,
  canonicalJson,
  checksumOf,
  readJson,
  readJsonl,
  verifyChecksum,
  writeJsonAtomic,
  writeNewJsonExclusive,
} from './fsx.ts'
import { isBrainError } from '../errors.ts'

test('X1 canonicalJson 与键序无关（checksum 稳定）', () => {
  const a = { b: 1, a: { z: 1, y: [3, { q: 1, p: 2 }] } }
  const b = { a: { y: [3, { p: 2, q: 1 }], z: 1 }, b: 1 }
  assert.equal(canonicalJson(a), canonicalJson(b))
  assert.equal(checksumOf(a), checksumOf(b))
})

test('X2 canonicalJson 丢弃 undefined，但保留 null（null 有语义）', () => {
  assert.equal(canonicalJson({ a: undefined, b: null }), '{"b":null}')
})

test('X3 checksum 对内容敏感', () => {
  assert.notEqual(checksumOf({ a: 1 }), checksumOf({ a: 2 }))
  assert.ok(checksumOf({ a: 1 }).startsWith('sha256:'))
})

test('X4 verifyChecksum 不匹配时抛 CHECKSUM_MISMATCH', () => {
  assert.throws(
    () => verifyChecksum({ a: 1 }, 'sha256:deadbeef'),
    (e: unknown) => isBrainError(e, 'CHECKSUM_MISMATCH'),
  )
})

test('I1 writeNewJsonExclusive 拒绝覆盖已存在文件', async () => {
  await withTempRoot(async (root) => {
    const p = join(root, 'a', 'v1.json')
    await writeNewJsonExclusive(p, { v: 1 })
    await assert.rejects(
      () => writeNewJsonExclusive(p, { v: 2 }),
      (e: unknown) => isBrainError(e, 'IMMUTABILITY_VIOLATION'),
    )
    assert.deepEqual(await readJson(p), { v: 1 })
  })
})

test('I2 writeJsonAtomic 可覆盖且不残留 tmp 文件', async () => {
  await withTempRoot(async (root) => {
    const p = join(root, 'index.json')
    await writeJsonAtomic(p, { n: 1 })
    await writeJsonAtomic(p, { n: 2 })
    assert.deepEqual(await readJson(p), { n: 2 })
    const leftovers = (await fs.readdir(root)).filter((f) => f.endsWith('.tmp'))
    assert.deepEqual(leftovers, [])
  })
})

test('X5 readJson 对不存在的文件返回 null（不抛）', async () => {
  await withTempRoot(async (root) => {
    assert.equal(await readJson(join(root, 'nope.json')), null)
  })
})

test('X6 appendJsonl 只追加，历史行不被改写', async () => {
  await withTempRoot(async (root) => {
    const p = join(root, 'events.jsonl')
    await appendJsonl(p, { i: 1 })
    await appendJsonl(p, { i: 2 })
    await appendJsonl(p, { i: 3 })
    assert.deepEqual(await readJsonl(p), [{ i: 1 }, { i: 2 }, { i: 3 }])
  })
})
