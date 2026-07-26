// localStore.ts — 浏览器 localStorage 后端（PWA 单机持久化）
//
// 实现 memory.ts 的 KVStore 接口，供 MemoryEngine 注入。
// 与 MemStore（测试用内存）同为 KVStore 实现，核心 memory.ts 测试不受影响。

import type { KVStore } from './memory.ts'

export class BrowserKVStore implements KVStore {
  private get ls(): Storage | null {
    try {
      return typeof window !== 'undefined' ? window.localStorage : null
    } catch {
      return null
    }
  }
  getItem(key: string): string | null {
    return this.ls ? this.ls.getItem(key) : null
  }
  setItem(key: string, value: string): void {
    this.ls?.setItem(key, value)
  }
}
