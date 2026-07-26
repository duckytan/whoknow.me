// 07-forbiddenCheck.test.ts — 否决#3 配置污染机检（07 forbidden_check）
//
// 坏长什么样：任意屏出现红线词 → 整包拒绝（L1-T1）→ 走 L4 降级。
// 机检：runForbiddenCheck 红灯→fail / 黄灯→不 fail；信封 forbidden_check.red_light_count>0 → REJECT。

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runForbiddenCheck } from '../src/core/forbiddenCheck.ts'
import { loadMartConfig } from '../src/config/loader.ts'
import { MART_STATIC_ENVELOPE } from '../src/config/l1mart.static.ts'

// 测试用合成 taboo（真实词表由 design-strategist 落地；机制测试不依赖具体内容）
const MART_TEST_TABOO = {
  version: '1.0',
  red_light: ['测试红线词XYZ'],
  yellow_light: ['测试黄灯词ABC'],
}

test('否决#3 · 红灯词 → redLightCount>0 → pass=false', () => {
  const r = runForbiddenCheck(['测试红线词XYZ', '正常导购台词'], MART_TEST_TABOO)
  assert.ok(r.redLightCount > 0)
  assert.equal(r.pass, false)
})

test('否决#3 · 黄灯词 → 不触发红灯，但记 yellow', () => {
  const r = runForbiddenCheck(['测试黄灯词ABC'], MART_TEST_TABOO)
  assert.equal(r.redLightCount, 0)
  assert.ok(r.hits.some((h) => h.level === 'yellow'))
})

test('否决#3 · 信封 forbidden_check.red_light_count>0 → 整包拒绝（不返回敏感内容）', () => {
  const env = {
    ...MART_STATIC_ENVELOPE,
    forbidden_check: { version: '1.0', red_light_count: 1, yellow_light_count: 0, passed: false },
  }
  const res = loadMartConfig(env)
  assert.equal(res.status, 'REJECT')
  assert.equal(res.config, undefined)
})

test('否决#3 · 信封红灯=0 → 正常放行（取 mart 子树）', () => {
  const res = loadMartConfig(MART_STATIC_ENVELOPE)
  assert.equal(res.status, 'OK')
  assert.ok(res.config)
})
