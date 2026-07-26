# 🛒 胡闹导购 · 系统 GDD 03 · 破防度引擎（affinity · 反骨版）

> **版本**：v1.0 · 2026-07-26 · design-strategist
> **层**：L1（配置）+ L2（运行时数值）· MVP 必做
> **上游**：`00-CONCEPT.md` §3.1（破防度）§4.3（状态量）§6.1（破防度引擎）· `mart-L1-datastructure-draft.md` §4
> **下游**：`02-selection-statemachine.md`（消费 delta）· `06-drama-dialog-ui.md`（meter 渲染）· `08-screenshot-share.md`（结局卡）

---

## 1. 机制（Mechanics）

破防度（mart 语义的 `affinity`）是博弈数值核心：0~100 区间，驱动双重胜利判定。

- **增减规则**：命中隐藏弱点 `+40` / 踩雷 `−10` / 平手 `+10`（由 02 状态机根据矩阵结算）。
- **双胜利态**：
  - `affinity >= 100` → **破防态**（导购叹气放行）。
  - `affinity <= 0` → **反消费胜利态**（劝退 = 省了钱，也是赢）。
- **双胜利均为 success 语义**：归零态是「反消费胜利」，**绝不**是「输/失败」（反骨定义 §五，G-4 门）。

## 2. 数据（Data）

**L1 配置（L1.mart.affinity）**：

```jsonc
affinity: {
  "initial": 50,          // [待测试] 反骨建议 30~40
  "min": 0,
  "max": 100,
  "winState": "破防态",     // >=100
  "loseState": "反消费胜利态" // <=0（注：非 lose，是第二赢法）
}
```

**L2 运行时**：`MartRoundState.affinity: number` ∈ [0,100]（见 02 §2）。
**L3 持久化**：`UserStats.affinity: Record<guideId, number>` 键前缀 `whoknow:mart:`（复用 waimai 结构，mart 语义=破防度）。

## 3. 状态（State）

| 态 | 区间 | 视觉/文案 |
|----|------|-----------|
| 低值·轻劝 | `0 < affinity ≤ 33` | 阶段文案「轻劝」；meter 色 `--mart-host` |
| 中值·狠劝 | `33 < affinity ≤ 66` | 阶段文案「狠劝」 |
| 高值·松动 | `66 < affinity < 100` | 阶段文案「松动」；meter 色渐变向 `--brand-green` |
| **破防态** | `affinity == 100` | 「服了，下单吧」success 绿框 |
| **反消费胜利态** | `affinity == 0` | 「省钱了，下次别来」success 绿框（非失败） |

## 4. 边界（Boundaries）

- `affinity` 仅内存流动（L2），不落盘为「进度」（P3 零负担）；L3 仅存历史峰值/计数供记忆与图鉴。
- **视觉禁忌**：破防度 meter **绝不**渲染成「财力/智商」标尺（ART-BIBLE §9.1 #4、§5.5）；劝退只调侃 NPC 自身。
- 颜色不独载：meter 必带数值（`--font-mono`，如「破防 72」）+ 阶段文案（WCAG，ART-BIBLE §7.2）。

## 5. 失败模式（Failure modes）

| 失败 | 表现 | 处置 |
|------|------|------|
| delta 累加越界 | <0 或 >100 | `clamp` 到 `[0,100]` |
| initial 越界 | 配置 initial 不在 [0,100] | 视为 50 兜底 |
| 语义混淆 | 误把 mart `affinity` 当 waimai 老板好感 | **EVOL-2** 注释标注（mart=破防度 0~100） |
| 双胜利渲染错 | 归零态画红叉 | 红线（§9.1 #5）→ 视觉自检拒收 |

## 6. 数值占位（[待测试] · 依 00-CONCEPT §10）

| 项 | 占位 | 标定 |
|----|------|------|
| 初始值 `initial` | `50*`（建议 30~40） | H2 笑率 + 胜任感 |
| 单轮 delta | `+40 / −10 / +10` | 说服爽度 |
| vip 阈值 | `10 次 或 affinity≥?` | 回访率 H6 |

## 7. 契约对齐（Contract alignment）

- **复用**：`UserStats.affinity` 键名 + 前缀 `whoknow:mart:`（§9.1）；`Rarity` 枚举做图鉴稀有度（§9.1）。
- **EVOL-2**：DATA-STRUCTURE 加 product-specific 注释——mart `affinity` 语义=破防度(0~100)，waimai=老板好感(−500~500)；无 schema 变更。
- **EVOL-6（NEW）**：`DramaEvent.moodDelta` 在 mart 语义目标=affinity（破防度），waimai= bossMood；文档注释层，无 schema 变更（详见 REVIEW §4）。
- **字段命名权威**：delta 用 `moodDelta` 语义（§9.3）；不引入新字段名。

## 8. 验收（Acceptance）

- [ ] 破防度 meter 带数值 + 阶段文案（色盲可凭数值理解，WCAG AA）。
- [ ] `>=100` 与 `<=0` 均渲染 success 语义（双胜利，绿框，无红叉）。
- [ ] 不渲染成「财力/智商」标尺（视觉红线 #4 通过）。
- [ ] L3 `affinity` 键前缀 `whoknow:mart:`，与 waimai `whoknow:waimai:` 不混。
- [ ] `EVOL-2` 注释在 DATA-STRUCTURE 落地（mart 语义标注）。

---

_系统 GDD 03 · 破防度引擎 v1.0 · design-strategist · 2026-07-26_
