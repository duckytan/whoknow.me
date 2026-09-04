# whoknow-brain · STATUS

brain 单一进度锚 · 对齐 docs/studio/STUDIO-PROGRESS.md 表格式 · 2026-09-04 由 701-PC 实测校准

> 定位：brain 的唯一七阶段进度锚。此前 brain 段依附 docs/studio/STUDIO-PROGRESS.md，
> 该文档由 waimai 主导、brain 段无可解析表，导致工作台把 brain 误报为 planning / 0 测试。
> 本文件建立后，whoknow-workbench/scripts/gen-metrics.mjs 的 brain 段 phaseDoc 与 testProbes 指向本文件。

## 七阶段表

| # 阶段 | 状态 | 证据 |
| --- | --- | --- |
| 1 概念孵化 | ✅ 完成 | BRAIN-PLAN.md 终态设计 + M0-M2 定标（双评审收口 2026-07-29） |
| 2 系统设计 | ✅ 完成 | api-spec.md v2.2 契约（信封 6 字段 + 4 级降级 + 水印 + 人工审核落盘） |
| 3 技术搭建 | ✅ 完成 | src 骨架（assemble/cli/config/contracts/deploy/release/storage）；`npm test` **77/77** |
| 4 预制作 | ✅ 完成 | seed 脚本齐（seed-brain-data / seed-platform-config）；首版 waimai 发布产物（releases/waimai/2026-08-16.001.json） |
| 5 制作（M1） | 🔶 进行中 | M0-M2 手动配置内容流；无 cron / 无审核台 UI（属 M3 自动化范畴） |
| 6 打磨 | ⬜ 未开始 | — |
| 7 发布 | ⬜ 未开始 | lean 发布链路已验证一次（releases/waimai/2026-08-16.001） |

## 测试锚

- `npm test` **77/77**（2026-09-04 由 701-PC 在 whoknow-brain 实跑，77 项用例全部通过）

## 口径说明

- 表格式对齐解析器约定：首列为「序号 + 阶段名」合写（`| 1 概念孵化 | 状态 | 证据 |`），与 docs/studio/STUDIO-PROGRESS.md 七阶段表同构。
- 阶段判定同口径：连续 ✅ 计数；🔶 记进行中、不计入完成数；⬜ 未开始。
- 数据消费方：whoknow-workbench/scripts/gen-metrics.mjs（brain 段 phaseDoc / testProbes）。
- 表述遵守 L2-C9：仅记录可核查事实，不做主观评价、不使用第一人称。
