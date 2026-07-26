# ADR-002 · 持久化策略：localStorage 键前缀 `whoknow:mart:` 隔离

> **状态**：ACCEPTED（Phase 3 评估采纳）
> **日期**：2026-07-26
> **主责**：eng-lead（程基岩）
> **关联**：`04-memory-tier.md` §2/§7 · `05-codex.md` §2/§7 · `DATA-STRUCTURE-v1` §5.1/§5.3 · waimai `src/store/memory.ts`

---

## 1. 状态（Context）

mart 需持久化「NPC 记忆」（同导购博弈次数 → 记忆分级 P1）与「图鉴收集」（P5）。数据底座必须：
1. 与 waimai 玩家数据**物理隔离**（双 App 共存，键冲突即灾难）；
2. 遵循 `DATA-STRUCTURE-v1` §5 的 `UserStats` 结构（字段名/桶语义同源，便于 v2 跨产品统一）；
3. 满足 P3 零负担（损坏自愈、重置入口藏深、单键 <50KB）；
4. 不修改任何 waimai 文件（L1-T5）。

决策点：**mart 的 localStorage 键命名与 `UserStats` 结构应如何落地？**

## 2. 决策（Decision）

**沿用 waimai `UserStats` 结构与 `KVStore` 注入式模式，键前缀改为 `whoknow:mart:`，单键存整份 JSON + `schemaVersion` 迁移。**

- **键前缀隔离**：mart 全量玩家数据键以 `whoknow:mart:` 开头；waimai 用 `whoknow:waimai:`。两套并存不冲突（对齐 DATA-STRUCTURE §5.1 注释「whoknow:waimai:」精神，mart 同构换前缀）。
- **单键 `whoknow:mart:stats`** 存整个 `UserStats` JSON（与 waimai `whoknow:waimai:stats` 同构）。
- **结构同源**：`UserStats = { schemaVersion, guideVisit, memoryTier, affinity, guidesSeen, movesSeen, weakpointsHit, branchesSeen, achievements, flags }`，字段名对齐 DATA-STRUCTURE §5.1/§4.2（mart 用 `guidesSeen/movesSeen/weakpointsHit` 同源扩展，不冲突 waimai `shopsSeen/ridersSeen`）。
- **KVStore 注入式**：`memory.ts` 定义 `interface KVStore { getItem/setItem }`，浏览器传 `localStorage` 适配，测试传 `MemStore` 内存实现（**直接复制 waimai `memory.ts` 模式，改键前缀**）。
- **写入时机**：每局博弈终止（02 WIN_BREAK/WIN_ANTI）→ `guideVisit[guideId]++` + `affinity[guideId]=峰值` + 图鉴桶写回。
- **版本迁移**：读时 `schemaVersion` 低于当前 → 跑迁移补齐缺失字段（缺字段用默认，不丢已有计数），对齐 DATA-STRUCTURE §8.3。

## 3. 后果（Consequences）

**正面**
- 与 waimai 物理隔离，双 App 无键冲突、无互相污染（L1-T5 直接守住房）。
- `UserStats` 结构跨产品同构，v2 接 brain 时 mart/waimai 可共用解析与迁移逻辑。
- KVStore 注入使记忆引擎 100% 单测覆盖（否决#1 记忆失效机检可纯 Node 跑，无需浏览器）。

**负面 / 成本**
- 需手动维护 `whoknow:mart:` 前缀（若误用 `whoknow:waimai:` 会污染 waimai 数据）——以常量 `MART_KEY_PREFIX = 'whoknow:mart:'` 单点定义 + lint 规则防呆。
- 单键 JSON 在极端高频写入下有轻微写放大，但图鉴/计数自然封顶 <50KB，无风险。

## 4. 备选方案（Alternatives Considered）

| 方案 | 描述 | 否决理由 |
|---|---|---|
| **A. 复用 waimai `whoknow:waimai:stats` 键** | mart 直接写 waimai 同键，混存 | 🔴 致命：污染 waimai 玩家数据 + 改 waimai 解析语义（L1-T5 红线） |
| **B. 每桶独立键（whoknow:mart:visit / :tier / :codex）** | 拆多键避免单键膨胀 | 写事务性弱、迁移复杂；waimai 已验证单键 JSON 可行，没必要分 |
| **C. IndexedDB** | 结构化存储 | MVP 数据量极小（<50KB），IndexedDB 过度工程；localStorage 足够且零依赖 |
| **✅ D. 单键 + `whoknow:mart:` 前缀（采纳）** | 同构 waimai，仅换前缀 + KV 注入 | 隔离、同构、可测、零 waimai 触碰 |

---

_eng-lead（程基岩）· 2026-07-26_
