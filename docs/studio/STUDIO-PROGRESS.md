# 工作室进度快照 · whoknow 胡闹宇宙

> **主理人视角（游承峰）· 单一进度锚**
> 生成：2026-07-25 · 用途：Phase 0 阶段诊断 + 当前进度 + 下一步，作为工作室推进的进度基准
> 配套权威文档：`胡闹宇宙总体设计方案.md`（总纲 v3）、`whoknow-waimai/docs/GDD-v2-2026-07-24.md`

---

## 1. 阶段诊断（7 阶段现状）

| 阶段 | 名称 | 状态 | 关键证据 |
|---|---|---|---|
| 1 | 概念孵化 | ✅ 完成 | GDD-v2.2.2、设计支柱 5+1、乐趣假说、核心循环已立 |
| 2 | 系统设计 | ✅ 完成 | DRAMA-ENGINE-V2、DATA-STRUCTURE-v1（4 层权威）、brain api-spec v2.2 契约 |
| 3 | 技术搭建 | 🔶 **CONCERNS 未收口** | 4 项收口 2/4 已落：数据形状 ADR ✅（ADR-001）+ forbidden_check 真闸门 ✅（prototype/ 扫描 red_light_count=0）；剩 DRAMA 解析器原型 + 静态配置部署验证 |
| 4 | 预制作 | ⚠️ 部分 | prototype 12 页高保真 + tests/ 禁忌词脚手架在；**缺 Epic/Story 拆分 + 首个冲刺计划 + 垂直切片交付** |
| 5 | 制作 | ⬜ 未开始 | M1 = v2 核心循环重建（7 页 + 记忆引擎 + DRAMA 四阶段 + 解析器）待开发 |
| 6 | 打磨 | ⬜ | — |
| 7 | 发布 | ⬜ | 硬闸门 = 真机 playtest（笑率 + 同店第 5 单差异） |

**定位结论**：设计（Phase 1-2）已 A+ 写满，但工程落地未开始。当前卡在 **Phase 3 的 CONCERNS 闸门**——工程分析（`whoknow-waimai/docs/analysis/TEAM-ENGINEERING-2026-07-25.md`）原话"4 项 P0 工程决策未落成算法/契约，**不可直接按冲突文档编码**"。下一步不是写 M1，而是先收口 Phase 3。

---

## 2. 已确认参数（Phase 0 确认 · 用户拍板）

| 参数 | 取值 | 备注 |
|---|---|---|
| 引擎 | **Vue3 + Vite + Vant**（沿用现状） | 移动端 Web 前端栈，与总纲/原型/契约一致，不重做 |
| 平台 | **PWA / 小程序** | 建议 **PWA 优先**（Vercel 现栈直接加 manifest + service worker）；小程序为独立 target，lean 模式下冻结至 M2 再议 |
| 评审强度 | **lean 轻量** | 设计评审 + 冒烟测试；保留真机 playtest 硬闸门（行动项 C） |

---

## 3. 当前进度快照

- **设计（Phase 1-2）· 完成**
  - `whoknow-waimai/docs/GDD-v2-2026-07-24.md`（v2.2.2，对齐 DRAMA-ENGINE-V2 + brain api-spec v2.2）
  - `whoknow-waimai/docs/specs/DRAMA-ENGINE-V2.md`（戏精引擎 = 人生模拟器）
  - `whoknow-waimai/docs/specs/DATA-STRUCTURE-v1-2026-07-24.md`（L1 内容 / L2 运行时 / L3 玩家持久化 / L4 图鉴 四层权威）
  - `whoknow-brain/docs/api-spec.md`（v2.2 契约：信封 6 字段 + 4 级降级 + 水印 + 人工审核落盘）
- **工程（Phase 3）· CONCERNS 未收口**
  - 4 项 P0 工程决策：ADR ✅（ADR-001-data-shape-authority.md）+ forbidden_check 真闸门 ✅（已跑通 prototype/ 扫描）；解析器原型 + 部署验证仍待落
- **预制作（Phase 4）· 部分**
  - 在：`prototype/`（12 页高保真）、`whoknow-waimai/tests/`（forbiddenCheck 脚手架 + taboo-list.json）
  - 缺：Epic/Story 拆分、首个冲刺计划、垂直切片交付
- **制作（Phase 5 / M1）· 未开始**
  - M1 = v2 核心循环重建（7 页 + 记忆引擎 + DRAMA 四阶段 + 解析器）

---

## 4. 待办 / 开放项

### Phase 3 收口三件事（engineering-lead 负责）
1. **数据形状 ADR**：以 `DATA-STRUCTURE-v1` 为唯一权威，定 `actor` / `moodDelta` / `next` + `nextWeights` / `id` 终态，出 ADR 决策记录
2. **DRAMA 解析器 / 状态机原型**：四阶段 `DramaState` 流动 + `DramaBranch` 链（**P0-D 缺口在此修**：让"写备注 vs 没写"产生差异）
3. **静态配置部署验证**：brain `latest-config.json` 信封拉取链路 + `vercel.json` buildCommand 修掉

### 红灯闸门（quality-lead 负责）
- **`forbidden_check` 客户端真闸门**立起来（P0-C 另一半 + 红线发布前硬防护，目标 `red_light_count === 0`）

### 历史遗留 P0（来自 v2 清场审计，尚未动）
- **P0-C**：latest-config 信封完整种子 / `vercel.json` buildCommand / forbidden_check 客户端闸门
- **P0-D**：SEED 7 分支未消费 `remarkTag` / `addressTag`（核心乐趣缺口，P1 假说未兑现）
- **P0-E**：视觉前品牌（prototype 去美团皮 + `design-tokens.css` 锚色未 import + 无障碍 3 回归）

---

## 5. 下一步路径（待用户拍板）

```
收 Phase 3 闸门（CONCERNS → PASS）
   └─ spawn engineering-lead（+ quality-lead 管红线闸门）
        ↓
Phase 4 预制作：垂直切片 + 首个冲刺计划（验证核心循环「好玩」再全面铺 7 页）
        ↓
Phase 5 制作（M1）：v2 核心循环重建
        ↓
Phase 6 打磨 → Phase 7 发布（硬闸门 = 真机 playtest：笑率 + 同店第 5 单差异）
```

**当前阻塞**：Phase 3 的 CONCERNS 闸门未收口前，不进入 Phase 5 写 M1。

---

## 6. 已知风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 直接按冲突文档写 M1 | 踩字段二义（`mood`/`moodDelta`、`speaker`/`actor`、分支 6≠7） | 先出数据形状 ADR 定唯一权威 |
| SEED 不消费备注/地址 | P1 乐趣假说不成立（"我做什么都一样"） | 解析器原型里先验证 `remarkTag`/`addressTag` 分支 |
| 红线漏网（曾质量 FAIL） | 红灯词/真实品牌进产品 | `forbidden_check` 客户端真闸门 + 发布前 `red_light_count === 0` |
| 平台选 PWA/小程序二义 | 小程序是独立运行时，非套壳 | PWA 优先；小程序作 Phase 3 单列架构决策点，M2 再议 |

---

## 7. 变更记录

| 日期 | 事件 |
|---|---|
| 2026-07-25 | Phase 0 诊断完成；确认引擎/平台/评审三参数；建本进度快照 |
