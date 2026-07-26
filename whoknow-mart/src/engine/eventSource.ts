// eventSource.ts — v2 brain 扩展点（ARCHITECTURE §9.2）
//
// MVP 的 L2 运行时只认内部事件流，不直接依赖数据来源。v2 接 brain 时，只替换
// 「事件源适配器」，L2 状态机与 UI 不变。
//   MVP 实现：LocalMatrixSource（读 L1.mart.matrix，纯前端查表）
//   v2 实现：BrainConfigSource（fetch /api/v1/mart/config → DramaEvent[](actor:'guide') → 适配）
//           当前未解冻（EVOL-1 阻塞 waimai 侧），仅登记接口，不实现（见文件底部注释）。

import type { Archetype, MoveId, MartMatrix } from '../types/contract.ts'

export interface MartRoundEvents {
  guideId: string
  guideArchetype: Archetype
  options: MoveId[] // 本轮 4 选项（位置随机由状态机控制）
  seed: number
}

export interface MartEventSource {
  getRound(
    guideId: string,
    guideArchetype: Archetype,
    history: { visitCount: number },
  ): MartRoundEvents
}

/** MVP 本地实现：读 L1.mart.matrix / moves，纯前端查表（不接 brain）。 */
export class LocalMatrixSource implements MartEventSource {
  constructor(
    private readonly moves: MoveId[],
    private readonly _matrix: MartMatrix,
  ) {}
  getRound(guideId: string, guideArchetype: Archetype): MartRoundEvents {
    const seed = (Math.random() * 0xffffffff) >>> 0
    // 位置随机由状态机 shuffleMoves 控制；此处仅提供选项全集
    void this._matrix
    return { guideId, guideArchetype, options: this.moves.slice(), seed }
  }
}

// v2 扩展点（接口仅登记，不实现）：
// class BrainConfigSource implements MartEventSource {
//   // fetch /api/v1/mart/config
//   //   → DramaEvent[](actor:'guide'（EVOL-1）)
//   //   → 适配为 MartRoundEvents（moodDelta→affinity（EVOL-6））
//   //   → 落到同一 MartRoundState 结算路径
//   // 当前未解冻：EVOL-1 仍阻塞 waimai 侧；MVP 纯前端矩阵驱动，不产 DramaEvent。
// }
