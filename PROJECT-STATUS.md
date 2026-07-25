# 项目状态 · whoknow 胡闹宇宙

> **任何 agent / 协作者请先读此文件** —— 它是根状态锚，看完即可拿到项目最新状态。
> 最后更新：2026-07-25 · 主理人 游承峰（Yoan Summit）
> 详细进度见 `docs/studio/STUDIO-PROGRESS.md`（工作室进度快照）

---

## 一句话

Phase 3 收口已完成（ADR-001 + forbidden_check 真闸门 + DRAMA 解析器原型 + 配置信封 + 门面部署）。**M1 已启动**，运行时位于 `whoknow-waimai/src/`（Vue3+Vite+Vant 真构建链）；`prototype/` 仅本地原型，不部署。

## 现在在哪（7 阶段）

| 阶段 | 状态 | 说明 |
|---|---|---|
| 1 概念孵化 | ✅ 完成 | GDD-v2.2.2、设计支柱 5+1、乐趣假说、核心循环 |
| 2 系统设计 | ✅ 完成 | DRAMA-ENGINE-V2、DATA-STRUCTURE-v1、brain api-spec v2.2 |
| 3 技术搭建 | ✅ 完成 | 4 项收口全落：数据形状 ADR ✅ + forbidden_check 真闸门 ✅（prototype/ 扫描 red_light_count=0）+ DRAMA 解析器原型 ✅（8/8 测试）+ 门面部署接线 ✅（vercel outputDirectory=.） |
| 4 预制作 | ⚠️ 部分 | prototype 12 页 + tests/ 在；缺 Epic/Story 拆分 + 首冲刺计划 + 垂直切片 |
| 5 制作 (M1) | 🔶 进行中 | 运行时 whoknow-waimai/src/（Vue3+Vite+Vant）；核心循环重建（下单→NPC 反应→四阶段→记忆） |
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
- **P0-D**：SEED 7 分支未消费 `remarkTag` / `addressTag`（核心乐趣缺口，P1 假说未兑现）
- **P0-E**：视觉前品牌（prototype 去美团皮 + `styles/design-tokens.css` 锚色未 import + 无障碍 3 回归）

## 变更记录

| 日期 | 事件 |
|---|---|
| 2026-07-25 | 建根状态锚 `PROJECT-STATUS.md`；Phase 0 诊断完成，确认引擎/平台/评审三参数 |
| 2026-07-25 | Phase 3 收口推进：ADR-001 出炉 + forbidden_check 真闸门跑通（prototype/ red_light_count=0）+ 修 taboo-list 裸"死"自爆；P0-A 产品面验证 PASS |
