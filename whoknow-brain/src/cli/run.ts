#!/usr/bin/env node
// cli/run.ts — 大脑 CLI 入口（M0–M2 手动模式）
//
// 用法：
//   node --experimental-strip-types src/cli/run.ts assemble \
//     --product waimai --data <dataRoot> --drafts <draftsDir> --out <outDir>
//
// 流程：读草稿 + meta → assembleProduct → 过闸门（不过闸直接退出，不可绕）→ 落盘+写清单。
// 部署（vercel）本阶段手动：产物落 <outDir>/releases/<product>/，用户在该目录 `vercel deploy --prod`。

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { assembleProduct } from '../assemble/assembler.ts'
import { deployRelease } from '../deploy/deployer.ts'
import { evaluatePublishable } from '../release/gate.ts'
import type { ContentDraft, ReleaseMeta, ProductKey } from '../assemble/types.ts'

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      product: { type: 'string', default: 'waimai' },
      data: { type: 'string' },
      drafts: { type: 'string' },
      out: { type: 'string' },
    },
    allowPositionals: true,
  })

  const product = values.product as ProductKey
  const data = values.data
  const drafts = values.drafts
  const out = values.out
  if (!data || !drafts || !out) {
    throw new Error('用法：brain assemble --product <p> --data <dataRoot> --drafts <draftsDir> --out <outDir>')
  }

  // 读草稿目录
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

  // 闸门（不可绕）
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

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
