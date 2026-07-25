// 真机 playtest 评分表聚合器
// 用法: node --experimental-strip-types scripts/playtest-aggregate.ts [path/to/scorecard.csv]
// 输出 H1(笑率/疲劳) / H2(同店递进) / H3(成就覆盖) / H4(无障碍由 tester 勾选) 的判定
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = join(fileURLToPath(import.meta.url), '..', '..')
const csvPath = process.argv[2] || join(here, 'docs/playtest/scorecard.csv')
const seedPath = join(here, 'docs/specs/DRAMA-SEED-v1-2026-07-24.json')

// ---- 最小 RFC4180 CSV 解析（支持双引号转义与引号内逗号）----
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false
      } else field += c
    } else {
      if (c === '"') inQ = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else if (c === '\r') { /* skip */ }
      else field += c
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

const text = readFileSync(csvPath, 'utf8')
const rows = parseCSV(text).filter((r) => r.length >= 8 && r[0] !== 'tester_id')
if (rows.length === 0) {
  console.error('没有有效数据行（请先删除示例行并填写）。')
  process.exit(1)
}

// 期望分支清单（从 SEED 读取，避免硬编码漂移）
const seed = JSON.parse(readFileSync(seedPath, 'utf8'))
const expectedBranches = new Set(seed.map((b: any) => b.id))

const scores: number[] = []
let repeatCount = 0
const seenBranches = new Set<string>()
let total = 0
// 场景 A 连相同检测：同一 session 内连续 >=3 相同 branch
const sessionSeq = new Map<string, string[]>()
let maxStreak = 0

for (const r of rows) {
  const tester = r[0], sid = r[1], branch = r[4]
  const funny = Number(r[5]), repeat = Number(r[6])
  total++
  if (!Number.isNaN(funny)) scores.push(funny)
  if (repeat === 1) repeatCount++
  if (branch) seenBranches.add(branch)
  const key = `${tester}|${sid}`
  const arr = sessionSeq.get(key) || []
  arr.push(branch)
  sessionSeq.set(key, arr)
}

// 连相同计算（每 session 内相邻同 branch 的连续段最大长度）
for (const arr of sessionSeq.values()) {
  let streak = 1
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] && arr[i] === arr[i - 1]) { streak++; maxStreak = Math.max(maxStreak, streak) }
    else streak = 1
  }
}

const median = (a: number[]) => {
  if (!a.length) return 0
  const s = [...a].sort((x, y) => x - y)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const medianScore = median(scores)
const geq4 = scores.filter((s) => s >= 4).length
const pctGeq4 = scores.length ? (geq4 / scores.length) * 100 : 0
const pctRepeat = total ? (repeatCount / total) * 100 : 0

// H2：同店递进分支是否出现
const h2Regular = seenBranches.has('regular_3rd')
const h2Vip = seenBranches.has('vip_5th')

// H3：成就覆盖（以分支是否出现近似；完整解锁以成就墙为准）
const covered = [...seenBranches].filter((b) => expectedBranches.has(b)).length
const h3pct = (covered / expectedBranches.size) * 100

const L: string[] = []
L.push('# 真机 Playtest 汇总报告')
L.push('')
L.push(`- 数据行数：**${total}**　tester 会话数：${sessionSeq.size}`)
L.push('')
L.push('## H1 笑率（好笑与否）')
L.push(`- 中位 funny_score：**${medianScore}**　（闸门口径 ≥3.5）`)
L.push(`- ≥4 分订单占比：**${pctGeq4.toFixed(1)}%**　（闸门口径 ≥60%）`)
L.push(`- 判定：**${medianScore >= 3.5 && pctGeq4 >= 60 ? 'PASS ✅' : 'CONCERNS ⚠️'}**`)
L.push('')
L.push('## H1 重复疲劳')
L.push(`- 「又是这套」占比：**${pctRepeat.toFixed(1)}%**　（建议 <30%）`)
L.push(`- 单会话内最长连续相同分支：**${maxStreak}**　（≥3 即 FAIL）`)
L.push(`- 判定：**${pctRepeat < 30 && maxStreak < 3 ? 'PASS ✅' : 'CONCERNS ⚠️'}**`)
L.push('')
L.push('## H2 同店递进差异')
L.push(`- 第3单 regular_3rd 命中：**${h2Regular ? '是 ✅' : '否 ❌'}**`)
L.push(`- 第5单 vip_5th 命中：**${h2Vip ? '是 ✅' : '否 ❌'}**`)
L.push(`- 判定：**${h2Regular && h2Vip ? 'PASS ✅' : 'CONCERNS ⚠️'}**（需人工核对台词明显不同）`)
L.push('')
L.push('## H3 分支/成就覆盖')
L.push(`- 评分表中出现且属 SEED 的分支：**${covered}/${expectedBranches.size}** (${h3pct.toFixed(0)}%)`)
L.push(`- 判定：**${covered === expectedBranches.size ? 'PASS ✅' : 'CONCERNS ⚠️'}**（成就墙 12/12 解锁以人工核对为准）`)
L.push('')
L.push('## H4 无障碍')
L.push('- 由 tester 按 RUNBOOK 场景 D 人工核对（键盘焦点环 / reduced-motion / 热区 44px / 字号），不在本自动汇总范围。')
L.push('')
console.log(L.join('\n'))
