#!/usr/bin/env node
// scripts/seed-platform-config.ts — 灌一份示例平台配置到 data/config/（M0-M2 手动初始）
//
// 用法：npm run seed:config
// data/ 被 .gitignore 忽略 → 配置本地居留、不入库（与 formulas / knowledge 一致）。
// 主理人后续直接编辑 data/config/records/default/v<n>.json 即可改配置，或 CLI `brain config init|show`。

import { join } from 'node:path'
import { PlatformConfigRepo, DEFAULT_CONFIG_ID, makeDefaultConfig } from '../src/config/platformConfig.ts'

const dataRoot = join(process.cwd(), 'data')

async function main(): Promise<void> {
  const repo = new PlatformConfigRepo(dataRoot)
  if (await repo.exists(DEFAULT_CONFIG_ID)) {
    console.log('⚠️ default 配置已存在，跳过（如需改配置请用 `brain config show` 查看后手动 edit）')
    return
  }
  const rec = await repo.create(DEFAULT_CONFIG_ID, makeDefaultConfig())
  console.log(`✅ 已创建默认平台配置：${rec.meta.version}`)
  console.log(`   信源数: ${rec.body.sources.length}`)
  console.log(`   权重档位 app: ${Object.keys(rec.body.weights.app_priority).join('/')}`)
  console.log('   位置: data/config/records/default/')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
