/**
 * forbiddenCheck.impl.ts — 红线闸门纯函数实现（单一实现真源）
 * --------------------------------------------------------------------------
 * 被 forbiddenCheck.test.ts（Q1 逻辑单测）与 config-contract.test.ts（Q2 契约）
 * 共同 import，保证「实现」也只有一份。
 *
 * 红线判定原则（docs/禁忌词清单-v1.0.md + api-spec.md §forbidden_check）：
 *   - 红线 0 容忍：用户可见内容含任一 red_light token → passed === false。
 *   - 黄灯仅做关键词过滤统计（yellow_light_count），不阻断发布。
 *   - 本项目虚构词（odd_eats / 暗黑料理 / 胡闹外卖 / whoknow / 锡哥 / 戏精 / 锡哥精选）
 *     绝不能进 red_light，否则会误伤已洗稿合规 seed，导致红线门控自爆。
 *
 * 已知匹配局限（已在用例中标注，供后续优化）：
 *   1) 子串过匹配：短词“医院”会命中“植物医院”等良性连续串 → 误伤。
 *      建议：清单优先用更精确短语 / 匹配时加 CJK 词边界判断。
 *   2) 数字短码泛匹配：“1288”会命中任何 1288（含 ¥1288 正常价格）→ 误伤。
 *      建议：账号类 token 加前后缀上下文（如“尾号 1288”）。
 *   3) 繁→简 / 全半角归一：本实现用最小化映射表覆盖已知 token，
 *      生产环境应替换为完整 t2s 字典（如 opencc）以保证召回。
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// 最小化「繁 → 简」映射表：仅覆盖红线 token / 已知测试所需字符。
// 生产环境应替换为完整 t2s 字典（opencc 等），本表只用于验证逻辑。
const TRAD_TO_SIMP: Record<string, string> = {
  醫: '医', 術: '术', 車: '车', 會: '会', 國: '国', 張: '张',
  門: '门', 電: '电', 腦: '脑', 愛: '爱', 點: '点', 辦: '办',
  來: '来', 時: '时', 實: '实', 師: '师', 麼: '么', 號: '号',
  單: '单', 銀: '银', 層: '层', 員: '员', 報: '报', 關: '关',
};

/** 归一化：繁→简 + 全角→半角 + 小写；同时记录归一后每个字符对应的原文索引。 */
function normalizeTracked(input: string): { norm: string; origIdx: number[] } {
  let norm = '';
  const origIdx: number[] = [];
  for (let i = 0; i < input.length; i++) {
    let ch = TRAD_TO_SIMP[input[i]] ?? input[i];
    const cp = ch.codePointAt(0)!;
    if (cp >= 0xff01 && cp <= 0xff5e) {
      // 全角 ASCII 变体 → 半角
      ch = String.fromCodePoint(cp - 0xfee0);
    } else if (cp === 0x3000) {
      ch = ' ';
    }
    norm += ch.toLowerCase();
    origIdx.push(i);
  }
  return { norm, origIdx };
}

/** 仅归一化 token（无需索引追踪）。 */
function normalizeToken(t: string): string {
  return normalizeTracked(t).norm;
}

export interface ForbiddenList {
  red_light: string[];
  yellow_light: string[];
}

export interface ForbiddenHit {
  token: string;
  index: number; // 命中处在【原文】中的索引
}

export interface ForbiddenResult {
  passed: boolean;
  redLightCount: number;   // 命中 red_light 的 occurrences 数（同一 token 可多次计入）
  yellowLightCount: number; // 命中的 yellow_light token 种类数
  hits: ForbiddenHit[];
}

/**
 * 红线闸门核心判定（纯函数）。
 * 归一化后做子串匹配：大小写不敏感、全半角归一、繁简归一。
 */
export function runForbiddenCheck(
  content: string,
  list: ForbiddenList,
): ForbiddenResult {
  const { norm, origIdx } = normalizeTracked(content);
  const hits: ForbiddenHit[] = [];
  const seen = new Set<string>();

  for (const rawToken of list.red_light) {
    const nt = normalizeToken(rawToken);
    if (!nt) continue;
    let from = 0;
    let idx: number;
    while ((idx = norm.indexOf(nt, from)) !== -1) {
      const key = `${rawToken}@${idx}`;
      if (!seen.has(key)) {
        seen.add(key);
        hits.push({ token: rawToken, index: origIdx[idx] });
      }
      from = idx + nt.length;
    }
  }

  let yellowLightCount = 0;
  for (const rawToken of list.yellow_light) {
    const nt = normalizeToken(rawToken);
    if (nt && norm.includes(nt)) yellowLightCount++;
  }

  return {
    passed: hits.length === 0,
    redLightCount: hits.length,
    yellowLightCount,
    hits,
  };
}

/** 加载“单一真源”红线清单（默认从本 impl 同目录的 taboo-list.json 读取）。 */
export function loadTaboo(
  fromPath?: string,
): { version: string; red_light: string[]; yellow_light: string[] } {
  const base = dirname(fileURLToPath(import.meta.url));
  const p = fromPath ?? join(base, 'taboo-list.json');
  return JSON.parse(readFileSync(p, 'utf-8'));
}
