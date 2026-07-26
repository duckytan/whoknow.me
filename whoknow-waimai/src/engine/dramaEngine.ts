// dramaEngine.ts — DRAMA 解析器 / 状态机（M1 运行时，whoknow-waimai/src）
// 移植自 whoknow-waimai/tests/drama-engine/dramaEngine.impl.ts（Phase 3 已验证 8/8 绿）。
// 以 ADR-001（数据形状权威）+ DATA-STRUCTURE-v1 为准。
//
// 范围：加载 branches[] → 条件串解析 → 权重池选支 → 四阶段 chain 流动
//   → moodDelta/delay/effect 累加 → 产出 DramaEvent[] + finalState + newFlags。
// 不做（留给上层）：真实骰子动画、UI 渲染、localStorage 持久化、brain 拉取降级（见 memory / config loader）。

export interface DramaState {
  bossMood: number
  riderMorale: number
  totalDelay: number
  tags: string[]
}

export interface OrderInput {
  shopId?: string
  riderId?: string
  addressTag?: string
  remarkTag?: string
  orderTotal?: number
  avgDishPrice?: number
  dishCount?: number
  deliveryFee?: number
  [k: string]: unknown
}

export interface HistoryParams {
  shopVisitCount?: number
  todayOrderCount?: number
  totalOrders?: number
  riderVisitCount?: number
  [k: string]: unknown
}

export interface MetaParams {
  hot_today?: string
  weather?: string
  [k: string]: unknown
}

export interface DramaEventOut {
  phase: string
  actor: string
  text: string
  moodDelta?: number
  delay?: number
  id?: string
}

export interface RunResult {
  selectedBranchId: string | null
  events: DramaEventOut[]
  finalState: DramaState
  newFlags: string[]
}

export interface RunOpts {
  random?: () => number
  history?: HistoryParams
  meta?: MetaParams
  flags?: string[]
}

// ---------------------------------------------------------------------------
// 条件串解析（DATA-STRUCTURE-v1 §3.7 语法）
//   操作符: > < >= <= = != ?(数组包含) !(数组不包含)
//   逻辑:   & (AND)  | (OR)  () (分组)
//   函数:   flag(name)  hasTag(name)    name 内部 {shopId}/{riderId} 解析前插值
// ---------------------------------------------------------------------------

function interpolate(cond: string, oi: OrderInput, meta: MetaParams): string {
  return cond.replace(/\{(\w+)\}/g, (_m, k: string) => {
    if (k in oi && oi[k] !== undefined && oi[k] !== '') return String(oi[k])
    if (k in meta && meta[k] !== undefined && meta[k] !== '') return String(meta[k])
    return `{${k}}`
  })
}

function getVar(name: string, oi: OrderInput, hist: HistoryParams, meta: MetaParams): unknown {
  if (name in oi && oi[name] !== undefined) return oi[name]
  if (name in hist && hist[name] !== undefined) return hist[name]
  if (name in meta && meta[name] !== undefined) return meta[name] as unknown
  return undefined
}

function compare(left: unknown, op: string, right: unknown): boolean {
  if (op === '=') {
    if (Array.isArray(right)) return right.map(String).includes(String(left))
    return String(left) === String(right)
  }
  if (op === '!=') return String(left) !== String(right)
  if (op === '?') {
    if (Array.isArray(right)) return right.map(String).includes(String(left))
    return String(left).includes(String(right))
  }
  if (op === '!') {
    if (Array.isArray(right)) return !right.map(String).includes(String(left))
    return !String(left).includes(String(right))
  }
  const l = Number(left)
  const r = Number(right)
  if (op === '>') return l > r
  if (op === '<') return l < r
  if (op === '>=') return l >= r
  if (op === '<=') return l <= r
  return false
}

class CondParser {
  s: string
  i = 0
  ctx: { oi: OrderInput; hist: HistoryParams; meta: MetaParams; flags: string[]; tags: string[] }
  constructor(s: string, ctx: { oi: OrderInput; hist: HistoryParams; meta: MetaParams; flags: string[]; tags: string[] }) {
    this.s = s
    this.ctx = ctx
  }
  skip() {
    while (this.i < this.s.length && this.s[this.i] === ' ') this.i++
  }
  parseOr(): boolean {
    let left = this.parseAnd()
    this.skip()
    while (this.s[this.i] === '|') {
      this.i++
      this.skip()
      left = left || this.parseAnd()
    }
    return left
  }
  parseAnd(): boolean {
    let left = this.parsePrimary()
    this.skip()
    while (this.s[this.i] === '&') {
      this.i++
      this.skip()
      left = left && this.parsePrimary()
    }
    return left
  }
  parsePrimary(): boolean {
    this.skip()
    if (this.s[this.i] === '(') {
      this.i++
      const v = this.parseOr()
      this.skip()
      if (this.s[this.i] === ')') this.i++
      return v
    }
    return this.parseAtom()
  }
  parseAtom(): boolean {
    this.skip()
    let j = this.i
    while (j < this.s.length && /[A-Za-z0-9_]/.test(this.s[j])) j++
    const ident = this.s.slice(this.i, j)
    this.i = j
    this.skip()
    if (this.s[this.i] === '(') {
      this.i++ // consume (
      let k = this.i
      let depth = 1
      while (k < this.s.length && depth > 0) {
        if (this.s[k] === '(') depth++
        else if (this.s[k] === ')') depth--
        if (depth === 0) break
        k++
      }
      const argsStr = this.s.slice(this.i, k).trim()
      this.i = k + 1
      const args = argsStr.length ? argsStr.split(',').map((a) => a.trim()).filter(Boolean) : []
      return this.evalFunc(ident, args)
    }
    const op = this.readOp()
    const value = this.readValue()
    if (/^\d/.test(ident)) {
      // 左侧为数字字面量（如 `1 = 1` 兜底条件），直接比较
      return compare(Number(ident), op, value)
    }
    return this.evalCompare(ident, op, value)
  }
  readOp(): string {
    this.skip()
    const two = this.s.slice(this.i, this.i + 2)
    if (two === '>=' || two === '<=' || two === '!=') {
      this.i += 2
      return two
    }
    const one = this.s[this.i]
    if (one === '=' || one === '<' || one === '>' || one === '?' || one === '!') {
      this.i++
      return one
    }
    throw new Error('unexpected operator at: ' + this.s.slice(this.i))
  }
  readValue(): unknown {
    this.skip()
    if (this.s[this.i] === '[') {
      let k = this.i
      let depth = 1
      while (k < this.s.length && depth > 0) {
        if (this.s[k] === '[') depth++
        else if (this.s[k] === ']') depth--
        if (depth === 0) break
        k++
      }
      const arrStr = this.s.slice(this.i + 1, k)
      this.i = k + 1
      return arrStr.split(',').map((s) => s.trim()).filter(Boolean)
    }
    const m = this.s.slice(this.i).match(/^-?\d+(\.\d+)?/)
    if (m) {
      this.i += m[0].length
      return Number(m[0])
    }
    let j = this.i
    while (j < this.s.length && !' &|()'.includes(this.s[j])) j++
    const w = this.s.slice(this.i, j)
    this.i = j
    return w
  }
  evalFunc(ident: string, args: string[]): boolean {
    if (ident === 'flag') return this.ctx.flags.includes(args[0])
    if (ident === 'hasTag') return this.ctx.tags.includes(args[0])
    return false
  }
  evalCompare(ident: string, op: string, value: unknown): boolean {
    const left = getVar(ident, this.ctx.oi, this.ctx.hist, this.ctx.meta)
    return compare(left, op, value)
  }
}

function substitute(text: string, oi: OrderInput, hist: HistoryParams, meta: MetaParams): string {
  return text.replace(/\{(\w+)\}/g, (_m, k: string) => {
    if (k in oi && oi[k] !== undefined && oi[k] !== '') return String(oi[k])
    if (k in hist && hist[k] !== undefined && hist[k] !== '') return String(hist[k])
    if (k in meta && meta[k] !== undefined && meta[k] !== '') return String(meta[k])
    return `{${k}}`
  })
}

// ---------------------------------------------------------------------------
// 主推演
// ---------------------------------------------------------------------------

export function runDrama(branches: any[], orderInput: OrderInput, opts: RunOpts = {}): RunResult {
  const random = opts.random ?? Math.random
  const hist = opts.history ?? {}
  const meta = opts.meta ?? {}
  const flags = (opts.flags ?? []).slice()

  const state: DramaState = { bossMood: 50, riderMorale: 60, totalDelay: 0, tags: [] }
  // ADR-001 §4：OrderInput.remarkTag / addressTag 播种进 tags（hasTag 判定）
  if (orderInput.remarkTag) state.tags.push(orderInput.remarkTag)
  if (orderInput.addressTag) state.tags.push(orderInput.addressTag)

  const newFlags: string[] = []
  const ctx = { oi: orderInput, hist, meta, flags, tags: state.tags }

  // 1) 命中筛选 + 概率 → 候选权重池
  const pool: { branch: any; weight: number }[] = []
  for (const b of branches) {
    const cond = interpolate(b.trigger.condition, orderInput, meta)
    let ok = false
    try {
      ok = new CondParser(cond, ctx).parseOr()
    } catch {
      ok = false // §8.4 条件串解析失败 → 静默跳过该分支
    }
    if (!ok) continue
    let prob = typeof b.trigger.probability === 'number' ? b.trigger.probability : 1
    const sc = b.trigger.probabilityScaling
    if (sc && typeof sc.param === 'string') {
      const pv = Number(getVar(sc.param, orderInput, hist, meta))
      prob += Math.max(0, pv - (sc.threshold ?? 0)) * (sc.rate ?? 0)
    }
    prob = Math.max(0, Math.min(1, prob))
    if (random() < prob) pool.push({ branch: b, weight: typeof b.weight === 'number' ? b.weight : 1 })
  }

  // 2) 权重池选 1（isFallback 分支仅在无其它命中时才兜底）
  let selected: any = null
  if (pool.length > 0) {
    const real = pool.filter((p) => !p.branch.isFallback)
    const candidates = real.length ? real : pool
    const totalW = candidates.reduce((s, p) => s + p.weight, 0)
    let r = random() * totalW
    for (const p of candidates) {
      r -= p.weight
      if (r < 0) {
        selected = p.branch
        break
      }
    }
    if (!selected) selected = candidates[candidates.length - 1].branch
  }

  // 3) 执行 chain（四阶段顺序流动 + next/nextWeights 跳转分支）
  //    顺序流：节点无 next → 走下一个 sibling（四阶段常规模型）
  //    跳转流：节点有 next → 跳到目标；跳转到达的节点若无 next 即为分支终点，不串兄弟
  //    guard 防环；effect.flags 内 {shopId}/{riderId} 按 ADR-001 §4 插值
  const events: DramaEventOut[] = []
  if (selected) {
    const chain = selected.chain ?? []
    const byId = new Map<string, any>()
    for (const n of chain) if (n.id) byId.set(n.id, n)
    const guard = new Set<string>()
    let seqIdx = 0
    let viaJump = false
    let node: any = chain[0]
    while (node && !(node.id && guard.has(node.id))) {
      if (node.id) guard.add(node.id)
      const ev: DramaEventOut = {
        phase: node.phase,
        actor: node.actor,
        text: substitute(node.text ?? '', orderInput, hist, meta),
      }
      if (typeof node.moodDelta === 'number') {
        state.bossMood += node.moodDelta
        ev.moodDelta = node.moodDelta
      }
      if (typeof node.delay === 'number') {
        state.totalDelay += node.delay
        ev.delay = node.delay
      }
      if (node.id) ev.id = node.id
      events.push(ev)
      if (node.effect?.tags) for (const t of node.effect.tags) if (!state.tags.includes(t)) state.tags.push(t)
      if (node.effect?.flags)
        for (const f of node.effect.flags) {
          const fv = interpolate(f, orderInput, meta) // ADR-001 §4：flag 内 {shopId}/{riderId} 插值
          if (!newFlags.includes(fv)) newFlags.push(fv)
          if (!flags.includes(fv)) flags.push(fv)
        }
      const next = node.next
      const hasNext = Array.isArray(next) ? next.length > 0 : typeof next === 'string' && next.length > 0
      if (hasNext) {
        let nextId: string | undefined
        if (Array.isArray(next)) {
          const weights: number[] = node.nextWeights ?? next.map(() => 1)
          const tot = weights.reduce((s, w) => s + w, 0)
          let r = random() * tot
          let k = next.length - 1
          for (let q = 0; q < next.length; q++) {
            r -= weights[q] ?? 1
            if (r < 0) {
              k = q
              break
            }
          }
          nextId = next[k]
        } else {
          nextId = next
        }
        node = nextId ? byId.get(nextId) : undefined
        viaJump = true
      } else if (viaJump) {
        node = undefined // 跳转到达的终点节点，不继续串兄弟
      } else {
        seqIdx++
        node = seqIdx < chain.length ? chain[seqIdx] : undefined
      }
    }
  }

  return { selectedBranchId: selected?.id ?? null, events, finalState: state, newFlags }
}
