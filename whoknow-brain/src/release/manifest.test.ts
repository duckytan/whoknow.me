// manifest.test.ts — 发布清单：不可变追加 + 版本治理 + 校验和断言
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  emptyManifest,
  buildReleaseEntry,
  addRelease,
  findEntry,
  verifyArtifact,
} from './manifest.ts'
import { makeEnvelope } from '../testing/fixtures.ts'
import { isBrainError } from '../errors.ts'

function env(version: string): ReturnType<typeof makeEnvelope> {
  return makeEnvelope({ version, generated_at: `${version.slice(0, 10)}T03:00:00.000Z` })
}

test('M1 buildReleaseEntry 校验和与 verifyArtifact 自洽', () => {
  const e = env('2026-07-31.001')
  const entry = buildReleaseEntry(e, { artifact: 'releases/2026-07-31.001/food.json' })
  assert.equal(entry.version, '2026-07-31.001')
  assert.match(entry.checksum, /^sha256:/)
  // 同一内容复算一致
  assert.doesNotThrow(() => verifyArtifact(entry, e))
})

test('M2 addRelease 设 current 且按时间升序', () => {
  const m0 = emptyManifest('food')
  const e1 = buildReleaseEntry(env('2026-07-30.001'), { artifact: 'a', released_at: '2026-07-30T03:00:00.000Z' })
  const e2 = buildReleaseEntry(env('2026-07-31.001'), { artifact: 'b', released_at: '2026-07-31T03:00:00.000Z' })
  const m1 = addRelease(m0, e1)
  const m2 = addRelease(m1, e2)
  assert.equal(m2.current, '2026-07-31.001')
  assert.equal(m2.entries.length, 2)
  // 升序：旧在前
  assert.equal(m2.entries[0]!.version, '2026-07-30.001')
})

test('M3 addRelease 重复 version 幂等覆盖（只留最后一条）', () => {
  const m0 = emptyManifest('food')
  const e1 = buildReleaseEntry(env('2026-07-31.001'), { artifact: 'a', released_at: '2026-07-31T03:00:00.000Z' })
  const e1b = buildReleaseEntry(env('2026-07-31.001'), { artifact: 'b', released_at: '2026-07-31T03:05:00.000Z' })
  const m1 = addRelease(m0, e1)
  const m2 = addRelease(m1, e1b)
  assert.equal(m2.entries.length, 1)
  assert.equal(m2.entries[0]!.artifact, 'b')
})

test('M4 findEntry 命中与未命中', () => {
  const m = addRelease(emptyManifest('food'), buildReleaseEntry(env('2026-07-31.001'), { artifact: 'a' }))
  assert.equal(findEntry(m, '2026-07-31.001')?.artifact, 'a')
  assert.equal(findEntry(m, '2099-01-01.001'), null)
})

test('M5 verifyArtifact 内容被篡改则抛 CHECKSUM_MISMATCH', () => {
  const e = env('2026-07-31.001')
  const entry = buildReleaseEntry(e, { artifact: 'a' })
  const tampered = makeEnvelope({ version: '2026-07-31.001', meta: { hot_today: 'TAMPERED' } })
  let err: unknown
  try {
    verifyArtifact(entry, tampered)
  } catch (x) {
    err = x
  }
  assert.ok(err !== undefined)
  assert.equal(isBrainError(err), true)
})

test('M6 emptyManifest 初始态', () => {
  const m = emptyManifest('food')
  assert.equal(m.current, null)
  assert.deepEqual(m.entries, [])
  assert.deepEqual(m.revoked, [])
})
