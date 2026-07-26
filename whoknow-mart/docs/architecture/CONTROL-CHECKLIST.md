# 🛒 胡闹导购（whoknow-mart）· 控制清单（CONTROL-CHECKLIST）

> **版本**：v1.0 · 2026-07-26 · eng-lead（程基岩）
> **用途**：Phase 4 冲刺前的「实现就绪清单」+ 三大否决项的**机检落地方式**（对应 04/02/07 的单元测试/扫描点）。
> **配套**：`ARCHITECTURE.md` · `adr/ADR-001..003` · `ARCH-REVIEW.md`
> **测试约定（对齐 waimai）**：`node --test --experimental-strip-types "src/**/*.test.ts"`，colocated `*.test.ts`，`MemStore` 内存 KV 注入。

---

## A. 实现就绪清单（Phase 4 冲刺前缺什么）

> ✅ = 本基线已覆盖（架构明确，可直接开工）；🟡 = 需主理人/跨机协调，不阻 MVP；🔴 = 冲刺前必须补齐的硬缺口。

### A.1 工程脚手架（✅ 架构已定，待建）

| 项 | 状态 | 说明 |
|---|---|---|
| `package.json` 同栈（vue/vue-router/pinia/vant + vite/vue-tsc） | 🟡 待建 | 复制 waimai 依赖；测试命令同 `node --test` |
| `vite.config.ts`（`base:'/mart/'` + `@` alias） | 🟡 待建 | 对齐 vercel.json `/mart` 重写 |
| `src/style.css` 复制 waimai `:root` + 追加 `--mart-host` 等 | 🟡 待建 | ART-BIBLE §8.1 一致性 |
| `src/router` / `App.vue` / `main.ts` | 🟡 待建 | 路由见 ARCHITECTURE §5.1 |
| PWA（`vite-plugin-pwa` + manifest + 图标） | 🟡 待建 | §8.3 |
| 根 `build-for-vercel.js` 增补 mart 构建 | 🔴 待主理人/DevOps | 当前只构建 waimai（§8.2） |

### A.2 核心模块（✅ 接口已定，待实现）

| 模块 | 文件 | 状态 |
|---|---|---|
| 选招制状态机 | `engine/martStateMachine.ts` | ✅ 接口/数据流已定（§3） |
| 破防度引擎 | `engine/breakDefense.ts` | ✅ |
| 矩阵查表 | `core/matrix.ts` | ✅ |
| 禁忌词校验 | `core/forbiddenCheck.ts` | ✅ 复制 waimai 同源 |
| 记忆引擎 | `store/memory.ts` | ✅ 键前缀 `whoknow:mart:`（ADR-002） |
| 图鉴桶 | `store/codex.ts` | ✅ |
| 信封 loader | `config/loader.ts` | ✅ 取 `mart` 子树 + 零改写校验 |
| 静态 L1.mart 信封 | `config/l1mart.static.ts` | 🟡 手写填充（值待 playtest，禁硬编码手感） |

### A.3 内容备料（🟡 待 design-strategist 填值）

| 项 | 说明 |
|---|---|
| 5 导购 `guides[]`（lineBuckets 首/回头/真爱粉台词） | C2 规范 id 已定，台词待填 |
| 克制矩阵 20 格（1+1+2） | 矩阵模式已定，具体弱点/踩雷招待填 |
| 商品池 `products[]`（离谱/正常 + guideBinding） | 待填 |
| 数值占位（initial/delta/roundCap/vip 阈值/记忆分级阈值） | 全 `[待测试]`，playtest 前禁硬编码 |

### A.4 CI / 门禁（🔴 冲刺前必须建）

| 门禁 | 说明 |
|---|---|
| **L1-T5 红线门**：PR 触碰 `whoknow-waimai/` 即失败 + 告警 | 守 R1（§7） |
| **forbiddenCheck 双份一致**：mart/waimai `forbiddenCheck.ts` diff 告警 | 守 R2（ADR-003 §3） |
| **否决#1/#2/#3 单测必须绿**（见 §B） | 质量硬闸门 |
| **vue-tsc 类型门** + **PWA 构建成功** | 工程基线 |

---

## B. 三大否决项机检落地方式（对应 04 / 02 / 07）

> 来源：`00-CONCEPT.md` §6.4 否决标准；`REVIEW.md` §8 机检结论。每条给出**扫描/单测点 + 断言**。

### B.1 否决#1 记忆失效（04 记忆分级 · `store/memory.test.ts`）

**坏长什么样**：同导购第 ≥5 次博弈，台词/弱点无差异（P1 破裂）→ 否决。
**机检落点**：`store/memory.test.ts` + `engine/martStateMachine.test.ts` 联调。

```typescript
// store/memory.test.ts
import { MemoryEngine, MemStore } from './memory'

test('同导购第≥5次 → memoryTier 切换为 vip（派生缓存）', () => {
  const eng = new MemoryEngine(new MemStore())
  for (let i = 0; i < 5; i++) eng.recordOrder('guide_wanger_ma')
  const tier = eng.getMemoryTier('guide_wanger_ma')   // 依赖 guideVisit≥阈值
  expect(tier).toBe('vip')              // 首=first / ≥3=regular / ≥10或affinity≥阈=vip
})

test('lineBucket 随 tier 切换（首触≠真爱粉）', () => {
  const first = pickLineBucket(l1mart, 'guide_wanger_ma', 'first')
  const vip   = pickLineBucket(l1mart, 'guide_wanger_ma', 'vip')
  expect(first).not.toEqual(vip)       // 否决#1：必须可感知差异
})

// 跨会话持久：recordOrder 后从新 MemoryEngine(同 KV) 读回 guideVisit 不丢
test('guideVisit 跨会话持久（whoknow:mart: 前缀）', () => {
  const kv = new MemStore()
  new MemoryEngine(kv).recordOrder('guide_wanger_ma')
  const reloaded = new MemoryEngine(kv).getVisitCount('guide_wanger_ma')
  expect(reloaded).toBe(1)
})
```

**扫描点**：CI 跑 `memory.test.ts`；断言 `first≠regular≠vip` 桶内容存在差异（非空同值）。
**额外防线**：若 `l1mart.guides[].lineBuckets` 三桶任一为空 → loader 启动即 warn（配置缺桶 = 潜在记忆失效）。

### B.2 否决#2 矩阵崩坏（02 状态机 · `core/matrix.test.ts`）

**坏长什么样**：任一轮 4 选项全 +40 或全 −10（无策略空间）→ 否决。
**机检落点**：`core/matrix.test.ts`（纯函数，不依赖 UI）。

```typescript
// core/matrix.test.ts
import { matrix, DELTA } from './matrix'   // matrix[archetype][moveId] = +40/-10/+10

const ARCHES = ['poison_tongue','rational','lazy','philosopher','dark']
const MOVES  = ['move_firm','move_compare','move_pity','move_poison']

test('每个导购矩阵 = 规范 1+1+2（禁止全同值轮次）', () => {
  for (const a of ARCHES) {
    const deltas = MOVES.map(m => matrix[a][m])
    const distinct = new Set(deltas)
    // 1+1+2：恰 1 个+40、1 个-10、2 个+10
    expect(deltas.filter(d => d === DELTA.WEAKNESS).length).toBe(1)  // +40
    expect(deltas.filter(d => d === DELTA.MINE).length).toBe(1)      // -10
    expect(deltas.filter(d => d === DELTA.NEUTRAL).length).toBe(2)   // +10
    expect(distinct.size).toBeGreaterThan(1)   // 否决#2：不全 +40 / 不全 -10
  }
})

test('每导购必存在可达破防态路径（保底轮次）', () => {
  for (const a of ARCHES) {
    // 连续选弱点招，应在 roundCap 内达到 affinity>=100
    expect(reachesBreak(a, 'roundCap')).toBe(true)
  }
})
```

**扫描点**：CI 跑 `matrix.test.ts`；任何导购矩阵不满足 1+1+2 即红。
**运行期兜底**：状态机 EVALUATE 若 `matrix[archetype][moveId]` 缺失 → 默认 +10 平手 + warn（02 §5），不崩也不产生全同值轮。

### B.3 否决#3 配置污染（07 forbidden_check · `core/forbiddenCheck.test.ts` + 横切接线）

**坏长什么样**：任意屏出现红线词 → 整包拒绝（L1-T1）→ 走 L4 降级。
**机检落点**：`core/forbiddenCheck.test.ts`（复制 waimai 同源）+ loader/UI 渲染前门。

```typescript
// core/forbiddenCheck.test.ts
import { runForbiddenCheck } from './forbiddenCheck'

test('红灯词 → redLightCount>0 → pass=false', () => {
  const r = runForbiddenCheck(['某真实明星名字', '正常导购台词'], TABOO)
  expect(r.redLightCount).toBeGreaterThan(0)
  expect(r.pass).toBe(false)
})

test('黄灯词 → 化名替换（某宝/某明星/京城）', () => {
  const r = runForbiddenCheck(['淘宝原词'], TABOO)
  expect(r.redLightCount).toBe(0)
  expect(r.hits.some(h => h.level === 'yellow')).toBe(true)
})

// 横切接线（loader 级）：信封 forbidden_check.red_light_count>0 → 整包拒
test('信封红灯 → loader 返回 REJECT（不渲染敏感内容）', () => {
  const env = { ...staticEnv, forbidden_check: { red_light_count: 1, passed: false } }
  expect(loadMartConfig(env).status).toBe('REJECT')   // → 走 L4 降级
})
```

**横切接线清单（渲染前必过）**：
- `config/loader.ts`：信封级 `forbidden_check` 红灯 → REJECT。
- `engine`：本轮事件文本（导购金句/选项文案）拼装后过 `runForbiddenCheck`。
- `components`：UI 微文案 / 店名 / 价格占位（如 `prod.name`/`shopName`/`pricePlaceholder`）渲染前过 check。
- **L4 降级不丢记忆**：REJECT 时不读/不渲染敏感内容，但已落盘 `whoknow:mart:stats` 保留（DATA-STRUCTURE §8.2）。

**扫描点**：CI 跑 `forbiddenCheck.test.ts`；并加静态扫描——`config/l1mart.static.ts` 全部字符串过一次 `runForbiddenCheck`，红灯即构建失败（静态文案零容忍）。

---

## C. 一键就绪校验（Phase 4 kickoff 前跑）

```bash
# 1) 工程基线
npm install && npm run build          # vue-tsc 类型门 + vite 构建 + PWA 生成

# 2) 三大否决项机检（必须全绿）
npm test -- --grep "memory|matrix|forbiddenCheck"

# 3) 红线门禁（本地 pre-commit 近似）
git diff --name-only HEAD | grep -q "whoknow-waimai/" && echo "🔴 触碰 waimai 红线，终止" || echo "✅ L1-T5 安全"

# 4) 静态 L1.mart 过 forbidden_check 扫描（零容忍）
node scripts/scan-l1mart-taboo.mjs
```

---

_whoknow-mart · 控制清单 v1.0 · eng-lead（程基岩）· 2026-07-26 · 待主理人汇编落 `agent-mart`（不推 main）_
