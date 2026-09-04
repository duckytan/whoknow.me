// revocation.ts — 版本失效清单与降级选版（阻断项 S2「旧版≠安全」的落地）
//
// 背景（BRAIN-PLAN 8.2-4）：降级用的"旧版"本身可能已变质（含违规/bug）。
// 光有 Vercel 部署回退不够 —— 必须能把某个内容版本**拉黑**，让回退跳过它。
//
// 里程碑：接口与选版逻辑 **M0–M2 即预埋**；触发来源（合规事件 / 举报 / 巡检）随 M3 补。
// 本模块是纯函数，不发网络请求；实际"下架"由手动部署脚本按结果执行。

import type { ReleaseEntry, ReleaseManifest, RevocationEntry } from './manifest.ts'
import type { DegradeLevel } from '../contracts/envelope.ts'

export function isRevoked(manifest: ReleaseManifest, version: string): boolean {
  return manifest.revoked.some((r) => r.version === version)
}

/** 拉黑一个版本（纯函数，返回新 manifest）。已拉黑则幂等。 */
export function revoke(
  manifest: ReleaseManifest,
  version: string,
  reason: string,
  by: string,
  at?: string,
): ReleaseManifest {
  if (isRevoked(manifest, version)) return manifest
  const entry: RevocationEntry = { version, revoked_at: at ?? new Date().toISOString(), reason, by }
  const revoked = manifest.revoked.concat(entry)
  // 若被拉黑的正是当前主推版本，current 必须让位给下一个可服务版本
  let current = manifest.current
  if (current === version) {
    const next = listServable({ ...manifest, revoked })
    current = next.length > 0 ? (next[0] as ReleaseEntry).version : null
  }
  return { ...manifest, revoked, current }
}

/** 可服务版本（已排除失效版），按发布时间**倒序**。 */
export function listServable(manifest: ReleaseManifest): ReleaseEntry[] {
  return manifest.entries
    .filter((e) => !isRevoked(manifest, e.version))
    .slice()
    .sort((a, b) => Date.parse(b.released_at) - Date.parse(a.released_at))
}

export interface ServableChoice {
  level: DegradeLevel
  version: string | null
  entry: ReleaseEntry | null
  reason: string
}

/**
 * L1–L4 降级选版参考实现（api-spec P0-3 四级降级 + S2 失效跳过）。
 *   L1 今日版本可用
 *   L2 回退到更早的**未失效**版本
 *   L3 静态 fallback（写死在 app 里）
 *   L4 诚实告知"今天没新段子"
 *
 * 这是 brain 侧的权威实现，app 端按同一语义实现即可（见 data-contract-v1.md §5）。
 */
export function pickServable(
  manifest: ReleaseManifest,
  opts: { todayVersion?: string | null; hasStaticFallback?: boolean } = {},
): ServableChoice {
  const servable = listServable(manifest)
  const today = opts.todayVersion ?? null

  if (today) {
    const hit = servable.find((e) => e.version === today)
    if (hit) return { level: 'L1', version: hit.version, entry: hit, reason: '今日版本可用' }
  }

  const older = servable.find((e) => e.version !== today)
  if (older) {
    return {
      level: 'L2',
      version: older.version,
      entry: older,
      reason: today ? '今日版本不可用或已失效，回退到最近的未失效版本' : '无今日版本，沿用最近的未失效版本',
    }
  }

  if (opts.hasStaticFallback) {
    return { level: 'L3', version: null, entry: null, reason: '无任何未失效的已发布版本，落静态 fallback' }
  }

  return { level: 'L4', version: null, entry: null, reason: '无可服务内容，诚实告知玩家' }
}
