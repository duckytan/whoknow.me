// forbiddenCheck.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runForbiddenCheck, normalize, type TabooList } from './forbiddenCheck.ts'

const taboo: TabooList = {
  version: '1.0',
  red_light: ['美团', '医院', '1288', '警察'],
  yellow_light: ['萌', '宝贝'],
}

test('F1 红线词命中 → pass=false，redLightCount>0', () => {
  const r = runForbiddenCheck(['老板是美团骑手'], taboo)
  assert.equal(r.pass, false)
  assert.ok(r.redLightCount >= 1)
})

test('F2 黄灯词不计入 redLightCount，但记录 hits', () => {
  const r = runForbiddenCheck(['小宝贝来单了'], taboo)
  assert.equal(r.pass, true) // 黄灯不影响发布闸门
  assert.ok(r.hits.some((h) => h.level === 'yellow'))
})

test('F3 全角→半角归一：１２８８ 命中 1288', () => {
  assert.equal(normalize('１２８８'), '1288')
  const r = runForbiddenCheck(['尾号１２８８'], taboo)
  assert.equal(r.pass, false)
})

test('F4 大小写归一：MEITUAN 命中 美团? 否——仅小写词命中', () => {
  // 红线词为简体中文，ASCII 变体靠小写归一；此处验证 clean 文本 pass=true
  const r = runForbiddenCheck(['老板今天心情不错'], taboo)
  assert.equal(r.pass, true)
  assert.equal(r.redLightCount, 0)
})

test('F5 多文本联合扫描', () => {
  const r = runForbiddenCheck(['正常台词一', '附近有医院', '正常台词二'], taboo)
  assert.equal(r.pass, false)
  assert.ok(r.hits.some((h) => h.term === '医院'))
})
