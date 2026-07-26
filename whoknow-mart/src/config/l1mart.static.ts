// l1mart.static.ts — MVP 静态 L1.mart 信封（手写填充，值来自 PHASE4-CONTENT.md v1.1）
//
// ⚠️ 内容层已接（design-strategist 定稿 · 主理人核准）：台词 / 矩阵 / 商品 / 手感数值
// 均为可 playtest 真实内容（red_light_count=0），不再有占位待填项。
// 手感类数值（initial / roundCap / vip 阈值）以「建议种子 · playtest 标定」标注，非硬编码定稿。
// 结构对齐 DATA-STRUCTURE-v1；mart 自建子集（guides/moves/matrix/affinity/products）。
// 红线词实际词表（red_light/yellow_light 数组）由 design-strategist 落地，本文件信封仅声明
// forbidden_check 计数（red_light_count=0）。

import type { L1Mart, SharedEnvelope } from '../types/contract.ts'

export const L1MART: L1Mart = {
  guides: [
    {
      id: 'guide_wanger_ma',
      name: '毒舌·王二麻',
      archetype: 'poison_tongue',
      motive: 'C',
      hiddenWeakness: ['比价'],
      thunderMine: ['装可怜'],
      lineBuckets: {
        first: [
          '家人们谁懂啊，这玩意儿也就你能看上。',
          '劝你善良，这价格我都替你疼。',
          '别急下单，我先泼盆冷水。',
          '就你这手速还抢购呢，慢点我还能少卖一单。',
        ],
        regular: [
          '又来了？上次劝你的话当耳旁风了？',
          '老熟人了，我还是那句——别交智商税。',
          '你这购物车，我都能背出来了。',
          '又来，你这复购率比我 KPI 还稳。',
        ],
        vip: [
          '行吧行吧，给句实话——真别买。',
          '咱俩这交情，我替你捂紧钱包。',
          '再买我都要替你急眼了（开玩笑）。',
          '铁粉认证了，这单我替你把取消键先按了。',
        ],
      },
      rarity: 'common',
      avatar: 'guide-poison-tongue',
    },
    {
      id: 'guide_lisuanpan',
      name: '精算·李算盘',
      archetype: 'rational',
      motive: 'C',
      hiddenWeakness: ['比价'],
      thunderMine: ['以毒攻毒'],
      lineBuckets: {
        first: [
          '咱算笔账：这功能你一年用不上两次。',
          '冲动是魔鬼，先放购物车冷静。',
          '这钱留着不香吗？',
        ],
        regular: [
          '第几次了？你的坑我已经数不清。',
          '理性提醒：上次那单你还没用呢。',
          '别让购物车替你做决定。',
        ],
        vip: [
          '自己人，我不绕弯子——这单省下的够吃顿好的。',
          '咱这种交情，直接告诉你：别下单。',
          '钱在你兜里最安全。',
        ],
      },
      rarity: 'common',
      avatar: 'guide-rational',
    },
    {
      id: 'guide_zhaotuotuo',
      name: '散漫·赵拖拖',
      archetype: 'lazy',
      motive: 'B',
      hiddenWeakness: ['装可怜'],
      thunderMine: ['我需要'],
      lineBuckets: {
        first: [
          '好累，能不能别买让我早点下班。',
          '我都躺平了你还来？',
          '下单要填单子，好麻烦，要不别买了。',
        ],
        regular: [
          '又来？我瘫着呢，你自便吧……才怪。',
          '看你这么勤快，我更想睡了。',
          '别买，我谢谢你，能多躺会儿。',
        ],
        vip: [
          '老主顾了，我打个喷嚏的功夫给你真相——别下单。',
          '咱俩谁跟谁，我真不坑你。',
          '这单我替你拒了啊。',
        ],
      },
      rarity: 'common',
      avatar: 'guide-lazy',
    },
    {
      id: 'guide_qianmanman',
      name: '鸡汤·钱满满',
      archetype: 'philosopher',
      motive: 'C',
      hiddenWeakness: ['以毒攻毒'],
      thunderMine: ['比价'],
      lineBuckets: {
        first: [
          '人生苦短，何必为一个用不上的东西掏空钱包。',
          '买它不如买清静。',
          '深呼吸，这股冲动会过去的。',
        ],
        regular: [
          '你这月第几次冲动了？breathe~',
          '上次的教训这么快忘了？',
          '购物车是欲望的镜子，照照。',
        ],
        vip: [
          '咱们这种交情，我得点醒你——有些东西不买，心里才真清净。',
          '真朋友不让你乱花钱。',
          '省下的，都是给未来的你。',
        ],
      },
      rarity: 'common',
      avatar: 'guide-philosopher',
    },
    {
      id: 'guide_zhouanan',
      name: '腹黑·周暗暗',
      archetype: 'dark',
      motive: 'B',
      hiddenWeakness: ['我需要'],
      thunderMine: ['装可怜'],
      lineBuckets: {
        first: [
          '买了这东西，老板笑得比你还开心，你确定？',
          '别急，我看戏呢。',
          '这价的猫腻，我比你清楚。',
        ],
        regular: [
          '又来送钱了？行，我假装没看见。',
          '你这毅力，用在别处多好。',
          '别买，我懒得替你心疼。',
        ],
        vip: [
          '自己人，偷偷告诉你，这玩意儿老板自己都不用。',
          '咱俩一伙的，别让上家赚走。',
          '这单，我站你这边。',
        ],
      },
      rarity: 'common',
      avatar: 'guide-dark',
    },
  ],
  moves: [
    { id: 'move_firm', label: '我需要！', archetype: '坚定' },
    { id: 'move_compare', label: '我比过价了', archetype: '比价' },
    { id: 'move_pity', label: '求求了', archetype: '装可怜' },
    { id: 'move_poison', label: '爱卖不卖', archetype: '以毒攻毒' },
  ],
  // 权威锁定（PHASE4-CONTENT.md v1.1 §2.1）：每行严格 1 弱点(+40) + 1 踩雷(−10) + 2 中性(+10)。
  // poison_tongue 弱点/踩雷来自 mart-L1-datastructure-draft §1 种子；其余 4 行为本次填值种子。
  matrix: {
    poison_tongue: { move_firm: 10, move_compare: 40, move_pity: -10, move_poison: 10 },
    rational: { move_firm: 10, move_compare: 40, move_pity: 10, move_poison: -10 },
    lazy: { move_firm: -10, move_compare: 10, move_pity: 40, move_poison: 10 },
    philosopher: { move_firm: 10, move_compare: -10, move_pity: 10, move_poison: 40 },
    dark: { move_firm: 40, move_compare: 10, move_pity: -10, move_poison: 10 },
  },
  affinity: {
    initial: 20,
    min: 0,
    max: 100,
    roundCap: 8,
    winState: 'WIN_BREAK',
    loseState: 'WIN_ANTI',
    // initial / roundCap 为「建议种子 · playtest 标定」（反骨建议 initial 30~40 / 单局 5–15min）。
  },
  products: [
    {
      id: 'prod_001',
      name: '能测前任心跳的枕头',
      price: 0,
      guideBinding: 'guide_zhouanan',
      rarity: 'uncommon',
      emoji: '🛏️',
      pricePlaceholder: '离谱价',
      shopName: '某宝杂货铺',
      category: '家居',
      absurdity: true,
      compareMaterial: '同款前任周边别家一抓一把，没必要在这交冤枉钱。',
    },
    {
      id: 'prod_002',
      name: '会骂人的闹钟',
      price: 0,
      guideBinding: 'guide_wanger_ma',
      rarity: 'rare',
      emoji: '⏰',
      pricePlaceholder: '¥??',
      shopName: '老王不卖铺',
      category: '数码',
      absurdity: true,
      compareMaterial: '会骂人的小家电某宝杂货铺一抓一把，价还更实在。',
    },
    {
      id: 'prod_003',
      name: '充电宝（正常品锚定真实感）',
      price: 0,
      guideBinding: 'guide_lisuanpan',
      rarity: 'common',
      emoji: '🔋',
      pricePlaceholder: '看缘分价',
      shopName: '某团小店',
      category: '数码',
      absurdity: false,
      compareMaterial: '充电宝满大街一个行情，这家没便宜到哪去。',
    },
    {
      id: 'prod_004',
      name: '口红（正常品）',
      price: 0,
      guideBinding: 'guide_qianmanman',
      rarity: 'common',
      emoji: '💄',
      pricePlaceholder: '智商税价',
      shopName: '某宝杂货铺',
      category: '美妆',
      absurdity: false,
      compareMaterial: '这色号别家常驻活动，这价划不来。',
    },
    {
      id: 'prod_005',
      name: '自动喂猫机器人',
      price: 0,
      guideBinding: 'guide_zhaotuotuo',
      rarity: 'rare',
      emoji: '🐱',
      pricePlaceholder: '离谱价',
      shopName: '京城杂货',
      category: '宠物',
      absurdity: true,
      compareMaterial: '自动喂猫的，比别家贵出一截，劝你冷静。',
    },
    {
      id: 'prod_006',
      name: '防秃头按摩梳',
      price: 0,
      guideBinding: 'guide_zhouanan',
      rarity: 'uncommon',
      emoji: '💆',
      pricePlaceholder: '¥??',
      shopName: '某团小店',
      category: '个护',
      absurdity: true,
      compareMaterial: '梳子而已，这价够买好几把普通的了。',
    },
  ],
}

/** MVP 静态信封（手写填充）。v2 接 brain 时 loader 增加「远程→昨日→fallback→L4」链路。 */
export const MART_STATIC_ENVELOPE: SharedEnvelope = {
  version: '2026-07-26.001',
  generated_at: '2026-07-26T00:00:00Z',
  effective_until: '2099-12-31T23:59:59Z',
  meta: { hot_today: '', weather: '', holiday: '' },
  mart: L1MART,
  forbidden_check: { version: '1.0', red_light_count: 0, yellow_light_count: 0, passed: true },
  fallback: { mart: L1MART },
}
