// sliceDrama.ts — 人生模拟器·垂直切片 确定性迷你推演（whoknow-waimai/src/engine）
//
// 设计锁定：docs/designs/waimai-life-sim-slice-2026-07-27.md（文策渊 / 用户拍板）
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

interface AddressDef {
  id: AddressTag
  acceptPrefix: string
  acceptNoRemark: string
  cookBase: string
  cookNoRemark: string
  deliverSlow: string
  deliverFast: string
  completeBase: string
}

// 4 个地址（切片初始严格 4 个；school/bermuda/hometown/rooftop 留扩展位）
const ADDRESSES: Record<AddressTag, AddressDef> = {
  toilet: {
    id: 'toilet',
    acceptPrefix: '公厕？？你住化粪池啊……',
    acceptNoRemark: '这地址可真会挑。',
    cookBase: '（啧，公厕的单我故意慢慢做，锅都不想洗）',
    cookNoRemark: '您先闻着味儿等着。',
    deliverSlow: '这老板又摆烂，我急疯了狂飙……公厕我找了半天。',
    deliverFast: '公厕这单老板居然利索，我一路畅通送到了，奇了。',
    completeBase: '拿好，公厕……趁热吃（别真趁热）。下次点正常地址行不行。',
  },
  icu: {
    id: 'icu',
    acceptPrefix: 'ICU 病房？',
    acceptNoRemark: '我轻着点做，您安心养着。',
    cookBase: '（小声）您这单我得快手快脚又轻手轻脚地做，汤别洒了。',
    cookNoRemark: '火候我替您盯着。',
    deliverSlow: 'ICU 这单我开得稳稳的，电梯都帮您按好了。',
    deliverFast: 'ICU 这单我开得稳稳的，您别急，门帮您留着。',
    completeBase: '趁热趁软乎……您慢用，好好休息。',
  },
  home: {
    id: 'home',
    acceptPrefix: '家庭单？',
    acceptNoRemark: '跟给自己家做一样，随便坐。',
    cookBase: '（哼着歌）家的味道，火候我拿捏得准。',
    cookNoRemark: '多等会儿也香。',
    deliverSlow: '你家这栋我熟，溜达着就到了，门把手给您留着。',
    deliverFast: '你家这栋我熟，溜达着就到了，门把手给您留着。',
    completeBase: '拿好，趁热吃，家里人等你呢。',
  },
  company: {
    id: 'company',
    acceptPrefix: '公司单？',
    acceptNoRemark: '行，你们打工人互相折磨呗。',
    cookBase: '（叹气）公司单我也就应付下，别指望多用心。',
    cookNoRemark: '凑合能吃。',
    deliverSlow: '公司楼我天天跑，电梯挤死，但准时给您放前台了。',
    deliverFast: '公司楼我天天跑，电梯挤死，但准时给您放前台了。',
    completeBase: '拿好，回工位趁热扒两口，别被老板抓包。',
  },
}

interface RemarkDef {
  id: RemarkTag
  /** gentle：第2阶段（出餐）老板被戳中收敛，moodDelta 转正（复合可解释·符号变化） */
  gentle?: boolean
  gentleMood?: number
  /** 出餐额外 delay（如表演才艺去换装），叠加在 cookSlow 的 45s 之上 */
  cookDelayBonus?: number
  acceptSuffix: string
  cookEcho?: string
  deliverEcho?: string
  completeEcho?: string
}

// 6 个备注（全带回 v1）
const REMARKS: Record<RemarkTag, RemarkDef> = {
  more_spicy: {
    id: 'more_spicy',
    acceptSuffix: '行，多放辣是吧，辣得你忘了在哪儿吃的。',
    cookEcho: '辣子现舂，等着。',
    deliverEcho: '',
    completeEcho: '',
  },
  less_spicy: {
    id: 'less_spicy',
    acceptSuffix: '少放辣？行，清淡点。',
    cookEcho: '辣子我手抖少抓了一把。',
    deliverEcho: '',
    completeEcho: '清清淡淡，养胃。',
  },
  no_cilantro: {
    id: 'no_cilantro',
    acceptSuffix: '不要香菜？又是你。',
    cookEcho: '香菜我一根没放，您放心。',
    deliverEcho: '',
    completeEcho: '（确定没香菜，我检查三遍了）',
  },
  no_scold: {
    id: 'no_scold',
    gentle: true,
    gentleMood: 5,
    acceptSuffix: '别骂了……行，我收敛点。',
    cookEcho: '（被你这句话戳中，火气下去了）我好好做。',
    deliverEcho: '',
    completeEcho: '刚才脾气不好，见谅啊。',
  },
  perform: {
    id: 'perform',
    cookDelayBonus: 20_000,
    acceptSuffix: '表演才艺？成，今儿给你来一段。',
    cookEcho: '（先去换身行头）您稍等，演出级出餐。',
    deliverEcho: '',
    completeEcho: '谢幕鞠躬，下次点个「encore」呗。',
  },
  boss_thx: {
    id: 'boss_thx',
    gentle: true,
    gentleMood: 10,
    acceptSuffix: '老板辛苦了？嗐，被你这么一说眼眶热了。',
    cookEcho: '（心里一暖）您这句话我记下了，多放份量。',
    deliverEcho: '',
    completeEcho: '（辛苦啥，您爱吃就行）',
  },
}

// ---------------------------------------------------------------------------
// 推演（纯函数 · 确定性）
// ---------------------------------------------------------------------------

export function sliceDrama(input: SliceInput): SliceResult {
  const addr = ADDRESSES[input.addressTag]
  const remark = REMARKS[input.remarkTag]

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

  const events: DramaEventOut[] = [
    {
      phase: 'accept',
      actor: 'boss',
      text: addr.acceptPrefix + (remark.acceptSuffix || addr.acceptNoRemark),
      moodDelta: acceptDelta,
    },
    {
      phase: 'cook',
      actor: 'boss',
      text: addr.cookBase + (remark.cookEcho || addr.cookNoRemark),
      moodDelta: cookMoodDelta,
      delay: cookDelay,
    },
    {
      phase: 'deliver',
      actor: 'rider',
      text: (cookSlow ? addr.deliverSlow : addr.deliverFast) + (remark.deliverEcho || ''),
      delay: deliverDelay,
    },
    {
      phase: 'complete',
      actor: 'boss',
      text: addr.completeBase + (remark.completeEcho || ''),
      moodDelta: COMPLETE_REBOUND,
    },
  ]

  return { dramaState, events }
}
