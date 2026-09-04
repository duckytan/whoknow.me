// versionedStore.ts — 只增不删改的版本化记录仓储（ADR-001 核心实现）
//
// 落地形态（磁盘）：
//   <root>/records/<id>/v<n>.json   ← 不可变记录，写一次永不改
//   <root>/events.jsonl             ← 只追加事件（状态变更 / 评分变更）
//   <root>/index.json               ← 派生缓存，可由上面两者完全重建
//
// 对应决策：
//   BRAIN-PLAN ① 公式存管 = 每条独立记录 + 版本号 + 创建时间 + 效果评分 + 状态（启用/淘汰/归档）
//   "AI 只新增、不删改旧"→ 改 = addVersion；淘汰 = setStatus('archived')，文件永不删
//   ADR-001 风险缓解 3：索引文件加速查询 + 写操作统一走一个 writer 模块（= 本文件）

import { join } from 'node:path'
import {
  appendJsonl,
  checksumOf,
  listDirs,
  listFiles,
  readJson,
  readJsonl,
  verifyChecksum,
  writeJsonAtomic,
  writeNewJsonExclusive,
} from './fsx.ts'
import { invalidId, recordExists, recordNotFound } from '../errors.ts'

export type RecordStatus = 'active' | 'deprecated' | 'archived'

export interface RecordMeta {
  schema: string
  id: string
  version: number
  created_at: string
  /** 本条 body 的 canonical sha256 */
  checksum: string
  /** 上一版本号；v1 为 null。构成版本链，支持回退追溯 */
  supersedes: number | null
}

export interface StoredRecord<TBody> {
  meta: RecordMeta
  body: TBody
}

export type StoreEventType = 'created' | 'version_added' | 'status_changed' | 'score_updated'

export interface StoreEvent {
  at: string
  id: string
  type: StoreEventType
  version?: number
  status?: RecordStatus
  score?: number
  reason?: string
  actor?: string
}

export interface IndexEntry {
  latest_version: number
  latest_checksum: string
  status: RecordStatus
  /** 效果评分：M0–M2 恒为 null（无反馈通道）；M3 由反馈闭环写入 */
  score: number | null
  created_at: string
  updated_at: string
}

export interface StoreIndex {
  schema: string
  store: string
  rebuilt_at: string
  entries: Record<string, IndexEntry>
}

export interface VersionedStoreOptions {
  /** 仓储根目录，例如 data/formulas */
  root: string
  /** 仓储名，仅用于报错与索引标识 */
  store: string
  /** 记录 schema 标识，例如 brain.formula/1 */
  schema: string
  /** 可注入时钟，便于测试确定性 */
  now?: () => Date
}

const INDEX_SCHEMA = 'brain.store.index/1'
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/

export function assertValidId(id: string): void {
  // 输入校验：同时防路径穿越（'..'、'/'、'\\' 均不匹配白名单）
  if (typeof id !== 'string' || !ID_RE.test(id)) throw invalidId(id)
}

export class VersionedStore<TBody> {
  readonly root: string
  readonly store: string
  readonly schema: string
  private readonly now: () => Date

  constructor(options: VersionedStoreOptions) {
    this.root = options.root
    this.store = options.store
    this.schema = options.schema
    this.now = options.now ?? (() => new Date())
  }

  // ── 路径 ──────────────────────────────────────────────
  get recordsDir(): string {
    return join(this.root, 'records')
  }
  get eventsPath(): string {
    return join(this.root, 'events.jsonl')
  }
  get indexPath(): string {
    return join(this.root, 'index.json')
  }
  recordDir(id: string): string {
    assertValidId(id)
    return join(this.recordsDir, id)
  }
  recordPath(id: string, version: number): string {
    return join(this.recordDir(id), `v${version}.json`)
  }

  // ── 写 ────────────────────────────────────────────────

  /** 新建记录（v1）。已存在则抛 RECORD_EXISTS —— 改内容请用 addVersion。 */
  async create(id: string, body: TBody): Promise<StoredRecord<TBody>> {
    assertValidId(id)
    const versions = await this.listVersions(id)
    if (versions.length > 0) throw recordExists(this.store, id)
    return this.writeVersion(id, body, 1, null, 'created')
  }

  /** 追加新版本（旧版保留，version 单调 +1）。 */
  async addVersion(id: string, body: TBody): Promise<StoredRecord<TBody>> {
    assertValidId(id)
    const versions = await this.listVersions(id)
    if (versions.length === 0) throw recordNotFound(this.store, id)
    const prev = versions[versions.length - 1] as number
    return this.writeVersion(id, body, prev + 1, prev, 'version_added')
  }

  private async writeVersion(
    id: string,
    body: TBody,
    version: number,
    supersedes: number | null,
    eventType: StoreEventType,
  ): Promise<StoredRecord<TBody>> {
    const at = this.now().toISOString()
    const meta: RecordMeta = {
      schema: this.schema,
      id,
      version,
      created_at: at,
      checksum: checksumOf(body),
      supersedes,
    }
    const record: StoredRecord<TBody> = { meta, body }
    // I1：'wx' 独占创建，任何覆盖尝试都会抛 IMMUTABILITY_VIOLATION
    await writeNewJsonExclusive(this.recordPath(id, version), record)
    const event: StoreEvent = { at, id, type: eventType, version }
    await appendJsonl(this.eventsPath, event)
    await this.touchIndex(id, meta)
    return record
  }

  /** 状态变更（启用/淘汰/归档）。不改历史文件，只追加事件 + 刷新索引。 */
  async setStatus(id: string, status: RecordStatus, reason?: string, actor?: string): Promise<void> {
    assertValidId(id)
    const versions = await this.listVersions(id)
    if (versions.length === 0) throw recordNotFound(this.store, id)
    const at = this.now().toISOString()
    const event: StoreEvent = { at, id, type: 'status_changed', status, reason, actor }
    await appendJsonl(this.eventsPath, event)
    const index = await this.readIndex()
    const entry = index.entries[id]
    if (entry) {
      entry.status = status
      entry.updated_at = at
      await writeJsonAtomic(this.indexPath, index)
    }
  }

  /**
   * 效果评分写入。
   * ⚠️ M0–M2 无反馈回传通道（ADR-004 上行属 M3），此接口为**预埋位**，
   *    仅供 M3 进化闭环调用；本阶段不应有生产调用方。
   */
  async setScore(id: string, score: number, reason?: string): Promise<void> {
    assertValidId(id)
    const versions = await this.listVersions(id)
    if (versions.length === 0) throw recordNotFound(this.store, id)
    const at = this.now().toISOString()
    const event: StoreEvent = { at, id, type: 'score_updated', score, reason }
    await appendJsonl(this.eventsPath, event)
    const index = await this.readIndex()
    const entry = index.entries[id]
    if (entry) {
      entry.score = score
      entry.updated_at = at
      await writeJsonAtomic(this.indexPath, index)
    }
  }

  // ── 读 ────────────────────────────────────────────────

  async listVersions(id: string): Promise<number[]> {
    const files = await listFiles(this.recordDir(id))
    return files
      .map((f) => /^v(\d+)\.json$/.exec(f))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => Number(m[1]))
      .sort((a, b) => a - b)
  }

  async listIds(): Promise<string[]> {
    return (await listDirs(this.recordsDir)).sort()
  }

  /** 读指定版本；顺带做 I4 内容校验（落盘损坏/被篡改会被抓出）。 */
  async get(id: string, version: number): Promise<StoredRecord<TBody>> {
    const path = this.recordPath(id, version)
    const rec = await readJson<StoredRecord<TBody>>(path)
    if (!rec) throw recordNotFound(this.store, id, version)
    verifyChecksum(rec.body, rec.meta.checksum, path)
    return rec
  }

  async getLatest(id: string): Promise<StoredRecord<TBody>> {
    const versions = await this.listVersions(id)
    if (versions.length === 0) throw recordNotFound(this.store, id)
    return this.get(id, versions[versions.length - 1] as number)
  }

  async readEvents(): Promise<StoreEvent[]> {
    return readJsonl<StoreEvent>(this.eventsPath)
  }

  async readIndex(): Promise<StoreIndex> {
    const idx = await readJson<StoreIndex>(this.indexPath)
    if (idx) return idx
    return { schema: INDEX_SCHEMA, store: this.store, rebuilt_at: this.now().toISOString(), entries: {} }
  }

  private async touchIndex(id: string, meta: RecordMeta): Promise<void> {
    const index = await this.readIndex()
    const prev = index.entries[id]
    index.entries[id] = {
      latest_version: meta.version,
      latest_checksum: meta.checksum,
      status: prev?.status ?? 'active',
      score: prev?.score ?? null,
      created_at: prev?.created_at ?? meta.created_at,
      updated_at: meta.created_at,
    }
    await writeJsonAtomic(this.indexPath, index)
  }

  /**
   * I3：索引完全可重建。
   * 扫描 records/ 拿版本与校验和，再回放 events.jsonl 恢复状态与评分。
   * 索引丢失/损坏不构成数据事故 —— 这是"文件即真相"的底气。
   */
  async rebuildIndex(): Promise<StoreIndex> {
    const entries: Record<string, IndexEntry> = {}
    for (const id of await this.listIds()) {
      const versions = await this.listVersions(id)
      if (versions.length === 0) continue
      const first = await this.get(id, versions[0] as number)
      const last = await this.get(id, versions[versions.length - 1] as number)
      entries[id] = {
        latest_version: last.meta.version,
        latest_checksum: last.meta.checksum,
        status: 'active',
        score: null,
        created_at: first.meta.created_at,
        updated_at: last.meta.created_at,
      }
    }
    for (const ev of await this.readEvents()) {
      const entry = entries[ev.id]
      if (!entry) continue
      if (ev.type === 'status_changed' && ev.status) {
        entry.status = ev.status
        entry.updated_at = ev.at
      }
      if (ev.type === 'score_updated' && typeof ev.score === 'number') {
        entry.score = ev.score
        entry.updated_at = ev.at
      }
    }
    const index: StoreIndex = {
      schema: INDEX_SCHEMA,
      store: this.store,
      rebuilt_at: this.now().toISOString(),
      entries,
    }
    await writeJsonAtomic(this.indexPath, index)
    return index
  }
}
