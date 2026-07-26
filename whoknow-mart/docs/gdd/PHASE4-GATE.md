# Phase 4 质量门 · whoknow-mart（预制作 / 垂直切片）

> **主理人汇编** · 游承峰（Studio Lead）· 2026-07-26
> 上游：`PHASE3-GATE.md`（PASS-with-CONCERNS）→ Phase 4 预制作
> 评审强度：full
> 成员交付：`eng-lead`（脚手架+核心+单测+DevOps）/ `design-strategist`（UX+内容）/ `art-director`（资产规格）

---

## 0. 判定

**PASS-with-CONCERNS**

三路并行交付齐全 + 实测全绿 + L1-T5 红线守住。带 CONCERNS 进入 Phase 5（制作）。

---

## 1. 交付清点（三路）

| 成员 | 交付 | 落盘路径 |
|------|------|----------|
| `eng-lead` | Vue3+Vite+Vant+TS+PWA 脚手架（`base:'/mart/'`、端口 5174）+ 核心模块（02-memory / 03-matrix[1+1+2 锁] / 04-forbidden-check[逐字同源复制 waimai] / 07-selection-state-machine[自建 `MartRoundState`，ADR-001]）+ `MartEventSource` 接口 + `LocalMatrixSource` 适配器 + 三大否决项单测 + DevOps（`build-for-vercel.js` 追加 mart 段、`scripts/ci-check.mjs`） | `whoknow-mart/src/` · `whoknow-mart/tests/` · `whoknow-mart/scripts/` · 根 `build-for-vercel.js` |
| `design-strategist` | UX 规格（S1–S6 屏幕流 / 双胜利 / 归零态中性 / SDT·心流 / 验收）+ 内容备料（5 导购台词池 / 20 格矩阵 1+1+2 / 商品池，全 `[待测试]`） | `whoknow-mart/docs/ux/UX-SPEC.md` · `whoknow-mart/docs/gdd/PHASE4-CONTENT.md` |
| `art-director` | 资产规格（5 导购视觉 / UI 组件 / 动效 / 4 处对比度达标） | `whoknow-mart/docs/art/ASSET-SPECS.md` |

**红线纪律**：eng-lead 未碰 `whoknow-waimai/` 任何文件；`build-for-vercel.js` 仅**追加** mart 段，未劫持 waimai。

---

## 2. 质量门裁定（P4-1 ~ P4-6）

| 门 | 判定 | 证据 |
|----|------|------|
| **P4-1 脚手架就绪** | ✅ PASS | `vite build` 成功（54 模块，`dist/` + `sw.js`/`workbox-*.js` 生成），`vue-tsc --noEmit` 0 类型错 |
| **P4-2 核心循环可跑通** | ✅ PASS | `GameView.vue` 真实跑通「4 选项位置随机 → 查矩阵 → 双胜利」；`reachesBreak` 用占位 affinity 验证可达破防 |
| **P4-3 三大否决项机检** | ✅ PASS | 实测 `npm test` → **12/12 绿**（04-memory / 02-matrix / 07-forbiddenCheck） |
| **P4-4 CI 门禁** | ✅ PASS | 实测 `npm run ci` 四步全 ✅（L1-T5 红线 / forbiddenCheck 双份一致 / 三大单测 / vue-tsc+构建） |
| **P4-5 L1-T5 红线** | ✅ PASS | `git status --short -- whoknow-waimai/` = **空**；`build-for-vercel.js` 仅追加 mart 段 |
| **P4-6 跨成员一致** | ✅ PASS | 三文在 `REVIEW.md` §5.1 锚表互锁；归零态禁红叉（G-4）三处一致；1+1+2 矩阵三处一致；L2-C9 三处合规 |

---

## 3. CONCERNS（带入 Phase 5 / 预上线）

- **C1 内容为占位**：矩阵弱点/踩雷映射、`lineBuckets` 台词、`products`、`affinity.initial` / `roundCap` / 记忆分级阈值均为 `[待测试]`，须 Phase 6 playtest 标定回填（`PHASE4-CONTENT.md` 已结构化就位）。
- **C2 对比度须工具终检**：`ASSET-SPECS.md` §4 四值（`#1a1a1a` / `#FF0036` ≥19px / `#222` / `#595959`）为 Standard 档强制，MVP 前须 `eng-lead` 用对比度工具终检（ACCESSIBILITY R4），据此补 `ART-BIBLE.md` §2.2/§2.5。
- **C3 部署路由命名差**：`build-for-vercel` 把产物放 `dist/mart/`；`vercel.json` 已有 `/mart/:path*` → `/whoknow-mart/dist/:path*`。但 waimai 现有 `/waimai` 路由与其 `dist/waimai` 拷贝之间本就存在一处可能的路径命名差（eng-lead 未动 `vercel.json`）。首次部署联调须一并确认 mart 与 waimai 各自的 rewrite 与目标目录一致。
- **C4 旧静态原型被取代**：新 Vue 构建将 `whoknow-mart/dist/` 下旧静态原型 HTML（`01-home`…`09-chat-outcome-lose` 等）整批删除、换 Vite 产物。即 mart v1 反骨原型本地被新切片工程取代；部署后线上即切换。预期演进，知悉即可。
- **C5 CONTROL-CHECKLIST §B.1 文档漂移**：示例写「同导购第 5 次 → vip」，与 `DATA-STRUCTURE-v1` §2.3 权威（regular≥3 / vip≥10）不一致。已裁定以权威源为准（10→vip），测试据此断言；主理人已修 §B.1 示例（见 §5 裁定）。
- **C6 EVOL-1 跨机阻塞**：`actor` 增 `guide` 仍须 DuckyPC 在 waimai 侧落地，v2 接 brain 前清。`BrainConfigSource` 接口已留、未实现。

---

## 4. 主理人裁定

- 采纳 `MartEventSource` + `LocalMatrixSource` 作 v2 接 brain 唯一扩展定点（与 Phase 3 裁定一致）。
- 采纳 `build-for-vercel.js` 增补 mart 构建；保留 waimai 段不变。
- **归零态 = 中局中性态**、终端双胜利绿框禁红叉（G-4 不漂移）——`UX-SPEC` §1.1 折中裁定有效。
- 矩阵 **1+1+2 锁**强制有效（`02-matrix.test.ts` 机检）。
- `forbidden_check` 逐字同源复制 waimai（ADR-003 零改写消费），已 `diff` 验证 byte-identical。
- C5：`CONTROL-CHECKLIST.md` §B.1 示例已修正为权威阈值（regular≥3 / vip≥10）。

---

## 5. 下阶段（Phase 5 制作）入口

- 内容填值（`design-strategist` 据 `PHASE4-CONTENT.md` 填 `[待测试]` + 过 `forbidden_check` 终审）。
- 对比度工具终检（`eng-lead`）+ 补 `ART-BIBLE.md` §2.2/§2.5（C2）。
- 首部署联调（C3）。
- EVOL-1 落地后清 C6，实现 `BrainConfigSource`（v2）。

---

## 6. 已知风险与缓解

| 风险 | 缓解 |
|------|------|
| playtest 前数值未标定（C1） | `PHASE4-CONTENT.md` 已结构化占位，Phase 6 门控回填 |
| 对比度值未终检（C2） | 列为 MVP 前必做项，R4 |
| 部署路由差（C3） | 首部署联调，mart/waimai rewrite 一并核对 |
| EVOL-1 跨机未落（C6） | v2 前清；MVP 不阻塞 |

---

_胡闹导购 · whoknow-mart Phase 4 质量门 v1.0 · 主理人 游承峰 · 2026-07-26 · 判定 PASS-with-CONCERNS_
