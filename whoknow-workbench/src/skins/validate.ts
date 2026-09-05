/**
 * 皮肤配置 JSON 校验（T12 · 架构 §5-T12）。
 * 双闸门：① schema 结构合法；② 业务数据污染检测（皮肤 JSON 严禁携带 metrics/manual 数值）。
 * 被 scripts/validate-skins.mjs 于构建前调用；不依赖 Vue 运行时。
 */
import type { SkinConfig } from './types';

const SKIN_IDS = ['cosmos-dark', 'paper-light', 'legacy'] as const;
const PAGE_IDS = ['home', 'detail', 'candidates', 'list', 'governance'] as const;
const DENSITIES = ['comfortable', 'compact'] as const;

const FONT_ROLES = ['display', 'title', 'body', 'mono'] as const;

/** 业务污染检测：metrics/manual 中的关键数值字符串，出现即报错（G3 数据不侵入） */
const BUSINESS_POLLUTION_PATTERNS: RegExp[] = [
  /"progressPct"/,
  /"testPass"/,
  /"testTotal"/,
  /"milestonePhase"/,
  /"healthScore"/,
  /"appStatus"/,
  /"contractCount"/,
];

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 校验单份皮肤配置：返回错误列表（空数组 = 通过） */
export function validateSkinConfig(id: string, raw: unknown): string[] {
  const errors: string[] = [];
  const label = `skins/${id}.json`;

  if (!isRecord(raw)) {
    return [`${label}: 根节点须为对象`];
  }

  // 顶层字段白名单：id / label / tokens / fonts / pages
  const allowedTop = ['id', 'label', 'tokens', 'fonts', 'pages'];
  for (const key of Object.keys(raw)) {
    if (!allowedTop.includes(key)) {
      errors.push(`${label}: 非法顶层字段 "${key}"（仅允许 ${allowedTop.join('/')}）`);
    }
  }

  if (!SKIN_IDS.includes(raw.id as (typeof SKIN_IDS)[number])) {
    errors.push(`${label}: id "${String(raw.id)}" 不在 ${SKIN_IDS.join('/')} 中`);
  }
  if (raw.id !== id) {
    errors.push(`${label}: 文件名 "${id}" 与 id "${String(raw.id)}" 不一致`);
  }
  if (typeof raw.label !== 'string' || raw.label.length === 0) {
    errors.push(`${label}: label 须为非空字符串`);
  }
  if (!SKIN_IDS.includes(raw.tokens as (typeof SKIN_IDS)[number])) {
    errors.push(`${label}: tokens 须指向三套令牌集之一`);
  }

  // fonts：四个角色均为非空字符串
  if (!isRecord(raw.fonts)) {
    errors.push(`${label}: fonts 须为对象`);
  } else {
    for (const role of FONT_ROLES) {
      const v = raw.fonts[role];
      if (typeof v !== 'string' || v.trim() === '') {
        errors.push(`${label}: fonts.${role} 须为非空字符串`);
      }
    }
  }

  // pages：键 ∈ PageId；每页 layout/density/regions
  if (!isRecord(raw.pages)) {
    errors.push(`${label}: pages 须为对象`);
  } else {
    for (const [pageId, pageRaw] of Object.entries(raw.pages)) {
      if (!(PAGE_IDS as readonly string[]).includes(pageId)) {
        errors.push(`${label}: 未知页面 "${pageId}"（仅允许 ${PAGE_IDS.join('/')}）`);
        continue;
      }
      if (!isRecord(pageRaw)) {
        errors.push(`${label}: pages.${pageId} 须为对象`);
        continue;
      }
      if (typeof pageRaw.layout !== 'string' || pageRaw.layout.trim() === '') {
        errors.push(`${label}: pages.${pageId}.layout 须为非空字符串`);
      }
      if (!(DENSITIES as readonly string[]).includes(String(pageRaw.density))) {
        errors.push(`${label}: pages.${pageId}.density 须为 ${DENSITIES.join('/')}`);
      }
      if (!Array.isArray(pageRaw.regions)) {
        errors.push(`${label}: pages.${pageId}.regions 须为数组`);
      } else {
        for (const [i, regionRaw] of pageRaw.regions.entries()) {
          if (!isRecord(regionRaw)) {
            errors.push(`${label}: pages.${pageId}.regions[${i}] 须为对象`);
            continue;
          }
          const allowedRegion = ['region', 'module', 'variant'];
          for (const key of Object.keys(regionRaw)) {
            if (!allowedRegion.includes(key)) {
              errors.push(`${label}: pages.${pageId}.regions[${i}] 非法字段 "${key}"`);
            }
          }
          if (typeof regionRaw.region !== 'string' || regionRaw.region.trim() === '') {
            errors.push(`${label}: pages.${pageId}.regions[${i}].region 须为非空字符串`);
          }
          if (typeof regionRaw.module !== 'string' || regionRaw.module.trim() === '') {
            errors.push(`${label}: pages.${pageId}.regions[${i}].module 须为非空字符串`);
          }
        }
      }
    }
  }

  // 业务污染检测：序列化全文扫描
  const serialized = JSON.stringify(raw);
  for (const pattern of BUSINESS_POLLUTION_PATTERNS) {
    if (pattern.test(serialized)) {
      errors.push(`${label}: 检出业务数据污染（命中 ${pattern.source}）——皮肤 JSON 严禁携带运行时业务数值（G3）`);
    }
  }

  return errors;
}

/** 供校验脚本消费的窄化导出（避免脚本侧 import Vue 相关类型链） */
export type { SkinConfig };
