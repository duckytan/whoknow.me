// manifest.ts — 发布清单与版本治理（ADR-003 内容级 version + checksum）
//
// 与 Vercel 的分工：
//   Vercel 管"部署级"回退（immutable deployment）；
//   manifest 管"内容级"版本与校验和 —— 因为部署回退救不了"旧版内容本身有问题"（8.2-4）。
//
// 本模块全部是**纯函数**：不碰网络、不碰 Vercel、不读环境变量。
// 落盘与部署由 M0–M2 的手动脚本调用（见 kickoff §4 E4）。

import { checksumOf } from '../storage/fsx.ts'
import { computeContentChecksumInput, type Envelope } from '../contracts/envelope.ts'
import { checksumMismatch } from '../errors.ts'

export const MANIFEST_SCHEMA = 'brain.release.manifest/1'

export interface ReleaseEntry {
  /** 形如 2026-07-31.001 */
  version: string
  /** 内容 canonical sha256（与 envelope.brain_meta.content_checksum 一致） */
  checksum: string
  released_at: string
  /** 成品制品相对路径，例如 releases/2026-07-31.001/food.json */
  artifact: string
  /** Vercel 不可变部署 URL（手动部署时回填；M0–M2 可为 null） */
  deployment_url: string | null
}

export interface RevocationEntry {
  version: string
  revoked_at: string
  reason: string
  by: string
}

export interface ReleaseManifest {
  schema: string
  product: string
  /** 当前对外主推版本；null = 从未成功发布 */
  current: string | null
  /** 按发布时间升序 */
  entries: ReleaseEntry[]
  /** S2 撤回/失效清单：回退时必须跳过 */
  revoked: RevocationEntry[]
}

export function emptyManifest(product: string): ReleaseManifest {
  return { schema: MANIFEST_SCHEMA, product, current: null, entries: [], revoked: [] }
}

/** 由 envelope 构造发布条目（checksum 从内容算，不信调用方传入）。 */
export function buildReleaseEntry(
  env: Envelope,
  opts: { artifact: string; released_at?: string; deployment_url?: string | null },
): ReleaseEntry {
  return {
    version: env.version,
    checksum: checksumOf(computeContentChecksumInput(env)),
    released_at: opts.released_at ?? new Date().toISOString(),
    artifact: opts.artifact,
    deployment_url: opts.deployment_url ?? null,
  }
}

/** 纯函数：返回新 manifest，不改入参。重复 version 视为幂等覆盖（同 version 只留最后一条）。 */
export function addRelease(manifest: ReleaseManifest, entry: ReleaseEntry): ReleaseManifest {
  const entries = manifest.entries.filter((e) => e.version !== entry.version).concat(entry)
  entries.sort((a, b) => Date.parse(a.released_at) - Date.parse(b.released_at))
  return { ...manifest, entries, current: entry.version }
}

export function findEntry(manifest: ReleaseManifest, version: string): ReleaseEntry | null {
  return manifest.entries.find((e) => e.version === version) ?? null
}

/** 校验制品内容与清单登记的 checksum 是否一致；不一致抛 CHECKSUM_MISMATCH。 */
export function verifyArtifact(entry: ReleaseEntry, env: Envelope): void {
  const actual = checksumOf(computeContentChecksumInput(env))
  if (actual !== entry.checksum) throw checksumMismatch(entry.checksum, actual, entry.artifact)
}
