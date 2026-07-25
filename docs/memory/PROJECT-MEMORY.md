# whoknow.me 项目长期记忆（跨设备共享版）

> 本文件是 `.workbuddy/memory/MEMORY.md` 的**跨设备提炼版**，纳入 git，多设备 `git pull` 即一致。
> 详细铁律/约定见 `CONSTITUTION.md`；本文件只记"项目事实与历史决策摘要"。

## 项目定位
- 品牌：whoknow · 胡闹宇宙（whoknow.me，创始人 Ducky 錡 / 锡哥）
- 人格：胡闹 + Who knows? + 家人们谁懂啊。娱乐化、梗向、截图传播驱动
- 主体：个人开发者，无营业执照；Vercel 海外部署 + 纯广告模式；里程碑制 M1-M4，无固定工期

## 产品矩阵（whoknow-* 统一前缀）
| 子项目 | 定位 | 阶段 | 技术栈 |
|---|---|---|---|
| whoknow-waimai | 胡闹外卖：披美团外衣的虚拟外卖 | M1 已上线 `/waimai` | Vue3 + Vite + Vant + Pinia + vue-router + SCSS |
| whoknow-mart | 胡闹导购：披淘宝外衣的反骨导购博弈（选招制） | 概念 | 拟复用 Vue3+Vant |
| whoknow-brain | 胡闹控制中心：共用 AI 后台（导演角色，不上台） | 概念 | api-spec 已定义 |

## 铁律分层（详见 CONSTITUTION.md）
- **L1 真铁律(5)**：禁忌词0容忍 / 配置状态分离 / 不害人·不违法·不互相踩·人格统一 / 字段命名权威 / 多App共存红线（违反即事故）
- **L2 强约定(8)**：统一部署§11 / 内部相对路径 / Git代理 / brain信封契约 / 品牌视觉规范 / 发布硬闸门 / MVP兼容 / ⛔不要做清单
- **L3 当前纪律(8,带退出条件)**：三铁律（截图即胜利/零摩擦/零负担）/ 痛点为王(产品级≥3痛点) / 用户思维(能用?爽?传播?) / 截图价值优先 / 四大痛点滤网(决策级任一即可) / 锡哥审核 / 零负担不push / 编排者只编排不建造

## 工程约定
- **Git 代理**：fetch / 拉取 / 推送须走 `127.0.0.1:12000` 代理（克隆亦同）
- **部署路由（正确值）**：`vercel.json` `/waimai` → `whoknow-waimai/dist`（注意：**非** `waimai/index.html`，旧记已作废）
- **部署架构**：单 Vercel 整仓托管多 app；每 app 走 `/短名` rewrite → `whoknow-<app>/dist`；`.gitignore` 追加 `!whoknow-<app>/dist/` 例外

## 多设备 memory 同步策略（2026-07-26 落地）
- **主通道**：硬知识（铁律/约定/架构/决策）写成仓库文档（`CONSTITUTION.md` / `BRAND.md` / 总纲 / `docs/memory/`）靠 git 同步，多设备零冲突
- **用户级偏好**（跨项目）：用云盘（OneDrive/iCloud）同步 `~/.workbuddy`，或 symlink 到同步目录
- **每日工作日志**（`.workbuddy/memory/2026-*.md`）：留本机、不共享（含机器路径、append-only 易并发冲突）
- **隐式云层（L1）**：长期偏好由系统学进云端 profile 自动跨设备；历史用 `conversation_search` 回查
- **镜像**：`.workbuddy/memory/MEMORY.md` 已 `git add -f` 强制跟踪作本机镜像

## 关键历史决策
- 2026-07-26：三司会审（sanshi-20260726-001）确认 12 条铁律方向合理但通胀，产出 `CONSTITUTION.md` 三层重分类
- 2026-07-26：M1 进度实证核查——`npm test` 45/45 绿、`npm run build` 通过、本地与线上零漂移
- 2026-07-24：品牌视觉规范 `BRAND.md` 创建（双主题 + 锚色 + design-tokens.css）
