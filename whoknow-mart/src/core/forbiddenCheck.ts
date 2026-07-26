// forbiddenCheck.ts — 红线门控（M1）
// 移植自 whoknow-waimai/tests/forbiddenCheck.impl.ts（Phase 3 真闸门）。
// 纯函数，浏览器/Node 通用。应用内由组件 import 规范 taboo 清单传入。

export interface TabooList {
  version?: string
  red_light: string[]
  yellow_light: string[]
}

export interface ForbiddenHit {
  term: string
  level: 'red' | 'yellow'
  index: number
}

export interface ForbiddenResult {
  pass: boolean
  redLightCount: number
  hits: ForbiddenHit[]
}

/** 全角→半角 + 转小写（繁简需额外词表，红线词以简体/ASCII 录入）。 */
export function normalize(s: string): string {
  let out = ''
  for (const ch of s) {
    const code = ch.codePointAt(0)!
    if (code >= 0xff01 && code <= 0xff5e) out += String.fromCodePoint(code - 0xfee0)
    else if (ch === '　') out += ' '
    else out += ch
  }
  return out.toLowerCase()
}

export function runForbiddenCheck(texts: string[], taboo: TabooList): ForbiddenResult {
  const corpus = texts.map(normalize).join('\n')
  const hits: ForbiddenHit[] = []

  for (const term of taboo.red_light ?? []) {
    const nt = normalize(term)
    if (!nt) continue
    let idx = corpus.indexOf(nt)
    while (idx !== -1) {
      hits.push({ term, level: 'red', index: idx })
      idx = corpus.indexOf(nt, idx + nt.length)
    }
  }
  for (const term of taboo.yellow_light ?? []) {
    const nt = normalize(term)
    if (!nt) continue
    let idx = corpus.indexOf(nt)
    while (idx !== -1) {
      hits.push({ term, level: 'yellow', index: idx })
      idx = corpus.indexOf(nt, idx + nt.length)
    }
  }

  const red = hits.filter((h) => h.level === 'red')
  return { pass: red.length === 0, redLightCount: red.length, hits }
}
