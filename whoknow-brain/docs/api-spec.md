# 🧠 whoknow-brain · 胡闹控制中心技术架构 v2.0

> **版本**：v2.1 · 2026-07-24（v2.0 + 三司会审 4 个 P0 修正）
> **拍板人**：Ducky 錡（whoknow 系创始人）
> **作者**：码农虾 💻
> **状态**：✅ 当前主版本
> **取代**：v0.1（7-21 ~ 7-24）→ 见 `references/api-spec-v0.1-archive.md`
> **变更**：v2.0 → v2.1 加 4 节 P0 修正（M0 必做清单/审核工作流/降级 UI/老接入点）

---

## 🎯 核心定位

> 「whoknow 宇宙的运营代理人。一次产出，养活全线产品。」

**brain 不只是内容生成器**，它是 whoknow 矩阵的：

| 角色 | 职责 |
|------|------|
| 🧠 **灵魂架构师** | 给每个产品定义独立 NPC 人格 |
| 📡 **数据采集器** | 听 7 感官（外部/服务器/玩家） |
| 🎭 **内容生成器** | 用 AI 量产可审核的"段子" |
| 📊 **运营监控** | 自动报警、自动恢复 |
| 🤖 **矩阵代理人** | 锡哥放手时，brain 接管运营 |

**业务关键洞察**（锡哥 Q27）：
> "有了 brain 后，数据上的问题，brain 就必须全盘接管。我全力去开发新 app。我只能偶尔抽样看。所以 brain 是整个胡闹宇宙的基石。"

---

## 🌌 服务的矩阵

brain 服务 **全部 whoknow 产品**，不只 waimai：

| 产品 | 当前状态 | brain 服务时机 |
|------|---------|-------------|
| **waimai**（胡闹外卖）| v18 上线 | ✅ M0 接入 |
| **mart**（胡闹导购）| 方案阶段 | 🟡 M1 接入 |
| **未来产品 × N** | 概念 | 🟢 M3+ 接入 |

**关键设计**：brain 一次 LLM 调用同时服务多产品，**成本摊薄**。

---

## 🏗️ 架构总览

```
┌──────────────────────────────────────────────────────────────┐
│                       👤 用户层                                │
│   浏览器访问 whoknow 系列所有产品                                │
└──────────────────────────────────────────────────────────────┘
                               ↓ HTTPS
┌──────────────────────────────────────────────────────────────┐
│                  🌐 CDN / 边缘层 (静态资源)                     │
│                                                              │
│   waimai / mart / 未来产品 / brain 后台                        │
│   · Cloudflare Pages / Vercel                                │
│   · 配置 JSON 单独 cache                                      │
└──────────────────────────────────────────────────────────────┘
                               ↑ HTTPS
┌──────────────────────────────┴───────────────────────────────┐
│                  📤 配置分发层 (brain-deployer)                │
│                                                              │
│   · 部署到 Cloudflare R2 / S3                                │
│   · 公开签名后的 config.json                                  │
│   · 版本号 + ETag + Last-Modified 头                          │
│   · 多产品共用分发层                                           │
│                                                              │
└──────────────────────────────┬───────────────────────────────┘
                               ↑ HTTPS POST (内部)
┌──────────────────────────────┴───────────────────────────────┐
│                  🧠 配置生成层 (brain-generator)               │
│                                                              │
│   ┌────────────────┐    ┌────────────────┐                   │
│   │  生成器         │ → │  禁忌词过滤     │ → 输出签名 JSON     │
│   │  · LLM 调用    │   │  · 3 级红绿灯   │                   │
│   │  · prompt 模板 │   │  · waimai 适配  │                   │
│   │  · soul_layer  │   │  · mart 适配    │                   │
│   └────────────────┘   └────────────────┘                   │
│                                                              │
└──────────────────────────────┬───────────────────────────────┘
                               ↑
┌──────────────────────────────┴───────────────────────────────┐
│                  📊 数据采集层 (brain-collector)               │
│                                                              │
│   外部:                          内部:                        │
│   · 微博热搜 (hot.ts)            · 后端服务器心跳 (server.ts) │
│   · 新闻 RSS (news.ts)           · 浏览器端埋点 (track.ts M1) │
│   · 天气 (weather.ts)           · 玩家反馈 (feedback.ts M1)  │
│   · 节日日历 (holiday.ts)        · 内容趋势 (trend.ts M2)    │
│                                                              │
│   每个数据源 = 1 个独立模块文件                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 目录结构 v2.0

```
whoknow-brain/
├── docs/
│   ├── api-spec.md                 ← 🆕 本文件 v2.0
│   ├── 禁忌词清单-v1.0.md          ← 7-24 专题落档
│   ├── 三司会审记录-2026-07-24.md  ← 3 轮会审沉淀
│   ├── topics/                     ← 专题（M0 后补）
│   │   └── 前3秒爆点专题.md        ← Q24 锡哥留
│   └── references/                 ← 历史档案
│       ├── api-spec-v0.1-archive.md   ← v0.1 原始 spec
│       └── api-spec-v0.1-changelog.md ← v0.1→v2.0 变更说明
│
├── engine/                         ← 🆕 内部模块（API 模块化）
│   ├── collector/
│   │   ├── hot.ts                  ← 微博热搜
│   │   ├── news.ts                 ← 新闻 RSS
│   │   ├── weather.ts              ← 天气
│   │   ├── holiday.ts              ← 节日
│   │   ├── server.ts               ← 后端服务器心跳
│   │   └── _base.ts                ← 采集器基类
│   │
│   ├── generator/
│   │   ├── llm.ts                  ← LLM 调用
│   │   ├── prompt.ts               ← prompt 模板
│   │   ├── soul.ts                 ← NPC 人格（M1）
│   │   ├── forbidden.ts            ← 禁忌词过滤
│   │   └── _base.ts                ← 生成器基类
│   │
│   └── deployer/
│       ├── file.ts                 ← 写本地 JSON
│       ├── report.ts               ← HTML 每日报告
│       └── cdn.ts                  ← 上 CDN（M1）
│
├── config/                         ← 配置模板
│   ├── food-template.json          ← waimai 生成模板
│   └── mart-template.json          ← mart 生成模板
│
├── scripts/                        ← 脚本
│   └── daily-run.sh                ← 每日运行入口（M1+ 才用 cron）
│
└── PROJECT-STATUS.md               ← 项目状态
```

---

## 📦 对外 API 设计 v2.0

### 设计原则（4 条）

1. **RESTful 路径**：标准 `/api/v1/{product}/{resource}` 风格
2. **统一响应格式**：`{"ok", "data", "meta"}` 或 `{"ok": false, "error", "message", "fallback_url"}`
3. **多产品共用**：路径含产品 key（food/mart/...）
4. **类型安全**：每个 API 有 TypeScript interface

### 路径前缀

```
/api/v1/{product}/{resource}
       │      │        │
       │      │        └─ config / approve / health / feedback / track
       │      └─ food / mart / 未来产品
       └─ v1 (版本号, 改了老客户端可继续用)
```

---

### 完整 API 清单

#### M0（必须实现 · P0）

| API | 方法 | 功能 | 鉴权 |
|-----|------|------|:----:|
| `/api/v1/food/config` | GET | 拉 waimai 配置 JSON | ❌ |
| `/api/v1/food/approve` | POST | 锡哥审核批准 | 🟡 Bearer |
| `/api/v1/health` | GET | 健康检查 | ❌ |
| `/api/v1/food/report` | GET | 锡哥后台 HTML 报告 | 🟡 Bearer |

#### M1（必须实现 · P1）

| API | 方法 | 功能 | 鉴权 |
|-----|------|------|:----:|
| `/api/v1/food/feedback` | POST | 玩家反馈 👍/👎 | ❌ |
| `/api/v1/mart/config` | GET | mart 配置 | 🟡 Bearer |
| `/api/v1/mart/approve` | POST | mart 审核 | 🟡 Bearer |
| `/api/v1/track` | POST | 前端埋点 | ❌ |

#### M2（实现规划 · P2）

| API | 方法 | 功能 | 鉴权 |
|-----|------|------|:----:|
| `/api/v1/metrics` | GET | brain 内部指标 | 🟢 HMAC |
| `/api/v1/metrics` | POST | 上报外部监控 | 🟢 HMAC |

#### M3+（未来扩展）

| API | 方法 | 功能 | 鉴权 |
|-----|------|------|:----:|
| `/api/v1/food/config/{date}` | GET | 历史配置查询 | 🟢 HMAC |
| `/api/v1/admin/...` | - | 后台管理 | 🟢 HMAC |
| 第三方接入 | - | 开放给其他项目 | 🟢 API Key |

---

### 统一响应格式

#### 成功响应

```json
{
  "ok": true,
  "data": {
    "version": "2026-07-24.001",
    "generated_at": "2026-07-24T03:00:00Z",
    "effective_until": "2026-07-25T03:00:00Z",
    "food": { ... },
    "mart": {}
  },
  "meta": {
    "freshness_hours": 12,
    "brain_version": "v2.0"
  }
}
```

#### 失败响应（4 种类型）

```json
// 1. brain 还没生成（首启）
{
  "ok": false,
  "error": "config_not_ready",
  "message": "脑尚未生成今日配置，请稍后重试",
  "fallback_url": "/static/fallback/food.json"
}

// 2. brain 失败（生成异常）
{
  "ok": false,
  "error": "brain_failed",
  "message": "脑生成失败，已降级到昨日配置",
  "fallback_url": "/api/v1/food/config?date=yesterday"
}

// 3. 版本过期
{
  "ok": false,
  "error": "version_expired",
  "message": "客户端版本过期",
  "fallback_url": "/api/v1/food/config"
}

// 4. 鉴权失败
{
  "ok": false,
  "error": "unauthorized",
  "message": "Token 无效或过期"
}
```

---

## 🔐 鉴权设计（3 阶段）

| 阶段 | 方案 | 适用场景 | 实施难度 |
|------|------|---------|:-------:|
| **M0** | ❌ 不鉴权 | 内网测试 | 0 |
| **M1** | 🟡 Bearer Token | 单产品拉配置 | 🟢 简单 |
| **M3** | 🟢 HMAC 签名 | 多产品 + 防重放 | 🟡 中等 |

### M1 · Bearer Token 示例

```typescript
// brain 端：环境变量配置 token
const VALID_TOKENS = ['brain_token_prod_xxx']

// 请求 header
Authorization: Bearer brain_token_prod_xxx

// 校验
if (req.headers.authorization !== `Bearer ${VALID_TOKENS[0]}`) {
  return { ok: false, error: 'unauthorized' }
}
```

### M3 · HMAC 签名设计

```typescript
// 每条消息带：
{
  from: "whoknow-waimai",
  to: "whoknow-brain",
  action: "track_event",
  payload: { ... },
  timestamp: 1721817600,
  nonce: "abc123",
  signature: "HMAC-SHA256(message, shared_secret)"
}

// 校验
const expected = HMAC-SHA256(message, SECRET)
if (provided !== expected) return unauthorized

// 防重放：timestamp 误差 > 60s 拒绝
```

---

## 🛡️ 降级策略（4 层 · 质量优先）

锡哥 Q23 拍板：**质量 > 数量，宁可没新内容也不出错**。

```
┌────────────────────────────────────────────┐
│  优先级 1：脑当日生成配置（最高质量）          │
│     ↓ brain 失败                            │
│  优先级 2：脑昨日生成配置（昨日质量稳定）       │
│     ↓ brain 全挂                             │
│  优先级 3：静态 fallback（写死在代码里）       │
│     ↓ fallback 也坏                          │
│  优先级 4：显示"今天没新段子"（诚实告知）       │
└────────────────────────────────────────────┘
```

### 降级触发逻辑（伪代码）

```typescript
async function getFoodConfig() {
  // 优先级 1
  const today = await fetchLatestConfig()
  if (today) return { ok: true, data: today }

  // 优先级 2
  const yesterday = await fetchLatestConfig({ date: 'yesterday' })
  if (yesterday) return { ok: true, data: yesterday, fallback: true }

  // 优先级 3
  const static = await fetchStaticFallback()
  if (static) return { ok: true, data: static, fallback: 'static' }

  // 优先级 4
  return { ok: false, error: 'no_config_available', message: '今天没新段子' }
}
```

---

## 🎨 JSON Schema 累计设计 v2.0

包含 **5 个新字段**（三司会审沉淀）：

```json
{
  "version": "2026-07-24.001",
  "generated_at": "2026-07-24T03:00:00Z",
  "effective_until": "2026-07-25T03:00:00Z",

  "meta": {
    "hot_today": "...",
    "weather": "...",
    "holiday": "..."
  },

  "food": {
    "boss": {
      "s001-老王烧烤": {
        "angry": ["...", "..."],
        "gentle": ["...", "..."]
      }
    },
    "rider": {
      "r001": ["..."]
    }
  },

  "mart": {},

  "soul_layer": {
    "npc_id": "s001-老王烧烤",
    "personality": "angry",
    "speech_style": "short-punchy",
    "topic_preference": ["weather", "hot_search"],
    "forbidden_words": ["萌", "亲", "宝贝"]
  },

  "ui_meta": {
    "ai_story_visible": true,
    "last_brain_run": "2026-07-24T03:00:00Z",
    "freshness_hours": 12
  },

  "story_assets": {
    "today_hot_topic": "...",
    "npc_quotes_today": ["..."]
  },

  "forbidden_check": {
    "version": "1.0",
    "red_light_count": 0,
    "yellow_light_count": 0,
    "passed": true
  },

  "fallback": {
    "food": { ... },
    "mart": {}
  }
}
```

---

## 🔄 工作流程 v2.0

### 每日运行（M0 手动触发，M1+ 接 cron）

```
触发（M0 手动 / M1 cron 03:00）
   │
   ├── 1️⃣ brain-collector（5 模块并行）
   │     ├─ hot.ts: 微博热搜 Top 10
   │     ├─ weather.ts: 今日天气
   │     ├─ holiday.ts: 今日节日
   │     ├─ news.ts: 5 条新闻摘要（M1+）
   │     └─ server.ts: 服务器心跳
   │
   ├── 2️⃣ brain-generator（LLM 调用）
   │     ├─ prompt.ts: 拼模板
   │     ├─ llm.ts: 调 DeepSeek V3
   │     ├─ forbidden.ts: 禁忌词过滤
   │     └─ soul.ts: NPC 人格注入（M1+）
   │
   ├── 3️⃣ brain-deployer（输出 3 路）
   │     ├─ file.ts: 写 brain-output/config-{date}.json
   │     ├─ report.ts: 写 daily-report.html（锡哥后台）
   │     └─ cdn.ts: 上 Cloudflare R2（M1+）
   │
   └── 4️⃣ 汇报（M1+ 才通知锡哥）
       └─ M0: board 通知码农虾
```

---

## 💰 成本估算 v2.0

| 项 | 频率 | 单次 | 月成本 |
|----|:----:|:----:|:-----:|
| 微博热搜 | 每日1次 | ¥0 | ¥0 |
| 天气 API | 每日1次 | ¥0 | ¥0 |
| 节日查询 | 每日1次 | ¥0 | ¥0 |
| LLM (DeepSeek V3) | 每日1次 | ¥0.3 | ¥9 |
| LLM 备用 (GLM-4.5) | 偶尔 | ¥0.5 | ¥1-3 |
| CDN 托管 | 静态 JSON | ¥0 | ¥0 |
| **合计** | | | **¥10-15/月** |

**锡哥预算上限 ¥30/月**：✅ 余量充足

---

## 🛡️ 可观测性 v2.0

### 健康检查 `/api/v1/health`

```json
{
  "ok": true,
  "version": "v2.0",
  "uptime_seconds": 86400,
  "last_generated": "2026-07-24T03:00:00Z",
  "config_versions": {
    "food": "2026-07-24.001",
    "mart": "2026-07-23.003"
  },
  "modules_status": {
    "collector/hot": "ok",
    "collector/weather": "ok",
    "collector/holiday": "ok",
    "generator/llm": "ok",
    "generator/forbidden": "ok",
    "deployer/file": "ok",
    "deployer/report": "ok"
  }
}
```

### 关键监控指标（M1+）

| 指标 | 阈值 | 告警 |
|------|------|:----:|
| `brain_uptime` | < 99% | 🔴 |
| `last_generated_age_hours` | > 36h | 🟡 |
| `llm_call_duration_ms` | > 30000 | 🟡 |
| `forbidden_red_count` | > 0 | 🔴 立即停 |
| `fallback_used` | > 0 | 🟡 |

---

## 🚦 实施时序（M0-M5）

| 阶段 | brain 角色 | 工作量 | 成本 |
|------|----------|:-----:|:----:|
| **M0** | 验证 AI 能生成可用话术 | 8-12h | ¥5 |
| **M1** | 帮 waimai 拉新留存 | +20h | ¥15 |
| **M2** | 接收埋点 + 自我调整 | +30h | ¥30 |
| **M3** | mart 接入 + 多产品矩阵 | +50h | ¥50 |
| **M4** | A/B test + 自我评估 | +80h | ¥80 |
| **M5** | 开放 API + 多租户 | +100h | ¥100+ |

**单人友好期（M0-M2）**：锡哥 1 人扛
**团队扩展期（M3+）**：必须找人协作（锡哥 Q31 警示）

---

## 🔒 关键设计原则（4 条 · 不可破）

### 1. **每个 API 一个模块**
> 一文件一功能，加新 = 加文件

### 2. **多产品共用协议**
> brain 一次 LLM = 多产品配置（成本摊薄）

### 3. **质量优先降级**
> 宁可"今天没新段子"也不出错（锡哥 Q23）

### 4. **单人友好优先（M0-M2）**
> 不是扩展性优先，是"让锡哥少干活"（锡哥 Q27）

---

## 📋 相关文档

| 文档 | 路径 | 状态 |
|------|------|:----:|
| 禁忌词清单 | `docs/禁忌词清单-v1.0.md` | ✅ v1.0 |
| 三司会审记录 | `docs/三司会审记录-2026-07-24.md` | ✅ 7-24 |
| v0.1 历史 | `docs/references/api-spec-v0.1-archive.md` | ✅ |
| v0.1 changelog | `docs/references/api-spec-v0.1-changelog.md` | ✅ |
| 前3秒爆专题 | `docs/topics/前3秒爆点专题.md` | 🟡 待做 |

---

## 🆕 v1.x → v2.0 升级路径（未来）

当需要再次大改时（预计 M3 团队化）：

1. **新建 v3.0 spec**
2. **v2.0 移到 references/**
3. **保留 references/ 作为历史档案**

---

## 🆕 v2.1 增量：4 个 P0 修正（三司会审沉淀）

> **来源**：v2.0 推出后，锡哥问"经过三司会审了吗？"——补做 R4 会审，发现 4 个 P0 缺口。

### P0-1 · M0 必做模块清单（13 → 8）

v2.0 列了 13 个脑内模块，但**没标"M0 必做"vs"M1+ 可选"**。M0 单人友好期不能贪多。

| 模块 | M0 | 工作量 | 备注 |
|------|:--:|:-----:|------|
| `collector/hot.ts`（微博热搜）| ✅ | 30min | 必做，3 数据源之一 |
| `collector/weather.ts`（天气）| ✅ | 15min | 必做 |
| `collector/holiday.ts`（节日）| ✅ | 15min | 必做 |
| `collector/server.ts`（服务器心跳）| ✅ | 1h | 必做（锡哥 Q10 后端数据）|
| `generator/llm.ts`（调 AI）| ✅ | 1h | 必做 |
| `generator/prompt.ts`（prompt 模板）| ✅ | 30min | 必做 |
| `generator/forbidden.ts`（禁忌词过滤）| ✅ | 30min | 必做（D1-D6 红绿灯）|
| `deployer/file.ts`（写本地 JSON）| ✅ | 20min | 必做 |
| `deployer/report.ts`（HTML 报告）| ✅ | 30min | 必做（锡哥 Q13 MD/HTML）|
| `collector/news.ts`（新闻 RSS）| ❌ | M1 | 数据源扩展 |
| `generator/soul.ts`（NPC 人格独立化）| ❌ | M1 | 防同质化 |
| `deployer/cdn.ts`（上 CDN）| ❌ | M1 | 当前不上 CDN |
| `collector/metrics.ts`（产品埋点）| ❌ | M2 | 玩家行为数据回流 |

**M0 必做 = 8 个**，M1 +3，M2 +1。

### P0-2 · 人工审核工作流（锡哥 Q19 流程图）

> **锡哥原话**："先走人工审核，就像现在一样，你问我答，你把需要我审核的内容整理成文件，我一条一条审核、批注。"

**M0 工作流**：

```
brain 跑完（手动触发）
  ↓
1️⃣ brain-generator 输出 pending-config-{date}.md（不是 JSON）
  ↓
2️⃣ 锡哥打开文件（board 通知码农虾 + 文件路径）
  ↓
3️⃣ 锡哥逐条批注：
   · "过"（批准）
   · "这句不要，太油腻"
   · "再写一版"
   · 加 emoji：👍 👎 📝
  ↓
4️⃣ 码农虾读取批注，整理成 latest-config.json
  ↓
5️⃣ waimai 启动时 fetch latest-config.json
  ↓
6️⃣ 玩家看到审核通过的话术
```

**文件格式**（M0 简化版 MD）：

```markdown
# 胡闹大脑 · 待审核 · 2026-07-24

## 老王烧烤（angry）

1. "大暑天吃烧烤我跟你急..." ← [锡哥批注]
2. "下雨了更要烤..."          ← ✅
3. "..."                     ← ❌ 这句不要

## 佛系老张（gentle）

1. "心静自然凉..." ← ✅
2. "..." ← [锡哥批注]
```

**关键约束**：
- 锡哥**只审核，不写代码**
- 码农虾**整理 + 落盘**
- AI **每次都重新生成**，锡哥不审过的**永远不进 waimai**

### P0-3 · 降级时 UI 显示策略（4 级）

v2.0 写"今天没新段子"，但**没说 UI 怎么显示**。M0 必须有方案。

| 降级级别 | UI 提示文案 | UI 元素 | waimai 行为 |
|---------|----------|--------|------------|
| **L1** 脑今日成功 | "🧠 今日 AI 更新 · 12 小时前" | 水印（页脚）| 渲染今日话术 |
| **L2** 脑昨日降级 | "⏰ 昨日 AI 内容" | 水印（页脚）| 渲染昨日话术 |
| **L3** 静态 fallback | "🎭 经典段子" | 水印（页脚）| 渲染写死内容 |
| **L4** 全部失败 | "今天没新段子，喝杯水吧 ☕" | 温和弹窗 | 显示菜单但无新内容 |

**水印位置**（waimai 首页页脚）：

```
┌──────────────────────────┐
│  ...首页内容...           │
│                          │
├──────────────────────────┤
│ 🧠 今日 AI 更新 · 12h 前 │  ← 水印（永远在）
└──────────────────────────┘
```

**L4 失败弹窗**（M0 + L4 触发时）：

```
┌────────────────────────────┐
│  今天没新段子                │
│  ────────────────          │
│  我们正在调教 AI 老板       │
│  先喝杯水，下次再来         │
│                            │
│      [好的]                │
└────────────────────────────┘
```

**关键设计**：
- **永远显示水印**（让玩家知道"AI 在工作"）
- **绝不静默失败**（玩家至少知道状态）
- **温和不焦虑**（L4 文案不吓人）

### P0-4 · waimai 老接入点对接

**现状**：waimai config.ts 7-22 已写 `/api/chaos-brain` 接入点。

**问题**：v2.0 用 `/api/v1/food/config`，**老路径冲突**。

**对接方案（3 选项）**：

| 方案 | 含义 | 优 | 缺 |
|------|------|---|---|
| 🅰️ **保留 + 转发** | `/api/chaos-brain` 转发到 `/api/v1/food/config` | waimai 不改 | 多一跳 |
| 🅱️ **改 waimai 路径** | waimai config.ts 改用 `/api/v1/food/config` | 干净 | waimai 要改 1 处 |
| 🅲️ **双支持 6 个月** | 两条路径并存 | 兼容老版 | 维护两份 |

**推荐 🅱️**（最简单）：

```typescript
// whoknow-waimai/src/utils/config.ts（未来改动）
export async function fetchRemoteConfig(): Promise<any> {
  const hooks = getBrainHooks()
  if (!hooks.enabled) return configData

  // 🆕 v2.1 升级：从 /api/chaos-brain 改为 /api/v1/food/config
  const endpoint = hooks.endpoint || '/api/v1/food/config'

  try {
    const res = await fetch(endpoint, { ... })
    // ...
  }
}
```

**M0 实施时**：
1. waimai config.ts 改 endpoint 默认值
2. brain 部署时同时提供两条路径
3. 1 个月后下掉 `/api/chaos-brain`

---

## 📊 v2.0 → v2.1 变更总结

| # | P0 修正 | 严重性 | 状态 |
|---|---------|:----:|:----:|
| 1 | M0 必做模块清单 | 🔴 | ✅ |
| 2 | 人工审核工作流 | 🔴 | ✅ |
| 3 | 降级时 UI 显示策略 | 🔴 | ✅ |
| 4 | waimai 老接入点对接 | 🔴 | ✅ |

**未引用的精华**（v2.2 再说）：

- 锡哥 SOUL 铁律（关键词查库 / 三阶段）
- 锡哥 USER 画像（个人开发者）
- Vant 跨 chunk 坑（前端部署注意）
- board 通讯机制（M0 通知用）
- skill 隔离目录约定

---

_v2.0 · 2026-07-24 锡哥拍板"推倒重来" · 码农虾落档_
_v2.1 增量 · 锡哥 AA 拍板 · 2026-07-24 22:08_
_基于 R4 三司会审补 4 个 P0 修正_
_基于 3 轮三司会审（31 共识 + 19 警示 + 44 问答）_