#!/usr/bin/env node
// cli/run.ts — 大脑 CLI 入口（M0–M2 手动模式）
//
// 子命令：
//   assemble  — 组装草稿 → 过闸门 → 落盘 releases/<product>/（手动部署 vercel）
//   config    — 管理平台手动配置包（信源清单 + 类型权重档位），M0-M2 不接 cron/UI
//
// 用法：
//   node --experimental-strip-types src/cli/run.ts assemble \
//     --product waimai --data <dataRoot> --drafts <draftsDir> --out <outDir>
//   node --experimental-strip-types src/cli/run.ts config init [--data <dataRoot>]
//   node --experimental-strip-types src/cli/run.ts config show [--data <dataRoot>]

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { assembleProduct } from '../assemble/assembler.ts'
import { deployRelease } from '../deploy/deployer.ts'
import { evaluatePublishable } from '../release/gate.ts'
import { PlatformConfigRepo, DEFAULT_CONFIG_ID, makeDefaultConfig } from '../config/platformConfig.ts'
import type { ContentDraft, ReleaseMeta, ProductKey } from '../assemble/types.ts'

async function runAssemble(values: Record<string, unknown>): Promise<void> {
  const product = values.product as ProductKey
  const data = values.data as string | undefined
  const drafts = values.drafts as string | undefined
  const out = values.out as string | undefined
  if (!data || !drafts || !out) {
    throw new Error('用法：brain assemble --product <p> --data <dataRoot> --drafts <draftsDir> --out <outDir>')
  }

  const files = (await readdir(drafts)).filter((f) => f.endsWith('.json') && f !== 'meta.json')
  if (files.length === 0) throw new Error(`草稿目录无 .json 草稿：${drafts}`)
  const draftList: ContentDraft[] = []
  for (const f of files) {
    const raw = JSON.parse(await readFile(join(drafts, f), 'utf8')) as ContentDraft
    draftList.push(raw)
  }
  const meta = JSON.parse(await readFile(join(drafts, 'meta.json'), 'utf8')) as ReleaseMeta

  console.log(`▌ 组装 ${draftList.length} 条草稿 → ${product} @ ${meta.version}`)
  const record = await assembleProduct(data, product, draftList, meta)

  const gate = evaluatePublishable(record)
  for (const w of gate.warnings) console.warn(`  ⚠️ ${w}`)
  if (!gate.ok) {
    console.error('❌ 发布闸门拦截，拒绝部署：')
    for (const r of gate.reasons) console.error(`  - ${r}`)
    process.exit(2)
  }

  const res = await deployRelease(product, record, { outDir: out })
  console.log('✅ 组装 + 落盘完成')
  console.log(`   产物: ${res.artifactPath}`)
  console.log(`   清单: ${res.manifestPath}`)
  console.log(`   版本: ${res.entry.version}  checksum: ${res.entry.checksum}`)
  console.log('   下一步：在该目录运行 `vercel deploy --prod` 上线（M0–M2 手动部署）')
}

async function runConfig(sub: string, data: string | undefined): Promise<void> {
  const root = data ?? join(process.cwd(), 'data')
  const repo = new PlatformConfigRepo(root)
  if (sub === 'init') {
    if (await repo.exists(DEFAULT_CONFIG_ID)) {
      console.log('⚠️ default 配置已存在，跳过（用 `brain config show` 查看，手动 edit 改）')
      return
    }
    const rec = await repo.create(DEFAULT_CONFIG_ID, makeDefaultConfig())
    console.log(`✅ 已创建默认平台配置 v${rec.meta.version}，位置 ${join(root, 'config')}/`)
    return
  }
  // show（默认）
  const rec = await repo.latest(DEFAULT_CONFIG_ID)
  console.log(JSON.stringify(rec.body, null, 2))
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      product: { type: 'string', default: 'waimai' },
      data: { type: 'string' },
      drafts: { type: 'string' },
      out: { type: 'string' },
    },
    allowPositionals: true,
  })

  const command = positionals[0] ?? 'assemble'
  if (command === 'config') {
    const sub = positionals[1] ?? 'show'
    await runConfig(sub, values.data as string | undefined)
    return
  }
  await runAssemble(values)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
