# ADR-001 · 数据形状权威与跨文档字段对齐

> **状态**：Accepted（2026-07-25）
> **提出**：engineering-lead 程基岩（主理人代执行，环境无 subagent spawn）
> **裁决归属**：主理人 游承峰，依据 `whoknow-waimai/docs/analysis/TEAM-ANALYSIS-SUMMARY-2026-07-25.md` §2 P0-B
> **关联**：`DATA-STRUCTURE-v1-2026-07-24.md`（唯一权威）、`DRAMA-ENGINE-V2.md`、`DRAMA-SEED-v1-2026-07-24.json`、`GDD-v2-2026-07-24.md` §9.4
> **目的**：M1 写 DRAMA 解释器 / 渲染层前，先把 6 项跨文档字段二义钉死，否则按冲突文档编码必返工。

---

## 1. 背景（为何需要本 ADR）

`TEAM-ENGINEERING` 与 `TEAM-DESIGN` 审计均指出：设计文档总体完整，但 **M1 落地的底层数据形状在四份文档间互相打架**。若直接按任意单份文档编码，会在以下字段上静默出错或返工：

- `mood`（GDD §9.4）/ `moodDelta`（DATA / SEED）
- `speaker`（SEED / DRAMA §6.4）/ `actor`（DATA §3.3）
- 分支目录 **6 ≠ 7**
- `flag()` 语法（逗号双参 vs 花括号单参）
- flag 命名 `dark_survivor_*` vs `dark_dish_*` vs `odd_eats_*`
- chain 节点 `id` + `next:string[]` + `nextWeights` vs `next:string|null` 无 `id`

## 2. 决策

**以 `DATA-STRUCTURE-v1` 为唯一权威（Single Source of Truth）。**
`GDD §9.4`、`DRAMA-SEED`、`DRAMA-ENGINE` 三处向它对齐；任何文档冲突，**以本 ADR + DATA-STRUCTURE-v1 裁决**。

## 3. 六项字段决议（M1 必须遵守）

| # | 议题 | 决议（终态） | 废弃 / 纠正 |
|---|------|------|------|
| 1 | 情绪字段 | 唯一用 **`moodDelta`（number，可负）**。渲染层只读 `moodDelta`，因果链不丢。 | 废弃 `mood`（GDD §9.4 的 mood 示例降为非权威参考） |
| 2 | 说话者字段 | 唯一用 **`actor`（枚举，含 `kitchen` 等）**。 | 废弃 `speaker`（SEED 已迁移 `speaker`→`actor`，见 §5） |
| 3 | 分支目录 | **7 条为权威**：四阶段 accept/cook/deliver/complete 跨越 + `cheap_no_rider` / `fate_reunion` / `blacklist_reunion`。 | GDD §9.4 的 6 条扩为 7 |
| 4 | `flag()` 语法 | 标准化 **`flag(name)`**，单参；`name` 可含 `{shopId}` / `{riderId}` 插值（解析前由已知作用域替换）。 | 废弃逗号双参 `flag(a, b)` |
| 5 | flag 命名 | 统一 **`odd_eats_*`**（对齐 DATA §5.2）。 | 废弃 `dark_survivor_*` / `dark_dish_*`（旧名） |
| 6 | chain 节点 | 每节点含 **`id`（string） + `next: string[]` + `nextWeights?: number[]`**。 | 废弃 `next: string\|null` 且无 `id` 的形式 |

## 4. 字段终态速查（M1 解释器 / 渲染层按此实现）

```
分支节点（L2 运行时 / SEED）：
  id:          string            // 唯一
  actor:       string            // 说话者（枚举含 kitchen）
  moodDelta:   number            // 情绪增量，可负
  next:        string[]          // 后继节点 id 列表
  nextWeights?: number[]         // 与 next 等长，未给则均权
  remarkTag?:  string            // 由 OrderInput.remark 播种（P0-D 消费点）
  addressTag?: string            // 由 OrderInput.address 播种（P0-D 消费点）
  flag?:       string            // flag(name)，name 可含 {shopId}/{riderId}

OrderInput → 初始 tags 播种：
  remark   → remarkTag
  address  → addressTag
  （hasTag() / flag() 据此判定；seed 当前须补 remarkTag/addressTag 触发分支，见 P0-D）
```

## 5. 迁移状态（working tree 已落地的部分）

| 项 | 状态 | 证据 |
|----|------|------|
| SEED `speaker`→`actor` | ✅ 已迁移（working tree 未提交） | `TEAM-CLEANUP-PLAN` B2 |
| `dark_dish_*`→`odd_eats_*` | ✅ 已改名 | DATA §5.2 + cleanup B 注释行 |
| GDD §9.4（6→7、mood→moodDelta、persona） | ✅ 已改 | cleanup B1 |
| DATA-STRUCTURE §3.3/§3.6（`actor`/`moodDelta`/`next:string[]`+`nextWeights`+`id`） | ⚠️ 部分，须按本 ADR 复核终态 | 本 ADR 为最终裁决 |
| DRAMA-ENGINE 逐项对齐 | ⚠️ 进行中（12 行红线已洗，字段表述待核） | cleanup B3 |

> M1 开工前，`engineering-lead` 须以本 ADR 为基准通读 `DATA-STRUCTURE-v1` 全文，确保 §3.x 字段表与本节 §4 完全一致；如有出入，以本 ADR 为准修正 DATA-STRUCTURE。

## 6. 契约测试（防回归）

加 `whoknow-waimai/tests/config-contract.test.ts`（golden-file）：
- 锁定字段终态：`actor` / `moodDelta` / `next:string[]` / `nextWeights` / `id` 必存在且类型正确；
- SEED 7 分支全部可被解析器加载、无 `speaker` / `mood` / `next:string|null` 残留；
- `flag()` 仅接受 `flag(name)` 形式。
CI 中本测试与 `scan-product-surface.ts` 同为 M1 合并前置。

## 7. 后果

- M1 解释器 / 渲染层**以本 ADR + DATA-STRUCTURE-v1 为准**，不再引用 GDD §9.4 的字段示例。
- 任何后续文档冲突，由主理人按本 ADR 裁决，不在代码层临时打补丁。
- 本 ADR 与 `forbidden_check` 闸门同为 Phase 3 → PASS 的收口证据之一。
