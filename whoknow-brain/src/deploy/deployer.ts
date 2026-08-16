// deployer.ts — 落盘与版本治理（ADR-003：部署即版本 + 内容级校验和）
//
// 本模块只做"本地落盘 + 写版本清单"，**不碰网络、不碰 Vercel**（纯函数友好）。
// M0–M2 手动阶段：产物写入 outDir/releases/<product>/，用户随后在该目录手动 `vercel deploy --prod`。
// （自动推 Vercel 属 M3；本阶段刻意不接，避免沙箱/凭据陷阱，也契合"前期省"。）
//
// 所有部署路径都必须先过 gate（assertPublishable），闸门不可绕。

import { join } from 'node:path'
import { writeJsonAtomic, readJson } from '../storage/fsx.ts'
import {
  projectToPublicEnvelope,
  verifyEnvelopeChecksum,
  type ProductionRecord,
} from '../contracts/production.ts'
import {
  emptyManifest,
  addRelease,
  buildReleaseEntry,
  type ReleaseManifest,
  type ReleaseEntry,
} from '../release/manifest.ts'
import { assertPublishable } from '../release/gate.ts'
import type { DegradeLevel } from '../contracts/envelope.ts'
import type { ProductKey } from '../assemble/types.ts'

export interface DeployOptions {
  /** 输出根目录；产物落 releases/<product>/ */
  outDir: string
}

export interface DeployResult {
  artifactPath: string
  manifestPath: string
  entry: ReleaseEntry
}

/**
 * 把一版 ProductionRecord 投影为公开 envelope 并落盘。
 * 返回产物路径与清单条目；清单 current 自动指向本版本（addRelease 幂等）。
 * @throws PUBLISH_BLOCKED 若未过闸门（红线/未审/契约不合法）
 */
export async function deployRelease(
  product: ProductKey,
  record: ProductionRecord,
  opts: DeployOptions,
): Promise<DeployResult> {
  // 闸门：部署前最后一道保险，绝不绕过
  assertPublishable(record)

  const level: DegradeLevel = 'L1'
  const env = projectToPublicEnvelope(record, level)
  if (!verifyEnvelopeChecksum(env)) {
    throw new Error('content_checksum 自洽校验失败（投影过程被破坏，拒绝落盘）')
  }

  const productDir = join(opts.outDir, 'releases', product)
  const artifactPath = join(productDir, `${env.version}.json`)
  await writeJsonAtomic(artifactPath, env)

  const manifestPath = join(productDir, 'manifest.json')
  const prev = await readJson<ReleaseManifest>(manifestPath)
  const manifest: ReleaseManifest = prev ?? emptyManifest(product)
  const entry = buildReleaseEntry(env, {
    artifact: `releases/${product}/${env.version}.json`,
  })
  const next = addRelease(manifest, entry)
  await writeJsonAtomic(manifestPath, next)

  return { artifactPath, manifestPath, entry }
}
