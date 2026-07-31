// safeJson.test.ts — Tier 1（正常值 / 边界 / 脏输入）
// 对应缺陷：P1 审计 D7（memory.ts 5 处裸 JSON.parse → 脏 localStorage 白屏）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeParse, safeParseArray, isPlainObject, toFiniteNumber } from './safeJson.ts'

test('SJ1 正常 JSON 原样解析', () => {
  assert.deepEqual(safeParse('{"a":1}', {}), { a: 1 })
  assert.deepEqual(safeParse('[1,2]', []), [1, 2])
  assert.equal(safeParse('"hi"', ''), 'hi')
})

test('SJ2 空值边界：null / undefined / 空串 / 纯空白 → fallback', () => {
  const fb = { ok: true }
  assert.equal(safeParse(null, fb), fb)
  assert.equal(safeParse(undefined, fb), fb)
  assert.equal(safeParse('', fb), fb)
  assert.equal(safeParse('   ', fb), fb)
})

test('SJ3 脏输入：语法错误 / 截断 / 非字符串 → fallback，不抛', () => {
  const fb = { ok: true }
  assert.equal(safeParse('{oops', fb), fb)
  assert.equal(safeParse('{"a":1', fb), fb)
  assert.equal(safeParse('undefined', fb), fb)
  assert.equal(safeParse(42 as unknown as string, fb), fb)
})

test('SJ4 JSON 里的 null 视为无数据 → fallback（否则调用方读属性会炸）', () => {
  const fb = { ok: true }
  assert.equal(safeParse('null', fb), fb)
})

test('SJ5 guard 形状校验不通过就当脏数据', () => {
  const fb = { totalOrders: 0 }
  assert.equal(safeParse('[1,2,3]', fb, isPlainObject), fb, '数组不该冒充对象')
  assert.equal(safeParse('"str"', fb, isPlainObject), fb)
  assert.deepEqual(safeParse('{"totalOrders":7}', fb, isPlainObject), { totalOrders: 7 })
})

test('SJ6 safeParseArray：非数组一律空数组（成就/历史的 unshift 不会炸）', () => {
  assert.deepEqual(safeParseArray('{"a":1}'), [])
  assert.deepEqual(safeParseArray('"月售28"'), [])
  assert.deepEqual(safeParseArray('坏数据'), [])
  assert.deepEqual(safeParseArray(null), [])
  assert.deepEqual(safeParseArray('[1,2]'), [1, 2])
})

test('SJ7 safeParseArray 带 itemGuard：滤掉脏元素只留合法项', () => {
  const raw = '["a",null,3,"b",{"x":1}]'
  assert.deepEqual(safeParseArray<string>(raw, (v) => typeof v === 'string'), ['a', 'b'])
  assert.deepEqual(safeParseArray('[null,null]', isPlainObject), [])
  assert.deepEqual(safeParseArray('[{"ts":1}]', isPlainObject), [{ ts: 1 }])
})

test('SJ8 toFiniteNumber 挡住 undefined/NaN/Infinity/字符串数字', () => {
  assert.equal(toFiniteNumber(7), 7)
  assert.equal(toFiniteNumber(0), 0)
  assert.equal(toFiniteNumber(undefined), 0)
  assert.equal(toFiniteNumber(NaN), 0)
  assert.equal(toFiniteNumber(Infinity), 0)
  assert.equal(toFiniteNumber('9'), 0)
  assert.equal(toFiniteNumber(null, 5), 5)
})

test('SJ9 isPlainObject 只认普通对象', () => {
  assert.equal(isPlainObject({}), true)
  assert.equal(isPlainObject([]), false)
  assert.equal(isPlainObject(null), false)
  assert.equal(isPlainObject('x'), false)
})
