// toast.test.ts — Tier 1（正常值 / 边界 / 脏输入）
// 对应缺陷：P1 审计 D6（原生 alert/confirm 出戏）→ 换成 app 内拟真提示
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { onToast, showToast, resetToastListeners, TOAST_DURATION_MS } from './toast.ts'

test('TS1 订阅者能收到消息，取消订阅后不再收到', () => {
  resetToastListeners()
  const got: string[] = []
  const off = onToast((m) => got.push(m))
  showToast('已复制：400-618-XXXX')
  off()
  showToast('这条不该收到')
  assert.deepEqual(got, ['已复制：400-618-XXXX'])
})

test('TS2 多订阅者全部收到（同一条消息广播）', () => {
  resetToastListeners()
  const a: string[] = []
  const b: string[] = []
  onToast((m) => a.push(m))
  onToast((m) => b.push(m))
  showToast('本单戏票不支持报销 🎭')
  assert.deepEqual(a, ['本单戏票不支持报销 🎭'])
  assert.deepEqual(b, ['本单戏票不支持报销 🎭'])
  resetToastListeners()
})

test('TS3 边界：空串 / 纯空白 / 脏值不弹框', () => {
  resetToastListeners()
  const got: string[] = []
  onToast((m) => got.push(m))
  showToast('')
  showToast('    ')
  showToast(null as unknown as string)
  showToast(undefined as unknown as string)
  showToast(42 as unknown as string)
  assert.deepEqual(got, [], '脏值不该弹出 toast')
  resetToastListeners()
})

test('TS4 消息前后空白被裁掉', () => {
  resetToastListeners()
  const got: string[] = []
  onToast((m) => got.push(m))
  showToast('  已清空，欢迎重新开演。  ')
  assert.deepEqual(got, ['已清空，欢迎重新开演。'])
  resetToastListeners()
})

test('TS5 单个订阅者抛异常不影响其余订阅者，也不冒泡到调用点', () => {
  resetToastListeners()
  const got: string[] = []
  onToast(() => {
    throw new Error('订阅者炸了')
  })
  onToast((m) => got.push(m))
  assert.doesNotThrow(() => showToast('订单已提交'))
  assert.deepEqual(got, ['订单已提交'])
  resetToastListeners()
})

test('TS6 停留时长为正数（组件按此设定定时器）', () => {
  assert.ok(Number.isFinite(TOAST_DURATION_MS) && TOAST_DURATION_MS > 0)
})
