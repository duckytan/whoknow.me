// revocation.test.ts — 版本失效清单 + L1–L4 降级选版（S2「旧版≠安全」）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emptyManifest, buildReleaseEntry, addRelease } from './manifest.ts'
import { isRevoked, revoke, listServable, pickServable } from './revocation.ts'
import { makeEnvelope } from '../testing/fixtures.ts'

function env(version: string): ReturnType<typeof makeEnvelope> {
  return makeEnvelope({ version, generated_at: `${version.slice(0, 10)}T03:00:00.000Z` })
}

function manifestWith(versions: string[], ats: string[]): ReturnType<typeof emptyManifest> {
  let m = emptyManifest('food')
  versions.forEach((v, i) => {
    m = addRelease(m, buildReleaseEntry(env(v), { artifact: v, released_at: ats[i] ?? `${v.slice(0, 10)}T03:00:00.000Z` }))
  })
  return m
}

test('R1 revoke 标记失效，isRevoked 命中', () => {
  const m = revoke(manifestWith(['2026-07-30.001', '2026-07-31.001'], []), '2026-07-30.001', '含违规', 'owner')
  assert.equal(isRevoked(m, '2026-07-30.001'), true)
  assert.equal(isRevoked(m, '2026-07-31.001'), false)
})

test('R2 listServable 排除失效版，按时间倒序', () => {
  const m = revoke(
    manifestWith(['2026-07-30.001', '2026-07-31.001', '2026-08-01.001'], []),
    '2026-07-30.001',
    '含违规',
    'owner',
  )
  const servable = listServable(m)
  assert.deepEqual(
    servable.map((e) => e.version),
    ['2026-08-01.001', '2026-07-31.001'],
  )
})

test('R3 拉黑当前主推版本 → current 让位下一个可服务版', () => {
  let m = manifestWith(['2026-07-30.001', '2026-07-31.001'], [])
  assert.equal(m.current, '2026-07-31.001')
  m = revoke(m, '2026-07-31.001', '变质', 'owner')
  assert.equal(m.current, '2026-07-30.001')
})

test('R4 revoke 幂等（重复拉黑不改变清单）', () => {
  const base = manifestWith(['2026-07-31.001'], [])
  const once = revoke(base, '2026-07-31.001', 'x', 'owner')
  const twice = revoke(once, '2026-07-31.001', 'x', 'owner')
  assert.equal(once.revoked.length, twice.revoked.length)
})

test('R5 pickServable L1：今日版本可用', () => {
  const m = manifestWith(['2026-07-30.001', '2026-07-31.001'], [])
  const c = pickServable(m, { todayVersion: '2026-07-31.001' })
  assert.equal(c.level, 'L1')
  assert.equal(c.version, '2026-07-31.001')
})

test('R6 pickServable L2：今日版失效 → 回退最近未失效版', () => {
  let m = manifestWith(['2026-07-30.001', '2026-07-31.001'], [])
  m = revoke(m, '2026-07-31.001', '变质', 'owner')
  const c = pickServable(m, { todayVersion: '2026-07-31.001' })
  assert.equal(c.level, 'L2')
  assert.equal(c.version, '2026-07-30.001')
})

test('R7 pickServable L3：无任何可服务版 + 有静态 fallback', () => {
  // 全拉黑
  let m = manifestWith(['2026-07-31.001'], [])
  m = revoke(m, '2026-07-31.001', '全坏', 'owner')
  const c = pickServable(m, { todayVersion: '2026-07-31.001', hasStaticFallback: true })
  assert.equal(c.level, 'L3')
  assert.equal(c.version, null)
})

test('R8 pickServable L4：全失效且无静态 fallback → 诚实告知', () => {
  let m = manifestWith(['2026-07-31.001'], [])
  m = revoke(m, '2026-07-31.001', '全坏', 'owner')
  const c = pickServable(m, { todayVersion: '2026-07-31.001', hasStaticFallback: false })
  assert.equal(c.level, 'L4')
  assert.equal(c.version, null)
})
