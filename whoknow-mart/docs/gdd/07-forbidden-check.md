# 🛒 胡闹导购 · 系统 GDD 07 · 禁忌词校验（forbidden_check · 共享契约）

> **版本**：v1.0 · 2026-07-26 · design-strategist
> **层**：契约（横切所有层）· MVP 必做（静态文案已过终审）
> **上游**：`00-CONCEPT.md` §0.2(#5)§9.5（红线 0 容忍）· `DATA-STRUCTURE-v1` §2.7（forbidden_check）· `mart-禁忌词终审.md`
> **下游**：横切 01–06 / 08 全部文案与资产

---

## 1. 机制（Mechanics）

所有 mart 文案/资产（导购台词/招式文案/吐槽分支/店名/价格占位/UI 微文案）须过 `forbidden_check`。红灯 0 容忍：`red_light_count > 0` → **整包拒绝**（L1-T1 / L2-C4），走 L4 降级诚实告知「今天没新段子」。

- **MVP 静态文案**：已过终审（`mart-禁忌词终审.md`），「智商税」为反骨劝退话术（吐槽商品非攻击用户）保留。
- **运行时（v2 接 brain）**：`forbidden_check` 常驻，每包先验红灯。
- **黄灯化名**：竞品品牌→某宝/某团；真人名→某明星；真实地名→京城（§9.5）。

## 2. 数据（Data）

复用 waimai `forbidden_check` 结构（DATA-STRUCTURE §2.7）：

```jsonc
forbidden_check: {
  "version": "1.0",
  "red_light_count": 0,     // >0 → 整包拒绝
  "yellow_light_count": 0,  // 黄灯 → 化名处理
  "passed": true
}
```

- 封信封内（`meta/soul_layer/ui_meta/...` 同信封，§2.1）。
- mart 消费同信封 `forbidden_check`，**不修改** waimai 文件。

## 3. 状态（State）

| 态 | 条件 | 处置 |
|----|------|------|
| `PASS` | `red_light_count === 0` | 正常渲染（L1/L2/L3 降级文案映射） |
| `REJECT` | `red_light_count > 0` | 整包拒绝 → L4 降级（api-spec §降级 L4） |
| `YELLOW` | `yellow_light_count > 0` | 黄灯词化名替换（某宝/某明星/京城） |

## 4. 边界（Boundaries）

- **mart 不修改 waimai 文件**（L1-T5 红线）；仅消费共享 `forbidden_check`。
- 已洗台词（行动项 A）不得回潮（§9.5）。
- 红线已洗字段（icu/bomb/food_poison/...）在结构层已退役（DATA-STRUCTURE §7），mart 不引入。

## 5. 失败模式（Failure modes）

| 失败 | 表现 | 处置 |
|------|------|------|
| 红灯泄露 | 任意屏出现红线词 | 整包拒绝回退 L4（配置污染，否决#3） |
| 静态文案回潮 | 行动项 A 已洗词复现 | 二审（v2 路线图 W5）拦截 |
| 黄灯未化名 | 某宝写「淘宝」原词 | 黄灯规则强制化名替换 |
| 降级后仍渲染 | REJECT 后仍出戏精 | L4 诚实告知，禁出敏感内容 |

## 6. 数值占位（[待测试]）

| 项 | 占位 | 标定 |
|----|------|------|
| 红灯阈值 | `0`（硬 0 容忍） | 不可调 |
| 黄灯处理 | 化名替换（规则固定） | 不可调 |

## 7. 契约对齐（Contract alignment）

- **直接复用** `forbidden_check`（§9.1，零改写）：`red_light_count > 0` 整包拒绝；mart 走 L4 降级。
- **4 级降级**复用 api-spec（§9.1）：`fallback.mart` 形状 == `L1.mart`。
- **不修改 waimai 文件**（L1-T5）。

## 8. 验收（Acceptance）

- [ ] 任意屏出现红线词 → 整包拒绝，绝不渲染敏感内容（否决#3 机检通过）。
- [ ] 黄灯词（竞品/真人/地名）全部化名（某宝/某明星/京城）。
- [ ] 降级时诚实告知「今天没新段子」，已落盘 L3 记忆不丢（DATA-STRUCTURE §8.2）。
- [ ] mart 未修改任何 waimai 文件（L1-T5 红线遵守）。

---

_系统 GDD 07 · 禁忌词校验 v1.0 · design-strategist · 2026-07-26_
