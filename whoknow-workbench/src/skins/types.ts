/**
 * 皮肤系统类型定义（T3）。
 * 配套实现：registry.ts / stores/skin.ts / composables/useSkin.ts。
 */

/** 皮肤 id（与 tokens.*.css 的 [data-skin] 取值一一对应） */
export type SkinId = 'cosmos-dark' | 'paper-light' | 'legacy';

/** 布局变体 id（受 LAYOUT_REGISTRY 约束，有限枚举；T6 起登记） */
export type LayoutVariantId = string;

/** 密度档位 */
export type Density = 'comfortable' | 'compact';

/** 模块 id（受 MODULE_REGISTRY 约束，= 组件文件名去 .vue） */
export type ModuleId = string;

/** 区域名（由布局变体组件内部定义：hero / rail / timeline / …） */
export type RegionName = string;

/** 页面 id */
export type PageId = 'home' | 'detail' | 'candidates' | 'list' | 'governance';

/** 模块插槽：区域 → 模块的映射单元 */
export interface ModuleSlot {
  module: ModuleId;
  variant?: string;
}

/** 区域映射：皮肤 JSON 中 regions[] 的一项 */
export interface RegionMapping {
  region: RegionName;
  module: ModuleId;
  variant?: string;
}

/** 字号角色（BRAND §3.1 阵容；皮肤层可切换映射） */
export interface SkinFontRoles {
  display: string;
  title: string;
  body: string;
  mono: string;
}

/** 单页布局声明 */
export interface SkinPageConfig {
  layout: LayoutVariantId;
  density: Density;
  regions: RegionMapping[];
}

/** 皮肤配置（对应 src/skins/*.json） */
export interface SkinConfig {
  id: SkinId;
  label: string;
  /** 指向 tokens.*.css 的 data-skin 值 */
  tokens: SkinId;
  fonts: SkinFontRoles;
  pages: Partial<Record<PageId, SkinPageConfig>>;
}

/** 图表容器色（由 skin store 经 getComputedStyle 解析 --chart-* 产出） */
export interface ChartTokenSet {
  text: string;
  muted: string;
  axisLine: string;
  splitLine: string;
  tooltipBg: string;
  tooltipBorder: string;
  legend: string;
  /** 数据序列色（锚色家族，两皮肤共用），由 CHART_PALETTE_VARS 解析 */
  series: string[];
}
