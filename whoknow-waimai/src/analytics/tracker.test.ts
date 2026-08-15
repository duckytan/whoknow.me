import { test } from 'node:test'
import assert from 'node:assert/strict'
import { track, getStats, clearStats } from './tracker.ts'

test('track 累计 share/replay 计数', () => {
  clearStats()
  track('replay')
  track('replay')
  track('share_click')
  const s = getStats()
  assert.equal(s.replay, 2)
  assert.equal(s.share_click, 1)
  assert.equal(s.total, 3)
})

test('track 携带 context 不报错', () => {
  clearStats()
  track('share_click', { addressTag: 'toilet', remarkTag: 'more_spicy' })
  const s = getStats()
  assert.equal(s.share_click, 1)
})

test('事件上限 500 条不溢出', () => {
  clearStats()
  for (let i = 0; i < 520; i++) track('replay')
  assert.equal(getStats().replay, 500)
})
