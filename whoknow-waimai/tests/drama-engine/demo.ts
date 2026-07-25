// demo.ts — P0-D「写备注 vs 没写」差异实测（Phase 3 · A 收尾演示）
// 运行：node --experimental-strip-types tests/drama-engine/demo.ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runDrama } from './dramaEngine.impl.ts'

const SEED_PATH = fileURLToPath(new URL('../../docs/specs/DRAMA-SEED-v1-2026-07-24.json', import.meta.url))
const SEED = JSON.parse(readFileSync(SEED_PATH, 'utf8'))

const base = {
  shopId: 's001-老王烧烤',
  riderId: 'r001',
  orderTotal: 50,
  avgDishPrice: 20,
  dishCount: 1,
  deliveryFee: 3,
  addressTag: 'home',
}

function show(title: string, r: ReturnType<typeof runDrama>) {
  console.log(`\n— ${title} —`)
  console.log(`命中分支: ${r.selectedBranchId ?? '(无·走默认平静流程)'} | bossMood: ${r.finalState.bossMood} | 延时: ${r.finalState.totalDelay}`)
  if (r.events.length === 0) {
    console.log('（无专属戏精台词 → 这正是「没写备注」与「写了」的差异点）')
  } else {
    for (const e of r.events) console.log(`  [${e.actor}] ${e.text}`)
  }
}

show('写了备注「别骂了」(remarkTag=no_scold)', runDrama(SEED, { ...base, remarkTag: 'no_scold' }, { random: () => 0 }))
show('写了备注「多放辣」(remarkTag=more_spicy)', runDrama(SEED, { ...base, remarkTag: 'more_spicy' }, { random: () => 0 }))
show('没写备注 (remarkTag=none)', runDrama(SEED, { ...base, remarkTag: 'none' }, { random: () => 0 }))
show('穷鬼单 (orderTotal=15)', runDrama(SEED, { ...base, orderTotal: 15 }, { random: () => 0 }))
