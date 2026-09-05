/**
 * 皮肤注册表（T6 完整版）。
 * MODULE_REGISTRY：首页 10 个模块组件登记（id → 组件）；
 * LAYOUT_REGISTRY：布局变体有限枚举（id → 布局组件），新增变体 = 写 Vue 组件并登记；
 * SKIN_REGISTRY：skin id → SkinConfig（编译期导入三份 JSON）。
 */

import type { Component } from 'vue';
import type { SkinConfig, ModuleId, LayoutVariantId } from './types';
import cosmosDark from './cosmos-dark.json';
import paperLight from './paper-light.json';
import legacy from './legacy.json';

import UniverseProgressModule from '@/components/modules/UniverseProgressModule.vue';
import AppStatusLightsModule from '@/components/modules/AppStatusLightsModule.vue';
import MilestoneGanttModule from '@/components/modules/MilestoneGanttModule.vue';
import CandidateMatrixModule from '@/components/modules/CandidateMatrixModule.vue';
import RiskBoardModule from '@/components/modules/RiskBoardModule.vue';
import QualityGateModule from '@/components/modules/QualityGateModule.vue';
import HealthRadarModule from '@/components/modules/HealthRadarModule.vue';
import DualInstanceLoadModule from '@/components/modules/DualInstanceLoadModule.vue';
import ContributionActivityModule from '@/components/modules/ContributionActivityModule.vue';
import ContractHubModule from '@/components/modules/ContractHubModule.vue';

import HomeClassic from './layouts/HomeClassic.vue';
import HomeSpotlight from './layouts/HomeSpotlight.vue';
import HomeDense from './layouts/HomeDense.vue';

/** 模块注册表：id = 组件文件名去 .vue */
export interface ModuleEntry {
  component: Component;
}
export const MODULE_REGISTRY: Record<ModuleId, ModuleEntry> = {
  UniverseProgressModule: { component: UniverseProgressModule },
  AppStatusLightsModule: { component: AppStatusLightsModule },
  MilestoneGanttModule: { component: MilestoneGanttModule },
  CandidateMatrixModule: { component: CandidateMatrixModule },
  RiskBoardModule: { component: RiskBoardModule },
  QualityGateModule: { component: QualityGateModule },
  HealthRadarModule: { component: HealthRadarModule },
  DualInstanceLoadModule: { component: DualInstanceLoadModule },
  ContributionActivityModule: { component: ContributionActivityModule },
  ContractHubModule: { component: ContractHubModule },
};

/** 布局变体注册表：有限枚举（PRD R-P0-06 明确不做运行时动态注册与拖拽搭建器） */
export interface LayoutEntry {
  label: string;
  component: Component;
}
export const LAYOUT_REGISTRY: Record<LayoutVariantId, LayoutEntry> = {
  'home-classic': { label: '经典六行', component: HomeClassic },
  'home-spotlight': { label: '焦点式', component: HomeSpotlight },
  'home-dense': { label: '紧凑瀑布', component: HomeDense },
};

/** 首页布局降级链的兜底变体 */
export const FALLBACK_HOME_LAYOUT: LayoutVariantId = 'home-classic';

/** 皮肤注册表：编译期导入三套 JSON */
export const SKIN_REGISTRY: Record<SkinConfig['id'], SkinConfig> = {
  'cosmos-dark': cosmosDark as SkinConfig,
  'paper-light': paperLight as SkinConfig,
  legacy: legacy as SkinConfig,
};
