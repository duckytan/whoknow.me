// sliceDrama.ts — 人生模拟器·垂直切片 确定性迷你推演（whoknow-waimai/src/engine）
//
// 设计锁定：docs/designs/waimai-life-sim-slice-2026-07-27.md（文策渊 / 用户拍板）
// 一致性契约：docs/designs/waimai-drama-consistency-spec.md（文策渊 / 2026-07-28）
//
// 与 dramaEngine.ts 的关系（见设计文档 B1）：
//   本模块是「选择驱动·确定性」底盘 —— 同一组选择每次结果完全一致，无随机。
//   不复用 dramaEngine 的 SEED 随机池（池内 random 抽签会破坏「我的选择决定走向」）。
//   dramaEngine.ts 保留为 legacy/full 路径，DRAMA-SEED-v1 不动。
//
// 铁律：纯函数、零随机、可单测。剧情内容确定性；仅 DramaTimeline 的「逐条 reveal 时机」
//   随机（UI 层，不在此处）。mini-SEED（偏移量表 + 各阶段文案）内联为常量，与
//   DRAMA-SEED-v1 平行，不污染它。
//
// 红线：不出现真实医疗机构名 / 死亡 / 暴力 / 竞品名；「ICU」用「ICU 病房」中性表述、
//   语气温柔小心；「公厕」用化粪池/公共厕所调侃但不脏话。
//
// 文案架构（一致性契约 §2）：带驱动 × 情境(ADDRESS_BAND_TEXT) × 节拍(REMARK_BEAT) 查表拼接。
//   - bossMood 由 50 + 地址偏移 + 备注偏移 唯一确定 → band（hostile/neutral/warm）。
//   - addressTemp 把地址归到 cold(toilet/company) / warm(icu/home) 两档，用于 gentle 备注消歧。
//   - accept/cook/complete = ADDRESS_BAND_TEXT[addr][band] + REMARK_BEAT[remark](temp) 拼接。
//   - deliver = RIDER_LINE[cookSlow?'slow':'fast'][addr] + RIDER_REMARK_MODIFIER[remark]（P2 第一刀破 R4：骑手现接备注回声）。
//   全部逐字对齐 §3 表格（authoritative），数值模型零改动。

import type { DramaState, DramaEventOut } from './dramaEngine'

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

export type AddressTag = 'toilet' | 'icu' | 'home' | 'company'
export type RemarkTag =
  | 'more_spicy'
  | 'less_spicy'
  | 'no_cilantro'
  | 'no_scold'
  | 'perform'
  | 'boss_thx'

export interface SliceInput {
  addressTag: AddressTag
  remarkTag: RemarkTag
  /** 装饰性：仅用于展示，不进入因果链（菜品在切片为装饰） */
  dishCount?: number
  totalPrice?: number
}

export interface SliceResult {
  dramaState: DramaState
  events: DramaEventOut[]
}

// 情绪带（一致性契约 §1.1）
type Band = 'hostile' | 'neutral' | 'warm'
// 地址温度（一致性契约 §2.3 消歧用）
type Temp = 'cold' | 'warm'

// ---------------------------------------------------------------------------
// 常量（mini-SEED · 与 DRAMA-SEED-v1 平行）
// ---------------------------------------------------------------------------

const BASE_MOOD = 50
const BASE_RIDER = 60
const SLOW_COOK_DELAY = 45_000 // 出餐慢：+45s
const SLOW_DELIVER_DELAY = 25_000 // 配送额外：+25s
const SLOW_RIDER_DROP = 10 // 出餐慢 → 骑手士气跌幅
const COMPLETE_REBOUND = 5 // 送达阶段叙事微回弹（仅体现在 complete 事件 moodDelta，不回写 dramaState）
const COOK_SLOW_THRESHOLD = 30 // bossMood <= 30 → 出餐慢

// 偏移量表（单一事实来源；UI chip 的 ± 标注由此派生）
export const ADDRESS_OFFSETS: Record<AddressTag, number> = {
  toilet: -30,
  icu: 20,
  home: 5,
  company: -5,
}
export const REMARK_OFFSETS: Record<RemarkTag, number> = {
  more_spicy: 5,
  less_spicy: 0,
  no_cilantro: 0,
  no_scold: 15,
  perform: 10,
  boss_thx: 20,
}

// 备注数值属性（gentle = 出餐阶段 moodDelta 转正；cookDelayBonus = 换装等叠加 delay）
//   纯数值，保持不变；文案已迁到 REMARK_BEAT。
interface RemarkNum {
  /** gentle：第2阶段（出餐）老板被戳中收敛，moodDelta 转正（复合可解释·符号变化） */
  gentle?: boolean
  gentleMood?: number
  /** 出餐额外 delay（如表演才艺去换装），叠加在 cookSlow 的 45s 之上 */
  cookDelayBonus?: number
}
const REMARK_NUM: Record<RemarkTag, RemarkNum> = {
  more_spicy: {},
  less_spicy: {},
  no_cilantro: {},
  no_scold: { gentle: true, gentleMood: 5 },
  perform: { cookDelayBonus: 20_000 },
  boss_thx: { gentle: true, gentleMood: 10 },
}

// ---------------------------------------------------------------------------
// 文案层：带驱动 × 情境 × 节拍（逐字对齐一致性契约 §3）
// ---------------------------------------------------------------------------

// 地址情境文本：按带分层（每地址仅填充其可达的带，以 §3 实际出现为准）
interface AddressBandText {
  accept: string
  cook: string
  complete: string
}
const ADDRESS_BAND_TEXT: Record<AddressTag, Partial<Record<Band, AddressBandText>>> = {
  // toilet（cold）：可达 hostile(≤30) / neutral(31–59)
  toilet: {
    hostile: {
      accept: '公厕？？你住化粪池啊……',
      cook: '（啧，公厕的单我故意慢慢做，锅都不想洗）',
      complete: '拿好，公厕……趁热吃（别真趁热）。下次点正常地址行不行。',
    },
    neutral: {
      accept: '公厕是吧……行，你这地址我接了。',
      cook: '公厕这单我正常做。',
      complete: '拿好，公厕……趁热吃（别真趁热）。你刚那句，我记下了。',
    },
  },
  // icu（warm）：仅可达 warm（≥60）；P2 收尾加轻荒诞（守红线·温柔）
  icu: {
    warm: {
      accept: 'ICU 病房？我轻着点做，您安心养着。',
      cook: '（小声）您这单我得快手快脚又轻手轻脚地做，汤别洒了。',
      complete: '趁热趁软乎……您慢用，好好休息。（这单我比查房还上心）',
    },
  },
  // home（warm 温度）：可达 neutral(55) / warm(60+)；P2 第一刀拆双人格——
  //   neutral（mood 55，less_spicy / no_cilantro）：家常随性、略敷衍
  //   warm（mood 60+，more_spicy / no_scold / perform / boss_thx）：真当家人、更上心
  //   （数值偏移量表零改动；more_spicy 偏移 +5 → home+more_spicy=60 落 warm 带，符合既有数值模型）
  home: {
    neutral: {
      accept: '家庭单？跟给自己家做一样，随便坐。',
      cook: '（家常味儿，火候我随手掂的）',
      complete: '拿好，趁热吃——再不吃咱妈要打电话查岗了。',
    },
    warm: {
      accept: '家庭单？跟回自己家一样，门都不用敲。',
      cook: '（哼着歌）家里的味道，闭眼都拿捏得准。',
      complete: '拿好，趁热吃，家里人惦记你呢。（碗我顺手洗了）',
    },
  },
  // company（cold）：可达 neutral(45/50/55) / warm(60/65)
  company: {
    neutral: {
      accept: '公司单？行，你们打工人互相折磨呗。',
      cook: '（叹气）公司单我也就应付下，别指望多用心。',
      complete: '拿好，回工位趁热扒两口，别被老板抓包。',
    },
    warm: {
      accept: '公司单？……得，被你这单整得我也有点想好好干。',
      cook: '公司单我也认真做，给你们打工人争口气。',
      complete: '拿好，回工位趁热吃，今天这单我用心了。',
    },
  },
}

// 备注节拍：accept/cook/complete 三拍；对需消歧的 gentle 备注按 addressTemp 取冷/暖变体
//   （仅 no_scold / boss_thx 需两路；其余 4 个备注单变体，语气中性兼容三带，见 §2.4）
interface RemarkBeat {
  accept: (temp: Temp) => string
  cook: (temp: Temp) => string
  complete: (temp: Temp) => string
}
const REMARK_BEAT: Record<RemarkTag, RemarkBeat> = {
  more_spicy: {
    accept: () => '行，多放辣是吧，辣得你忘了在哪儿吃的。',
    cook: () => '辣子现舂，等着。',
    complete: () => '辣到位了，喝口水缓缓。',
  },
  less_spicy: {
    accept: () => '少放辣？行，清淡点。',
    cook: () => '辣子我手抖少抓了一把。',
    complete: () => '清清淡淡，养胃。',
  },
  no_cilantro: {
    accept: () => '不要香菜？又是你。',
    cook: () => '香菜我一根没放，您放心。',
    complete: () => '（确定没香菜，我检查三遍了）',
  },
  // no_scold（别骂了）：冷地址老板本要炸→被劝住收敛；暖地址本就 nice→改用「被体贴戳中」，不出现「别骂了」
  no_scold: {
    accept: (t) => (t === 'cold' ? '别骂了……行，我收敛点。' : '你倒会替我着想……那我更得好好做。'),
    cook: (t) =>
      t === 'cold'
        ? '（被你那句「别骂了」戳中）我好好做。'
        : '（被你这句话暖到，手上更仔细了）我好好做。',
    complete: (t) => (t === 'cold' ? '刚才脾气不好，见谅啊。' : '你这么体贴，这单我记心里了。'),
  },
  perform: {
    accept: () => '表演才艺？成，今儿给你来一段。',
    cook: () => '先去换身行头，您稍等，演出级出餐。',
    complete: () => '谢幕鞠躬，下次点个「encore」呗。',
  },
  // boss_thx（老板辛苦了）：冷地址骂完被客气整不会了；暖地址本就 nice 被夸更暖
  boss_thx: {
    accept: (t) =>
      t === 'cold'
        ? '老板辛苦了？嗐，被你这么客气整不会了……'
        : '老板辛苦了？嘿，被你这么一夸，更得好好伺候了。',
    cook: () => '（心里一暖）您这句话我记下了，多放份量。',
    complete: () => '（辛苦啥，您爱吃就行）',
  },
}

// 骑手台词：承接地址情境 + cook 状态（slow→急 / fast→稳）；P2 第一刀破 R4，叠加备注回声。
//   toilet 慢单(slow)/快单(fast) 两版；icu/home/company 无慢单，仅 fast 一版。
//   slow 三档（icu/home/company）不可达，占位保持类型安全，文本等同 fast。
const RIDER_LINE: Record<'slow' | 'fast', Record<AddressTag, string>> = {
  slow: {
    toilet: '这老板又摆烂，我急疯了狂飙……公厕我找了半天。',
    // 以下三档不可达（icu/home/company 无慢单），占位保持类型安全，文本等同 fast。
    icu: 'ICU 这单我开得稳稳的，您别急，门帮您留着。',
    home: '你家这栋我熟，溜达着就到了，门把手给您留着。',
    company: '公司楼我天天跑，电梯挤死，但准时给您放前台了。',
  },
  fast: {
    toilet: '公厕这单老板居然利索，我一路畅通送到了，奇了。',
    icu: 'ICU 这单我开得稳稳的，您别急，门帮您留着。',
    home: '你家这栋我熟，溜达着就到了，门把手给您留着。',
    company: '公司楼我天天跑，电梯挤死，但准时给您放前台了。',
  },
}

// 骑手备注回声（P2 第一刀破 R4）：骑手对用户备注的口语化反应（快递小哥人格），
// 确定性、零随机。拼接于 RIDER_LINE 基础句之后；空串 '' 表示骑手不接该备注。
//   6 条均给非空回声，以彻底破除「骑手线 24 组合仅 5 句不同、每句重复 4–6 次」的重复疲劳。
const RIDER_REMARK_MODIFIER: Record<RemarkTag, string> = {
  more_spicy: '（辣味隔着打包袋直窜我鼻子，你自求多福）',
  less_spicy: '（清汤寡水的，老板说你养生我信了）',
  no_cilantro: '（香菜？我闻着都嫌弃，一根没给你放）',
  no_scold: '（你倒替老板说话，我都不敢催了）',
  perform: '（还演出呢？下回给我也整一段）',
  boss_thx: '（老板被你夸得乐呵，我顺带沾光了）',
}

// bossMood → 情绪带（≤30 hostile / 31–59 neutral / ≥60 warm）
function bandOf(mood: number): Band {
  if (mood <= COOK_SLOW_THRESHOLD) return 'hostile'
  if (mood < 60) return 'neutral'
  return 'warm'
}

// 地址 → 温度（cold = toilet|company，warm = icu|home）
function addressTemp(addr: AddressTag): Temp {
  return addr === 'toilet' || addr === 'company' ? 'cold' : 'warm'
}

// ---------------------------------------------------------------------------
// 推演（纯函数 · 确定性）
// ---------------------------------------------------------------------------

export function sliceDrama(input: SliceInput): SliceResult {
  const remark = REMARK_NUM[input.remarkTag]

  // 阶段1 接单：bossMood = 50 + 地址偏移 + 备注偏移（情绪带，决定出餐快慢）
  const addrOffset = ADDRESS_OFFSETS[input.addressTag]
  const remarkOffset = REMARK_OFFSETS[input.remarkTag]
  const bossMood = BASE_MOOD + addrOffset + remarkOffset
  // 情绪带偏移：中性(0)不显示，避免「+0」噪声
  const acceptDelta = addrOffset + remarkOffset === 0 ? undefined : addrOffset + remarkOffset

  // 阶段2 出餐：情绪带 <= 30 → 出餐慢（+45s）；否则正常（0）
  //   gentle 备注在出餐阶段被戳中收敛 → moodDelta 转正（复合可解释·符号变化）
  const cookSlow = bossMood <= COOK_SLOW_THRESHOLD
  const cookDelay = (cookSlow ? SLOW_COOK_DELAY : 0) + (remark.cookDelayBonus ?? 0)
  const cookMoodDelta = remark.gentle ? (remark.gentleMood ?? 0) : undefined

  // 阶段3 配送：出餐慢 → 骑手急（士气 -10，+25s）；否则平稳
  const riderMorale = cookSlow ? BASE_RIDER - SLOW_RIDER_DROP : BASE_RIDER
  const deliverDelay = cookSlow ? SLOW_DELIVER_DELAY : 0

  const totalDelay = cookDelay + deliverDelay

  // dramaState：反映由选择决定的「情绪带」（接单即定，驱动出餐快慢）+ 骑手士气 + 总延迟。
  //   送达阶段 +5 为叙事收尾微回弹，仅体现在 complete 事件 moodDelta 上，不回写 dramaState
  //   （避免与「带」语义混淆；与 B2 因果一致：公厕+多放辣 → bossMood 带 = 25）。
  const dramaState: DramaState = {
    bossMood,
    riderMorale,
    totalDelay,
    tags: [input.addressTag, input.remarkTag],
  }

  // 文案拼接：带驱动 × 情境 × 节拍（逐字对齐 §3）
  const band = bandOf(bossMood)
  const temp = addressTemp(input.addressTag)
  const addrText = ADDRESS_BAND_TEXT[input.addressTag][band]
  if (!addrText) {
    // 数值模型保证每个 (addr, bossMood) 的组合落在 ADDRESS_BAND_TEXT 已填充的带内，
    // 此处仅作防御性断言，正常永远不可达。
    throw new Error(`sliceDrama: 未配置文案带 ${input.addressTag}/${band}`)
  }
  const beat = REMARK_BEAT[input.remarkTag]

  const acceptText = addrText.accept + beat.accept(temp)
  const cookText = addrText.cook + beat.cook(temp)
  const completeText = addrText.complete + beat.complete(temp)
  const deliverText =
    RIDER_LINE[cookSlow ? 'slow' : 'fast'][input.addressTag] +
    (RIDER_REMARK_MODIFIER[input.remarkTag] ?? '')

  const events: DramaEventOut[] = [
    {
      phase: 'accept',
      actor: 'boss',
      text: acceptText,
      moodDelta: acceptDelta,
    },
    {
      phase: 'cook',
      actor: 'boss',
      text: cookText,
      moodDelta: cookMoodDelta,
      delay: cookDelay,
    },
    {
      phase: 'deliver',
      actor: 'rider',
      text: deliverText,
      delay: deliverDelay,
    },
    {
      phase: 'complete',
      actor: 'boss',
      text: completeText,
      moodDelta: COMPLETE_REBOUND,
    },
  ]

  return { dramaState, events }
}
