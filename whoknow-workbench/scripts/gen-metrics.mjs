#!/usr/bin/env node
/**
 * gen-metrics.mjs · 胡闹宇宙开发工作台数据管道（SYSTEM_DESIGN.md §6）
 *
 * 职责：
 *   1. git 聚合    —— 在仓库根执行 git log，产出提交总数 / 顶层目录分布 / 作者分布 / ISO 周频
 *   2. 文档解析    —— docs/studio/{PROJECT-STATUS,STUDIO-PROGRESS,APP-MATRIX-ROADMAP}.md +
 *                     各 app docs/ 正则抽取阶段、测试数、候选矩阵、门禁
 *   3. 宪法解析    —— CONSTITUTION.md 抽取 L1 5 条 / L2 9 条 / L3 8 条标题与实证状态
 *   4. 输出        —— whoknow-workbench/public/data/metrics.json
 *
 * 运行环境：Node ESM，node >= 20。
 * 降级约定：git 命令或任一文档读取失败时进入降级分支，写入占位数据并记入 warnings，
 *           进程始终以 exit code 0 结束，不阻断构建。
 * 平台约定：路径统一按 posix 归一（Windows Git Bash 下 git 输出为正斜杠）。
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKBENCH_ROOT = path.resolve(SCRIPT_DIR, '..');
const REPO_ROOT = path.resolve(WORKBENCH_ROOT, '..');
const OUT_DIR = path.join(WORKBENCH_ROOT, 'public', 'data');
const OUT_FILE = path.join(OUT_DIR, 'metrics.json');

const SCHEMA_VERSION = '2026-09-03.001';
const COMMIT_MARK = '__WB_COMMIT__';
const PHASE_TOTAL = 7;

const STATUS_DOCS = [
  'docs/studio/PROJECT-STATUS.md',
  'docs/studio/STUDIO-PROGRESS.md',
  'docs/studio/APP-MATRIX-ROADMAP.md',
];

/** 三个已立项 app 的采集配置（顺序即展示顺序） */
const APP_DEFS = [
  // 顺序 = 工作台展示顺序（导航 / 卡片 / 质量门 / 状态灯均沿用此序）
  // 胡闹大脑为全宇宙契约中枢，置顶展示；其余保持原相对顺序。
  {
    key: 'brain',
    dir: 'whoknow-brain',
    label: '胡闹大脑',
    ownerInstance: '701-PC',
    phaseDoc: 'docs/studio/STUDIO-PROGRESS.md',
    testProbes: [],
    fallbackPhase: 2,
    fallbackTest: [0, 0],
  },
  {
    key: 'waimai',
    dir: 'whoknow-waimai',
    label: '胡闹外卖',
    ownerInstance: 'DuckyPC',
    phaseDoc: 'docs/studio/PROJECT-STATUS.md',
    testProbes: [
      { file: 'docs/studio/PROJECT-STATUS.md', re: /`npm test`\s*\*\*(\d+)\/(\d+)\*\*/ },
      { file: 'docs/studio/PROJECT-STATUS.md', re: /(\d+)\/(\d+)\s*单测绿/ },
    ],
    fallbackPhase: 7,
    fallbackTest: [45, 45],
  },
  {
    key: 'mart',
    dir: 'whoknow-mart',
    label: '胡闹导购',
    ownerInstance: '701-PC',
    phaseDoc: 'whoknow-mart/docs/gdd/PHASE5-QA.md',
    testProbes: [
      { file: 'whoknow-mart/docs/gdd/PHASE5-QA.md', re: /`npm test`\s*(\d+)\/(\d+)/ },
      { file: 'whoknow-mart/docs/gdd/PHASE4-GATE.md', re: /\*\*(\d+)\/(\d+)\s*绿\*\*/ },
    ],
    fallbackPhase: 5,
    fallbackTest: [12, 12],
  },
];

const warnings = [];

// ── 基础工具 ───────────────────────────────────────────────

/** 读取仓库内文本文件，失败返回空串并登记 warning */
function readRepoText(relPath) {
  const abs = path.join(REPO_ROOT, relPath);
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch {
    warnings.push(`文档不可读，已降级：${relPath}`);
    return '';
  }
}

function existsRepo(relPath) {
  try {
    return fs.existsSync(path.join(REPO_ROOT, relPath));
  } catch {
    return false;
  }
}

/** 统计目录下 markdown 文件数量（含一级子目录），失败返回 0 */
function countDocs(relDir) {
  const abs = path.join(REPO_ROOT, relDir);
  let total = 0;
  try {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        total += 1;
        continue;
      }
      if (entry.isDirectory()) {
        const sub = path.join(abs, entry.name);
        for (const child of fs.readdirSync(sub, { withFileTypes: true })) {
          if (child.isFile() && child.name.toLowerCase().endsWith('.md')) total += 1;
        }
      }
    }
  } catch {
    return 0;
  }
  return total;
}

function toPosix(p) {
  return p.split('\\').join('/');
}

/** ISO 周标识（形如 2026-W31），入参为 Date */
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - weekday);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function sortRecordDesc(record) {
  const out = {};
  for (const [key, value] of Object.entries(record).sort((a, b) => b[1] - a[1])) {
    out[key] = value;
  }
  return out;
}

// ── 1. git 聚合 ────────────────────────────────────────────

function runGit(args) {
  return execFileSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

/**
 * 顶层桶归类：whoknow-* 目录保留原名；docs 归 docs；根文件归 root；其余取顶层目录名。
 */
function bucketOf(filePath) {
  const posix = toPosix(filePath).replace(/^\.\//, '');
  const segments = posix.split('/').filter(Boolean);
  if (segments.length === 0) return 'root';
  if (segments.length === 1) return 'root';
  const top = segments[0];
  if (top.startsWith('whoknow-')) return top;
  return top;
}

function emptyGitAggregate() {
  return {
    commitsTotal: 0,
    commitsByDir: {},
    authorDist: {},
    commitTimeseries: [],
    branches: [],
    firstCommitAt: null,
    lastCommitAt: null,
    degraded: true,
  };
}

/** 无 git 环境时的占位聚合（数值来自 PRD §2.1 已盘点基线，标记 degraded=true） */
function fallbackGitAggregate() {
  const base = emptyGitAggregate();
  base.commitsTotal = 0;
  base.commitsByDir = {};
  base.authorDist = {};
  base.commitTimeseries = [];
  base.branches = [];
  warnings.push('git 聚合降级：git 命令不可用或仓库不可读，已写入空聚合占位');
  return base;
}

function collectGit() {
  let raw = '';
  try {
    raw = runGit([
      'log',
      '--all',
      `--pretty=format:${COMMIT_MARK}%H|%an|%ad`,
      '--date=iso-strict',
      '--name-only',
    ]);
  } catch {
    return { aggregate: fallbackGitAggregate(), perApp: {} };
  }

  const seen = new Set();
  const commitsByDir = {};
  const authorDist = {};
  const weekMap = new Map();
  const perApp = {};
  let commitsTotal = 0;
  let firstAt = null;
  let lastAt = null;

  let current = null;
  const flush = () => {
    if (!current) return;
    if (seen.has(current.hash)) {
      current = null;
      return;
    }
    seen.add(current.hash);
    commitsTotal += 1;
    authorDist[current.author] = (authorDist[current.author] ?? 0) + 1;

    const stamp = current.date;
    if (stamp) {
      if (!firstAt || stamp < firstAt) firstAt = stamp;
      if (!lastAt || stamp > lastAt) lastAt = stamp;
      const parsed = new Date(stamp);
      if (!Number.isNaN(parsed.getTime())) {
        const wk = isoWeek(parsed);
        weekMap.set(wk, (weekMap.get(wk) ?? 0) + 1);
      }
    }

    for (const bucket of current.buckets) {
      commitsByDir[bucket] = (commitsByDir[bucket] ?? 0) + 1;
      if (bucket.startsWith('whoknow-')) {
        const slot = (perApp[bucket] ??= { commits: 0, authors: {}, dirs: {} });
        slot.commits += 1;
        slot.authors[current.author] = (slot.authors[current.author] ?? 0) + 1;
        for (const inner of current.innerDirs.get(bucket) ?? []) {
          slot.dirs[inner] = (slot.dirs[inner] ?? 0) + 1;
        }
      }
    }
    current = null;
  };

  for (const line of raw.split('\n')) {
    const text = line.replace(/\r$/, '');
    if (text.startsWith(COMMIT_MARK)) {
      flush();
      const [hash, author, date] = text.slice(COMMIT_MARK.length).split('|');
      current = {
        hash: hash ?? '',
        author: (author ?? 'unknown').trim() || 'unknown',
        date: (date ?? '').trim(),
        buckets: new Set(),
        innerDirs: new Map(),
      };
      continue;
    }
    if (!text.trim() || !current) continue;
    const bucket = bucketOf(text.trim());
    current.buckets.add(bucket);
    if (bucket.startsWith('whoknow-')) {
      const segments = toPosix(text.trim()).split('/').filter(Boolean);
      const inner = segments.length > 2 ? segments[1] : 'root';
      const set = current.innerDirs.get(bucket) ?? new Set();
      set.add(inner);
      current.innerDirs.set(bucket, set);
    }
  }
  flush();

  let branches = [];
  try {
    branches = runGit(['branch', '--all', '--format=%(refname:short)'])
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);
  } catch {
    warnings.push('git 分支列举失败，branches 为空数组');
  }

  const commitTimeseries = [...weekMap.entries()]
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => (a.week < b.week ? -1 : 1));

  return {
    aggregate: {
      commitsTotal,
      commitsByDir: sortRecordDesc(commitsByDir),
      authorDist: sortRecordDesc(authorDist),
      commitTimeseries,
      branches,
      firstCommitAt: firstAt,
      lastCommitAt: lastAt,
      degraded: commitsTotal === 0,
    },
    perApp,
  };
}

// ── 2. 文档解析：阶段 / 状态 / 测试 ────────────────────────

/** 解析七阶段表：匹配形如 "| 5 制作 (M1) | ✅ 完成 | 说明 |" 的行 */
function parsePhaseTable(text) {
  const rows = [];
  const re = /^\|\s*(\d)\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*$/gm;
  let match;
  while ((match = re.exec(text)) !== null) {
    const index = Number(match[1]);
    if (index < 1 || index > PHASE_TOTAL) continue;
    const name = match[2].trim();
    const status = match[3].trim();
    const evidence = match[4].trim();
    if (!name) continue;
    if (rows.some((r) => r.index === index)) continue;
    rows.push({
      index,
      name,
      done: status.includes('✅'),
      partial: status.includes('🔶') || status.includes('⚠️'),
      statusText: status,
      evidence,
    });
  }
  return rows.sort((a, b) => a.index - b.index);
}

/** 连续完成的最大阶段号；无连续完成时取已完成阶段数 */
function phaseFromRows(rows) {
  let streak = 0;
  for (const row of rows) {
    if (row.index === streak + 1 && row.done) streak += 1;
    else break;
  }
  if (streak > 0) return streak;
  return rows.filter((r) => r.done).length;
}

function resolveTestCounts(def, docCache) {
  for (const probe of def.testProbes) {
    const text = docCache.get(probe.file) ?? readRepoText(probe.file);
    docCache.set(probe.file, text);
    if (!text) continue;
    const match = probe.re.exec(text);
    if (match) return [Number(match[1]), Number(match[2])];
  }
  if (def.testProbes.length > 0) {
    warnings.push(`${def.key} 测试计数正则未命中，回退基线 ${def.fallbackTest.join('/')}`);
  }
  return def.fallbackTest;
}

/**
 * appStatus 推断（SYSTEM_DESIGN §6.2 口径）：
 *   dist 存在 且 阶段全完成 → live
 *   src 存在 且 dist 未全量完成 → designing
 *   仅 docs → planning
 */
function resolveAppStatus(evidence, phase) {
  if (evidence.hasDist && phase >= PHASE_TOTAL) return 'live';
  if (evidence.hasSrc || evidence.hasDist) return 'designing';
  return 'planning';
}

function collectApps(gitPerApp, docCache) {
  const apps = [];
  for (const def of APP_DEFS) {
    const evidence = {
      hasSrc: existsRepo(`${def.dir}/src`),
      hasDist: existsRepo(`${def.dir}/dist`),
      hasDocs: existsRepo(`${def.dir}/docs`),
      docCount: countDocs(`${def.dir}/docs`),
    };

    const phaseText = docCache.get(def.phaseDoc) ?? readRepoText(def.phaseDoc);
    docCache.set(def.phaseDoc, phaseText);
    const phaseRows = parsePhaseTable(phaseText);
    let phase = phaseRows.length > 0 ? phaseFromRows(phaseRows) : 0;
    if (phase === 0) {
      phase = def.fallbackPhase;
      warnings.push(`${def.key} 七阶段表未解析到完成项，回退基线 phase=${phase}`);
    }
    if (def.key !== 'waimai') {
      // waimai 的七阶段表在根状态锚；mart/brain 无独立七阶段表，按各自基线校准
      phase = Math.min(phase, def.fallbackPhase);
    }

    const [testPass, testTotal] = resolveTestCounts(def, docCache);
    const gitSlot = gitPerApp[def.dir] ?? { commits: 0, authors: {}, dirs: {} };

    apps.push({
      appKey: def.key,
      appStatus: resolveAppStatus(evidence, phase),
      milestonePhase: phase,
      testPass,
      testTotal,
      buildStatus: evidence.hasDist ? 'pass' : 'unknown',
      gitCommitsTotal: gitSlot.commits,
      gitCommitsByDir: sortRecordDesc(gitSlot.dirs),
      gitAuthorDist: sortRecordDesc(gitSlot.authors),
      candidateCount: 0,
      candidateCategories: 0,
      unlockGateStatus: false,
      diskEvidence: evidence,
      progressPct: Math.round((phase / PHASE_TOTAL) * 100),
      ownerInstance: def.ownerInstance,
      commitTimeseries: [],
      ciResult: evidence.hasDist ? 'pass' : 'unknown',
      realtimeProgressPct: null,
      playtestMetrics: null,
      bizMetrics: { laughRate: null, retention: null },
      dora: { deployFreq: null, leadTime: null, mtbf: null, mttr: null },
      label: def.label,
    });
  }
  return apps;
}

// ── 3. 候选矩阵解析 ────────────────────────────────────────

const FALLBACK_CANDIDATES = [
  ['2.1', '胡闹打车', 'whoknow-ride', '出行/打车', 5, 'A'],
  ['2.2', '胡闹占卜', 'whoknow-fate', '星座/抽签', 4, 'H'],
  ['2.3', '胡闹云养宠', 'whoknow-pet', '养宠', 5, 'F'],
  ['2.4', '胡闹天气', 'whoknow-weather', '天气', 3, 'H'],
  ['2.5', '胡闹打工', 'whoknow-work', '办公/职场', 4, 'G'],
  ['2.6', '胡闹相亲', 'whoknow-love', '交友', 3, 'F'],
  ['2.7', '胡闹家政', 'whoknow-home', '上门维修/保洁', 3, 'B'],
  ['2.8', '胡闹导航', 'whoknow-nav', '地图导航', 2, 'A'],
  ['2.9', '胡闹美发', 'whoknow-salon', '美发预约', 3, 'C'],
  ['2.10', '胡闹按摩', 'whoknow-spa', '上门养生推拿', 2, 'C'],
  ['2.11', '胡闹记账', 'whoknow-ledger', '记账/资产', 3, 'E'],
  ['2.12', '胡闹搬家', 'whoknow-move', '搬家/货运', 3, 'B'],
  ['2.13', '胡闹租房', 'whoknow-rent', '租房/看房', 3, 'D'],
  ['2.14', '胡闹快递', 'whoknow-express', '物流查询', 2, 'B'],
  ['2.15', '胡闹酒吧', 'whoknow-bar', '调酒/点单（虚构）', 3, 'F'],
  ['2.16', '胡闹相机', 'whoknow-cam', '美颜相机', 2, 'C'],
];

const FALLBACK_CLUSTERS = [
  ['A', '出行 Mobility', '移动场景，共享司机/导航员 persona 池'],
  ['B', '到家服务 Home Errands', '上门/到手服务，共享服务者毒舌 tone'],
  ['C', '变美与健康 Glow & Wellness', '形象经营域，共享点评顾客话术母题'],
  ['D', '居住 Dwelling', '单一但高频痛点，待扩装修/物业补位'],
  ['E', '消费与钱包 Commerce', '花钱域，共享消费虚构 + 吐槽机制'],
  ['F', '社交与陪伴 Social', '关系域，共享虚构互动 + 情感投射'],
  ['G', '职场 Hustle', '单一，待扩面试/开会补位'],
  ['H', '玄学日常 Omen Daily', '宜忌/运势域，共享离谱卦象母题'],
];

const GATE_CONDITION =
  '金克木硬约束：waimai 真机 playtest 硬闸门 PASS + mart v1 跑通，二者全绿前禁止任一候选进入 Phase 1';

/** 解析路线图 §2.0 全量速览表（16 行） */
function parseCandidateRows(text) {
  const rows = [];
  const re =
    /^\|\s*(2\.\d{1,2})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([★☆]+)\s*\|\s*([A-H])[.\s]*([^|]*?)\s*\|/gm;
  let match;
  while ((match = re.exec(text)) !== null) {
    const nameCell = match[2].trim();
    const codeMatch = /(whoknow-[a-z0-9-]+)/.exec(nameCell);
    if (!codeMatch) continue;
    const code = codeMatch[1];
    const name = nameCell.replace(code, '').trim();
    rows.push({
      section: match[1],
      name,
      code,
      shell: match[3].trim(),
      reuseLevel: (match[4].match(/★/g) ?? []).length,
      categoryId: match[5],
    });
  }
  return rows;
}

/** 解析路线图 §3 聚类地图表（8 行） */
function parseClusterRows(text) {
  const rows = [];
  const re = /^\|\s*\*\*([A-H])\.\s*([^*|]+?)\*\*\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm;
  let match;
  while ((match = re.exec(text)) !== null) {
    rows.push({
      id: match[1],
      name: match[2].trim(),
      membersText: match[3].trim(),
      unlockLogic: match[4].trim(),
    });
  }
  return rows;
}

/** 解析路线图 §4 优先级路线图表，得到 app 名 → 档位（M2/M3/M4） */
function parseTierMap(text) {
  const map = new Map();
  const re = /^\|\s*\*\*(M\d)[^*]*\*\*\s*\|\s*([^|]+?)\s*\|/gm;
  let match;
  while ((match = re.exec(text)) !== null) {
    map.set(match[1], match[2]);
  }
  return map;
}

function resolveTier(tierMap, candidateName) {
  for (const [tier, listText] of tierMap.entries()) {
    if (listText.includes(candidateName)) return tier;
  }
  return 'M4';
}

function collectCandidates(roadmapText) {
  let candidateRows = parseCandidateRows(roadmapText);
  if (candidateRows.length === 0) {
    warnings.push('候选速览表未解析到行，回退 APP-MATRIX-ROADMAP §2.0 基线 16 款');
    candidateRows = FALLBACK_CANDIDATES.map(([section, name, code, shell, reuseLevel, categoryId]) => ({
      section,
      name,
      code,
      shell,
      reuseLevel,
      categoryId,
    }));
  }

  let clusterRows = parseClusterRows(roadmapText);
  if (clusterRows.length === 0) {
    warnings.push('聚类地图表未解析到行，回退 APP-MATRIX-ROADMAP §3 基线 8 大类');
    clusterRows = FALLBACK_CLUSTERS.map(([id, name, unlockLogic]) => ({
      id,
      name,
      membersText: '',
      unlockLogic,
    }));
  }

  const tierMap = parseTierMap(roadmapText);
  // 门禁判定：路线图 §0 明示金克木硬约束冻结；仅当冻结表述消失且出现解锁结论才置 true。
  const frozen = /金克木/.test(roadmapText) || /冻结/.test(roadmapText);
  const unlocked = /解锁门禁\s*已\s*PASS/.test(roadmapText);
  const gateOpen = unlocked && !frozen;
  if (!frozen && !unlocked) {
    warnings.push('路线图未检出金克木冻结表述且无解锁结论，门禁按未解锁保守处理');
  }

  const categories = clusterRows.map((cluster) => ({
    id: cluster.id,
    name: `${cluster.id} ${cluster.name}`,
    members: candidateRows
      .filter((row) => row.categoryId === cluster.id)
      .map((row) => ({
        code: row.code,
        name: row.name,
        reuseLevel: row.reuseLevel,
        categoryId: row.categoryId,
        shell: row.shell,
        unlockTier: resolveTier(tierMap, row.name),
        section: row.section,
      })),
    unlockGate: {
      status: gateOpen,
      condition: cluster.unlockLogic ? `${cluster.unlockLogic}｜${GATE_CONDITION}` : GATE_CONDITION,
    },
  }));

  return {
    total: candidateRows.length,
    categoryCount: categories.length,
    categories,
    unlockGateStatus: gateOpen,
  };
}

// ── 4. 宪法解析（L1 / L2 / L3）─────────────────────────────

function iconToStatus(text) {
  if (text.includes('✅')) return 'on';
  if (text.includes('🔶') || text.includes('⚠️') || text.includes('部分')) return 'partial';
  if (text.includes('❌') || text.includes('🔴')) return 'off';
  return 'partial';
}

function parseConstitution(text) {
  const l1 = [];
  const l2 = [];
  const l3 = [];

  const headingRe = /^###\s+(L1-T\d|L3-D\d)[\s\u3000]+(.+?)\s*$/gm;
  const blocks = [];
  let match;
  while ((match = headingRe.exec(text)) !== null) {
    blocks.push({ id: match[1], title: match[2].trim(), from: match.index });
  }
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const end = i + 1 < blocks.length ? blocks[i + 1].from : text.length;
    const body = text.slice(block.from, end);
    const proof = /\*\*实证状态\*\*：\s*(.+)/.exec(body);
    const evidence = proof ? proof[1].trim() : '';
    if (block.id.startsWith('L1-')) {
      l1.push({
        id: block.id,
        title: block.title.replace(/\s+/g, ' '),
        status: evidence ? iconToStatus(evidence) : 'partial',
        evidence: evidence || '出处见 CONSTITUTION.md 对应小节',
      });
    } else {
      l3.push({
        id: block.id,
        title: block.title.replace(/[⚠️🔴]/g, '').replace(/\s+/g, ' ').trim(),
        status: 'on',
      });
    }
  }

  const l2Re = /^\|\s*(L2-C\d)\s*\|\s*([^|]+?)\s*\|[^|]*\|[^|]*\|\s*([^|]+?)\s*\|/gm;
  while ((match = l2Re.exec(text)) !== null) {
    l2.push({
      id: match[1],
      title: match[2].replace(/[⛔🔴]/g, '').trim(),
      status: iconToStatus(match[3]),
    });
  }

  if (l1.length === 0) {
    warnings.push('CONSTITUTION.md L1 小节未解析到，回退附录 B 基线 5 条');
    const fallback = [
      ['L1-T1', '禁忌词红线 0 容忍'],
      ['L1-T2', '配置与状态分离（玩家隐私底线）'],
      ['L1-T3', '不害人 · 不违法 · 不互相踩 · 人格统一'],
      ['L1-T4', '字段命名权威（跨 app 数据正确性底线）'],
      ['L1-T5', '多 App 共存红线（部署安全底线，违反即事故）'],
    ];
    for (const [id, title] of fallback) {
      l1.push({ id, title, status: 'partial', evidence: '文档解析降级，状态以 manual.json 为准' });
    }
  }

  return { l1, l2, l3 };
}

// ── 5. 里程碑甘特（waimai 七阶段）─────────────────────────

/** 七阶段起止日期锚：依据 PROJECT-STATUS 变更记录（2026-07-24 起，每阶段按记录日聚合） */
const PHASE_DATE_ANCHORS = [
  ['2026-07-24', '2026-07-25'],
  ['2026-07-25', '2026-07-25'],
  ['2026-07-25', '2026-07-25'],
  ['2026-07-25', '2026-07-25'],
  ['2026-07-25', '2026-07-26'],
  ['2026-07-26', '2026-07-28'],
  ['2026-07-28', '2026-08-31'],
];

function buildMilestoneGantt(phaseRows, waimaiStatus) {
  const rows = phaseRows.length > 0 ? phaseRows : [];
  if (rows.length === 0) {
    warnings.push('里程碑甘特降级：七阶段表为空，输出空数组');
    return [];
  }
  return rows.map((row) => {
    const anchor = PHASE_DATE_ANCHORS[row.index - 1] ?? ['2026-07-24', '2026-08-31'];
    return {
      phase: `${row.index} ${row.name}`,
      start: anchor[0],
      end: anchor[1],
      status: row.done ? waimaiStatus : row.partial ? 'designing' : 'planning',
      done: row.done,
      evidence: row.evidence.slice(0, 180),
    };
  });
}

// ── 6. 主流程 ──────────────────────────────────────────────

function main() {
  const docCache = new Map();
  for (const doc of STATUS_DOCS) docCache.set(doc, readRepoText(doc));

  const git = collectGit();
  const apps = collectApps(git.perApp, docCache);
  const roadmapText = docCache.get('docs/studio/APP-MATRIX-ROADMAP.md') ?? '';
  const candidates = collectCandidates(roadmapText);
  const constitution = parseConstitution(readRepoText('CONSTITUTION.md'));

  // 候选数与门禁回填进每个 app 的 A 类字段
  for (const app of apps) {
    app.candidateCount = candidates.total;
    app.candidateCategories = candidates.categoryCount;
    app.unlockGateStatus = candidates.unlockGateStatus;
    app.commitTimeseries = git.aggregate.commitTimeseries;
  }

  const waimai = apps.find((a) => a.appKey === 'waimai');
  const waimaiPhaseRows = parsePhaseTable(docCache.get('docs/studio/PROJECT-STATUS.md') ?? '');
  const milestoneGantt = buildMilestoneGantt(waimaiPhaseRows, waimai ? waimai.appStatus : 'planning');

  const overallProgressPct =
    apps.length > 0
      ? Math.round((apps.reduce((sum, a) => sum + a.milestonePhase, 0) / (PHASE_TOTAL * apps.length)) * 100)
      : 0;

  const qualityGate = apps.map((app) => ({
    app: app.appKey,
    pass: app.testPass,
    total: app.testTotal,
    verdict:
      app.testTotal === 0
        ? '无自动化测试（仅文档契约）'
        : app.testPass === app.testTotal
          ? '全绿'
          : '存在未通过用例',
    buildStatus: app.buildStatus,
  }));

  const riskBoard = constitution.l1.map((law) => ({
    id: law.id,
    title: law.title,
    status: law.status,
    evidence: law.evidence,
  }));

  const bundle = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      gitRepo: 'whoknow.me',
      statusDocs: STATUS_DOCS,
    },
    universe: {
      overallProgressPct,
      appStatusLights: apps,
      milestoneGantt,
      candidateMatrix: candidates.categories,
      riskBoard,
      qualityGate,
      git: git.aggregate,
    },
    apps,
    candidates: { total: candidates.total, categories: candidates.categories },
    governance: {
      l1: constitution.l1.map((law) => ({ id: law.id, title: law.title, status: law.status })),
      l2: constitution.l2,
      l3: constitution.l3,
      redLights: riskBoard,
      gate: {
        status: candidates.unlockGateStatus,
        condition: GATE_CONDITION,
        prerequisites: ['waimai 真机 playtest 硬闸门 PASS', 'mart v1 跑通验证'],
        frozenBy: '总纲 §2 金克木·克制扩张 + 三司会审 2026-07-28 裁定',
      },
    },
    warnings,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');

  const rel = toPosix(path.relative(REPO_ROOT, OUT_FILE));
  process.stdout.write(`[gen-metrics] 输出 ${rel}\n`);
  process.stdout.write(
    `[gen-metrics] 提交总数 ${git.aggregate.commitsTotal}｜作者 ${Object.keys(git.aggregate.authorDist).length}｜周期桶 ${git.aggregate.commitTimeseries.length}\n`,
  );
  process.stdout.write(
    `[gen-metrics] app ${apps.length}｜候选 ${candidates.total}/${candidates.categoryCount} 类｜整体进度 ${overallProgressPct}%\n`,
  );
  process.stdout.write(
    `[gen-metrics] 宪法 L1 ${constitution.l1.length} / L2 ${constitution.l2.length} / L3 ${constitution.l3.length}\n`,
  );
  if (warnings.length > 0) {
    process.stdout.write(`[gen-metrics] 降级告警 ${warnings.length} 条：\n`);
    for (const w of warnings) process.stdout.write(`  - ${w}\n`);
  } else {
    process.stdout.write('[gen-metrics] 无降级告警\n');
  }
}

try {
  main();
} catch (error) {
  // 顶层兜底：任何未预期异常均降级为占位文件，保证构建链不中断
  const message = error instanceof Error ? error.message : String(error);
  warnings.push(`顶层异常降级：${message}`);
  const placeholder = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: { gitRepo: 'whoknow.me', statusDocs: STATUS_DOCS },
    universe: {
      overallProgressPct: 0,
      appStatusLights: [],
      milestoneGantt: [],
      candidateMatrix: [],
      riskBoard: [],
      qualityGate: [],
      git: emptyGitAggregate(),
    },
    apps: [],
    candidates: { total: 0, categories: [] },
    governance: { l1: [], l2: [], l3: [], redLights: [] },
    warnings,
  };
  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, `${JSON.stringify(placeholder, null, 2)}\n`, 'utf8');
  } catch {
    process.stdout.write('[gen-metrics] 占位文件写入亦失败，输出目录不可写\n');
  }
  process.stdout.write(`[gen-metrics] 降级完成（${message}）\n`);
}
