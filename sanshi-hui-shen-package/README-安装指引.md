# 三司会审 Skill 套装 · 安装指引

> 打包日期：2026-07-25 · 适配环境：WorkBuddy（用户级 skill）
> 作者：周星星 🌟 · 拍板人：錡哥

---

## 一、这是什么

本压缩包是「三司会审」决策审计体系的**完整可移植套装**，包含 1 个编排层 + 3 个联动子 skill：

| 目录 | Skill 名（工具调用值） | 角色 | 内容 |
|------|----------------------|------|------|
| `sanshi-hui-shen/` | `sanshi-hui-shen` | **核心大脑 / 编排层** | 主控按任务动态组装审计流程，调度三司协同审查并出综合报告 |
| `ming-bian-jue/` | `ming-bian-jue` | 明辨诀（儒·朱熹）| 第一性原理 6+1 步法审查，主「对不对」 |
| `po-wang-jue/` | `po-wang-jue` | 破妄诀（释·六祖慧能）| 3 重妄执 × 12 截面穿透信念前提，主「信不信」 |
| `wuxing-jue/` | `wuxing-jue` | 五行诀（道·老子）| 5 维心法 + 8 关系平衡，主「全不全 / 久不久」 |

**联动关系**：`sanshi-hui-shen` 在审查阶段通过 WorkBuddy 的 `Skill` 工具，按 skill 名依次加载 `ming-bian-jue` / `po-wang-jue` / `wuxing-jue`。**四个必须一起安装**，只装编排层会找不到子 skill 而降级/报错。

---

## 二、文件清单

```
sanshi-hui-shen-package/
├── README-安装指引.md          ← 本文件
├── sanshi-hui-shen/
│   ├── SKILL.md
│   └── references/             ← changelog.md, state-machine.md
├── ming-bian-jue/
│   ├── SKILL.md
│   └── references/             ← CHANGELOG.md, auto-upgrade.md, checklist-17.md
├── po-wang-jue/
│   ├── SKILL.md
│   └── references/             ← CHANGELOG.md, v1.1.md, v1.2.md
└── wuxing-jue/
    ├── SKILL.md
    └── references/             ← FAQ.md, five-dimensions.md, eight-relations.md,
                                    evolution.md, external-review.md,
                                    cross-cultural-comparison.md, index.md
```

> 注：源机器 `sanshi-hui-shen/` 下还有若干 `*自审报告*.md`、`*整改*.md` 等开发审计杂稿，
> 它们不是 skill 运行所需，已**有意排除**，保持安装包干净。

---

## 三、安装方法（推荐：直接复制）

WorkBuddy 的用户级 skill 目录为 `~/.workbuddy/skills/`（Windows 即 `%USERPROFILE%\.workbuddy\skills\`）。
只需把本包里 **4 个 skill 目录**整目录复制进去即可，**无需注册、无需改配置**。

### Windows

1. 解压本压缩包。
2. 打开资源管理器，地址栏输入 `%USERPROFILE%\.workbuddy\skills` 回车，进入 skill 目录。
   （若不存在，新建 `skills` 文件夹。）
3. 把 `sanshi-hui-shen`、`ming-bian-jue`、`po-wang-jue`、`wuxing-jue` 四个文件夹
   整体**复制**进 `skills\` 目录。
4. 最终结构应为：
   ```
   C:\Users\你的用户名\.workbuddy\skills\
   ├── sanshi-hui-shen\SKILL.md
   ├── ming-bian-jue\SKILL.md
   ├── po-wang-jue\SKILL.md
   └── wuxing-jue\SKILL.md
   ```

### macOS / Linux

```bash
# 1. 解压后进入包目录
cd sanshi-hui-shen-package
# 2. 复制到用户级 skill 目录
mkdir -p ~/.workbuddy/skills
cp -r sanshi-hui-shen ming-bian-jue po-wang-jue wuxing-jue ~/.workbuddy/skills/
```

### 项目级安装（可选）

若只想在某个工程内生效（不污染全局），复制到该工程的：
`{工程根目录}/.workbuddy/skills/`
效果同上，仅作用于该工程。

---

## 四、验证安装

1. 重启 / 刷新 WorkBuddy（让 skill 索引重新加载）。
2. 在对话框输入 `/skills`（或查看可用 skill 列表），应能看到
   `sanshi-hui-shen`、`ming-bian-jue`、`po-wang-jue`、`wuxing-jue` 四个。
3. 直接说「**三司会审**」「**会审**」「**三诀会审**」触发编排层；
   或单独说「明辨诀」「破妄诀」「五行诀」触发对应子 skill（单司独审模式）。

> 触发成功标志：主控进入「深度理解 → 制定计划 → 执行跟进 → 报告闭环」四阶段，
> 并在阶段 3 调用子 skill。

---

## 五、使用要点

- **触发词**：`三司会审` / `会审` / `三诀会审`；重大决策（跨文件改动、改核心架构、加新铁律、新建项目）也会自动建议走会审。
- **三种模式**：
  - 简化（仅 `ming-bian-jue` 单司）
  - 默认（明辨诀 + 命中的其他司）
  - 圆桌（三司全跑，高 stakes 默认并行 Agent 隔离）
- **跳过模式**：日常问答、单文件小改、已 cron 自动化的任务，编排层会自动建议跳过会审。
- **子 skill 名务必精确**：五行诀的 Skill 名是 `wuxing-jue`（无连字符）。原包曾误写作 `wu-xing-jue`，已修正，请勿改回。
- **运行时落档**：会审过程会把「接力棒」写入当前工程的
  `.workbuddy/memory/sanshi-tasks/<task-id>.md`，首次使用会自动建目录，无需手动创建。
- **圆桌并行模式**依赖 WorkBuddy 的 sub-agent（Agent）能力；若版本不支持，自动降级为串行，功能不受影响。

---

## 六、已知适配说明（从 OpenClaw 迁移到 WorkBuddy）

- **跨 skill 调用**：不再是文件路径互调，而是主控用 `Skill` 工具按 skill 名加载。
- **落档路径**：统一使用工程相对路径 `.workbuddy/memory/…`，换机器/换工程都能自适应。
- **多 agent**：WorkBuddy 为单机单主 agent，圆桌并行通过 sub-agent 隔离实现，跨司印证由主控中转。
- 原 OpenClaw 的 `versions/` 历史归档、`lessons-learned/` 教训文档等**未随包移植**（日常使用不需要），
  新机器的教训请自行在 `.workbuddy/memory/lessons-learned/` 逐步积累。

---

## 七、版本

- 三司会审（sanshi-hui-shen）：v2.8.4 · 2026-07-25
- 明辨诀（ming-bian-jue）：v3.0.2
- 破妄诀（po-wang-jue）：v1.3
- 五行诀（wuxing-jue）：v4.0.4（WorkBuddy 移植版）

---

## 八、卸载

删除 `~/.workbuddy/skills/` 下对应的四个目录即可，无残留配置。
