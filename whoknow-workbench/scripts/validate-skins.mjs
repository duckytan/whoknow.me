#!/usr/bin/env node
/**
 * 构建前皮肤配置校验（T12 · 架构 §1.7）。
 * 用法：node scripts/validate-skins.mjs
 * 校验 src/skins/*.json 的 schema 结构与业务数据污染；任一错误即非零退出，阻断构建。
 * 说明：validate.ts 为 TS 源文件，本脚本不引入它（避免 ts-node 依赖），
 * 而是以同一套规则内联实现于本文件——两处规则必须同步修改（搜索「与 validate.ts 同步」）。
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKINS_DIR = join(__dirname, '..', 'src', 'skins');

const SKIN_IDS = ['cosmos-dark', 'paper-light', 'legacy'];
const PAGE_IDS = ['home', 'detail', 'candidates', 'list', 'governance'];
const DENSITIES = ['comfortable', 'compact'];
const FONT_ROLES = ['display', 'title', 'body', 'mono'];

// 与 validate.ts 同步：业务污染模式（G3 数据不侵入）
const BUSINESS_POLLUTION_PATTERNS = [
  /"progressPct"/,
  /"testPass"/,
  /"testTotal"/,
  /"milestonePhase"/,
  /"healthScore"/,
  /"appStatus"/,
  /"contractCount"/,
];

/** @param {string} id @param {unknown} raw @returns {string[]} */
function validateSkinConfig(id, raw) {
  const errors = [];
  const label = `skins/${id}.json`;

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return [`${label}: 根节点须为对象`];
  }
  const obj = /** @type {Record<string, unknown>} */ (raw);

  const allowedTop = ['id', 'label', 'tokens', 'fonts', 'pages'];
  for (const key of Object.keys(obj)) {
    if (!allowedTop.includes(key)) {
      errors.push(`${label}: 非法顶层字段 "${key}"（仅允许 ${allowedTop.join('/')}）`);
    }
  }

  if (!SKIN_IDS.includes(String(obj.id))) {
    errors.push(`${label}: id "${String(obj.id)}" 不在 ${SKIN_IDS.join('/')} 中`);
  }
  if (obj.id !== id) {
    errors.push(`${label}: 文件名 "${id}" 与 id "${String(obj.id)}" 不一致`);
  }
  if (typeof obj.label !== 'string' || obj.label.length === 0) {
    errors.push(`${label}: label 须为非空字符串`);
  }
  if (!SKIN_IDS.includes(String(obj.tokens))) {
    errors.push(`${label}: tokens 须指向三套令牌集之一`);
  }

  if (typeof obj.fonts !== 'object' || obj.fonts === null || Array.isArray(obj.fonts)) {
    errors.push(`${label}: fonts 须为对象`);
  } else {
    const fonts = /** @type {Record<string, unknown>} */ (obj.fonts);
    for (const role of FONT_ROLES) {
      const v = fonts[role];
      if (typeof v !== 'string' || v.trim() === '') {
        errors.push(`${label}: fonts.${role} 须为非空字符串`);
      }
    }
  }

  if (typeof obj.pages !== 'object' || obj.pages === null || Array.isArray(obj.pages)) {
    errors.push(`${label}: pages 须为对象`);
  } else {
    const pages = /** @type {Record<string, unknown>} */ (obj.pages);
    for (const [pageId, pageRaw] of Object.entries(pages)) {
      if (!PAGE_IDS.includes(pageId)) {
        errors.push(`${label}: 未知页面 "${pageId}"（仅允许 ${PAGE_IDS.join('/')}）`);
        continue;
      }
      if (typeof pageRaw !== 'object' || pageRaw === null || Array.isArray(pageRaw)) {
        errors.push(`${label}: pages.${pageId} 须为对象`);
        continue;
      }
      const page = /** @type {Record<string, unknown>} */ (pageRaw);
      if (typeof page.layout !== 'string' || page.layout.trim() === '') {
        errors.push(`${label}: pages.${pageId}.layout 须为非空字符串`);
      }
      if (!DENSITIES.includes(String(page.density))) {
        errors.push(`${label}: pages.${pageId}.density 须为 ${DENSITIES.join('/')}`);
      }
      if (!Array.isArray(page.regions)) {
        errors.push(`${label}: pages.${pageId}.regions 须为数组`);
        continue;
      }
      page.regions.forEach((regionRaw, i) => {
        if (typeof regionRaw !== 'object' || regionRaw === null || Array.isArray(regionRaw)) {
          errors.push(`${label}: pages.${pageId}.regions[${i}] 须为对象`);
          return;
        }
        const region = /** @type {Record<string, unknown>} */ (regionRaw);
        for (const key of Object.keys(region)) {
          if (!['region', 'module', 'variant'].includes(key)) {
            errors.push(`${label}: pages.${pageId}.regions[${i}] 非法字段 "${key}"`);
          }
        }
        if (typeof region.region !== 'string' || region.region.trim() === '') {
          errors.push(`${label}: pages.${pageId}.regions[${i}].region 须为非空字符串`);
        }
        if (typeof region.module !== 'string' || region.module.trim() === '') {
          errors.push(`${label}: pages.${pageId}.regions[${i}].module 须为非空字符串`);
        }
      });
    }
  }

  const serialized = JSON.stringify(obj);
  for (const pattern of BUSINESS_POLLUTION_PATTERNS) {
    if (pattern.test(serialized)) {
      errors.push(
        `${label}: 检出业务数据污染（命中 ${pattern.source}）——皮肤 JSON 严禁携带运行时业务数值（G3）`,
      );
    }
  }

  return errors;
}

let failed = false;
for (const id of SKIN_IDS) {
  const path = join(SKINS_DIR, `${id}.json`);
  if (!existsSync(path)) {
    console.error(`[validate-skins] 缺失 ${id}.json`);
    failed = true;
    continue;
  }
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (err) {
    console.error(`[validate-skins] ${id}.json 解析失败: ${err.message}`);
    failed = true;
    continue;
  }
  const errors = validateSkinConfig(id, raw);
  if (errors.length === 0) {
    console.log(`[validate-skins] ${id}.json 通过`);
  } else {
    failed = true;
    for (const e of errors) console.error(`[validate-skins] ${e}`);
  }
}

if (failed) {
  console.error('[validate-skins] 校验未通过，阻断构建');
  process.exit(1);
}
console.log('[validate-skins] 全部通过');
