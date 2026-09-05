/**
 * 皮肤注册表（T3 骨架）。
 * 本轮只落地 SKIN_REGISTRY（skin id → SkinConfig，读三份 JSON）。
 * MODULE_REGISTRY / LAYOUT_REGISTRY 属 T6/T7，本轮留空对象 + TODO。
 */

import type { SkinConfig, ModuleId, LayoutVariantId } from './types';
import cosmosDark from './cosmos-dark.json';
import paperLight from './paper-light.json';
import legacy from './legacy.json';

/** 模块注册表：21 个现有 .vue 组件登记（T6 填充） */
export interface ModuleEntry {
  component: unknown;
  dataRequirements?: string[];
}
// TODO(T6): 登记 UniverseProgressModule / AppStatusLightsModule / … 共 21 个组件
export const MODULE_REGISTRY: Record<ModuleId, ModuleEntry> = {};

/** 布局变体注册表：有限枚举（T6 填充） */
export interface LayoutEntry {
  label: string;
  component: unknown;
}
// TODO(T6): 登记 home-classic / home-spotlight / home-dense / …
export const LAYOUT_REGISTRY: Record<LayoutVariantId, LayoutEntry> = {};

/** 皮肤注册表：编译期导入三套 JSON */
export const SKIN_REGISTRY: Record<SkinConfig['id'], SkinConfig> = {
  'cosmos-dark': cosmosDark as SkinConfig,
  'paper-light': paperLight as SkinConfig,
  legacy: legacy as SkinConfig,
};
