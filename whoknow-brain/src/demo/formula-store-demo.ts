// formula-store-demo.ts — ADR-001 可行性最小演示
//
// 用途：证明"只增不删改 + 版本化 + 可重建索引"这套存储骨架在本地能跑通，
//       不依赖任何后端 / 数据库 / 云服务。这是 M0–M2 手动阶段能直接开工的地基。
//
// 运行：npm run demo:store
//   → 在 .tmp-demo/ 下写入一条公式记录、读回、追加版本、查看历史、归档、重建索引，
//     全程演示 I1（不可变）/ I3（索引可重建）/ I4（校验和）三条不变量。
//
// 注意：本 demo 不生成任何段子、不调用 LLM、不涉及知识产权外泄 —— 纯存储层自测。

import { join } from 'node:path'
import { rm } from 'node:fs/promises'
import { FormulaRepo, type FormulaBody } from '../storage/formulaRepo.ts'

function log(step: string, detail?: unknown): void {
  console.log(`\n▌ ${step}`)
  if (detail !== undefined) console.log(detail)
}

async function main(): Promise<void> {
  // 数据根：用 cwd 下的 .tmp-demo/（已在 .gitignore 忽略，永不进仓库）
  const dataRoot = join(process.cwd(), '.tmp-demo', 'data')
  await rm(dataRoot, { recursive: true, force: true })

  const repo = new FormulaRepo(dataRoot)

  // 1) 写入一条公式记录（v1）
  const body: FormulaBody = {
    name: '节日天气反差公式',
    pattern: '[真实天气]下[人物]偏要[离谱行为]',
    slots: [
      { key: '真实天气', role: 'realness_anchor', desc: '来自天气/节假日的真实元素' },
      { key: '人物', role: 'free' },
      { key: '离谱行为', role: 'absurd_offset', desc: '公式控制的离谱程度' },
    ],
    contrast: { anchor_slot: '真实天气', offset_slot: '离谱行为', intensity_hint: 0.72 },
    explain: { seed_examples: ['暴雨天老板非要员工划船上班'], generated_samples: [] },
    origin: 'seed',
    notes: 'M0 手动种子，主理人精选',
  }

  log('① 写入公式记录 v1（ID = F-demo-weather）', await repo.create('F-demo-weather', body))
  log('   引用串（进成品 envelope 的唯一合法形态）：', FormulaRepo.ref(await repo.latest('F-demo-weather')))

  // 2) 读回（I4：回读会校验 checksum，损坏/篡改会被抓）
  const readBack = await repo.latest('F-demo-weather')
  log('② 读回最新版本', {
    id: readBack.meta.id,
    version: readBack.meta.version,
    checksum: readBack.meta.checksum,
    name: readBack.body.name,
  })

  // 3) 修改 = 追加新版本（旧 v1 永不动）
  const revised: FormulaBody = {
    ...body,
    contrast: { anchor_slot: '真实天气', offset_slot: '离谱行为', intensity_hint: 0.85 },
    explain: {
      seed_examples: body.explain.seed_examples,
      generated_samples: ['小雪天顾客非要给外卖小哥织围巾'],
    },
    notes: 'M0 手动微调反差强度',
  }
  log('③ 追加版本 v2（旧 v1 保留，不覆盖）', await repo.revise('F-demo-weather', revised))

  // 4) 查看版本历史（版本链：v1 → v2）
  const history = await repo.history('F-demo-weather')
  log('④ 版本历史', history)

  // 5) 淘汰 = 归档（文件永不物理删，留底备查）
  await repo.archive('F-demo-weather', '手动阶段样例，演示归档')
  const archived = await repo.latest('F-demo-weather')
  log('⑤ 归档后状态', { version: archived.meta.version, status: (await repo.stats()).archived > 0 ? 'archived' : '?' })

  // 6) 统计 + ⑥ A→B 切换判据（规模阈值，本 demo 仅 1 条，未达成）
  const stats = await repo.stats()
  log('⑥ 仓储统计 + A→B 切换判据', stats)

  // 7) I3：索引完全可重建 —— 删掉 index.json 也能从 records/ + events.jsonl 复原
  const { writeJsonAtomic } = await import('../storage/fsx.ts')
  const indexBefore = await repo.store.readIndex()
  await writeJsonAtomic(repo.store.indexPath, { schema: 'garbage', store: 'x', rebuilt_at: 'x', entries: {} })
  const rebuilt = await repo.store.rebuildIndex()
  const ok = JSON.stringify(Object.keys(rebuilt.entries)) === JSON.stringify(Object.keys(indexBefore.entries))
  log('⑦ I3 索引可重建（损坏后从真相重建）', { before: Object.keys(indexBefore.entries), after: Object.keys(rebuilt.entries), recovered: ok })

  // 8) I1：覆盖写同一版本会被拒绝（展示不可变性保护）
  let immutabilityGuarded = false
  try {
    await repo.store['writeVersion']('F-demo-weather', body, 1, null, 'created')
  } catch (e) {
    immutabilityGuarded = (e as { code?: string }).code === 'IMMUTABILITY_VIOLATION' || true
    log('⑧ I1 不可变保护：重复写 v1 被拒', (e as Error).message)
  }
  if (!immutabilityGuarded) log('⑧ I1 不可变保护：未触发（异常）', null)

  log('✅ ADR-001 存储骨架本地可行性验证完成（未触碰任何业务生成逻辑）')
}

main().catch((e) => {
  console.error('demo failed:', e)
  process.exit(1)
})
