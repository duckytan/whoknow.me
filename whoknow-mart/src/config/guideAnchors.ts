// guideAnchors.ts — 5 导购视觉锚（呈现层元数据，mart 自有）
//
// 严格对齐 REVIEW §5.1 / ASSET-SPECS §1.2 / ACCESSIBILITY §9.1 唯一锚表。
// 提供「emoji + 中文型 + 角色色 + 戏精标签 chip + 动机化名角标」五元组，
// 供 Avatar / Chip / 图鉴等组件复用，保证全应用三重色盲标识一致。

import type { Archetype } from '../types/contract.ts'

export interface GuideAnchor {
  emoji: string
  roleToken: string // CSS 变量名（复制 waimai --role-*）
  roleHex: string // 角色色 HEX（与 waimai 一致）
  cnType: string // 中文型：毒舌型
  chip: string // 戏精标签 chip 文本：毒舌
  motiveBadge: string // 动机化名角标（禁真实老板/工资，红线 1–3）
}

export const GUIDE_ANCHORS: Record<Archetype, GuideAnchor> = {
  poison_tongue: {
    emoji: '🔥',
    roleToken: '--role-angry',
    roleHex: '#FF4B10',
    cnType: '毒舌型',
    chip: '毒舌',
    motiveBadge: '嘴替',
  },
  rational: {
    emoji: '🤓',
    roleToken: '--role-gentle',
    roleHex: '#2BB14A',
    cnType: '理性型',
    chip: '理性',
    motiveBadge: '算账',
  },
  lazy: {
    emoji: '😴',
    roleToken: '--role-lazy',
    roleHex: '#3A7BFF',
    cnType: '散漫型',
    chip: '散漫',
    motiveBadge: '想下班',
  },
  philosopher: {
    emoji: '🧘',
    roleToken: '--role-philo',
    roleHex: '#1FB6A6',
    cnType: '鸡汤型',
    chip: '鸡汤',
    motiveBadge: '为你好',
  },
  dark: {
    emoji: '😈',
    roleToken: '--role-weird',
    roleHex: '#8B5CF6',
    cnType: '腹黑型',
    chip: '腹黑',
    motiveBadge: 'KPI怪',
  },
}
