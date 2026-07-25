// memoryStore.ts — 记忆引擎浏览器单例（localStorage 持久化）
import { MemoryEngine, type KVStore } from './memory'

class LocalStore implements KVStore {
  getItem(k: string) {
    return localStorage.getItem(k)
  }
  setItem(k: string, v: string) {
    localStorage.setItem(k, v)
  }
}

// Node/SSR 兜底（测试与记忆模块已另有 MemStore）
class MemFallback implements KVStore {
  private m = new Map<string, string>()
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null
  }
  setItem(k: string, v: string) {
    this.m.set(k, v)
  }
}

const store: KVStore = typeof localStorage !== 'undefined' ? new LocalStore() : new MemFallback()
export const memory = new MemoryEngine(store)
