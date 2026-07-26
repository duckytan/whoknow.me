# 胡闹宇宙 · Git 工作流规范（GIT-WORKFLOW）

> 适用范围：whoknow.me 仓库全部 WorkBuddy 实例（701-PC / Agent-商城、DuckyPC / Agent-外卖）及 Ducky 人工提交。
> 配套文档：`docs/studio/ROLES.md`（身份与范围）、`docs/studio/WIP.md`（在制通报）、`CONSTITUTION.md` L2-C9（客观表述）。
> 本文件为单一事实源，覆盖 `ROLES.md` §2.5「硬隔离」选项的落地细则。落地日期：2026-07-26。

## 1. 现状与根因（2026-07-26 诊断）

- **现象**：全部提交直接落到 `main`；701-PC 与 DuckyPC 两台机器各自向 `main` 推送，易触发 non-fast-forward 拒绝。
- **根因 1**：无特性分支 / 无 PR 闸门，`main` 同时被两个自治实例直接写入，缺隔离。
- **根因 2**：旧指引建议「push 前 `git pull --rebase origin main`」——在 `main` 上 rebase 后强推 `main` 属高危操作（改写共享历史）。
- **根因 3**：提交类型不统一（出现 `recover:`、裸 `Merge branch` 信息），干扰 `git log` 与变更追踪。
- **根因 4**：冲突预防依赖人工登记 `WIP.md`，无结构性保证。
- **目标**：保护 `main` 始终可部署；两实例工作线隔离；提交可追溯、可 bisect。

## 2. 目标分支模型

```
main  ─────●────────●────────●────  （受保护，始终可部署，仅经 PR 合入）
            ↑        ↑        ↑
   (squash) │ (squash)│ (squash)
            │        │        │
agent-mart  ─●──●──●─┘        │       （701-PC / Agent-商城 工作线）
agent-waimai ─●──●──●─────────┘       （DuckyPC / Agent-外卖 工作线）
            （特性并行时再从各自 agent 线切 feat/* 短分支）
```

- `main`：受保护分支，禁止直接 push；只接收来自 `agent-*` 线的 squash 合入（需 CI 绿）。
- `agent-mart`：Agent-商城（701-PC）持久工作线，对应范围 `whoknow-mart/` + `whoknow-brain/`。
- `agent-waimai`：Agent-外卖（DuckyPC）持久工作线，对应范围 `whoknow-waimai/` + 主站前端。
- `feat/*` / `fix/*`：单任务短分支，从所属 `agent-*` 线切出，完事即合回并删除。

## 3. 日常流程（以 701-PC / Agent-商城 为例，DuckyPC 对称）

### 3.1 开工

```bash
git fetch origin
git checkout agent-mart
git rebase origin/agent-mart      # 先追上远端自己的线
```

### 3.2 提交（原子 + Conventional）

- 每次提交只做一件事；信息格式 `<type>(<scope>)?!?: <subject>`。
- 允许 type：`feat` `fix` `docs` `chore` `refactor` `test` `style` `perf` `build` `ci` `revert`。
- ⚠️ 禁止 `recover:`（改用 `fix:` 或 `chore:` 并说明）；禁止裸 `Merge branch` 信息。
- 示例：`fix(mart): 修正结算页数量越界` / `docs: 更新商城 v1 部署说明`。

### 3.3 同步（关键：rebase 所属 agent 线，绝不 rebase main）

```bash
git fetch origin
git rebase origin/main                      # 把你的 agent 线变基到最新 main 之上
git push --force-with-lease origin agent-mart   # 仅强推自己的线，且用 --force-with-lease
```

- 🚫 禁止在 `main` 上执行 `git pull --rebase` 后强推 `main`。

### 3.4 提升（合入 main）

1. 在 GitHub 对 `agent-mart` → `main` 开 PR（github 连接器接入后由 `gh` 执行；详见 §6）。
2. 等 CI 构建检查通过（Vercel 构建或 GitHub Actions，见 §7）。
3. 以 **squash** 方式合入，单条 conventional 提交信息；合后保留 `agent-mart` 作常驻工作线（仅需在重置时从 `main` 删除重建）。

## 4. 冲突预防（与 ROLES / WIP 协同）

- 独占范围（`ROLES` §1）互不越界；各实例只动其 `agent-*` 线对应的目录。
- 共享文件（`docs/studio/` 除本文件与 `WIP.md`、`README.md`、`BRAND.md`、`vercel.json` 等）改动前按 `ROLES` §2.2 协商，并在 PR 中自然形成审阅闸门。
- 长任务开工仍登记 `WIP.md`（`ROLES` §3），作为结构性隔离之外的冗余保险。

## 5. 提交规范速查

| type | 用途 | 示例 |
|---|---|---|
| feat | 新功能 | feat(mart): 新增选招制 |
| fix | 缺陷修复 | fix(waimai): 修复下单超时 |
| docs | 文档 | docs: 更新 ROLES 范围表 |
| chore | 杂项/构建 | chore: 升级依赖 |
| refactor | 重构 | refactor(brain): 抽离契约校验 |
| test | 测试 | test(mart): 补充结算单测 |
| style | 格式 | style: 统一缩进 |
| perf | 性能 | perf(brain): 缓存信封解析 |
| build | 构建系统 | build: 调整 vercel 构建脚本 |
| ci | CI 配置 | ci: 加构建检查 |
| revert | 回退 | revert: 回退 feat(mart) 选招制 |

## 6. 分支保护（Ducky 在 GitHub 执行）

github 连接器接入后，由 `gh` 设定（`main` 禁止直接 push、要求 PR、要求状态检查通过）：

```bash
gh api repos/duckytan/whoknow.me/branches/main/protection \
  --method PUT -f required_status_checks.strict=true \
  -f required_pull_request_reviews=0 -f enforce_admins=true \
  -f required_status_checks.contexts='["build"]'
```

（参数按实际 CI 名称调整；`enforce_admins=true` 连 Ducky 也受保护。）

## 7. CI 建议（防部署挂）

- Vercel 已随 push 到 `main` 自动构建；额外加 GitHub Actions `build.yml` 在 PR 上跑 `node build-for-vercel.js` 验证不报错（详见仓库 `.github/workflows/build.yml`，需实测）。
- 状态检查名记为 `build`，与 §6 保护规则对应。

## 8. 恢复与回滚

- 误提交未推：`git reset --soft HEAD~1` 撤回留改动。
- 已推需撤销：`git revert <sha>`（生成反向提交，安全）；禁止对共享分支 `git reset --hard` 后强推。
- 丢了提交：`git reflog` 找回 sha 再 `cherry-pick`。
- bisect 定位引入缺陷的提交：`git bisect start` → `git bisect bad` → `git bisect good <sha>`。

## 9. 本仓库 Git 配置（已落地，各机确认）

```bash
git config core.hooksPath .githooks        # 启用 L2-C9 预提交 + 提交规范检查
git config pull.rebase true                # git pull 默认 rebase，避免意外 merge commit
git config rebase.autoStash true           # rebase 前自动暂存未提交改动
git config branch.autoSetupRebase always  # 新分支默认跟踪 rebase
```

- DuckyPC 首次启用须同样执行上述 `core.hooksPath` 一行，否则跳过 L2-C9 钩子。
