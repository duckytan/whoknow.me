# 🛒 胡闹导购（whoknow-mart）· Phase 3 主架构文档

> **文档类型**：Phase 3 技术搭建评估（架构基线）· 供 Phase 4/5 实现冲刺使用
> **版本**：v1.0 · 2026-07-26
> **主责**：eng-lead（程基岩，工程主程）
> **上游权威**：`whoknow-mart/docs/gdd/*`（Phase 1/2 全 GDD）· `whoknow-waimai/docs/specs/DATA-STRUCTURE-v1-2026-07-24.md` · `whoknow-brain/docs/api-spec.md` v2.2 · `whoknow-mart/docs/art/ART-BIBLE.md` · `whoknow-waimai/src` 工程实现（同栈参考）
> **下游**：Phase 4 实现冲刺（垂直切片）· `adr/ADR-001..003` · `CONTROL-CHECKLIST.md` · `ARCH-REVIEW.md`
> **状态**：🔴 待主理人（游承峰）汇编决定是否落 `agent-mart`（不推 main）

---

## 0. 范围与纪律（先读，不可违背）

本架构基线仅覆盖 **MVP（纯前端可玩验证版，不接 brain）**。Phase 2 质量门判定 **PASS-with-CONCERNS**（G-1~G-8 全 PASS），本门评估不重新论证 GDD 正确性，只把它落成可实现的工程结构。

### 0.1 不可违背铁律（来自 GDD §0.2 / SYSTEMS-INDEX §0 / DATA-STRUCTURE §1）

| 编码 | 铁律 | 架构落地 |
|---|---|---|
| **L1-T5** | 严禁修改任何 waimai 文件（多 App 共存红线） | mart 只**消费**共享信封/契约，新增模块全在 `whoknow-mart/src` 内；`whoknow-waimai/src` 零改动（§7 专门约束） |
| **L1-T4** | 字段命名权威复用：`actor`/`moodDelta`/`next`+`nextWeights`/`id` | 冲突时以 `DATA-STRUCTURE-v1` 胜出；mart 不抢先另起命名 |
| **零改写** | EVOL 演进项标注清晰，不破共享解析器 | 信封、`forbidden_check`、`Rarity`、`chain[]`、`ui_meta` 水印、4 级降级**原样消费**（§6） |
| **红绿灯 0 容忍** | `forbidden_check.red_light_count > 0` → 整包拒绝 | 横切全层，先于一切渲染（§6.3 / 07 系统） |
| **战略 #1** | app 优先、大脑自动化后置 | MVP 用静态/手动 `L1.mart` 信封验证乐趣；**不另造大脑**、不接 brain（§9） |
| **战略 #2** | 新字段走契约演进（EVOL）而非自建系统 | EVOL-1~6 全程只登记、不落地（§10） |

### 0.2 本基线已消化的 Phase 2 CONCERNS

- **D1 / D2 已修**：`archetype` 用规范英文 id（`poison_tongue` 等）；矩阵规范 **1 弱点(+40) + 1 踩雷(−10) + 2 中性(+10)**（REVIEW §6）。本基线全采用规范值。
- **EVOL-1**（actor 增 `guide`）仍阻塞 waimai 侧；MVP 不产 `DramaEvent`，**无阻断**，v2 前须落地（§9 / §10）。
- **EVOL-2/3/6**（共享契约注释：mart=`破防度 0~100` / 同导购博弈次数 / `moodDelta`→`affinity`）MVP 无阻断，v2 需 waimai 主责人协调。

---

## 1. 分层架构总览

沿用 `DATA-STRUCTURE-v1` §1 的四层模型，叠加 UI 渲染层（mart MVP 的可见出口）。各层严格**配置与状态分离**，且 mart 的 L1 内容（`L1.mart`）为**自建、不触 waimai** 的子集。

```
┌──────────────────────────────────────────────────────────────────┐
│  UI 渲染层 (Vue3 + Vant + Pinia)                                  │
│  戏精弹层(06) · 截图分享(08) · 商品舞台视图(01) · 图鉴视图(05)     │
│  消费 L2 状态 + L3 记忆/图鉴，不反向依赖引擎                      │
└───────────────────────────────┬──────────────────────────────────┘
                                 │ 读 MartRoundState + 破防度 + 图鉴
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  L2 · 运行时（mart 独有状态机，不复用 waimai DramaState）          │
│  选招制状态机(02) · 破防度引擎(03)                                 │
│  MartRoundState（仅内存，不落盘）· 消费 L1.matrix + L3 记忆输入    │
│  产出：事件流 → 双胜利判定 → 写回 L3/L4                          │
└───────────────┬───────────────────────────────┬──────────────────┘
                │ 读 L1.mart（guides/moves/matrix/affinity） │ 读记忆输入
                ▼                                   ▼
┌──────────────────────────┐         ┌────────────────────────────────┐
│  L1 · 内容配置 (L1.mart) │         │  L3 · 玩家持久化 (localStorage) │
│  mart 自建，键前缀隔离    │         │  UserStats：guideVisit / tier   │
│  静态信封（MVP 不接 brain）│         │  / affinity / 图鉴桶，前缀      │
│                          │         │  whoknow:mart:                  │
│  — 不触 waimai 文件 —    │         └──────────────┬─────────────────┘
└──────────────────────────┘                        │ 写回
                                                    ▼
                                         ┌──────────────────────────┐
                                         │  L4 · 图鉴与成就 (Collection) │
                                         │  内嵌 L3：guidesSeen/      │
                                         │  movesSeen/weakpointsHit   │
                                         │  /achievements（Rarity）    │
                                         └──────────────────────────┘

       07 · forbidden_check ── 横切 L1 文案 / L2 事件 / L3/L4 展示 / UI 微文案
       red_light_count>0 → 整包拒绝 → 4 级降级 L4（永远先于一切渲染）
```

**层间契约（mart 化）**：
- L1 信封（含 `mart:{}`）被 config loader 解析 → 取出 `L1.mart` 子集供 L2 消费。
- L2 推演结束 → 写回 L3（`guideVisit++` / `affinity` 峰值 / 图鉴桶）。
- L3 的 `memoryTier` / `guideVisit` → 作为下一次 L2 推演的**历史行为参数**输入（NPC「记忆」闭环，对应 P1）。
- L4 图鉴内嵌 L3 单键 JSON，无独立落盘。

---

## 2. 模块边界与依赖方向（DAG）

依赖方向**单向向下**：UI → L2 → (L1 + L3) → L4；`forbidden_check` 横切。箭头 = 「依赖/消费」。

```
[UI] 06 戏精弹层 ─┐
    08 截图分享  ─┤
    01 商品舞台  ─┤
    05 图鉴视图  ─┤
                  ├──────────────▶ [L2] 02 选招制状态机 ──▶ [03] 破防度引擎
                  │                      │   │  ▲                │
                  │                      │   │  │                │
                  │                      ▼   │  │                ▼
                  │                  [L1] L1.mart (guides/moves/matrix/affinity)
                  │                      ▲   │
                  │                      │   │ 读记忆输入
                  │                      ▼   ▼
                  │                  [L3] 04 记忆分级 ◀──写回── [L4] 05 图鉴桶
                  │
        [07] forbidden_check ──横切──▶ L1 文案 / L2 事件文本 / L3·L4 展示 / UI 微文案
                  │
                  └── red_light_count>0 → 整包拒绝 → 4 级降级 L4
```

**依赖要点（与 SYSTEMS-INDEX §2 对齐）**：
1. `01 商品舞台` 是入口：无商品即无结算、无博弈；先于 02。
2. `03 破防度引擎` 的配置（矩阵 delta / 胜负态）是 02 状态机的数值输入。
3. `02 选招制状态机` 是运行时核心，消费 01/03/04，写回 05。
4. `04 记忆分级` 与 `05 图鉴` 是 L3/L4 持久化，被 02 读（记忆输入）写（图鉴解锁）。
5. `06 戏精弹层` 与 `08 截图分享` 是纯渲染/输出层，依赖 02 状态 + 03 破防度 + 05 图鉴，不反向依赖引擎。
6. `07 禁忌词校验` 横切：所有 L1 文案、L2 事件文本、L3/L4 展示文案、UI 微文案均须过 `forbidden_check`，红灯即整包拒绝。

**循环禁止**：UI 层、L2 引擎层**绝不**直接写 localStorage（持久化只经 L3 store）；L1 配置层**绝不**引用运行时状态。

---

## 3. 选招制状态机（02）核心数据流

mart 独有，不复用 waimai `DramaState`（bossMood/riderMorale/totalDelay）。采用**选招制查表 + 双胜利判定**模型（ADR-001）。

### 3.1 MartRoundState（仅内存，不落盘）

```typescript
interface MartRoundState {
  guideId: string          // 当前导购（C2 规范 id，如 guide_wanger_ma）
  guideArchetype: string   // 查矩阵用（poison_tongue 等 5 规范 id）
  affinity: number         // 破防度 0~100（来自 03）
  round: number            // 当前轮次（从 1 起）
  roundCap: number         // 防死循环上限 [待测试]
  tags: string[]           // 叙事标签（跨轮传递）
  selectedHistory: string[]// 已选 moveId 序列（图鉴/复盘）
  positionSeed: number     // 本轮 4 选项位置随机种子
  optionsThisRound: string[] // 本轮 4 选项（moveId 已 shuffle，4 招全出现）
}
```

### 3.2 一轮流转（伪代码 · 驱动单元测试 §CONTROL-CHECKLIST）

```
[CHECKOUT_TRIGGER] ──(来自 01)──▶ INTRO（导购闪现首爆点，P6 ≤3s）
   │
   ▼
ROUND:
   optionsThisRound = shuffle([move_firm, move_compare, move_pity, move_poison])  // 位置随机，4 招全出现去重
   渲染 4 选项(06)
   │
   ▼ 玩家选招 moveId
EVALUATE:
   delta = matrix[guideArchetype][moveId]   // +40 命中 / -10 踩雷 / +10 平手
   affinity = clamp(affinity + delta, 0, 100)
   │
   ├─ affinity >= 100 ─▶ WIN_BREAK（破防态·放行：「服了，下单吧」）── success 语义
   ├─ affinity <= 0   ─▶ WIN_ANTI （反消费胜利态·劝退：「省钱了，下次别来」）── success 语义
   ├─ round >= roundCap ─▶ WIN_ANTI（默认劝退·防死循环）
   └─ 否则 ─▶ round++ → ROUND（位置重随机）
```

**双胜利均为 success 语义**（G-4 / ART-BIBLE §2.4）：归零态**绝不**渲染为「失败/红叉」。
**保底轮次**（N 轮内必破）：轮次内确保至少存在可达破防态路径，防「逼半天还不卖」被耍感（02 §5.2）。

### 3.3 矩阵查表（L1.mart.matrix）

`matrix[archetype][moveId] = delta`，5 型 × 4 招 = 20 格，规范模式 **1+1+2**：

| 每导购 | 招数 | delta | 含义 |
|---|---|---|---|
| 1 隐藏弱点 | 1 招（如 rational→move_compare） | **+40** | 命中弱点 |
| 1 踩雷 | 1 招（如 rational→move_pity） | **−10** | 踩雷 |
| 2 中性 | 余 2 招 | **+10** | 平手/试探 |

> 否决#2「矩阵崩坏」= 任一轮 4 选项全 +40 或全 −10（无策略空间）→ 机检扫描（CONTROL-CHECKLIST §2）。1+1+2 模式天然满足「不全同值」。

### 3.4 失败模式与兜底（对齐 02 §5）

| 失败 | 处置 |
|---|---|
| 矩阵查不到 `matrix[archetype][moveId]` | 默认 `+10` 平手，记 warn，不崩 |
| delta 累加越界 | `clamp(affinity, 0, 100)` |
| 死循环（一直 −10 未到 cap） | `round_cap` 到达强制 WIN_ANTI |
| 选项位置冲突（shuffle 重复） | 重 shuffle 至 4 招去重全出现 |
| 导购 archetype 无效 | 回退默认 `poison_tongue`，记 warn |

---

## 4. 共享信封零改写消费

mart 与 waimai **同信封**消费。MVP 信封为**静态/手动 `L1.mart`**（不接 brain），结构对齐 `api-spec.md` §JSON Schema（信封 6 字段 + `mart` + `fallback.mart`）。

### 4.1 信封字段消费映射

| 信封字段 | 来源（共享权威） | mart 消费方式 | 是否改写 |
|---|---|---|---|
| `version`/`generated_at`/`effective_until` | api-spec | config loader 版本与失效判定 | 否 |
| `meta` (`hot_today`/`weather`/`holiday`) | api-spec/DATA-STRUCTURE §2.1 | MVP 本地随机兜底（无 brain 时） | 否 |
| `food` | waimai 专用 | **不消费**（mart 只读 `mart`） | 不碰 |
| `mart` | mart 自建 L1.mart（MVP 手写填充） | 取出 `guides/moves/matrix/affinity/products` 供 L1/L2 | 否（仅读） |
| `soul_layer` | api-spec | MVP 不消费（v2 接 soul 人格） | 否 |
| `ui_meta` | DATA-STRUCTURE §2.5 | **只进页脚水印**（首页/结算底部），绝不覆盖弹层/气泡/结局卡 | 否 |
| `story_assets` | api-spec | MVP 不消费 | 否 |
| `forbidden_check` | DATA-STRUCTURE §2.7 | 横切全部文案（§6.3） | 否 |
| `fallback` (`fallback.mart`) | api-spec 4 级降级 | 形状 == `L1.mart`，brain 全挂时兜底 | 否 |

### 4.2 消费方式（零改写原则）

- **复制共享解析器，不 fork 语义**：`forbidden_check`、`Rarity` 枚举、`chain[]` 内联链表、`ui_meta` 水印、`next`+`nextWeights` 一律**原样**消费。mart 的 config loader 只做「取出 `mart` 子树 + 校验信封 6 字段存在性」，**不改写任何共享字段名/语义**（ADR-003）。
- **mart 自建子集隔离**：`L1.mart = { guides, moves, matrix, affinity, products }` 全部是 mart 新建键，与 waimai `food.{boss,rider,branches}` 并列于同一信封的 `mart` 键下，互不侵入。
- **字段命名对齐**：矩阵 delta 沿用 `moodDelta` 语义（mart 目标=affinity，非 bossMood → EVOL-6 仅注释层，无 schema 变更）；未来 brain 事件链用 `next`+`nextWeights` 与 `id`（L1-T4）。

### 4.3 4 级降级（对齐 api-spec §降级策略 + DATA-STRUCTURE §8.1）

```
优先级 1：本地 L1.mart 静态信封（MVP 最高质量，等同 waimai「当日生成」）
   ↓ 解析失败 / 文件缺失
优先级 2：内置 seed 兜底（商品/导购/矩阵 最小可玩集，§1 / DATA-STRUCTURE §2.8 精神）
   ↓ seed 也坏
优先级 3：配置污染 → forbidden_check 红灯 → 整包拒绝
   ↓ 诚实告知
优先级 4：显示「今天没新段子」（L4 降级文案），已落盘 L3 记忆不丢
```

> MVP 不接 brain，故「拉远程 config」步骤省略；优先级 1 即静态本地信封。v2 接 brain 时，loader 增加「远程 `/api/v1/mart/config` → 昨日 → 静态 fallback → L4」链路（§9）。

---

## 5. Vite + Vant 工程结构（src 目录划分）

**技术栈（用户拍板）**：Vue3 + Vite + Vant，部署 Vercel PWA。与 waimai **同栈同构**，工程约定直接对齐 `whoknow-waimai/src`（降低双 App 维护成本、满足 ART-BIBLE §8.1 一致性铁律）。

### 5.1 目录划分（对齐 waimai 同构）

```
whoknow-mart/
├── index.html
├── package.json            # 同 waimai：vue/vue-router/pinia/vant + vite/vue-tsc + node --test
├── vite.config.ts          # base: '/mart/'（对齐 vercel.json /mart 重写）
├── tsconfig.json
├── public/
│   ├── manifest.webmanifest        # PWA（§8）
│   └── pwa-assets/                 # 图标 192/512
└── src/
    ├── main.ts                     # 挂载 App + Pinia + router + PWA 注册
    ├── App.vue
    ├── style.css                   # 复制 waimai :root + BRAND/ART-BIBLE 令牌（§8.1 一致性）
    ├── router/
    │   └── index.ts                # /(home) /product/:id /checkout /codex /profile
    ├── views/                      # 路由页（对齐 waimai views/）
    │   ├── HomeView.vue            # 商品列表（01 商品舞台 BROWSE_LIST）
    │   ├── ProductView.vue         # 商品详情 BROWSE_DETAIL
    │   ├── CheckoutView.vue        # 点结算 → CHECKOUT_TRIGGER（移交博弈）
    │   ├── GameView.vue            # 选招制博弈主页（02 状态机驱动 06 弹层）
    │   ├── CodexView.vue           # 图鉴（05）
    │   └── ProfileView.vue         # 记忆/重置入口（P3 藏深）
    ├── components/                  # 对齐 waimai components/
    │   ├── DramaDialog.vue         # 戏精弹层（06 · 弹簧入场 + 金句 + 4 选项）
    │   ├── BreakMeter.vue          # 破防度 meter（03 · 数值+阶段文案，WCAG）
    │   ├── OptionButton.vue        # 选招 4 选项（图标+文字双标识，焦点环）
    │   ├── RoleBadge.vue           # 导购角色色 chip（复用 waimai .persona--* 模式）
    │   ├── ResultCard.vue          # 结局卡/段子卡（08 · 无水印可分享视图）
    │   ├── TabBar.vue              # 底部 TabBar（选中态 --brand-orange，对齐 waimai）
    │   └── FooterWatermark.vue     # ui_meta 水印（仅页脚）
    ├── config/                     # 对齐 waimai config/
    │   ├── loader.ts               # 加载+解析信封，取 L1.mart 子树（§4.2）
    │   ├── loader.test.ts          # 信封 6 字段存在性 / 零改写校验
    │   └── l1mart.static.ts        # MVP 静态 L1.mart 信封（手写填充，值待 playtest）
    ├── core/                       # 对齐 waimai core/（纯函数，跨环境）
    │   ├── forbiddenCheck.ts       # ★ 复制 waimai 同款（零改写，L1-T5）
    │   ├── forbiddenCheck.test.ts
    │   ├── matrix.ts               # 矩阵查表 + clamp（02 §3）
    │   └── matrix.test.ts          # 否决#2 矩阵崩坏扫描
    ├── engine/                     # mart 独有运行时（不复用 waimai dramaEngine）
    │   ├── martStateMachine.ts     # 选招制状态机（02 §3，MartRoundState）
    │   ├── martStateMachine.test.ts# 双胜利判定 + 防死循环 + 位置随机
    │   ├── breakDefense.ts         # 破防度引擎（03）
    │   └── breakDefense.test.ts
    ├── store/                      # 对齐 waimai store/（Pinia + KV 注入）
    │   ├── memory.ts               # ★ MemoryEngine（键前缀 whoknow:mart:，ADR-002）
    │   ├── memory.test.ts          # 否决#1 记忆失效机检
    │   ├── memoryStore.ts          # Pinia 包装（guideVisit/tier/affinity/图鉴）
    │   ├── codex.ts                # 图鉴桶（05 · guidesSeen/movesSeen/weakpointsHit）
    │   └── codex.test.ts
    └── types/                     # 共享类型（L1.mart / MartRoundState / 信封）
        └── contract.ts             # 复用 DATA-STRUCTURE 字段名（actor/moodDelta/...）
```

### 5.2 工程约定（从 waimai 直接继承，减少决策）

| 约定 | waimai 现状 | mart 对齐 |
|---|---|---|
| 测试运行 | `node --test --experimental-strip-types "src/**/*.test.ts"` | **完全一致**（colocated `*.test.ts`） |
| 测试隔离 | `MemStore` 内存 KV 注入 | mart `memory.ts` 同样 `KVStore` 注入式，测试用内存实现 |
| 类型 | TypeScript（vue-tsc 构建门） | 一致 |
| 状态管理 | Pinia | 一致（`memoryStore`/`codex` 为 Pinia store） |
| 路由 | vue-router | 一致 |
| Vite base | `/waimai/` | `/mart/`（对齐 vercel.json 重写） |
| 风格令牌 | `style.css` `:root` | **复制 waimai `:root` + 追加 `--mart-host` 等**（ART-BIBLE §8.1） |

---

## 6. 禁忌词校验（07）横切落地

`forbidden_check` 零改写复用（DATA-STRUCTURE §2.7）。mart **不修改 waimai 文件**，仅消费同信封 `forbidden_check`。

### 6.1 机检接线（先于一切渲染）

```
任意文案/资产进入渲染前 → runForbiddenCheck(texts, taboo) → {pass, redLightCount, hits}
   ├─ redLightCount === 0 → PASS，正常渲染
   ├─ redLightCount > 0   → REJECT：整包拒绝 → 4 级降级 L4（诚实告知「今天没新段子」）
   └─ yellowLightCount > 0 → 黄灯词化名替换（某宝/某明星/京城，§9.5）
```

- **MVP 静态文案**：已过终审（`mart-禁忌词终审.md`），「智商税」为反骨劝退话术保留。`core/forbiddenCheck.ts` 与 waimai **同款代码**（复制而非改写），保证解析器一致。
- **接线点**：`config/loader.ts`（信封级红灯）、`engine`（事件文本）、`components`（UI 微文案/店名/价格占位）均声明过 `forbidden_check`。
- **L4 降级不丢记忆**：红灯整包拒绝时，已落盘 L3 记忆不受影响（DATA-STRUCTURE §8.2）。

---

## 7. 与 waimai 文件关系（L1-T5 红线落地）

> **硬性约束**：`whoknow-waimai/` 目录下**任何文件都不得修改**。mart 的所有实现代码、配置、类型、测试**只在 `whoknow-mart/` 内**。

| 共享对象 | 消费方式 | 红线检查 |
|---|---|---|
| `DATA-STRUCTURE-v1` 字段名（`actor`/`moodDelta`/`next`/`id`） | 在 `types/contract.ts` 复用同名 | 不重命名 |
| `forbidden_check` 语义 | `core/forbiddenCheck.ts` 复制 waimai 实现 | 不改 waimai 源 |
| `Rarity` / `chain[]` / `ui_meta` | 直接消费，结构一致 | 不 fork |
| `MemoryEngine` 模式 | 复制 KVStore 注入式，仅改键前缀 | 不改 waimai `memory.ts` |
| 风格令牌 `:root` | 复制 waimai `style.css` 的 `:root` + H4 回归区块 | 不改 waimai `style.css` |
| Vite 工程约定 | 同构目录 + 同测试命令 | 不改 waimai `vite.config.ts` |

**CI 门禁建议**（CONTROL-CHECKLIST）：增加一条「waimai 目录变更检测」——若 PR 触碰 `whoknow-waimai/`，构建失败并告警（守住 L1-T5）。

---

## 8. PWA（Vercel）配置要点

### 8.1 Vercel 重写（已存在于根 `vercel.json`）

```jsonc
{ "source": "/mart/:path*", "destination": "/whoknow-mart/dist/:path*" }
```
→ mart `vite.config.ts` 必须 `base: '/mart/'`，产物放到 `whoknow-mart/dist/`。

### 8.2 构建编排（需更新根 `build-for-vercel.js`）

当前 `build-for-vercel.js` 只构建 waimai。Phase 4 须补一步：构建 `whoknow-mart` → 产物已满足 `/mart` 重写（无需改 vercel.json）。**注意**：不要破坏 waimai 现有产物（L1-T5 精神延伸：mart 不劫持 waimai 构建）。

### 8.3 PWA 配置

- 用 `vite-plugin-pwa`（标准方案，与 Vant 兼容）：`registerType: 'autoUpdate'`、`manifest`（name=胡闹导购、theme_color=`#FF5000`、icons 192/512）、`workbox` 预缓存 `index.html` + `assets`。
- **离线可玩**：MVP 纯前端，L1.mart 静态信封打包进产物，离线可运行（契合「单机 0 成本」）。
- **水印分离**：PWA 安装横幅/页脚水印只走 `FooterWatermark`，绝不覆盖戏精弹层/结局卡（api-spec D3）。

---

## 9. MVP 不接 brain 的边界 + v2 接 brain 扩展点

### 9.1 MVP 边界（明确不做的）

| 不做 | 理由 |
|---|---|
| 不拉 `/api/v1/mart/config` | 战略 #1：app 优先、大脑后置；MVP 用静态 L1.mart 验证乐趣 |
| 不产 `DramaEvent`（无 `actor:'guide'`） | EVOL-1 仍阻塞 waimai 侧；MVP 纯前端矩阵驱动 |
| 不接 `soul_layer` 人格注入 | v2 才用 |
| 不接 `story_assets` 热搜联动 | v2 才用 |
| 不造任何 AI/LLM 调用 | 不另造大脑 |

### 9.2 v2 扩展点（当前只留接口，不实现）

**关键设计**：MVP 的 L2 运行时**只认内部事件流**，不直接依赖数据来源。v2 接 brain 时，只替换「事件源适配器」，L2 状态机与 UI 不变。

```
interface MartEventSource {
  // MVP 实现：LocalMatrixSource（读 L1.mart.matrix，纯前端查表）
  // v2 实现：BrainConfigSource（fetch /api/v1/mart/config → 取 DramaEvent[]（actor:'guide'）→ 适配为内部事件流）
  getRound(guideId, history): MartRoundEvents
}
```

- **DramaEvent 适配器**：brain 产出的 `DramaEvent`（`actor:'guide'`（EVOL-1）、`moodDelta`→`affinity`（EVOL-6））经一层 adapter 映射为 mart 内部事件流，落到同一 `MartRoundState` 结算路径。
- **4 级降级链路**：loader 增加 `远程今日 → 远程昨日 → 静态 fallback.mart → L4`，完全复用 api-spec §降级策略。
- **解冻前置**（总纲 §5）：① playtest 通过 ② waimai `DATA-STRUCTURE-v1` 落定（含 EVOL-1/2/3/6）。

---

## 10. 契约演进（EVOL）登记与阻塞项

mart **只登记、不落地** EVOL；以下为带入 Phase 4 的协调项，均不阻断 MVP。

| 编号 | 类型 | 内容 | 阻塞方 | MVP 影响 |
|---|---|---|---|---|
| EVOL-1 | 硬演进 | `DramaEvent.actor` 增 `guide` | waimai 主责人（DuckyPC） | 无（MVP 不产 DramaEvent） |
| EVOL-2 | 软演进 | `L3.affinity` 注释 mart=破防度 0~100 | waimai 协调（注释层） | 无 |
| EVOL-3 | 软演进 | `memoryTier` 派生源标注 mart=同导购博弈次数 | waimai 协调（注释层） | 无 |
| EVOL-4 | 协商 | archetype 自键承载（不扩 waimai persona） | 美术/契约对齐 | 无（C2 表已规范） |
| EVOL-5 | 填空 | 填 `mart`/`fallback.mart` 信封（L1.mart） | M1-a（mart 主责人） | MVP 手写静态信封替代，无阻断 |
| EVOL-6 | 软演进 | `moodDelta` 语义目标标注 mart→affinity | waimai 协调（注释层） | 无 |

> 详见 `docs/gdd/REVIEW.md` §4、§6（D1/D2 已修）、`docs/contract/EVOL-1-guide-enum-request.md`。

---

## 11. 引用索引

- 概念与系统 GDD：`whoknow-mart/docs/gdd/00-CONCEPT.md`、`00-SYSTEMS-INDEX.md`、`01`~`08`
- 跨 GDD 评审：`whoknow-mart/docs/gdd/REVIEW.md`（C2 规范表 §5、D1/D2 §6、EVOL §4）
- 质量门：`whoknow-mart/docs/gdd/PHASE2-GATE.md`（PASS-with-CONCERNS）
- 共享契约：`whoknow-waimai/docs/specs/DATA-STRUCTURE-v1-2026-07-24.md`
- brain 契约：`whoknow-brain/docs/api-spec.md` v2.2（信封 6 字段 / 4 级降级 / D3 水印裁定）
- 美术圣经：`whoknow-mart/docs/art/ART-BIBLE.md`（令牌 / 角色色 / 截图安全区）
- 同栈参考实现：`whoknow-waimai/src`（forbiddenCheck / memory / dramaEngine / vite.config）
- 本基线配套：`adr/ADR-001..003`、`ARCH-REVIEW.md`、`CONTROL-CHECKLIST.md`

---

_whoknow-mart · Phase 3 主架构文档 v1.0 · eng-lead（程基岩）· 2026-07-26 · 待主理人汇编落 `agent-mart`（不推 main）_
