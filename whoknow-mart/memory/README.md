# 🧠 whoknow-mart · memory（防失忆占位）

> 本目录规划自总纲《胡闹宇宙总体设计方案.md》§5 与 `whoknow-mart/docs/`，用于存放 mart 的「防失忆」笔记——跨会话的设计决策、拍板、坑点。
> 当前（2026-07-25）mart 冻结期，正式 memory 笔记待 M1 解冻后随开发累积。

## 已沉淀的核心决策（指针，不重复）
- 概念设计 + 复用边界：见 `docs/mart-MVP-概念设计-v0.1.md`
- 契约对齐（复用什么 / 自建什么）：见 `docs/mart-复用契约对齐清单.md`
- 主责分工：mart 由本会话主理人（游承峰）负责；外卖（waimai v2）由另一 workbuddy 开发。

## 防失忆铁律
1. 凡外卖 `DATA-STRUCTURE-v1` 字段变更，mart 直接跟，不另起命名（避二义坑）。
2. 所有 mart 话术过 `forbidden_check` 红灯 0 容忍。
3. 好感度 / 招式数值均为 `[PLACEHOLDER]`，以 playtest 笑率为唯一标定依据。
