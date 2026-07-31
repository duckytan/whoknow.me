// toast.ts — 全局拟真提示总线（P1 审计 D6）
//
// 背景：原生 alert() / confirm() 是最强"出戏"信号——系统弹窗一出来，
// "真美团外壳"当场击穿。改用 app 内 toast，视觉复用 style.css 既有 .ph-toast
// （店铺页加购提示同款），不新造样式语言。
//
// 为什么是"总线 + 单挂载点"而不是每个页面各写一份局部 toast：
// 设置页清空数据后会 router.push('/shops')，局部 toast 会随页面卸载一起消失，
// 用户根本看不到反馈。总线 + App.vue 顶层挂载才能跨路由存活。
//
// 本模块刻意不 import vue：保持纯 TS，node:test 可直接单测（这正是本轮制度补丁的要求）。

/** toast 停留时长（毫秒），与店铺页既有局部 toast 保持一致。 */
export const TOAST_DURATION_MS = 2000

type ToastListener = (message: string) => void

const listeners = new Set<ToastListener>()

/** 订阅 toast；返回取消订阅函数（组件卸载时务必调用）。 */
export function onToast(fn: ToastListener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** 弹一条拟真提示。空串 / 脏值直接忽略，不弹空框。 */
export function showToast(message: string): void {
  const text = typeof message === 'string' ? message.trim() : ''
  if (!text) return
  for (const fn of [...listeners]) {
    try {
      fn(text)
    } catch {
      // 单个订阅者异常不阻断其余订阅者，也不冒泡到业务调用点
    }
  }
}

/** 仅测试用：清空订阅者，避免用例间互相污染。 */
export function resetToastListeners(): void {
  listeners.clear()
}
