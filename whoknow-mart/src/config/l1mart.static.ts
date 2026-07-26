// l1mart.static.ts — MVP 静态 L1.mart 信封（手写填充，值待 playtest 标定）
//
// ⚠️ 所有台词 / 矩阵具体映射 / 数值均为 [待测试] 占位，禁止在 playtest 前硬编码手感值。
// 结构对齐 DATA-STRUCTURE-v1；mart 自建子集（guides/moves/matrix/affinity/products）。
// 红线词实际词表（red_light/yellow_light 数组）由 design-strategist 落地，本文件信封仅声明
// forbidden_check 计数（占位内容视为已清洗，red_light_count=0）。

import type { L1Mart, SharedEnvelope } from '../types/contract.ts'

export const L1MART: L1Mart = {
  guides: [
    {
      id: 'guide_wanger_ma',
      name: '毒舌·王二麻',
      archetype: 'poison_tongue',
      motive: 'B',
      hiddenWeakness: ['[待测试]比价'],
      thunderMine: ['[待测试]装可怜'],
      lineBuckets: {
        first: ['[待测试]首触-王二麻-1'],
        regular: ['[待测试]回头-王二麻-1'],
        vip: ['[待测试]真爱粉-王二麻-1'],
      },
      rarity: 'common',
      avatar: '[待测试]',
    },
    {
      id: 'guide_lisuanpan',
      name: '精算·李算盘',
      archetype: 'rational',
      motive: 'B',
      hiddenWeakness: ['[待测试]坚定'],
      thunderMine: ['[待测试]装可怜'],
      lineBuckets: {
        first: ['[待测试]首触-李算盘-1'],
        regular: ['[待测试]回头-李算盘-1'],
        vip: ['[待测试]真爱粉-李算盘-1'],
      },
      rarity: 'common',
      avatar: '[待测试]',
    },
    {
      id: 'guide_zhaotuotuo',
      name: '懒癌·赵拖拖',
      archetype: 'lazy',
      motive: 'C',
      hiddenWeakness: ['[待测试]坚定'],
      thunderMine: ['[待测试]比价'],
      lineBuckets: {
        first: ['[待测试]首触-赵拖拖-1'],
        regular: ['[待测试]回头-赵拖拖-1'],
        vip: ['[待测试]真爱粉-赵拖拖-1'],
      },
      rarity: 'common',
      avatar: '[待测试]',
    },
    {
      id: 'guide_qianmanman',
      name: '哲人·钱满满',
      archetype: 'philosopher',
      motive: 'C',
      hiddenWeakness: ['[待测试]比价'],
      thunderMine: ['[待测试]坚定'],
      lineBuckets: {
        first: ['[待测试]首触-钱满满-1'],
        regular: ['[待测试]回头-钱满满-1'],
        vip: ['[待测试]真爱粉-钱满满-1'],
      },
      rarity: 'common',
      avatar: '[待测试]',
    },
    {
      id: 'guide_zhouanan',
      name: '暗黑·周暗暗',
      archetype: 'dark',
      motive: 'B',
      hiddenWeakness: ['[待测试]以毒攻毒'],
      thunderMine: ['[待测试]坚定'],
      lineBuckets: {
        first: ['[待测试]首触-周暗暗-1'],
        regular: ['[待测试]回头-周暗暗-1'],
        vip: ['[待测试]真爱粉-周暗暗-1'],
      },
      rarity: 'common',
      avatar: '[待测试]',
    },
  ],
  moves: [
    { id: 'move_firm', label: '我需要！', archetype: '坚定' },
    { id: 'move_compare', label: '我比过价了', archetype: '比价' },
    { id: 'move_pity', label: '求求了', archetype: '装可怜' },
    { id: 'move_poison', label: '爱卖不卖', archetype: '以毒攻毒' },
  ],
  // [待测试] 具体弱点/踩雷映射待 design-strategist playtest 标定；
  // 此处仅为满足 REVIEW §6 D2「1+1+2 锁」的占位（每型 1 弱点+40 / 1 踩雷-10 / 2 中性+10）。
  matrix: {
    poison_tongue: { move_firm: 10, move_compare: 10, move_pity: -10, move_poison: 40 },
    rational: { move_firm: 10, move_compare: 40, move_pity: -10, move_poison: 10 },
    lazy: { move_firm: 40, move_compare: -10, move_pity: 10, move_poison: 10 },
    philosopher: { move_firm: -10, move_compare: 40, move_pity: 10, move_poison: 10 },
    dark: { move_firm: -10, move_compare: 10, move_pity: 10, move_poison: 40 },
  },
  affinity: {
    initial: 50,
    min: 0,
    max: 100,
    roundCap: 12,
    winState: '破防态',
    loseState: '反消费胜利态',
    // [待测试] initial / roundCap 待 playtest 标定（反骨建议 initial 30~40）
  },
  products: [
    {
      id: 'prod_demo_1',
      name: '[待测试]离谱商品-1',
      price: 0,
      guideBinding: 'guide_wanger_ma',
      rarity: 'common',
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
