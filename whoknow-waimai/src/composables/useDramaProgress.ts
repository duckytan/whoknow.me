// useDramaProgress.ts — 统一 reveal 时钟 composable（拟真外壳 · 唯一事实时钟）
//
// 设计规格：docs/designs/waimai-realism-shell-spec.md §5.1
//
// 职责：
//   拥有"逐条 reveal 时钟"——依 events 顺序逐条登场（间隔随机 1.5–4s；
//   出餐慢阶段拉长到 2.5–4s，手感与旧 DramaTimeline 一致）。
//   暴露 currentPhase / phaseProgress(p) / revealedCount / isPerforming / typingIndex，
//   被 MapTrack / DramaChat / PushNotifier 共同消费——禁止三者各自 setTimeout 各走各的。
//
// 铁律：
//   - 纯消费 DramaEventOut（phase/actor/text/moodDelta?/delay?），零改引擎、零改台词。
//   - p 仅在 deliver 阶段由 0→1 缓动推进（cubic-bezier(0.4,0,0.2,1)），accept/cook 为 0，
//     complete 为 1；ETA 由 etaForAddress * (1-p) 联动，随 p 整数递减即"跳秒"。
//   - 支持 reset→resubmit：events 变空时复位，重新填充时重启时钟。

import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  inject,
  provide,
  type Ref,
  type ComputedRef,
  type InjectionKey,
} from 'vue'
import type { DramaEventOut } from '../engine/dramaEngine'

export interface DramaProgress {
  /** 当前阶段：accept → cook → deliver → complete */
  currentPhase: Ref<string>
  /** 配送进度 p∈[0,1]：仅 deliver 阶段 0→1 缓动；其余阶段为 0 或 1 */
  phaseProgress: Ref<number>
  /** 已完整登场（气泡已显示）的事件数 */
  revealedCount: Ref<number>
  /** 是否处于"某 NPC 正在输入…"状态 */
  isPerforming: ComputedRef<boolean>
  /** 正在打字的事件下标（-1 表示无）；聊天据此渲染命名 NPC 打字指示 */
  typingIndex: Ref<number>
}

export const DRAMA_PROGRESS_KEY: InjectionKey<DramaProgress> = Symbol('dramaProgress')

// ---- cubic-bezier(0.4,0,0.2,1) 缓动求解（贴合 CSS 同款曲线） ----
function makeEasing(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  return (x: number): number => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const xt = sampleX(t) - x
      const d = sampleDX(t)
      if (Math.abs(xt) < 1e-4 || Math.abs(d) < 1e-6) break
      t -= xt / d
    }
    return sampleY(t)
  }
}
const ease = makeEasing(0.4, 0, 0.2, 1)

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

const DELIVER_DURATION_MS = 9000 // 配送阶段在屏时长（规格建议 ~9s）
const INITIAL_DELAY = 400
const TYPING_BEAT_CAP = 1600 // 骑手气泡登场前的打字节奏上限

/**
 * 创建并驱动统一时钟。
 * @param getEvents 返回当前结果态事件的 getter（结果态由 OrderView 通过 ref 提供）。
 */
export function useDramaProgress(getEvents: () => DramaEventOut[]): DramaProgress {
  const revealedCount = ref(0)
  const typingIndex = ref(-1)
  const currentPhase = ref<string>(getEvents()[0]?.phase ?? 'accept')
  const phaseProgress = ref(0)
  const isPerforming = computed(() => typingIndex.value !== -1)

  const timeouts = new Set<ReturnType<typeof setTimeout>>()
  let rafId = 0
  let started = false

  const reducedMotion =
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function later(fn: () => void, ms: number): void {
    const id = setTimeout(() => {
      timeouts.delete(id)
      fn()
    }, ms)
    timeouts.add(id)
  }

  function clearTimers(): void {
    timeouts.forEach((id) => clearTimeout(id))
    timeouts.clear()
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  function resetState(): void {
    clearTimers()
    started = false
    revealedCount.value = 0
    typingIndex.value = -1
    phaseProgress.value = 0
    currentPhase.value = getEvents()[0]?.phase ?? 'accept'
  }

  // 第 idx 条登场前的等待：出餐慢阶段（delay ≥ 45s）拉长，呼应原 DramaTimeline 手感。
  function intervalFor(idx: number): number {
    const ev = getEvents()[idx]
    if (ev && typeof ev.delay === 'number' && ev.delay >= 45_000) {
      return rand(2500, 4000)
    }
    return rand(1500, 4000)
  }

  function beginStep(idx: number): void {
    const ev = getEvents()[idx]
    if (!ev) return
    currentPhase.value = ev.phase
    typingIndex.value = idx

    if (ev.phase === 'deliver') {
      // 骑手沿线行进：p 0→1（ETA 同步压缩）。reduced-motion 直接跳到终位（不补间）。
      if (reducedMotion) {
        phaseProgress.value = 1
        later(() => finishStep(idx), 600)
      } else {
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DELIVER_DURATION_MS)
          phaseProgress.value = ease(t)
          if (t < 1) {
            rafId = requestAnimationFrame(tick)
          } else {
            phaseProgress.value = 1
            finishStep(idx)
          }
        }
        rafId = requestAnimationFrame(tick)
      }
      // 骑手气泡在打字节奏后登场（保留逐条 reveal 手感），骑手点已开始移动。
      const beat = Math.min(intervalFor(idx), TYPING_BEAT_CAP)
      later(() => {
        revealedCount.value = idx + 1
        typingIndex.value = -1
      }, beat)
      return
    }

    later(() => finishStep(idx), intervalFor(idx))
  }

  function finishStep(idx: number): void {
    revealedCount.value = idx + 1
    typingIndex.value = -1
    beginStep(idx + 1)
  }

  function start(): void {
    if (started) return
    const evs = getEvents()
    if (!evs.length) return
    started = true
    revealedCount.value = 0
    typingIndex.value = -1
    phaseProgress.value = 0
    currentPhase.value = evs[0]?.phase ?? 'accept'
    later(() => beginStep(0), INITIAL_DELAY)
  }

  watch(
    () => getEvents().length,
    (n) => {
      if (n > 0 && !started) start()
      else if (n === 0) resetState()
    }
  )

  onMounted(() => {
    if (getEvents().length > 0) start()
  })
  onBeforeUnmount(() => {
    clearTimers()
  })

  return { currentPhase, phaseProgress, revealedCount, isPerforming, typingIndex }
}

/** 在父组件（OrderView）中调用：创建时钟并 provide 给子组件共享。 */
export function provideDramaProgress(getEvents: () => DramaEventOut[]): DramaProgress {
  const dp = useDramaProgress(getEvents)
  provide(DRAMA_PROGRESS_KEY, dp)
  return dp
}

/** 子组件（MapTrack / DramaChat / PushNotifier）注入共享时钟。 */
export function useDramaProgressInjected(): DramaProgress {
  const dp = inject(DRAMA_PROGRESS_KEY)
  if (!dp) throw new Error('useDramaProgress must be provided by an ancestor')
  return dp
}
