// eta.ts — 视图层 ETA 纯函数（拟真外壳 · 不碰引擎）
//
// 设计规格：docs/designs/waimai-realism-shell-spec.md §1.4 / §5.2
// 铁律：确定性纯函数，仅用于地图 ETA 显示；不写入 dramaState、不碰 sliceDrama。
// 量级 = 真实配送分钟级（秒），倒计时随 useDramaProgress.phaseProgress(p)
//   压缩在"配送阶段在屏时长"内走完（见 useDramaProgress），既真实又不拖沓。

import type { AddressTag } from '../engine/sliceDrama'

// 真实分钟级默认值（用户拍板）：home=28min / company=22min / icu=35min / toilet=40min
// 将来 playtest 校准即可，此处先给默认值。
const ETA_SECONDS: Record<AddressTag, number> = {
  home: 1680,
  company: 1320,
  icu: 2100,
  toilet: 2400,
}

const DEFAULT_ETA = 1800 // 兜底（未知地址）

/** 返回该地址的预估送达总时长（秒），确定性。 */
export function etaForAddress(tag: AddressTag | '' | undefined): number {
  if (!tag) return DEFAULT_ETA
  return ETA_SECONDS[tag] ?? DEFAULT_ETA
}

/** 把秒数格式化为 mm:ss（如 1680 → "28:00"）。 */
export function fmtMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return `${m}:${pad(sec)}`
}
