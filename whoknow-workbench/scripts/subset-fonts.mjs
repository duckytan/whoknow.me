// 字体子集化脚本（阶段 A · T2）
//
// 输入：node_modules 中的 @fontsource / @expo-google-fonts 字体源（WOFF2 / TTF）。
// 输出：src/assets/fonts/*.woff2（按工作台实际用到的字符白名单子集化）。
//
// 子集化工具为 `subset-font`（基于 harfbuzzjs，纯 JS，零 Python 依赖）。
// 中文字体（Noto Sans SC / ZCOOL QingKe HuangYou）按从 src/ 源码与
// public/data/*.json 文案中抽取的汉字白名单子集化，避免整字库入库。
//
// 字阵容严格遵循 BRAND.md §3.1；BRAND §3.1 明令禁用的退役草书字体不在此列，
// 该禁令以 grep 校验留痕（见任务验收标准）。

import subsetFont from 'subset-font';
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── 字体源解析（从已安装的 npm 包中定位文件） ──────────────
const fontsource = (p) => require.resolve(join('@fontsource', p));
const expoZcool = require.resolve(
  '@expo-google-fonts/zcool-qingke-huangyou/400Regular/ZCOOLQingKeHuangYou_400Regular.ttf'
);

// 每个目标：family（@font-face family 名）、weight、输出文件名、源文件路径、
// wl（白名单来源：'body' = 全量文案；'title' = 仅组件标题用到的汉字）。
const TARGETS = [
  { family: 'Bungee', weight: 400, out: 'Bungee.woff2', src: fontsource('bungee/files/bungee-latin-400-normal.woff2'), wl: 'body' },
  { family: 'ZCOOL QingKe HuangYou', weight: 400, out: 'ZCOOLQingKeHuangYou.woff2', src: expoZcool, wl: 'title' },
  { family: 'Inter', weight: 400, out: 'Inter-400.woff2', src: fontsource('inter/files/inter-latin-400-normal.woff2'), wl: 'body' },
  { family: 'Inter', weight: 600, out: 'Inter-600.woff2', src: fontsource('inter/files/inter-latin-600-normal.woff2'), wl: 'body' },
  { family: 'Inter', weight: 700, out: 'Inter-700.woff2', src: fontsource('inter/files/inter-latin-700-normal.woff2'), wl: 'body' },
  { family: 'Noto Sans SC', weight: 400, out: 'NotoSansSC-400.woff2', src: fontsource('noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff2'), wl: 'body' },
  { family: 'JetBrains Mono', weight: 400, out: 'JetBrainsMono-400.woff2', src: fontsource('jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2'), wl: 'body' },
  { family: 'JetBrains Mono', weight: 600, out: 'JetBrainsMono-600.woff2', src: fontsource('jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2'), wl: 'body' },
];
// 注：Noto Sans SC 700 因 400KB 体积预算未落地（中文粗体由 400 合成），
// 若后续预算放宽可补回 noto-sans-sc-chinese-simplified-700。

// ── 白名单抽取 ─────────────────────────────────────────────
// body 白名单：扫描 src/ 全部源码 + public/data/*.json 文案 + index.html，
//   收集实际渲染用到的全部字符（拉丁 + 中文 + 标点）。
// title 白名单：仅扫描组件源码（.vue / .ts / .ts / index.html）中的汉字，
//   用于 ZCOOL 标题字体，避免把整份中文语料塞进展示字体撑大体积。
const BODY_DIRS = [join(root, 'src'), join(root, 'public', 'data')];
const BODY_FILES = [join(root, 'index.html')];
// 标题白名单仅取自组件模板（.vue）与 index.html：这些才是卡片/区块标题的实际文案。
// src/**/*.ts 中的中文多为状态名、格式标签等正文文案，归 Noto Sans SC，不进 ZCOOL。
const TITLE_DIRS = [join(root, 'src')];
const TITLE_FILES = [join(root, 'index.html')];
const TITLE_FILE_RE = /\.vue$/i;

async function walk(dir, out) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (/\.(vue|ts|js|json|css|html?)$/i.test(e.name)) out.push(full);
  }
}

// 是否汉字 / 中文标点 / 全角符号（用于 title 白名单收窄）
function isCJK(ch) {
  const c = ch.codePointAt(0);
  return (
    (c >= 0x3000 && c <= 0x303f) || // CJK 符号与标点
    (c >= 0x3400 && c <= 0x4dbf) || // 扩展 A
    (c >= 0x4e00 && c <= 0x9fff) || // 统一汉字
    (c >= 0xf900 && c <= 0xfaff) || // 兼容汉字
    (c >= 0xff00 && c <= 0xffef) || // 全角形式
    (c >= 0x20000 && c <= 0x2ebef)  // 扩展 B+（罕见）
  );
}

async function collectChars(dirs, files, filter, fileFilter) {
  const list = [];
  for (const f of files) {
    if (!fileFilter || fileFilter(f)) list.push(f);
  }
  for (const d of dirs) {
    try {
      await walk(d, list);
    } catch {
      /* 目录不存在则跳过 */
    }
  }
  if (fileFilter) {
    for (let i = list.length - 1; i >= 0; i--) {
      if (!fileFilter(list[i])) list.splice(i, 1);
    }
  }
  const chars = new Set();
  for (const f of list) {
    let text;
    try {
      text = await readFile(f, 'utf8');
    } catch {
      continue;
    }
    for (const ch of text) {
      if (!filter || filter(ch)) chars.add(ch);
    }
  }
  return [...chars].join('');
}

async function main() {
  const outDir = join(root, 'src', 'assets', 'fonts');
  await mkdir(outDir, { recursive: true });

  const bodyWl = await collectChars(BODY_DIRS, BODY_FILES, null);
  const titleWl = await collectChars(TITLE_DIRS, TITLE_FILES, isCJK, (f) => TITLE_FILE_RE.test(f));
  console.log(`[subset-fonts] body 白名单字符数：${[...bodyWl].length}`);
  console.log(`[subset-fonts] title 白名单字符数：${[...titleWl].length}`);

  const report = [];
  for (const t of TARGETS) {
    const text = t.wl === 'title' ? titleWl : bodyWl;
    const buf = await readFile(t.src);
    const subset = await subsetFont(buf, text, { targetFormat: 'woff2' });
    const dest = join(outDir, t.out);
    await writeFile(dest, subset);
    const kb = (subset.length / 1024).toFixed(1);
    console.log(`[subset-fonts] ${t.family} ${t.weight} -> ${t.out} (${subset.length} B / ${kb} KB)`);
    report.push({ family: t.family, weight: t.weight, file: t.out, bytes: subset.length });
  }

  const total = report.reduce((s, r) => s + r.bytes, 0);
  console.log(`[subset-fonts] 合计 ${total} B / ${(total / 1024).toFixed(1)} KB`);
  if (total > 400 * 1024) {
    console.error('[subset-fonts] 警告：字体合计体积超过 400KB 预算');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
