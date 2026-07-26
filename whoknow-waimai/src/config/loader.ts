// loader.ts — 配置加载器（M1）
// 以 DRAMA-SEED（权威 10 分支）为数据源，解析/校验 branches。
// 浏览器端由 envelope 加载（fetch latest-config.json），这里提供纯函数 + node 读取路径。

export interface Branch {
  id: string
  name?: string
  weight?: number
  isFallback?: boolean
  trigger: {
    condition: string
    probability?: number
    probabilityScaling?: { param: string; threshold?: number; rate?: number }
    cooldownMin?: number
    maxPerUser?: number
  }
  rarity?: string
  achievements?: string[]
  chain: Array<{
    phase: string
    actor: string
    text: string
    moodDelta?: number
    delay?: number
    id?: string
    next?: string | string[]
    nextWeights?: number[]
    effect?: { tags?: string[]; flags?: string[] }
  }>
}

/** 纯解析：顶层数组即 branches；校验结构并返回。 */
export function parseBranches(raw: unknown): Branch[] {
  if (!Array.isArray(raw)) throw new Error('branches 必须是数组')
  const branches = raw as Branch[]
  if (branches.length === 0) throw new Error('branches 为空')
  for (const b of branches) {
    if (!b.id || typeof b.id !== 'string') throw new Error('branch 缺少 id')
    if (!b.trigger || typeof b.trigger.condition !== 'string') throw new Error(`branch ${b.id} 缺 trigger.condition`)
    if (!Array.isArray(b.chain) || b.chain.length === 0) throw new Error(`branch ${b.id} 缺 chain`)
    for (const n of b.chain) {
      if (!n.phase || !n.actor || typeof n.text !== 'string') {
        throw new Error(`branch ${b.id} 的 chain 节点缺 phase/actor/text`)
      }
    }
  }
  return branches
}

/** 合法插值变量白名单（引擎运行时由 OrderInput/History/Meta 替换）。 */
const KNOWN_VARS = new Set([
  'orderTotal', 'deliveryFee', 'todayOrderCount', 'shopId', 'riderId',
  'avgDishPrice', 'dishCount', 'remarkTag', 'addressTag', 'hot_today', 'weather',
  'shopVisitCount', 'riderVisitCount',
])

/** 校验红线：任何台词文本不得残留「非白名单」占位符（如旧名 {price}/{fee}）。 */
export function assertNoPlaceholderLeak(branches: Branch[]): void {
  const re = /\{(\w+)\}/g
  for (const b of branches) {
    for (const n of b.chain) {
      let m: RegExpExecArray | null
      while ((m = re.exec(n.text))) {
        if (!KNOWN_VARS.has(m[1])) {
          throw new Error(`branch ${b.id} 节点残留非法占位符: ${m[0]} (text=${n.text})`)
        }
      }
    }
  }
}

/** 解析已读取的 SEED JSON（纯函数，浏览器/Node 通用）。浏览器端由 envelope fetch 拿到 JSON 后传入。 */
export function loadSeedBranches(raw: unknown): Branch[] {
  const branches = parseBranches(raw)
  assertNoPlaceholderLeak(branches)
  return branches
}
