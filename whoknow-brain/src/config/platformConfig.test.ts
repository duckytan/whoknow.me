// platformConfig.test.ts — 配置包仓储测试（M0-M2 手动，VersionedStore 版本化）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeTempRoot, cleanup } from '../testing/tmpdir.ts'
import { PlatformConfigRepo, DEFAULT_CONFIG_ID, makeDefaultConfig } from './platformConfig.ts'
import type { PlatformConfig } from './types.ts'

test('创建默认配置包并读回', async () => {
  const root = await makeTempRoot('cfg-')
  try {
    const repo = new PlatformConfigRepo(root)
    const rec = await repo.create(DEFAULT_CONFIG_ID, makeDefaultConfig())
    assert.equal(rec.meta.version, 1)

    const latest = await repo.latest(DEFAULT_CONFIG_ID)
    assert.equal(latest.body.sources.length, 3, '应含 3 条信源')
    const weather = latest.body.sources.find((s) => s.id === 'api-openweather')
    assert.ok(weather && weather.status === 'active')
    const sensitive = latest.body.sources.find((s) => s.id === 'rss-politics')
    assert.ok(sensitive && sensitive.status === 'paused' && sensitive.weight === 0, '涉敏源默认暂停且权重 0')
    assert.equal(latest.body.weights.dimension_weights.meme, 1.2)
  } finally {
    await cleanup(root)
  }
})

test('修改权重档位 = 追加新版本，旧版保留可回退', async () => {
  const root = await makeTempRoot('cfg-')
  try {
    const repo = new PlatformConfigRepo(root)
    await repo.create(DEFAULT_CONFIG_ID, makeDefaultConfig())

    const base = makeDefaultConfig()
    const updated: PlatformConfig = {
      ...base,
      weights: {
        ...base.weights,
        dimension_weights: { ...base.weights.dimension_weights, meme: 2.0 },
      },
      meta: { ...base.meta, version_label: 'v2 调高梗性权重', updated_by: '锡哥' },
    }
    const rev = await repo.revise(DEFAULT_CONFIG_ID, updated)
    assert.equal(rev.meta.version, 2)

    const v1 = await repo.version(DEFAULT_CONFIG_ID, 1)
    assert.equal(v1.body.weights.dimension_weights.meme, 1.2, '旧版 meme 应保留 1.2')
    const latest = await repo.latest(DEFAULT_CONFIG_ID)
    assert.equal(latest.body.weights.dimension_weights.meme, 2.0)
  } finally {
    await cleanup(root)
  }
})

test('listIds / readIndex / 重复创建报错', async () => {
  const root = await makeTempRoot('cfg-')
  try {
    const repo = new PlatformConfigRepo(root)
    await repo.create(DEFAULT_CONFIG_ID, makeDefaultConfig())

    const ids = await repo.listIds()
    assert.deepEqual(ids, [DEFAULT_CONFIG_ID])
    const idx = await repo.readIndex()
    assert.ok(idx.entries[DEFAULT_CONFIG_ID])

    await assert.rejects(() => repo.create(DEFAULT_CONFIG_ID, makeDefaultConfig()))
  } finally {
    await cleanup(root)
  }
})

test('rebuildIndex 可从 records 重建索引', async () => {
  const root = await makeTempRoot('cfg-')
  try {
    const repo = new PlatformConfigRepo(root)
    await repo.create(DEFAULT_CONFIG_ID, makeDefaultConfig())
    await repo.revise(DEFAULT_CONFIG_ID, makeDefaultConfig())
    const rebuilt = await repo.rebuildIndex()
    assert.equal(rebuilt.entries[DEFAULT_CONFIG_ID]!.latest_version, 2)
  } finally {
    await cleanup(root)
  }
})
