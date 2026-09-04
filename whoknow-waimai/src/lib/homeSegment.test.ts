import test from 'node:test'
import assert from 'node:assert/strict'
// 被 node --test 直接加载的模块间导入必须带 .ts 扩展名（见 §2 末 N4）
import { nextHomeSeg } from './homeSegment.ts'

// 自取是占位频道：点击只提示、不切高亮。
// 这条把"点自取后 segActive 仍为 '首页'"的口径钉死——
// HomeView 里仅在 nextHomeSeg 返回非 null 时才改 segActive，所以自取永远是 null。
test('自取点击不切高亮（返回 null，调用方不改 segActive）', () => {
  assert.equal(nextHomeSeg('自取'), null)
})

// 首页等真实分段正常切高亮
test('首页点击正常切高亮', () => {
  assert.equal(nextHomeSeg('首页'), '首页')
})

// 其它分段透传（如将来新增频道），保持口径一致、不被误判成占位频道
test('非自取分段透传原值', () => {
  assert.equal(nextHomeSeg('外卖'), '外卖')
})
