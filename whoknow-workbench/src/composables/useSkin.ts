/**
 * 皮肤切换封装（T3）。
 * 纯函数 resolveInitialSkin 实现优先级链（URL > localStorage > prefers-color-scheme > 默认），
 * 被 skin store 在初始化时调用；useSkin 为组件侧便捷封装。
 */

import type { SkinId } from '@/skins/types';
import { useSkinStore } from '@/stores/skin';

/** 合法皮肤 id 有序表（同时作为 unknown→SkinId 的白名单） */
export const SKIN_ORDER: SkinId[] = ['cosmos-dark', 'paper-light', 'legacy'];

const STORAGE_KEY = 'wb.skin';

export function isSkinId(v: string | null): v is SkinId {
  return !!v && (SKIN_ORDER as string[]).includes(v);
}

/** 写入 localStorage['wb.skin']（持久化皮肤选择） */
export function persistSkin(id: SkinId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* localStorage 不可用时静默降级（隐私模式 / 禁用） */
  }
}

/**
 * 优先级链解析初始皮肤：
 *   URL ?skin=  >  localStorage['wb.skin']  >  prefers-color-scheme  >  默认 cosmos-dark
 */
export function resolveInitialSkin(): SkinId {
  const url = new URLSearchParams(location.search).get('skin');
  if (isSkinId(url)) return url;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSkinId(stored)) return stored;
  } catch {
    /* localStorage 不可用时跳过 */
  }

  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'paper-light';
  }
  return 'cosmos-dark';
}

/** 组件侧便捷封装：返回 store 与切换动作 */
export function useSkin() {
  const store = useSkinStore();
  return {
    store,
    skinId: store.skinId,
    config: store.config,
    setSkin: (id: SkinId) => store.setSkin(id),
    skins: SKIN_ORDER,
  };
}
