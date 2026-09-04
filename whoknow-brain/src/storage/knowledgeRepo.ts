// knowledgeRepo.ts — 知识库仓储（BRAIN-PLAN ③ / ADR-001）
//
// 范围声明（守里程碑）：
//   本阶段（M0–M2）只做「存 + 带元数据」。
//   权重重算、热温冷自动升降、冷层归档转存 = **定时任务驱动，属 M3（ADR-002）**，本文件不实现。
//
// ADR-001-A（本次补充决策，见 phase3-kickoff.md §5）：
//   tier（热/温/冷）以**元数据字段**为唯一真相，不以目录物理位置表达。
//   理由：跨目录搬文件 = 物理改动，与"只增不删改 + 崩溃安全"冲突；
//        物理分层压缩留 M3 归档作业按 tier 字段批量执行。

import { join } from 'node:path'
import { VersionedStore, type StoredRecord } from './versionedStore.ts'

export const KNOWLEDGE_SCHEMA = 'brain.knowledge/1'

export type KnowledgeTier = 'hot' | 'warm' | 'cold'

/** ③ 拍板打分维度：复用 OpenClaw 新闻源 5 维 + 大脑特有「梗性」1 维 = 6 维。取值 0–1。 */
export interface KnowledgeWeights {
  hit_rate: number
  timeliness: number
  relevance: number
  authority: number
  stability: number
  /** 梗性 / 趣味性 —— 防"权威但不好笑"被滤出去（也是 S3「安全但无聊」告警的输入） */
  memeability: number
}

export const WEIGHT_KEYS: readonly (keyof KnowledgeWeights)[] = [
  'hit_rate',
  'timeliness',
  'relevance',
  'authority',
  'stability',
  'memeability',
]

export interface KnowledgeBody {
  title: string
  source_id: string
  source_type: 'news' | 'joke' | 'meme' | 'other'
  captured_at: string
  tier: KnowledgeTier
  weights: KnowledgeWeights
  /** 保留期（可配置）；null = 未设定。到期由 M3 归档作业处理，**不物理删** */
  retention_until: string | null
  /** 红线扫描结果（禁忌词清单 v1.0 红绿灯）；新闻衍生归因层留 M3 增强 */
  compliance: { level: 'green' | 'yellow' | 'red'; hits: string[] }
  /**
   * 原文引用（本地相对路径），**不是原文本身**。
   * 知识产权铁律：原始素材永不进成品 envelope，只以 ref 形式被引用。
   */
  payload_ref: string
}

export type KnowledgeRecord = StoredRecord<KnowledgeBody>

export class WeightRangeError extends Error {
  constructor(key: string, value: unknown) {
    super(`权重维度 ${key} 必须是 0–1 之间的数字，收到：${JSON.stringify(value)}`)
    this.name = 'WeightRangeError'
  }
}

/** 结构校验（非业务打分）：6 维齐全且落在 0–1。 */
export function assertWeights(w: KnowledgeWeights): void {
  for (const k of WEIGHT_KEYS) {
    const v = w[k]
    if (typeof v !== 'number' || Number.isNaN(v) || v < 0 || v > 1) throw new WeightRangeError(k, v)
  }
}

export class KnowledgeRepo {
  readonly store: VersionedStore<KnowledgeBody>

  constructor(dataRoot: string, now?: () => Date) {
    this.store = new VersionedStore<KnowledgeBody>({
      root: join(dataRoot, 'knowledge'),
      store: 'knowledge',
      schema: KNOWLEDGE_SCHEMA,
      now,
    })
  }

  create(id: string, body: KnowledgeBody): Promise<KnowledgeRecord> {
    assertWeights(body.weights)
    return this.store.create(id, body)
  }

  /** 权重/分层变更 = 追加新版本（保留历史打分轨迹，供 M3 复盘）。 */
  revise(id: string, body: KnowledgeBody): Promise<KnowledgeRecord> {
    assertWeights(body.weights)
    return this.store.addVersion(id, body)
  }

  latest(id: string): Promise<KnowledgeRecord> {
    return this.store.getLatest(id)
  }

  /** 归档：只标状态，冷层文件永不物理删。 */
  archive(id: string, reason: string): Promise<void> {
    return this.store.setStatus(id, 'archived', reason)
  }

  async listByTier(tier: KnowledgeTier): Promise<string[]> {
    const ids = await this.store.listIds()
    const out: string[] = []
    for (const id of ids) {
      const rec = await this.store.getLatest(id)
      if (rec.body.tier === tier) out.push(id)
    }
    return out
  }

  static ref(record: KnowledgeRecord): string {
    return `${record.meta.id}@${record.meta.version}`
  }
}
