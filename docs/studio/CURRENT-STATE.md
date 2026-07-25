# whoknow.me 当前状态快照（2026-07-26）
> 新会话首读。详细版见 workspace memory `C:\Users\Administrator\WorkBuddy\Claw\.workbuddy\memory\CURRENT-STATE.md`（若同 workspace 可直达）。

## 项目
- 本仓库 = 「胡闹宇宙」纯静态站，Vercel `https://whoknow.me`。双 App：`whoknow-waimai`(/waimai，M1已上线) + `whoknow-mart`(/mart，v1反骨原型已上线)，共用 `whoknow-brain`。
- 分工：waimai 由另一 workbuddy 开发；mart 由主理人(游承峰)主责。
- ⚠️ git：push 前必须 `git fetch` + `git pull --rebase origin main`（另一 workbuddy 常推 waimai）。

## 当前卡点
1. **waimai 真机 playtest 闸门（行动项C）未过**：CHECKLIST 要求"≥8真人×12单+填scorecard.csv"，用户 07-26 质疑不现实，主理人给 A轻量/B自然回收/C全量 三选项**未拍板**。该门现为上线后跟踪门（非阻塞）。
2. **mart 卡**：① 真机playtest需真人 ② M1接brain须等外卖`DATA-STRUCTURE-v1`字段落定（waimai仍在M1）。

## 关键文档（相对本仓库根）
- 总纲：`胡闹宇宙总体设计方案.md`（§11部署规范、行动项C）
- waimai playtest：`whoknow-waimai/docs/PLAYTEST-CHECKLIST-2026-07-25.md`、`whoknow-waimai/docs/playtest/RUNBOOK.md`、`whoknow-waimai/docs/playtest/scorecard-template.csv`
- mart 文档：`whoknow-mart/docs/*`、`whoknow-mart/dist/`
- 部署：`vercel.json`（7条：waimai 4 + mart 3）

## 环境限制
- 当前 WorkBuddy 会话无 spawn 子agent工具 → 主理人代行成员产出。

## 下一步
1. 等用户拍板 waimai playtest A/B/C
2. mart 等外卖字段落定 → 填 L1.mart + 实现选招制
3. mart v2 迭代
