/**
 * scan-product-surface.ts — forbidden_check CI 闸门（产品面扫描）
 * --------------------------------------------------------------------------
 * 仅扫描「用户可见产品面」= `prototype/`（最终发布到 Vercel 的高保真原型）。
 * 这是发布红线 0 容忍的唯一硬闸门范围。
 *
 * 明确排除（非用户可见 / 设计 meta / 黄灯，按计划不动）：
 *   - `whoknow-waimai/docs/specs/`（设计蓝图；其 DRAMA-ENGINE-V2.md:157
 *     含「禁用声明」meta 引用红线词，属声明性文本，非上线内容）
 *   - `BRAND.md` / `GDD` / `docs/analysis/` / `whoknow-brain/docs/` / `.workbuddy/`
 *   - `archive/`（已归档 v1 旧活数据，单独 P1 清洗项）
 *
 * 退出码：redLightCount === 0 → 0（CI 通过）；> 0 → 1（CI 失败，阻断发布）。
 *
 * 运行（Node 22.6+ 自带 TS 剥离）：
 *   node --experimental-strip-types whoknow-waimai/tests/scan-product-surface.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runForbiddenCheck, loadTaboo } from './forbiddenCheck.impl.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..'); // whoknow.me/
const SURFACE = join(ROOT, 'prototype');

const SKIP_DIRS = new Set(['node_modules', '.git', 'archive', 'analysis', '.workbuddy', 'docs']);
const TEXT_EXT = new Set(['.html', '.css', '.js', '.ts', '.json', '.md', '.svg', '.vue']);

function collect(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(e)) continue;
      collect(p, out);
    } else if (TEXT_EXT.has(p.slice(p.lastIndexOf('.')))) {
      out.push(p);
    }
  }
}

const taboo = loadTaboo();
const files: string[] = [];
collect(SURFACE, files);

let total = 0;
const hits: { file: string; token: string; index: number }[] = [];
for (const f of files) {
  const content = readFileSync(f, 'utf-8');
  const r = runForbiddenCheck(content, taboo);
  if (!r.passed) {
    total += r.redLightCount;
    for (const h of r.hits) {
      hits.push({ file: f, token: h.token, index: h.index });
    }
  }
}

const rel = (f: string) => f.replace(ROOT + '/', '');
console.log(`\n[forbidden_check] 产品面扫描范围：prototype/（${files.length} 个文件）`);
if (hits.length === 0) {
  console.log(`[forbidden_check] ✅ PASS · red_light_count = 0`);
  process.exit(0);
} else {
  console.log(`[forbidden_check] ❌ FAIL · red_light_count = ${total}`);
  for (const h of hits.slice(0, 50)) {
    console.log(`   ${rel(h.file)}:${h.index}  «${h.token}»`);
  }
  process.exit(1);
}
