// tmpdir.ts — 测试用临时目录（非测试文件，不被 node --test 收集）
// 所有存储层测试必须在独立临时目录内跑，禁止污染 data/。

import { promises as fs } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export async function makeTempRoot(prefix = 'brain-test-'): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix))
}

export async function cleanup(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true })
}

/** 用完即删的作用域包裹，避免测试失败时残留目录。 */
export async function withTempRoot<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await makeTempRoot()
  try {
    return await fn(root)
  } finally {
    await cleanup(root)
  }
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.stat(path)
    return true
  } catch {
    return false
  }
}
