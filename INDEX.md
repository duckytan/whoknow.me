# 项目总入口 · INDEX.md

> 🦆 **新 agent onboarding 第一站**：新 agent 拉取项目后无任何上下文记忆。动手前须先读完本文件。本文件是导航，细节点链接进对应详文档。所有 agent（含主理人编排时 spawn 的成员）拉取项目后应先读此处。

> 📣 **读取引导声明（谁负责让 agent 看到本文件）**：若某 agent 由主理人编排层唤醒，本文件路径已由编排 prompt 强制注入该 agent 上下文——该 agent 已在读。若某 agent 为裸 clone 后直接打开本文件，该 agent 须主动先读完此处再动手。本项目不靠「agent 自发翻目录」保证入口生效，而靠「主理人编排层 + 平台注入层」双保险把本文件喂给新 agent。

> 🚀 **TL;DR · 3 步必做（没耐心版）**：① 读 [`胡闹宇宙总体设计方案.md`](胡闹宇宙总体设计方案.md) 与 [`CONSTITUTION.md`](CONSTITUTION.md) ② `hostname` 确认本机角色，对照 §8 分工表 ③ 读 [`docs/studio/PROJECT-STATUS.md`](docs/studio/PROJECT-STATUS.md) 看进度与开放项。**④ 同机多会话并行时**：取 `CODEBUDDY_SESSION_ID` 并按 [`多会话并行协作区分方案`](docs/studio/MULTI-SESSION-WORKING-PROTOCOL.md) 隔离记忆（每日日志写 `memory/sessions/<SID>/`，禁裸写共享 `YYYY-MM-DD.md`）。读完即可接任务；细节按需再翻本文件各节。

---

## 0. 30 秒速览

- **项目**：whoknow（胡闹宇宙）——娱乐化、梗向、截图传播驱动的虚拟生活服务产品矩阵。
- **产品矩阵**：`whoknow-waimai`（胡闹外卖·已上线 M1）/ `whoknow-mart`（胡闹导购·概念）/ `whoknow-brain`（胡闹控制中心·导演角色，手动生成）。
- **部署**：单 Vercel 仓库托管多 app，根 `vercel.json` 纯静态 + `/短名` 路由分发。
- **当前里程碑（详见 [`docs/studio/PROJECT-STATUS.md`](docs/studio/PROJECT-STATUS.md)，含最后更新日期）**：外卖 M1 已上线；导购概念；brain 手动信封。
- **本实例所在机器负责什么**：见 §6 身份确认 + §8 分工表。

---

## 1. 项目概况

胡闹宇宙是一个"胡闹 + Who knows? + 家人们谁懂啊"调性的娱乐化产品矩阵，人格化、梗向、靠截图传播驱动。四大痛点滤网（无聊 / 想笑 / 没钱也想消费 / 管不住手）是任何功能的第一关；用户思维铁律（能用吗？会爽吗？会传播吗？）是任何决策的前置三问。

- 产品矩阵一句话：外卖 = 披美团外衣的虚拟外卖；导购 = 披淘宝外衣的反骨导购博弈（选招制）；brain = 共用 AI 后台（导演，不上台）。
- 技术栈：外卖为 Vue3 + Vite + Vant + Pinia + vue-router + SCSS；单仓多 app，纯广告模式，里程碑制（M1–M4）无固定工期。
- 品牌视觉：双主题（宇宙暗色主站 + 产品浅色子 App）+ 锚色（绿 `#6eda78` / 橙 `#ff7849` / 紫 `#8b5cf6` 不可替换）。

📄 详情（最高权威）：[`胡闹宇宙总体设计方案.md`](胡闹宇宙总体设计方案.md)

---

## 2. 项目铁律（不可妥协）

完整三层分类见 [`CONSTITUTION.md`](CONSTITUTION.md)。**L1 真铁律（仅 5 条，违反即事故）**：

1. **禁忌词红线 0 容忍**：所有话术过禁忌词审核（`forbidden_check` 闸门，`red_light_count===0` 且 `passed===true` 才落盘，否则整包丢弃回退）。
2. **配置与状态分离**：brain 只产内容配置（L1），永远不写玩家数据；玩家数据只在浏览器 localStorage，brain 碰不到（隐私 + 单机 0 成本基石）。
3. **不害人 / 不违法 / 不互相踩 / 人格统一**：内容不制造焦虑、不人身攻击、不碰真实明星物价品牌（黄灯须化名）；多 app 人格一致。
4. **字段命名权威**：mart 必须复用 waimai 命名（`actor` / `moodDelta` / `next`+`nextWeights` / `id`），严禁抢先另起；须等 waimai `DATA-STRUCTURE-v1` 落定后一次性对齐。
5. **多 app 共存红线**：新增 app 只动两处（`vercel.json` 追加 rewrite + `.gitignore` 追加 `!dist/` 例外）；绝不删改其他 app 的路由/目录；绝不 `force push`。

其余为 **L2 强约定**（部署§11、相对路径、Git 代理、brain 信封契约、视觉规范、发布闸门、MVP 兼容、⛔不要做）与 **L3 当前纪律**（三铁律、痛点为王、用户思维、截图价值、痛点滤网、锡哥审核、零负担、编排者纪律，每条带退出条件）——见 `CONSTITUTION.md`。

---

## 3. 开发进度

- **外卖 M1**：七阶段（概念→系统设计→技术搭建→预制作→制作→打磨→发布）全 ✅，已上线 `/waimai`；测试 45/45 绿，构建 0 类型错误。
- **导购**：概念阶段，复用契约对齐中（`whoknow-mart/docs/`）。
- **brain**：手动信封（锡哥生成），P0-C 自动化**暂停**（见 §8）。
- **开放项**：P0-C 暂停（后台 agent 已终止，待重启）；playtest 硬闸门口径（A 轻量 / B 自然回收 / C 全量）未拍板；brain 负责方已定：`701-PC` / Agent-商城（胡叨叨），见 §8；P0-D `shopVisitCount` 未被消费（待 P1）；小程序 target 冻结至 M2；无障碍 3 项回归待 M2。

📄 详情：[`docs/studio/PROJECT-STATUS.md`](docs/studio/PROJECT-STATUS.md)

---

## 4. 规范性指引（动手前先读对应文档）

| 规范 | 作用 | 路径 |
|---|---|---|
| 结构规范（含 §7 防再犯双闸门） | 文件/目录/文档归位；**移动/删除/归档前必 grep 全仓核查依赖** | [`docs/studio/REPO-STRUCTURE-CONVENTION.md`](docs/studio/REPO-STRUCTURE-CONVENTION.md) |
| 品牌视觉 | 锚色 / 字体 / WCAG AA 无障碍 | [`BRAND.md`](BRAND.md) |
| 铁律宪法 | 三层重分类 + 度量/商业/演进三维 | [`CONSTITUTION.md`](CONSTITUTION.md) |
| 多实例协作章程 | 角色 / 权限 / 冲突处理 | [`docs/studio/ROLES.md`](docs/studio/ROLES.md) |
| 多会话并行协作区分方案 | 同目录多会话隔离 / 写作 / 冲突处置 | [`docs/studio/MULTI-SESSION-WORKING-PROTOCOL.md`](docs/studio/MULTI-SESSION-WORKING-PROTOCOL.md) |
| 在制登记 | 当前 WIP / 阻塞项 | [`docs/studio/WIP.md`](docs/studio/WIP.md) |
| Git 工作流（分支 / 提交 / 合入） | 受保护 main + agent 工作线 + PR/CI 闸门 | [`docs/studio/GIT-WORKFLOW.md`](docs/studio/GIT-WORKFLOW.md) |
| brain 信封契约 | 信封 6 字段 + 4 级降级 + 水印 + 人工审核 | [`whoknow-brain/docs/api-spec.md`](whoknow-brain/docs/api-spec.md) |
| 跨设备共享记忆 | 项目级记忆入口（替代本机日志跨设备同步） | [`docs/studio/memory/PROJECT-MEMORY.md`](docs/studio/memory/PROJECT-MEMORY.md) |
| 新机器身份初始化（兜底） | 无 IDENTITY.md 时粘贴即用清单，根治「不读 ROLES」 | 见 §6「DuckyPC 接入操作清单（内联 · 粘贴即用）」 |

⚠️ **任何文件/目录/文档操作前，必先读结构规范并遵守 §7 双闸门**（前置核查 + 修订回扫）。

### 工作室编排参数（Phase 0 已确认）
主理人编排层（游承峰）按以下 Phase 0 参数运行，新 agent 拉取项目后即以此为准：

| 参数 | 取值 | 说明 |
|---|---|---|
| 评审强度 | **full** | 每个阶段切换走正式质量门（设计/架构/烟雾/发布评审，给 PASS/CONCERNS/FAIL）；多 agent 并行 spawn + 主理人汇编。用户 2026-07-26 拍板锁定。 |
| 引擎选型 | 不适用（web 应用） | 技术栈见各 app README：whoknow-waimai=Vue3+Vite+Vant；whoknow-mart 拟复用 Vue3+Vant；whoknow-brain 为 AI 后台。 |
| 目标平台 | Vercel 海外部署 + Web | 单仓多 app，`/短名` rewrite → `whoknow-<app>/dist`；纯广告模式；里程碑制 M1-M4。 |

> 评审强度=full 意味着：治理改动也走质量门（如三司会审、§7 双闸门、L2-C9 客观表述红线 + 预提交钩子）。

---



## 5. 项目文件结构

**根白名单**（详见结构规范 §2，本文件 `INDEX.md` 与 `CONSTITUTION.md` 已列入）：
`README.md` / 总纲 / `BRAND.md` / `CONSTITUTION.md` / `INDEX.md` / `vercel.json` / `index.html` / `index1.html` / `data/` / `styles/` / `js/` / `docs/` / `whoknow-*/` / `archive/`。

| 路径 | 内容 |
|---|---|
| `whoknow-waimai/` | 外卖 app：`src/`（引擎/视图/store）、`docs/`（GDD/规格）、`public/config/`（brain 信封样例） |
| `whoknow-mart/` | 导购 app（概念） |
| `whoknow-brain/` | 控制中心：`docs/api-spec.md`（信封契约） |
| `docs/studio/` | 宇宙级文档：结构规范 / 状态 / 协作章程 / `memory/` |
| `docs/studio/memory/` | 跨设备共享记忆（进 git） |
| `.workbuddy/memory/` | 本机工作台日志（**不进 git**，留本地） |
| `archive/` | 废旧资产归档 |

⚠️ **`index.html` 与 `index1.html` 是 `build-for-vercel.js` 的部署源文件，复制进 `dist/` 上线——禁止归档/删除**（曾有事故）。

---

## 6. agent 身份确认方式

本机身份在 `C:\Users\<用户名>\.workbuddy\` 的 `SOUL.md` / `IDENTITY.md` / `USER.md` —— **不在项目仓库，每台机器各自维护，不跨设备覆盖**。

确认三步：
1. **本实例身份**：读 `SOUL.md`（AI 人格）+ `IDENTITY.md`（名字/角色）。
2. **本实例所在机器**：用 `hostname` 获取计算机名，对照 §8 分工表定位本实例角色（见下）。
3. **本实例负责哪些 app**：对照 §8 分工表。

计算机名 → 角色锚点：
- `DuckyPC` → 负责 `whoknow-waimai`（主理人 Ducky / duckytan）
- `701-PC` → 负责 `whoknow-mart` + `whoknow-brain`
- **其他计算机名 / 新机器**：见下方「冷启动闭环」——先确认本机归属哪类 app，再写入身份文件。

### 全新机器冷启动闭环（P0 · 流动开发常态）
多机流动开发常态下，全新机器首次启动即身份文件为空，非异常。闭环：
1. **装 workbuddy 后**：多数机器平台会引导填写 `SOUL.md` / `IDENTITY.md` / `USER.md`（位于 `C:\Users\<用户名>\.workbuddy\`）。**但实测有机器（如 `DuckyPC`）未触发引导、连 `IDENTITY.md` 都没有**——不要假设已初始化。若本机身份文件缺失，按本节下方「DuckyPC 接入操作清单（内联 · 粘贴即用）」粘贴即用清单补建。
2. **（接入第 0 步 · 硬规则）**：无论平台是否引导，每台机器都必须在本机 `IDENTITY.md` 写入「每次会话开始先读 [`docs/studio/ROLES.md`](docs/studio/ROLES.md) 定位本机角色与范围」这一自动注入指针。否则新建对话会遗忘协作约定——本仓库所有 agent 强制，详见 `ROLES.md` §5。
3. **缺失 / 丢失时**：按本机 workbuddy 的重新初始化流程重建这三个文件——项目不强制文件内容，只要求该 agent 确认「本机负责哪个 app」（对照 §8 分工表写进 `IDENTITY.md`）。
4. **网络自适应**：Git 代理端口随机器而异，按 `CONSTITUTION.md` L2-C3 实测两候选端口（`127.0.0.1:12000` / `127.0.0.1:7890`）取通者写入本机 `git config`；`701-PC` 实测 `7890` 通 / `12000` 不通（2026-07-26），`DuckyPC` 待实测回填。若两端口均不通 / 无代理环境，`git config --global --unset http.proxy https.proxy` 走直连，不要卡死在固定端口。
5. **回写**：角色确认后，若 §8 分工表未覆盖该 agent 的机器，提 PR 补一行（见 §8 跨边界任务归属原则）。

### DuckyPC 接入操作清单（内联 · 粘贴即用）

> 目的：让 `DuckyPC` 机器上的 WorkBuddy 实例每次会话自动记住其角色为 Agent-外卖、并去读 `docs/studio/ROLES.md`。不做这一步，仓库协作约定对该实例形同虚设——WorkBuddy 不会自动加载仓库文件，新建对话会遗忘双实例分工。

**为什么必须做**：WorkBuddy 每会话自动注入的只有两类本地文件（用户级 `~/.workbuddy/IDENTITY.md`、项目级 `.workbuddy/memory/MEMORY.md`），二者均不随仓库同步；仓库里会同步的文件（`ROLES.md` 等）无自动加载机制，必须主动 Read。因此必须在 `DuckyPC` 机器上建一个"自动注入的指针"才稳。

**只放指针，不放角色权威**：下方模板写入 `IDENTITY.md` 的角色 / 范围仅为指针与兜底；角色与范围唯一权威在 `docs/studio/ROLES.md`（单一事实源），冲突以 `ROLES.md` 为准。

在 `DuckyPC` 机器上，将以下内容写入 `C:\Users\<用户名>\.workbuddy\IDENTITY.md`（文件不存在则新建）：

```markdown
# IDENTITY.md - Who Am I?

- **Name:** Agent-外卖（DuckyPC 实例）
- **Creature:** 胡闹宇宙外卖 App 的协作者 AI，机器 DuckyPC 负责 whoknow-waimai + 主站前端
- **Vibe:** （自定，随意）
- **Emoji:** （自定）

## 关键约定
- 机器名 `DuckyPC` → **Agent-外卖**，负责 `whoknow-waimai/` + 主站前端（`data/` `styles/` `js/` `index*.html`）。
- **每次会话开始先读 `docs/studio/ROLES.md`**（§0 机器名映射 + §2 协作红线 + §7 双闸门）。
- **多会话同目录隔离**：同工作目录开多个会话时取 `CODEBUDDY_SESSION_ID` 并按 `docs/studio/MULTI-SESSION-WORKING-PROTOCOL.md` 隔离记忆（日志写 `memory/sessions/<SID>/`，禁裸写共享 `YYYY-MM-DD.md`）。
- 共享文件（`README.md` / `BRAND.md` / 总纲 / `docs/studio/` 除 `ROLES`/`WIP`）改前先与 `701-PC`（Agent-商城）协商。
- 用户统一称呼 **「Ducky」**（= duckytan）。
- 详见 `docs/studio/ROLES.md`。
```

可选——写入 `C:\Users\<用户名>\.workbuddy\USER.md` 让"用户称呼"也对齐：

```markdown
# USER.md - About Your Human

- **Name:** duckytan
- **What to call them:** Ducky
- **Notes:** 胡闹宇宙双 App 静态站（whoknow-waimai / whoknow-mart），双 WorkBuddy 实例并行协作。
```

**验证**：于 `DuckyPC` 新建对话，提问「实例身份 / 负责范围 / 开工前应读文件」——预期回答为 Agent-外卖 + 负责 whoknow-waimai/主站前端 + 先读 ROLES.md。

**完成后回填**：在 `701-PC` 机器上把 `docs/studio/ROLES.md` §0「AI 自称」列 `DuckyPC` 行的"（待该实例自定后回填上表）"改为在 `DuckyPC` 机器上定的自称，然后 commit + push，使双实例自称在共享章程对齐。

---

## 7. 多 agent 协同开发规范协议

多台机器并行改同一 GitHub 仓库。铁律级规则：

- **Git 代理**：本机 `fetch / pull / push` 代理端口随机器而异，按 `CONSTITUTION.md` L2-C3 实测两候选端口取通者写入本机 `git config`；`701-PC` 实测 `7890` 通 / `12000` 不通（2026-07-26），`DuckyPC` 待实测。无代理环境走直连（见 §6 冷启动·网络自适应），不卡死。
- **分支模型**：`main` 受保护、始终可部署；各实例在各自 agent 工作线（`agent-mart` / `agent-waimai`）开发，经 squash + PR + CI 合入 `main`。完整流程见 [`docs/studio/GIT-WORKFLOW.md`](docs/studio/GIT-WORKFLOW.md)。
- **同步 / 推送被拒**：在所属 agent 工作线 `git fetch && git rebase origin/main` 追平，再 `git push --force-with-lease origin agent-mart`（或 `agent-waimai`）；**禁在 `main` 上 rebase 或强推**。
- **内部链接一律相对路径**：禁写绝对 `/...`，否则在 `/短名/` 路由下 404。
- **新增 app 只动两处**：`vercel.json` 追加 rewrite + `.gitignore` 追加 `!dist/` 例外；绝不删改其他 app 的路由/目录/`.gitignore`。
- **文档权威链**：总纲 ＞ 结构规范 ＞ 各 app 文档；冲突以总纲为准。

📄 详情：[`docs/studio/GIT-WORKFLOW.md`](docs/studio/GIT-WORKFLOW.md)（Git 流程）· [`docs/studio/ROLES.md`](docs/studio/ROLES.md) · [`docs/studio/WIP.md`](docs/studio/WIP.md)

---

## 8. agent 分工表

| 机器 | 计算机名 | 负责 app | 主理人 | 备注 |
|---|---|---|---|---|
| `DuckyPC` | `DuckyPC` | `whoknow-waimai` | Ducky | 外卖 M1 迭代、结构治理、跨设备记忆 |
| 另一台 | `701-PC` | `whoknow-mart` + `whoknow-brain` | 产出：锡哥；执行：胡叨叨（Agent-商城）| brain 信封待自动化（P0-C）；⚠️ brain 为共享契约中枢，单点归商城侧，存在单点耦合风险 |

**跨边界任务归属原则**：按"生产方"定。信封（brain 产出）→ 归 `701-PC`；若消费方（waimai）机器已具备样本且合理，可协商在消费方做。当前 **P0-C（brain 信封自动化）暂停**：后台 agent 已终止(killed)，但 **brain 负责方已定：`701-PC` / Agent-商城（胡叨叨）**，**由 701-PC 侧的 agent 执行，不在 DuckyPC 跨做**。信封样例 `latest-config.json` / `fallback.json` 已抢救进 `whoknow-waimai/public/config/`。

共同：共享同一 GitHub 仓库，靠 git 同步 + 结构规范 + 本分工表避免冲突。

---

## 9. 全新 agent onboarding 步骤（照做）

0. **同机多会话并行（关键）**：若本机同时开多个 WorkBuddy 会话指向本目录，先 `echo "$CODEBUDDY_SESSION_ID"` 取本会话 ID，读 [`多会话并行协作区分方案`](docs/studio/MULTI-SESSION-WORKING-PROTOCOL.md) 并按其「新会话启动速做」隔离记忆——本会话日志只写 `memory/sessions/<SID>/YYYY-MM-DD.md`，**禁裸写**共享 `YYYY-MM-DD.md`。
1. `git clone` 仓库，按本机网络配置 git 代理（见 §6 冷启动·网络自适应）。
2. **读本文件 `INDEX.md`**（新 agent 拉取后即读此处）。
3. 读 [`胡闹宇宙总体设计方案.md`](胡闹宇宙总体设计方案.md)（总纲）+ [`CONSTITUTION.md`](CONSTITUTION.md)（铁律）。
4. `hostname` 确认本机角色，核对 §6 / §8 分工。
5. 读 [`docs/studio/PROJECT-STATUS.md`](docs/studio/PROJECT-STATUS.md) 看进度与开放项。
6. 接具体任务前，读对应规范（结构 / 品牌 / `api-spec`）。
7. 记忆同步：读 [`docs/studio/memory/PROJECT-MEMORY.md`](docs/studio/memory/PROJECT-MEMORY.md)（跨设备共享记忆入口）。

### 动手最小指令（P1 · 接到任务后怎么真跑起来）
| 动作 | 命令 | 备注 |
|---|---|---|
| 拉取最新 | 在 agent 工作线 `git fetch && git rebase origin/main` | 追平后 `git push --force-with-lease origin agent-mart`（或 `agent-waimai`）；详见 GIT-WORKFLOW.md §3 |
| 外卖本地起服务 | `cd whoknow-waimai && npm install && npm run dev` | 仅 waimai 有完整构建链；mart/brain 为概念/手动，暂无 build |
| 外卖跑测试 | `cd whoknow-waimai && npm test` | 45/45 绿为健康基线 |
| 外卖构建 | `cd whoknow-waimai && npm run build` | 产物 `dist/`（唯一上线物）|
| 提交流程 | 在 agent 工作线：改 → `git add` → `git commit`（Conventional）→ `git push --force-with-lease` → 开 PR 合入 `main` | 提交信息须 Conventional Commits，见 GIT-WORKFLOW.md §5 |

> 非 waimai 任务（mart/brain）目前以文档/配置为主，无统一构建；按对应 `docs/` 指引操作。

### 维护机制（P1 · 谁让 INDEX 不腐化）
- **责任人**：主理人（游承峰）统筹；具体回写由对应阶段负责 agent 在产出时顺手更新。
- **触发时机**：每次**里程碑切换 / 发布**（Phase 7）时，`release-ops-lead` 把关把「回写 INDEX §3 进度 + §8 分工」列入发布清单必做项。
- **铁律**：进度/分工有变 → 先改 `PROJECT-STATUS.md`（权威） → 再回写本文件对应节；保持单一事实源。

---

## 10. 避坑清单（血泪）

- ❌ **删 `index.html` / `index1.html`**：部署源文件，删了构建坏（真实事故）。
- ❌ **改 `.gitignore` 用 `!` 重新包含被忽略目录**：git 不支持（对被排除目录/条目无效），改用 `git add -f` 或换位置。
- ❌ **绝对路径 `/...` 内部链接**：`/短名/` 路由下 404，一律相对路径。
- ❌ **对 `main` / 共享分支 `force push`**：多机器协作致命；agent 工作线仅可用 `--force-with-lease`。
- ⚠️ **Windows CRLF 假差异**：本地 build 产生 CRLF，与云端 LF 的"差异"内容一致、不影响部署，可 `git checkout` 还原。
- ⚠️ **stash 未跟踪文件在 `stash@{n}^3`**：普通 `git checkout stash@{n}` 取不到，用 `git checkout "stash@{n}^3" -- <path>`。
- ⚠️ **名词歧义**：`README` 的"痛点为王 ≥3 痛点"是产品级要求；`BRAND` 的"痛点滤网任一即可"是视觉/界面决策级——层级不同，非矛盾。

---

## 11. 术语表

- **SEED / 信封**：brain 产出的内容配置 JSON（老板台词 / 骑手台词等），waimai / mart 运行时消费。
- **DRAMA 引擎**：waimai 的剧情分支引擎（`whoknow-waimai/src/engine/`）。
- **forbidden_check**：禁忌词校验闸门（`red_light_count===0` 才落盘）。
- **锡哥 / 錡哥**：品牌创始人侧；锡哥手动生成 brain 信封，"AI 更新"水印是戏称非真定时 AI。
- **M1–M4**：里程碑。
- **三司会审**：明辨诀（朱熹）/ 破妄诀（慧能）/ 五行诀（老子）审计编排层，见 `whoknow-brain/docs/sanshi-hui-shen-package/`。

---

## 12. 文档导航与权威链

权威：总纲 ＞ 结构规范 ＞ 各 app 文档；**多机协作角色 / 红线以 [`ROLES.md`](docs/studio/ROLES.md) 为准**（INDEX 仅作导航摘要，细则以该文件为准，避免双文档漂移）。

| 查询目标 | 查阅文档 |
|---|---|
| 项目全貌 / 决策 | [`胡闹宇宙总体设计方案.md`](胡闹宇宙总体设计方案.md) |
| 铁律 / 约定 | [`CONSTITUTION.md`](CONSTITUTION.md) |
| 文件归位 / 移动删除 | [`docs/studio/REPO-STRUCTURE-CONVENTION.md`](docs/studio/REPO-STRUCTURE-CONVENTION.md) |
| 当前进度 / 开放项 | [`docs/studio/PROJECT-STATUS.md`](docs/studio/PROJECT-STATUS.md) |
| 多机协作 / 权限 | [`docs/studio/ROLES.md`](docs/studio/ROLES.md) · [`docs/studio/WIP.md`](docs/studio/WIP.md) |
| 多会话并行协作区分 | [`docs/studio/MULTI-SESSION-WORKING-PROTOCOL.md`](docs/studio/MULTI-SESSION-WORKING-PROTOCOL.md) |
| Git 工作流 / 分支策略 | [`docs/studio/GIT-WORKFLOW.md`](docs/studio/GIT-WORKFLOW.md) |
| 新机器身份初始化（兜底） | 见 §6「DuckyPC 接入操作清单（内联 · 粘贴即用）」 |
| 品牌视觉 | [`BRAND.md`](BRAND.md) |
| brain 信封契约 | [`whoknow-brain/docs/api-spec.md`](whoknow-brain/docs/api-spec.md) |
| 跨设备记忆 | [`docs/studio/memory/PROJECT-MEMORY.md`](docs/studio/memory/PROJECT-MEMORY.md) |
| 三司会审能力 | [`whoknow-brain/docs/sanshi-hui-shen-package/`](whoknow-brain/docs/sanshi-hui-shen-package/) |

---

---

## 13. 大脑方案讨论 · 进行中（WIP · 2026-07-26 夜 · 待续）

> 🦆 **下次开机从哪接**：直接读本节 + 下面的两份文档，从 **Q0.0 拓扑立场对齐** 继续拍板。讨论闭合前**不动任何代码**。

**缘起**：大脑（whoknow-brain）是胡闹宇宙核心中枢，开发须"先设计后构建、前期讨论透彻"，对其设 **design-lock gate**（严于 full 评审）。为让讨论有结构，建了方案讨论计划并做三司会审。

**已落盘产物（续接用）**：
- [`whoknow-brain/docs/DISCUSSION-PLAN.md`](whoknow-brain/docs/DISCUSSION-PLAN.md) — 大脑底层架构方案讨论计划：7 章 28 题，每题含 前因后果 + 多方案 + 优劣评比表 + 最终推荐(带理由) + 举一反三。
- [`whoknow-brain/docs/DISCUSSION-PLAN-AUDIT.md`](whoknow-brain/docs/DISCUSSION-PLAN-AUDIT.md) — 三司会审报告（2026-07-26）。结论 = **条件性通过（不通过作 Phase 3 依据）**；两大 P0：① 拓扑双重真相（地基裂缝）② 锁闸是愿望不是闸门。

**🔴 当前卡点（必须先决）· Q0.0 拓扑立场对齐**：
- **矛盾**：DISCUSSION-PLAN 默认 **拓扑 A（构建期静态内容管道）**；但 `whoknow-brain/docs/api-spec.md`（**v2.1**，被 `CONSTITUTION` L2-C4 指为契约权威）实为 **拓扑 B（运行时中枢）**——含 `collector`（玩家反馈/服务器心跳）、REST `/api/v1`、cron 03:00、服务端审核、HMAC、"锡哥放手时 brain 接管运营"。两份互斥。
- **已展开选项**（详见 DISCUSSION-PLAN-AUDIT / 主理人 Q0.0 提案）：方案1 推翻 api-spec 改投 A ／ 方案2 保留 B 并调和铁律 ／ **方案3 混合（A 静态基座 + B 能力推迟路线图，主理人推荐）**。
- **下一步**：Ducky 拍板 Q0.0 选 1/2/3 → 回写 DISCUSSION-PLAN（加 Q0.0 + 校准事实：api-spec 实 v2.1 非 v2.2 + 在 `.githooks/pre-commit` 落钩子把锁闸变真闸门）→ 进 D1 定位边界。

**待补（讨论闭合前）**：design-lock gate 尚未 codify 进 `CONSTITUTION`（缺 design-lock 条款）；锁闸空闸门需在 pre-commit 加 `whoknow-brain/**` 未 CLOSED/缺 ADR 拦截。

**已知过程异常（已隔离，未决）**：三司会审窗口内 `whoknow-waimai` 引擎被改出 `priority` 优先级层（正是 19:13 真人试玩 bug 的修复选项 A，当时标"待拍板未动代码"）。已 `git stash` 隔离（来源存疑，待 Ducky 确认归属）。本回合未动它。

---

_本文件是项目总入口。任何 agent 拉取项目后应**先读此处**再动手。内容随里程碑更新，旧信息以对应详文档为准；若发现本文件与详文档冲突，以详文档 + 权威链为准，并提 PR 回扫本文件。_
