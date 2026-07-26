# 胡闹宇宙 · 多 WorkBuddy 协作章程（ROLES）

> 目的：本仓库由**多个 WorkBuddy 实例并行协作、共享同一 GitHub 仓库**。本文件界定各实例的身份、独占范围与协作红线，避免重复劳动与互相覆盖（git 冲突 / 改动互毁）。
> 配套必读：`docs/studio/REPO-STRUCTURE-CONVENTION.md`（文件结构规范，所有实例必须遵守，尤其 §7 防再犯双闸门）。
> 本文件是"**地图**"；每个实例"我是谁"由本机计算机名 + 本文件 §0 映射**自动定位**（结论缓存于本地，见 §4）。

## 0. 身份识别（计算机名驱动）
本仓库由两台物理机器上的 WorkBuddy 实例并行协作。身份通过**计算机名（`$COMPUTERNAME`）**自动识别，无需人工逐一分配台词。

- **锚点**：计算机名在本多机场景稳定且语义明确（`701-PC` / `DuckyPC`），作为身份锚点足够；如需更强唯一性（如同机多实例），可叠加 MachineGuid：`(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Cryptography').MachineGuid`。
- **自动定位**：每个实例启动读本机 `$COMPUTERNAME`，对照下表定位自己的角色与范围，并可将结论缓存到本地（见 §4）。
- **机器名 → 角色映射**：

  | 计算机名 | 角色 | AI 自称 | 负责范围 |
  |---|---|---|---|
  | `701-PC`（本机）| **Agent-商城** | 胡叨叨 🦆 | `whoknow-mart/` + `whoknow-brain/`（契约中枢）|
  | `DuckyPC` | **Agent-外卖** | （待该实例自定后回填本表）| `whoknow-waimai/` + 主站前端（`data/` `styles/` `js/` `index*.html`）|

- **仓库只放"地图"，不放"角色定位结论"**：映射表（本文件）入库共享；"我是谁 / 我负责啥"的**定位结论**缓存到本机 gitignored 的 `.workbuddy/memory/`，不与另一台冲突。但**对协作可见的称呼约定**（见下）必须入库共享，否则双实例无法对齐"对方叫什么、用户叫什么"。

### 统一称呼约定（双实例对齐用，入库共享）
- **用户（你）**：`duckytan`，统一称呼 **「Ducky」**。两实例均以此称呼用户，与其本地 `USER.md` 是否存在无关。
- **本机 AI 自称**：`701-PC` 实例自称 **胡叨叨 🦆**（已于本机 `IDENTITY.md` 固定）。
- **DuckyPC AI 自称**：该实例尚未初始化本地身份文件（`USER.md` / `IDENTITY.md` 均不存在），自称**待其在本地 `IDENTITY.md` 自定后回填上表**。在回填前，本机以 **Agent-外卖** 指代之。
- 若需两实例自称风格统一，由各自在本地完成初始化，并把最终自称回填本表"AI 自称"列（单一事实源原则，§2.6）。

## 1. 实例与范围（Identity × Scope）
| 实例标识 | 所在机器 | 负责范围（独占） | 说明 |
|---|---|---|---|
| **Agent-外卖** | `DuckyPC` | `whoknow-waimai/`、`data/`、`styles/`、`js/`、`index.html`、`index1.html` | 外卖 App 全栈 + 主站门面前端 |
| **Agent-商城** | `701-PC`（本机）| `whoknow-mart/`、`whoknow-brain/`（契约中枢）| 商城 App + 宇宙级契约中枢 |
| **共享 / 协调（须协商）**| — | `胡闹宇宙总体设计方案.md`、`README.md`、`BRAND.md`、`vercel.json`、`archive/`、`docs/studio/`（除本文件与 WIP.md 外）| 跨切面文件，改动须通知另一实例并经人工确认 |

> 范围划分是**建议值**，可按实际工作流调整；调整后须双方一致并回写本表与 §0 映射。

## 2. 协作红线
1. **独占范围互不越界**：非本实例负责的目录 / 文件，不得擅自修改；确需改动须先在对话中知会负责实例并取得同意。
2. **共享文件改前协商**：对"共享 / 协调"列文件，任何实例改动前须：(a) 说明意图；(b) 等另一方 ack 或人工拍板；(c) 改动后同步告知。
3. **开工前先 pull**：每次会话开始先 `git pull`（或确认本地与 `origin/main` 一致），避免基于过期代码产生冲突。
4. **§7 防再犯双闸门全员适用**：文件归档 / 移动 / 删除前必 `grep` 核查部署 / 运行依赖；修订后必全文回扫对齐，杜绝同文档两处结论相反。
5. **冲突预防（二选一）**：
   - 软隔离（推荐起步）：串行——一方改完 `push`，另一方 `pull` 后再改；
   - 硬隔离：各自在本地分支（如 `agent-waimai` / `agent-mart`）开发，以 PR 合入 `main`。
6. **单一事实源**：跨实例的约定只在本章程 + 结构规范中定义，不各写各的。

## 3. 在制（WIP）通报
- 长任务开工前，在 `docs/studio/WIP.md` 记一行：`[机器名/角色] 任务简述 @ 文件`，结束划掉。
- 另一实例开工前先扫 `WIP.md`，避免双改同一文件。
- `WIP.md` 属共享文件，按 §2.2 协商规则维护。

## 4. 身份识别与本地缓存（计算机名驱动）
> 为何"我是谁"放本地而非入库：仓库文件对两实例可见，无法自我标识读者；身份结论须放本地（gitignored 的 `.workbuddy/memory/`），与另一台互不覆盖。

**自动定位流程**（每个实例启动时）：
1. 读本机 `$COMPUTERNAME`（Windows PowerShell：`$env:COMPUTERNAME`）。
2. 对照 §0 映射表：`701-PC` → Agent-商城，`DuckyPC` → Agent-外卖。
3. 把结论缓存到本机项目级 `D:\AI-Project\whoknow.me\.workbuddy\memory\MEMORY.md`，例如本机（701-PC）写：
   > 本机计算机名 `701-PC` → **Agent-商城**，负责 `whoknow-mart/` + `whoknow-brain/`。只动我的范围；共享文件改前先协商；遵守 §7 双闸门。详见 `docs/studio/ROLES.md`。
4. DuckyPC 实例缓存对应：本机 `DuckyPC` → **Agent-外卖**，负责 `whoknow-waimai/` + 主站前端。

> 缓存仅为加速；即使不缓存，每次读 `$COMPUTERNAME` + §0 映射表也能正确定位。

## 5. 新实例接入（含"如何确保实例真的读本文件"）
> ⚠️ **机制局限（必读）**：WorkBuddy 每次会话**自动注入**的只有「用户级 `~/.workbuddy/IDENTITY.md`」与「项目级 `.workbuddy/memory/MEMORY.md`」，二者**都不随仓库同步**（前者用户级、后者 gitignored）。仓库里会同步的文件（含本文件）**没有任何自动加载机制**，必须主动 Read。因此：**约定写进本仓库 ≠ 各实例会读**；若某台未初始化本地指针，新建对话会遗忘本约定、可能越界协作。

**接入第 0 步（治本，必须做）**：在本机用户级 `~/.workbuddy/IDENTITY.md` 写入身份指针，使 WorkBuddy 每次会话自动注入"去读本文件"的记忆。例（DuckyPC）：
> 本机计算机名 `DuckyPC` → **Agent-外卖**，负责 `whoknow-waimai/` + 主站前端。**每次会话开始先读 `docs/studio/ROLES.md`**。详见该文件 §0。
（`701-PC` 实例等价于靠 workspace memory 自动注入实现同样效果，见 `.workbuddy/memory/MEMORY.md`。）

**接入后续步骤**：
- 拉取仓库后先读：`ROLES.md`（§0 机器名映射）→ `REPO-STRUCTURE-CONVENTION.md` → 本地身份缓存。
- 若新增第三台机器：在 §0 映射表 + §1 增列自身行（机器名 → 角色 → 范围），并写入本机身份文件（第 0 步）。
- 现成执行清单见 `docs/studio/AGENT-WAIMAI-SETUP.md`（DuckyPC 可直接照做，粘贴即生效）。
