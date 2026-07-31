// fsx.ts — 存储层文件原语（ADR-001 的地基）
//
// 工程不变量（写代码时不得违反，测试逐条覆盖）：
//   I1 只增不删改：不可变记录用 'wx' 独占创建，已存在即抛 IMMUTABILITY_VIOLATION。
//   I2 原子写：派生文件（index.json 等）走 临时文件 + rename，避免半截文件。
//   I3 派生可重建：任何"写坏了也不致命"的文件必须能从不可变记录 + 事件日志重建。
//   I4 内容校验：checksum = sha256(canonicalJson(body))；写完回读校验。
//   I5 零业务语义：本文件不认识"段子/公式/新闻"，只认识"字节与路径"。

import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { immutabilityViolation, checksumMismatch } from '../errors.ts'

/** 稳定序列化：递归排序对象键、丢弃 undefined，保证 checksum 与键序无关。 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortDeep(value))
}

function sortDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortDeep)
  if (v !== null && typeof v === 'object') {
    const src = v as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(src).sort()) {
      if (src[k] === undefined) continue
      out[k] = sortDeep(src[k])
    }
    return out
  }
  return v
}

export function sha256(text: string): string {
  return 'sha256:' + createHash('sha256').update(text, 'utf8').digest('hex')
}

/** 内容校验和：对 canonical JSON 取 sha256，跨机器/跨语言可复算。 */
export function checksumOf(value: unknown): string {
  return sha256(canonicalJson(value))
}

export function verifyChecksum(value: unknown, expected: string, path?: string): void {
  const actual = checksumOf(value)
  if (actual !== expected) throw checksumMismatch(expected, actual, path)
}

async function errCode(e: unknown): Promise<string | undefined> {
  return (e as { code?: string } | undefined)?.code
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.stat(path)
    return true
  } catch {
    return false
  }
}

/** I1 + I4：独占创建不可变 JSON 文件；已存在则拒绝；写完回读比对。 */
export async function writeNewJsonExclusive(path: string, value: unknown): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true })
  const text = JSON.stringify(value, null, 2) + '\n'
  try {
    await fs.writeFile(path, text, { encoding: 'utf8', flag: 'wx' })
  } catch (e) {
    if ((await errCode(e)) === 'EEXIST') throw immutabilityViolation(path)
    throw e
  }
  const back = await fs.readFile(path, 'utf8')
  if (back !== text) throw checksumMismatch(sha256(text), sha256(back), path)
}

/** I2：派生文件原子覆盖写（临时文件 + rename）。仅用于可重建的缓存/索引。 */
export async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true })
  const tmp = join(dirname(path), `.${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`)
  const text = JSON.stringify(value, null, 2) + '\n'
  await fs.writeFile(tmp, text, 'utf8')
  await fs.rename(tmp, path)
}

export async function readJson<T>(path: string): Promise<T | null> {
  try {
    const text = await fs.readFile(path, 'utf8')
    return JSON.parse(text) as T
  } catch (e) {
    if ((await errCode(e)) === 'ENOENT') return null
    throw e
  }
}

/** 事件日志：只追加，永不改写（状态/评分变更的唯一真相来源）。 */
export async function appendJsonl(path: string, value: unknown): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true })
  await fs.writeFile(path, JSON.stringify(value) + '\n', { encoding: 'utf8', flag: 'a' })
}

export async function readJsonl<T>(path: string): Promise<T[]> {
  try {
    const text = await fs.readFile(path, 'utf8')
    return text
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((l) => JSON.parse(l) as T)
  } catch (e) {
    if ((await errCode(e)) === 'ENOENT') return []
    throw e
  }
}

export async function listDirs(path: string): Promise<string[]> {
  try {
    const items = await fs.readdir(path, { withFileTypes: true })
    return items.filter((i) => i.isDirectory()).map((i) => i.name)
  } catch (e) {
    if ((await errCode(e)) === 'ENOENT') return []
    throw e
  }
}

export async function listFiles(path: string): Promise<string[]> {
  try {
    const items = await fs.readdir(path, { withFileTypes: true })
    return items.filter((i) => i.isFile()).map((i) => i.name)
  } catch (e) {
    if ((await errCode(e)) === 'ENOENT') return []
    throw e
  }
}
