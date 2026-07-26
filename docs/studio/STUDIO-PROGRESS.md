# 工作室进度快照 · whoknow 胡闹宇宙

> **主理人视角（游承峰）· 单一进度锚**
> 生成：2026-07-25 · 对齐更新：2026-07-26（M1 已完工部署，阶段表对齐 PROJECT-STATUS.md）
> 配套权威文档：`胡闹宇宙总体设计方案.md`（总纲 v3）、`whoknow-waimai/docs/GDD-v2-2026-07-24.md`、`docs/studio/PROJECT-STATUS.md`（根状态锚）

---

## 1. 阶段诊断（7 阶段现状）

| 阶段 | 名称 | 状态 | 关键证据 |
|---|---|---|---|
| 1 | 概念孵化 | ✅ 完成 | GDD-v2.2.2、设计支柱 5+1、乐趣假说、核心循环已立 |
| 2 | 系统设计 | ✅ 完成 | DRAMA-ENGINE-V2、DATA-STRUCTURE-v1（4 层权威）、brain api-spec v2.2 契约 |
| 3 | 技术搭建 | ✅ 完成 | 4 项收口全落：数据形状 ADR（ADR-001）+ forbidden_check 真闸门（prototype/ 扫描 red_light_count=0）+ DRAMA 解析器原型（8/8 测试）+ 门面部署接线（vercel outputDirectory=.） |
| 4 | 预制作 | ✅ 完成 | 补齐 7 个缺失界面 + 内容铺满；DRAMA-SEED 扩至 22 分支 + SEED AI 自评（12/12 成就可达） |
| 5 | 制作（M1） | ✅ 完成 | Route B 整合 + P1 扩展：5 店 + 3 骑手 + 12 成就 + 订单历史 + 7 新界面；选项2 美团Lite 下单流落地；`npm test` 45/45 绿 + 构建 PASS；Vercel 已部署 |
| 6 | 打磨 | ✅ 完成（首轮） | SEED 40 分支 + 代码级 playtest 仿真（不同链 10.2/12）+ `dramaEngine.coverage.test.ts` 守死分支 + style.css H4 回归；真笑率待真机 |
| 7 | 发布 | ✅ 完成（lean） | 已部署上线；硬闸门 = 真机 playtest 已可执行（PLAYTEST-CHECKLIST + docs/playtest/ 工具链）；"好笑与否"待真人 JSON 微调 |

**定位结论**：M1 全链路已完成并部署。设计（Phase 1-2）与工程（Phase 3-5）均落定；打磨首轮完成；发布已上线。当前无阶段阻塞，待办为历史 P0 收尾与真机 playtest 填表。

---

## 2. 已确认参数（Phase 0 确认 · 用户拍板）

| 参数 | 取值 | 备注 |
|---|---|---|
| 引擎 | **Vue3 + Vite + Vant**（沿用现状） | 移动端 Web 前端栈，与总纲/原型/契约一致，不重做 |
| 平台 | **PWA 优先**（Vercel 现栈加 manifest + service worker）；小程序为独立 target，lean 模式下冻结至 M2 | — |
| 评审强度 | **full**（2026-07-26 起锁定；M1 执行期曾用 lean） | 正式质量门（设计/架构/烟雾/发布评审 + PASS/CONCERNS/FAIL）；保留真机 playtest 硬闸门 |

---

## 3. 当前进度快照

- **设计（Phase 1-2）· 完成**
  - `whoknow-waimai/docs/GDD-v2-2026-07-24.md`（v2.2.2，对齐 DRAMA-ENGINE-V2 + brain api-spec v2.2）
  - `whoknow-waimai/docs/specs/DRAMA-ENGINE-V2.md`（戏精引擎 = 人生模拟器）
  - `whoknow-waimai/docs/specs/DATA-STRUCTURE-v1-2026-07-24.md`（L1 内容 / L2 运行时 / L3 玩家持久化 / L4 图鉴 四层权威）
  - `whoknow-brain/docs/api-spec.md`（v2.2 契约：信封 6 字段 + 4 级降级 + 水印 + 人工审核落盘）
- **工程（Phase 3）· 完成**
  - 4 项 P0 工程决策全落：ADR-001（数据形状权威）+ forbidden_check 真闸门（prototype/ 扫描 red_light_count=0）+ DRAMA 解析器原型（8/8 测试）+ 门面部署（vercel outputDirectory=.）
- **预制作（Phase 4）· 完成**
  - 7 缺失界面（Feed/Service/Privacy/Terms/Profile/Settings/About）并入路由 + TabBar + 内容铺满
  - DRAMA-SEED 扩至 22 分支 + SEED AI 自评（12/12 成就可达）
- **制作（Phase 5 / M1）· 完成**
  - Route B：原型浅色皮套 M1 内核；5 店（全人格）+ 3 骑手（随机派单）+ 12 成就 + 订单历史 + 7 新界面
  - 选项2 美团Lite 下单流：`src/data/dishes.ts` + `src/store/cart.ts` + `ShopView` + `OrderView`
  - `npm run build` PASS（vue-tsc 0 error）+ `npm test` 45/45 绿；Vercel 已部署
- **打磨（Phase 6）· 首轮完成**
  - SEED 40 分支（店/骑手人格成主多样性源）+ `scripts/playtest-sim.ts` 代码级抗疲劳代理 + `dramaEngine.coverage.test.ts` + style.css H4 回归
- **发布（Phase 7）· 完成（lean）**
  - 已部署上线；真机 playtest 硬闸门工具链齐备（PLAYTEST-CHECKLIST + docs/playtest/ scorecard/RUNBOOK/aggregate）

---

## 4. 待办 / 开放项

### 历史遗留 P0（来自 v2 清场审计）
- **P0-C（⏸ 2026-07-26 暂停）**：latest-config 信封完整种子 / `vercel.json` buildCommand（forbidden_check 客户端闸门 ✅ 已落地）。暂停原因：后台工程 agent 已终止（killed），brain 实际负责方归 701-PC；处置：由 701-PC 上的 agent 执行，DuckyPC 不跨机器修改。信封样例已抢救进 `whoknow-waimai/public/config/`
- **P0-D（部分缓解）**：`remarkTag` 现已被 odd/blacklist/more_spicy/no_scold 消费；`shopVisitCount` 仍未被任何分支消费（店间/同店差异感待 P1 设计）
- **P0-E（已解决）**：BRAND.md 锚色 + 字体令牌已引入 `src/style.css`；无障碍回归待 M2

### 真机 playtest（发布硬闸门填表）
- 代码级代理已出 H1 口径；待真人填 scorecard 跑 `scripts/playtest-aggregate.ts` 出最终判定

---

## 5. 下一步路径（待用户拍板）

```
M1 已上线 → 真机 playtest 填表（出最终笑率判定）
   └─ P0-C 由 701-PC 负责 agent 收尾（DuckyPC 不跨做）
   └─ P0-D 同店差异感设计（P1）
   └─ M2：whoknow-mart（导购）/ whoknow-brain（控制中心）推进 + 小程序 target 解冻
```

**当前阻塞**：无阶段阻塞。M1 已部署；剩余为历史 P0 收尾与真机 playtest 填表。

---

## 6. 已知风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 直接按冲突文档写 M1 | 踩字段二义（mood/moodDelta、speaker/actor、分支 6≠7） | 已出数据形状 ADR 定唯一权威（ADR-001），M1 已按权威落地 |
| SEED 不消费备注/地址 | P1 乐趣假说不成立 | P0-D 部分缓解（remarkTag 已消费）；shopVisitCount 待 P1 |
| 红线漏网 | 红灯词/真实品牌进产品 | forbidden_check 客户端真闸门 + 发布前 red_light_count===0（已落地） |
| 跨机器 agent 越界改 brain | 分支冲突/责任不清 | P0-C 限定 701-PC 执行，DuckyPC 不跨做（CONSTITUTION 纪律） |

---

## 7. 变更记录

| 日期 | 事件 |
|---|---|
| 2026-07-25 | Phase 0 诊断完成；确认引擎/平台/评审三参数；建本进度快照（初始态：M1 未开始） |
| 2026-07-26 | 对齐 PROJECT-STATUS.md：阶段表全 ✅（M1 已完工部署）；评审强度锁 full；待办/风险同步更新 |
