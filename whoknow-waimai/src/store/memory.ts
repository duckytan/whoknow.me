// memory.ts — 记忆引擎（M1）
// 驱动「同店第 N 单差异」：累计到店次数、flags、tags；全局订单计数。
// storage 注入式：浏览器用 localStorage，测试用内存实现。

export interface KVStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface ShopMemory {
  shopId: string
  visitCount: number
  flags: string[]
  tags: string[]
}

export interface HistoryParams {
  shopVisitCount: number
  todayOrderCount: number
  totalOrders: number
  riderVisitCount?: number
  [k: string]: unknown
}

export interface OrderHistoryEntry {
  ts: number
  shopId: string
  shopName: string
  branchId: string | null
  branchName?: string
  bossMood: number
  total?: number
  achievements: string[]
}

interface ShopRecord {
  visitCount: number
  flags: string[]
  tags: string[]
}

interface RiderRecord {
  visitCount: number
}

interface GlobalRecord {
  totalOrders: number
  todayOrderCount: number
  todayDate: string // YYYY-MM-DD
}

function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export class MemoryEngine {
  private store: KVStore
  constructor(store: KVStore) {
    this.store = store
  }

  private shopKey(shopId: string) {
    return `waimai:memory:${shopId}`
  }
  private riderKey(riderId: string) {
    return `waimai:rider:${riderId}`
  }
  private globalKey() {
    return 'waimai:global'
  }

  private readShop(shopId: string): ShopRecord {
    const raw = this.store.getItem(this.shopKey(shopId))
    if (!raw) return { visitCount: 0, flags: [], tags: [] }
    try {
      return JSON.parse(raw) as ShopRecord
    } catch {
      return { visitCount: 0, flags: [], tags: [] }
    }
  }
  private writeShop(shopId: string, rec: ShopRecord) {
    this.store.setItem(this.shopKey(shopId), JSON.stringify(rec))
  }
  private readRider(riderId: string): RiderRecord {
    const raw = this.store.getItem(this.riderKey(riderId))
    if (!raw) return { visitCount: 0 }
    try {
      return JSON.parse(raw) as RiderRecord
    } catch {
      return { visitCount: 0 }
    }
  }
  private writeRider(riderId: string, rec: RiderRecord) {
    this.store.setItem(this.riderKey(riderId), JSON.stringify(rec))
  }
  private readGlobal(): GlobalRecord {
    const raw = this.store.getItem(this.globalKey())
    const t = todayStr()
    if (!raw) return { totalOrders: 0, todayOrderCount: 0, todayDate: t }
    const g = JSON.parse(raw) as GlobalRecord
    if (g.todayDate !== t) return { totalOrders: g.totalOrders, todayOrderCount: 0, todayDate: t }
    return g
  }
  private writeGlobal(g: GlobalRecord) {
    this.store.setItem(this.globalKey(), JSON.stringify(g))
  }

  /** 记录一单，返回更新后的本店记忆 + 全局参数。 */
  recordOrder(shopId: string, opts: { flags?: string[]; tags?: string[] } = {}): {
    memory: ShopMemory
    history: HistoryParams
  } {
    const shop = this.readShop(shopId)
    shop.visitCount += 1
    for (const f of opts.flags ?? []) if (!shop.flags.includes(f)) shop.flags.push(f)
    for (const t of opts.tags ?? []) if (!shop.tags.includes(t)) shop.tags.push(t)
    this.writeShop(shopId, shop)

    const g = this.readGlobal()
    g.totalOrders += 1
    g.todayOrderCount += 1
    g.todayDate = todayStr()
    this.writeGlobal(g)

    return {
      memory: { shopId, visitCount: shop.visitCount, flags: shop.flags.slice(), tags: shop.tags.slice() },
      history: {
        shopVisitCount: shop.visitCount,
        todayOrderCount: g.todayOrderCount,
        totalOrders: g.totalOrders,
      },
    }
  }

  getShopMemory(shopId: string): ShopMemory {
    const s = this.readShop(shopId)
    return { shopId, visitCount: s.visitCount, flags: s.flags.slice(), tags: s.tags.slice() }
  }

  /** 记录骑手送达一单，返回递增后的骑手访问计数（与 recordOrder 对 shop 的写法平行）。 */
  recordRider(riderId: string): number {
    const r = this.readRider(riderId)
    r.visitCount += 1
    this.writeRider(riderId, r)
    return r.visitCount
  }

  getHistoryParams(shopId: string, riderId?: string): HistoryParams {
    const s = this.readShop(shopId)
    const g = this.readGlobal()
    const out: HistoryParams = {
      shopVisitCount: s.visitCount,
      todayOrderCount: g.todayOrderCount,
      totalOrders: g.totalOrders,
    }
    // 骑手维度：含本次 +1，与 OrderView 对 shop 的本地 +1 语义一致；未传 riderId 时不含该字段（向后兼容）
    if (riderId) out.riderVisitCount = this.readRider(riderId).visitCount + 1
    return out
  }

  // ---- 成就解锁追踪 ----
  private achKey() {
    return 'waimai:achievements'
  }
  /** 合并解锁集合，返回最新全集；仅新增时写回。 */
  unlockAchievements(ids: string[]): string[] {
    const raw = this.store.getItem(this.achKey())
    const cur = raw ? (JSON.parse(raw) as string[]) : []
    let changed = false
    for (const id of ids) {
      if (id && !cur.includes(id)) {
        cur.push(id)
        changed = true
      }
    }
    if (changed) this.store.setItem(this.achKey(), JSON.stringify(cur))
    return cur.slice()
  }
  getAchievements(): string[] {
    const raw = this.store.getItem(this.achKey())
    return raw ? (JSON.parse(raw) as string[]) : []
  }

  // ---- 订单历史 ----
  private histKey() {
    return 'waimai:history'
  }
  recordOrderHistory(entry: OrderHistoryEntry): void {
    const raw = this.store.getItem(this.histKey())
    const arr = raw ? (JSON.parse(raw) as OrderHistoryEntry[]) : []
    arr.unshift(entry)
    this.store.setItem(this.histKey(), JSON.stringify(arr.slice(0, 100)))
  }
  getOrderHistory(): OrderHistoryEntry[] {
    const raw = this.store.getItem(this.histKey())
    return raw ? (JSON.parse(raw) as OrderHistoryEntry[]) : []
  }

  /** 测试/重置用：清掉某店或全部。 */
  reset(shopId?: string) {
    if (shopId) this.store.setItem(this.shopKey(shopId), JSON.stringify({ visitCount: 0, flags: [], tags: [] }))
    else {
      this.store.setItem(this.globalKey(), JSON.stringify({ totalOrders: 0, todayOrderCount: 0, todayDate: todayStr() }))
    }
  }
}

/** 内存 KV（测试用）。 */
export class MemStore implements KVStore {
  private m = new Map<string, string>()
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null
  }
  setItem(k: string, v: string) {
    this.m.set(k, v)
  }
}
