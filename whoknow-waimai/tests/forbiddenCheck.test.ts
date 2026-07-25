/**
 * forbiddenCheck.test.ts — 红线闸门单元测试（P0-C · Q1）
 * --------------------------------------------------------------------------
 * 纯字符串单元测试，不依赖任何应用代码 / 不引入额外测试框架。
 * 运行方式（Node 22.6+ 自带 TS 剥离，无需 jest/vitest/tsx）：
 *     node --test --experimental-strip-types tests/forbiddenCheck.test.ts
 * 或（仓库若后续有 test 脚本）：
 *     npm test
 *
 * 本文件同时提供 `runForbiddenCheck` 参考实现（纯函数、零依赖），
 * engineering 可直接复制到客户端闸门逻辑中，保证「单一真源」一致。
 *
 * 红线判定原则（来自 docs/禁忌词清单-v1.0.md + api-spec.md §forbidden_check）：
 *   - 红线 0 容忍：用户可见内容含任一 red_light token → passed === false。
 *   - 黄灯仅做关键词过滤统计（yellow_light_count），不阻断发布。
 *   - 本项目虚构词（odd_eats / 暗黑料理 / 胡闹外卖 / whoknow / 锡哥 / 戏精 / 锡哥精选）
 *     绝不能进 red_light，否则会误伤已洗稿合规 seed，导致红线门控自爆。
 *
 * 已知匹配局限（已在用例中以“风险演示”标注，供后续优化参考）：
 *   1) 子串过匹配：清单仅列短词“医院”时，含连续“医院”的良性词（如“植物医院”
 *      “人民医院”）也会被命中 → 误伤。注：“医学院”（医-学-院）并不含连续“医院”，
 *      故不会被误伤，本实现已正确跳过；但“植物医院”这类会。
 *      建议：清单优先用更精确的多字短语；或匹配时加 CJK 词边界判断。
 *   2) 数字短码泛匹配：“1288”会命中任何出现 1288 的文本（含 ¥1288 正常价格）
 *      → 误伤。建议：银行账号类 token 加前后缀上下文（如“尾号 1288”）。
 *   3) 繁→简 / 全半角归一：本实现用最小化映射表覆盖已知 token，
 *      生产环境应替换为完整 t2s 字典（如 opencc）以保证召回。
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/* ========================================================================
 * 0. 加载「单一真源」红线清单（engineering 同样 import 此文件）
 * ====================================================================== */
const __dirname = dirname(fileURLToPath(import.meta.url));
const TABOO_PATH = join(__dirname, 'taboo-list.json');
const taboo = JSON.parse(readFileSync(TABOO_PATH, 'utf-8')) as {
  version: string;
  red_light: string[];
  yellow_light: string[];
};

/* ========================================================================
 * 1. 参考实现：runForbiddenCheck（纯函数，可复制到客户端闸门）
 * ====================================================================== */

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

/* ========================================================================
 * 2. 测试
 * ====================================================================== */

/* ---- 2.0 清单自身契约（确保单一真源有效、且未误伤合规词）---- */
test('taboo-list.json 结构有效且版本为 1.0', () => {
  assert.equal(taboo.version, '1.0');
  assert.ok(Array.isArray(taboo.red_light) && taboo.red_light.length > 0);
  assert.ok(Array.isArray(taboo.yellow_light) && taboo.yellow_light.length > 0);
});

test('red_light 绝不能包含本项目虚构合规词（否则门控自爆）', () => {
  const fictional = [
    'odd_eats', '暗黑料理', '黑暗料理', '胡闹外卖', 'whoknow',
    '锡哥', '戏精', '锡哥精选',
  ];
  for (const f of fictional) {
    assert.ok(
      !taboo.red_light.includes(f),
      `合规虚构词 "${f}" 不应出现在 red_light`,
    );
  }
});

/* ---- 2.1 已知坏串：必须 passed === false 且 hits 含正确 token ---- */
test('已知坏串·中文真实机构/医疗', () => {
  const r = runForbiddenCheck('他昨天进医院了', taboo);
  assert.equal(r.passed, false);
  assert.ok(r.hits.some((h) => h.token === '医院'), '应命中 "医院"');
});

test('已知坏串·真实品牌（子串 + 精确短语）', () => {
  const r = runForbiddenCheck('真实美团外卖送餐慢', taboo);
  assert.equal(r.passed, false);
  assert.ok(r.hits.some((h) => h.token === '美团'), '应命中 "美团"');
  assert.ok(r.hits.some((h) => h.token === '真实美团'), '应命中 "真实美团"');
});

test('已知坏串·银行账号短码', () => {
  const r = runForbiddenCheck('尾号 1288 的卡', taboo);
  assert.equal(r.passed, false);
  assert.ok(r.hits.some((h) => h.token === '1288'), '应命中 "1288"');
});

test('已知坏串·真实银行机构', () => {
  const r = runForbiddenCheck('请转到中国工商银行收款', taboo);
  assert.equal(r.passed, false);
  assert.ok(r.hits.some((h) => h.token === '中国工商银行'), '应命中 "中国工商银行"');
});

test('已知坏串·英文医疗/暴力 token', () => {
  const r = runForbiddenCheck('the patient was sent to icu', taboo);
  assert.equal(r.passed, false);
  assert.ok(r.hits.some((h) => h.token === 'icu'), '应命中 "icu"');
});

test('已知坏串·暴力/灵异（投毒、诈尸、上吊、炸弹）', () => {
  for (const [text, token] of [
    ['他威胁要投毒', '投毒'],
    ['半夜诈尸了', '诈尸'],
    ['剧情里有人上吊', '上吊'],
    ['包里发现一个 bomb', 'bomb'],
    ['楼梯间有炸弹', '炸弹'],
  ] as const) {
    const r = runForbiddenCheck(text, taboo);
    assert.equal(r.passed, false, `文本 "${text}" 应被拦截`);
    assert.ok(r.hits.some((h) => h.token === token), `应命中 "${token}"`);
  }
});

test('已知坏串·政治敏感（警察/公安）', () => {
  const r = runForbiddenCheck('假冒公安来查水表', taboo);
  assert.equal(r.passed, false);
  assert.ok(r.hits.some((h) => h.token === '公安'), '应命中 "公安"');
  assert.ok(r.hits.some((h) => h.token === '警察') === false, '本句不含警察');
});

/* ---- 2.2 已知好串：合规虚构词必须 passed === true ---- */
test('已知好串·odd_eats / 暗黑料理', () => {
  const r = runForbiddenCheck('你点了 odd_eats 黑暗料理', taboo);
  assert.equal(r.passed, true);
  assert.equal(r.redLightCount, 0);
});

test('已知好串·胡闹外卖 / whoknow', () => {
  const r = runForbiddenCheck('欢迎来到胡闹外卖 whoknow 世界', taboo);
  assert.equal(r.passed, true);
});

test('已知好串·锡哥精选 / 戏精', () => {
  const r = runForbiddenCheck('锡哥精选好店，戏精附体', taboo);
  assert.equal(r.passed, true);
});

/* ---- 2.3 边界：大小写 / 全半角 / 繁简 归一后命中 ---- */
test('边界·大小写不敏感（MEITUAN → meituan）', () => {
  const r = runForbiddenCheck('MeiTuan 广告', taboo);
  assert.equal(r.passed, false);
  assert.ok(r.hits.some((h) => h.token === 'meituan'), '应命中 "meituan"');
});

test('边界·全角拉丁归一（ＭＥＩＴＵＡＮ → meituan）', () => {
  const r = runForbiddenCheck('全角ＭＥＩＴＵＡＮ测试', taboo);
  assert.equal(r.passed, false);
  assert.ok(r.hits.some((h) => h.token === 'meituan'), '应命中 "meituan"');
});

test('边界·繁体中文归一（醫院 → 医院）', () => {
  const r = runForbiddenCheck('他去醫院看病', taboo);
  assert.equal(r.passed, false);
  assert.ok(r.hits.some((h) => h.token === '医院'), '应命中 "医院"');
  const hit = r.hits.find((h) => h.token === '医院')!;
  assert.equal(hit.index, 2, '原文索引应指向“醫”所在位置');
});

/* ---- 2.4 黄灯：统计但不阻断 ---- */
test('黄灯·只含黄灯词时 passed 仍为 true，但 yellowLightCount > 0', () => {
  const r = runForbiddenCheck('宝贝亲，吃饭了吗', taboo);
  assert.equal(r.passed, true, '黄灯不阻断发布');
  assert.ok(r.yellowLightCount > 0, '应统计到黄灯命中');
});

/* ---- 2.5 风险演示（已知局限，供后续优化，不计入失败）---- */
test('风险演示·子串过匹配：植物医院 会误伤 医院（标注局限）', () => {
  // 局限 1：清单仅列短词“医院”，导致含连续“医院”的良性词“植物医院”被命中。
  // （“医学院”=医-学-院 不连续，不会被误伤，本实现已正确跳过。）
  // 优化方向：清单用更精确短语 / 匹配时加 CJK 词边界判断。
  const r = runForbiddenCheck('小区门口开了家植物医院', taboo);
  assert.equal(r.passed, false, '当前实现会误伤——这是已知的子串过匹配局限');
  assert.ok(r.hits.some((h) => h.token === '医院'));
});

test('风险演示·短码泛匹配：¥1288 正常价格 会误伤 1288（标注局限）', () => {
  // 局限 2：银行账号短码“1288”会命中任何 1288 文本。
  // 优化方向：账号类 token 加前后缀上下文（如“尾号 1288”）。
  const r = runForbiddenCheck('今日套餐仅 ¥1288', taboo);
  assert.equal(r.passed, false, '当前实现会误伤——这是已知的短码泛匹配局限');
  assert.ok(r.hits.some((h) => h.token === '1288'));
});
