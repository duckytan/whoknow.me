# EVOL-1 契约演进请求 · `DramaEvent.actor` 新增 `guide`

> 状态：🟡 待 waimai 主责人（DuckyPC / Agent-外卖）评审并落地
> 提出方：mart 主理人（游承峰，701-PC / Agent-商城）
> 日期：2026-07-26
> 性质：硬演进（共享契约变更，影响双方解析器）

## 背景

whoknow-mart 的导购事件需要「导购」这一说话者身份。现有共享 `DramaEvent.actor` 枚举（`whoknow-waimai/docs/specs/DATA-STRUCTURE-v1-2026-07-24.md` §3.3 L193）为：

```
boss | kitchen | rider | system
```

其中 `boss`=外卖老板、`rider`=骑手，均不匹配「导购」。mart 若复用 `boss` 会造成语义污染（与 waimai「老板」混淆），重演 v1 `speaker`/`actor` 二义坑。

## 请求变更

在共享 `DramaEvent.actor` 枚举新增一个值：

```
boss | kitchen | rider | system | guide
```

- `guide` = 胡闹导购（mart 说话者）。
- 仅新增枚举值，不改既有四值语义；不新增字段、不改既有字段名。

## 理由

- mart 概念文档 `00-CONCEPT.md` §9.4 EVOL-1 已登记为硬演进。
- 双方解析器须识别 `guide`，避免解析分歧（`mart-复用契约对齐清单.md` §6）。

## 影响与约束

- **mart 侧**：消费 `guide`，**不擅自修改 waimai 文件**（L1-T5 多 App 共存红线，由 701-PC 主理人约束）。
- **waimai 侧**：仅枚举扩展，现有 food 事件不受影响。
- 落地后：mart 在 Phase 5（接入 brain / 发真实事件）前须确认 `guide` 已生效。

## 验收清单

- [ ] `DATA-STRUCTURE-v1` §3.3 枚举含 `guide`
- [ ] `whoknow-brain/docs/api-spec.md` 信封示例 `mart` 同信封消费 `guide`
- [ ] 双方解析器单测覆盖 `guide`

## 处置建议

由 DuckyPC 在另一台机器（Agent-外卖工作线）执行枚举扩展 + 提交，701-PC 侧 mart 仅消费。扩展后请在 `docs/studio/WIP.md` / `ROLES.md` 注明，便于双实例同步。

## 关联

- 概念文档：`whoknow-mart/docs/gdd/00-CONCEPT.md` §9.4 EVOL-1
- 美术映射：`whoknow-mart/docs/art/ART-BIBLE.md` §2.5 / §4.2（5 导购 → waimai `--role-*` token 视觉映射，rider 不启用）
- 字段命名权威：`DATA-STRUCTURE-v1` L1-T4（`actor` 非 `speaker`）
