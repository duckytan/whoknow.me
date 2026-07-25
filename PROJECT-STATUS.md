# 项目状态 · whoknow 胡闹宇宙

> **任何 agent / 协作者请先读此文件** —— 它是根状态锚，看完即可拿到项目最新状态。
> 最后更新：2026-07-25 · 主理人 游承峰（Yoan Summit）
> 详细进度见 `docs/studio/STUDIO-PROGRESS.md`（工作室进度快照）

---

## 一句话

Phase 3 收口已完成（ADR-001 + forbidden_check 真闸门 + DRAMA 解析器原型 + 配置信封 + 门面部署）。**M1 已落地并部署**：运行时 `whoknow-waimai/src/`（Vue3+Vite 真构建链）；**Route B 已执行**（用户选「核心循环优先」）—— 把原型浅色胡闹黄外卖皮套到 M1 内核上，贯通 选店→下单→订单详情(DRAMA 时间线)→历史→成就墙。`prototype/` 仅本地原型，不部署。

## 现在在哪（7 阶段）

| 阶段 | 状态 | 说明 |
|---|---|---|
| 1 概念孵化 | ✅ 完成 | GDD-v2.2.2、设计支柱 5+1、乐趣假说、核心循环 |
| 2 系统设计 | ✅ 完成 | DRAMA-ENGINE-V2、DATA-STRUCTURE-v1、brain api-spec v2.2 |
| 3 技术搭建 | ✅ 完成 | 4 项收口全落：数据形状 ADR ✅ + forbidden_check 真闸门 ✅（prototype/ 扫描 red_light_count=0）+ DRAMA 解析器原型 ✅（8/8 测试）+ 门面部署接线 ✅（vercel outputDirectory=.） |
| 4 预制作 | ⚠️ 部分 | prototype 12 页 + tests/ 在；缺 Epic/Story 拆分 + 首冲刺计划 + 垂直切片 |
| 5 制作 (M1) | ✅ 完成 | Route B 整合：原型浅色皮 + M1 内核。5 店(全人格)+3 骑手+成就墙+订单历史；`npm run build` PASS(vue-tsc 0 error) + `npm test` **38/38** 绿（含 P0 死分支可达性 T10/T11/T12）；三司会审 P0 两刀已修并上线（commit 3d83744，已 push + Vercel 部署）；仓库结构已合并为单一文件夹 `whoknow-waimai/`（删根 `waimai/`，构建产物收进 `whoknow-waimai/dist/`，vercel `/waimai` → `whoknow-waimai/dist`）|
| 6 打磨 | ⬜ | — |
| 7 发布 | ⬜ | **硬闸门 = 真机 playtest（笑率 + 同店第 5 单差异）** |

## 已确认参数（用户拍板）

- **引擎**：Vue3 + Vite + Vant（沿用现状，不重做）
- **平台**：PWA 优先（Vercel 现栈加 manifest + service worker）；小程序为独立 target，lean 模式下冻结至 M2
- **评审强度**：lean 轻量（设计评审 + 冒烟测试；保留 playtest 真机硬闸门）

## 关键文档（按优先级读）

1. `胡闹宇宙总体设计方案.md` —— 总纲 v3，唯一权威方向
2. `docs/studio/STUDIO-PROGRESS.md` —— 工作室进度快照（阶段表 / 待办 / 路径 / 风险）
3. `whoknow-waimai/docs/GDD-v2-2026-07-24.md` —— v2 主 GDD
4. `whoknow-waimai/docs/specs/DATA-STRUCTURE-v1-2026-07-24.md` —— **数据结构唯一权威**（字段以它为准：`actor` / `moodDelta` / `next`+`nextWeights` / `id`）
5. `whoknow-brain/docs/api-spec.md` —— brain ↔ waimai 配置契约（信封 6 字段 + 4 级降级 + 水印 + 人工审核落盘）

## 当前下一步（待用户拍板启动）

收 Phase 3 闸门（spawn `engineering-lead` + `quality-lead`）→ 落地：
1. ✅ **数据形状 ADR**：`whoknow-waimai/docs/adr/ADR-001-data-shape-authority.md`（已出，6 项字段二义已裁决）
2. **DRAMA 解析器 / 状态机原型**：四阶段 `DramaState` 流动 + `DramaBranch` 链（顺带修 P0-D 乐趣缺口）
3. **静态配置部署验证**：brain `latest-config.json` 拉取链路 + `vercel.json` buildCommand
4. ✅ **`forbidden_check` 真闸门**：`tests/forbiddenCheck.impl.ts` + `scan-product-surface.ts`（CI 闸门，prototype/ 扫描 red_light_count=0；已修裸"死"过宽词自爆）

## ⛔ 不要做

- 不要直接写 M1 / DRAMA 解释器（冲突文档未对齐，会踩字段二义：`mood`/`moodDelta`、`speaker`/`actor`、分支 6≠7）
- 不要假设 brain 已自动化（当前为锡哥**手动**生成配置，水印"今日 AI 更新"是戏称，非真定时 AI）

## 开放项（历史 P0 未动）

- **P0-C**：latest-config 信封完整种子 / `vercel.json` buildCommand（forbidden_check 客户端闸门 ✅ 已落地，见上）
- **P0-D（部分缓解）**：`remarkTag` 现已被 odd/blacklist/more_spicy/no_scold 消费（odd_eats、boss_blacklist 经备注可达）；`shopVisitCount` 仍未被任何分支消费（店间/同店差异感待 P1 设计）
- **P0-E（已解决）**：视觉前品牌 —— P0-2 已将 BRAND.md 锚色(`--brand-green/orange/purple`)+字体令牌(ZCOOL KuaiLe 手写梗等)引入 `src/style.css`；导航选中态改品牌橙红、段子卡手写体+品牌绿高亮底(截图价值)、成就✓改品牌绿、全局 whoknow 绿底白「?」角标；无障碍回归待 M2

## 变更记录

| 日期 | 事件 |
|---|---|
| 2026-07-25 | 建根状态锚 `PROJECT-STATUS.md`；Phase 0 诊断完成，确认引擎/平台/评审三参数 |
| 2026-07-25 | Phase 3 收口推进：ADR-001 出炉 + forbidden_check 真闸门跑通（prototype/ red_light_count=0）+ 修 taboo-list 裸"死"自爆；P0-A 产品面验证 PASS |
| 2026-07-25 | **M1 完成**：Vue3+Vite+Vant 真构建链核心循环落地（`whoknow-waimai/src/`，27/27 测试绿 + 构建 PASS）；构建配置重构（去 project-reference，TS6310 修复）；门面 index.html 导航页已独立 commit 上线 |
| 2026-07-25 | **M1 app 部署接线已推**（`f832317`）：vercel.json buildCommand 构建 whoknow-waimai 并 cp 到 /waimai（outputDirectory 保持 "."，门面在根）；加 /waimai SPA 回退；.vercelignore 去掉 waimai 源码排除。Vercel 连仓库自动部署，push 后约 1-2 min 上线 `whoknow.me/waimai` |
| 2026-07-25 | **首页样式修复 + styleguide 恢复**：Vercel dashboard 残留 buildCommand 导致部署回退，改为静态部署 + 覆盖 buildCommand 为 `echo done`；`whoknow.me` 样式与 `/waimai` app 均正常；从 `archive/root-obsolete` 恢复 `docs/styleguide.html` |
| 2026-07-25 | **Route B 整合 + 部署（commit a6a1e35, push 到 main）**：原型浅色皮套 M1 内核；新增 8 组件 + 6 视图 + shops/achievements 数据层 + 成就/历史接入 memory；测试 27→35 绿；移除未用 public/config 死配置(含旧 {price}/{fee})；`waimai/` 预构建提交，Vercel 静态部署，live 验证 /waimai 返回新构建(HTTP 200, 无 {price}/{fee}) |
| 2026-07-25 | **三司会审 P0 两刀（commit 9c798d6，本地 ahead 1，push 暂受阻）**：① P0-1 死分支修复 —— odd_eats 触发由自锁 flag 改为 `remarkTag=odd \| flag(odd_eats_{shopId})` 经备注首次可达(`dark_chef` 成就可解锁)；新增 `boss_blacklist` 分支(备注拉黑/差评)播种 `blacklisted_{shopId}`，使 `blacklist_reunion` 后续可触发(`reconciled` 成就可解锁)；`orderInput` 备注分类加 odd/blacklist；测试 35→38(T10/T11/T12)。② P0-2 品牌落地(BRAND.md) —— 引入品牌锚色 `--brand-green/orange/purple`+字体令牌(ZCOOL KuaiLe 手写梗/Ma Shan Zheng/Bungee 等)；导航选中态改品牌橙红；段子卡 NPC 金句手写体+品牌绿高亮底(截图价值)；成就✓改品牌绿+解锁绿光晕；Story 水印 badge 改品牌橙；表单聚焦改品牌橙；全局 whoknow 绿底白「?」角标(PhoneFrame)。`npm run build` 0 报错(67 模块)。**push 因沙箱 git 写鉴权被拦截(HTTP 401 Basic realm，环境仅有 Bearer/API 令牌，proxy 仅放行读)暂未上 GitHub，Vercel 未重部署；代码已本地提交、waimai/ 已重建待上线** |
| 2026-07-25 | **P0 两刀 push + 部署上线（commit 3d83744）**：本地 `git pull --rebase` 远端 1633bab(whoknow-mart 文档，零重叠) 后 `git push` 成功；live 验证 `/waimai` 切到新构建 `index-OPWjNubD.js`，含 `boss_blacklist`/`blacklisted_`/`odd_eats`/`dark_chef`/`reconciled`，无 `{price}`/`{fee}`。|
| 2026-07-25 | **仓库结构合并为单一文件夹（commit de60c78 + 78bbabf）**：删根目录 `waimai/`，构建产物收进 `whoknow-waimai/dist/`；`.gitignore` 例外放行 `whoknow-waimai/dist/`；`vercel.json` 的 `/waimai` 路由改指 `whoknow-waimai/dist`（assets 直投 + SPA 兜底 + 末尾斜杠规则）。一个项目只占根目录一个位置，与 `whoknow-mart/` 一致。live 验证 `/waimai/`、`/waimai/orders`、`/waimai/shop/s01`、资产均 HTTP 200 |
