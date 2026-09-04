// formulaRepo.ts — 公式库仓储（BRAIN-PLAN ① / ADR-001）
//
// 本文件只负责"公式记录怎么存、怎么版本化、怎么查"，
// **不负责**从段子归纳公式、也不负责套公式生成段子（那是 M3 生成层的事）。
//
// 字段直接落 BRAIN-PLAN ① 拍板项：
//   唯一 ID + 版本号 + 创建时间 + 效果评分 + 状态（启用/淘汰/归档）
//   融 D 可解释性：来源模范段子 + 生成样例
// 并预埋双评审 B2「反差喜剧工程化」：现实锚点 / 胡闹偏移 / 反差强度。

import { join } from 'node:path'
import { VersionedStore, type RecordStatus, type StoredRecord } from './versionedStore.ts'

export const FORMULA_SCHEMA = 'brain.formula/1'

/** 参数槽角色 —— B2：把"真实外壳 × 胡闹内核"变成一阶参数，而不是靠 LLM 运气。 */
export type SlotRole =
  | 'realness_anchor' // 现实锚点：来自新闻/节假日/天气的真实元素
  | 'absurd_offset' // 胡闹偏移：公式控制的离谱程度
  | 'free' // 普通槽位

export interface FormulaSlot {
  key: string
  role: SlotRole
  desc?: string
}

/** 可解释单元（BRAIN-PLAN ① 融 D）：审计时能一眼看懂"这公式打哪来、长啥样"。 */
export interface FormulaExplain {
  /** 来源模范段子（种子法 A 阶段由主理人精选） */
  seed_examples: string[]
  /** 生成样例（该公式产出过什么） */
  generated_samples: string[]
}

export interface FormulaBody {
  name: string
  /** 套路框架，如「[人物]在[场景]干[离谱事]」 */
  pattern: string
  slots: FormulaSlot[]
  /** B2 反差轴：指明哪个槽是现实锚点、哪个是胡闹偏移、期望反差强度（0–1，null=未标定） */
  contrast: {
    anchor_slot: string | null
    offset_slot: string | null
    intensity_hint: number | null
  }
  explain: FormulaExplain
  /** ⑥ A→B：seed = 主理人种子；llm = AI 自归纳（过渡期需走试用/审核通道） */
  origin: 'seed' | 'llm'
  notes?: string
}

export type FormulaRecord = StoredRecord<FormulaBody>

export interface FormulaStats {
  /** ⑥ A→B 切换判据①：公式库规模 ≥ 200 条 */
  total: number
  active: number
  archived: number
  /** 门槛达成与否（阈值为拍板初值，后续按真实数据调） */
  ab_switch_size_threshold: number
  ab_switch_size_met: boolean
}

export class FormulaRepo {
  readonly store: VersionedStore<FormulaBody>

  constructor(dataRoot: string, now?: () => Date) {
    this.store = new VersionedStore<FormulaBody>({
      root: join(dataRoot, 'formulas'),
      store: 'formulas',
      schema: FORMULA_SCHEMA,
      now,
    })
  }

  create(id: string, body: FormulaBody): Promise<FormulaRecord> {
    return this.store.create(id, body)
  }

  /** 修改 = 出新版本（AI 只新增、不删改旧）。 */
  revise(id: string, body: FormulaBody): Promise<FormulaRecord> {
    return this.store.addVersion(id, body)
  }

  latest(id: string): Promise<FormulaRecord> {
    return this.store.getLatest(id)
  }

  version(id: string, version: number): Promise<FormulaRecord> {
    return this.store.get(id, version)
  }

  history(id: string): Promise<number[]> {
    return this.store.listVersions(id)
  }

  /** 淘汰 = 标记归档，文件永不物理删（留底备查）。 */
  archive(id: string, reason: string, actor = 'system'): Promise<void> {
    return this.store.setStatus(id, 'archived', reason, actor)
  }

  setStatus(id: string, status: RecordStatus, reason?: string): Promise<void> {
    return this.store.setStatus(id, status, reason)
  }

  async stats(): Promise<FormulaStats> {
    const index = await this.store.readIndex()
    const values = Object.values(index.entries)
    return {
      total: values.length,
      active: values.filter((e) => e.status === 'active').length,
      archived: values.filter((e) => e.status === 'archived').length,
      ab_switch_size_threshold: 200,
      ab_switch_size_met: values.length >= 200,
    }
  }

  /** 引用串：进成品 envelope 的**唯一**允许形态（不带 pattern 本体，防知识产权外泄）。 */
  static ref(record: FormulaRecord): string {
    return `${record.meta.id}@${record.meta.version}`
  }
}
