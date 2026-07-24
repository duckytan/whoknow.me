# 🧠 whoknow-brain · 胡闹控制中心技术架构 v2.0

> **版本**：v2.0 · 2026-07-24
> **拍板人**：Ducky 錡（whoknow 系创始人）
> **作者**：码农虾 💻
> **状态**：✅ 当前主版本
> **取代**：v0.1（7-21 ~ 7-24）→ 见 `references/api-spec-v0.1-archive.md`

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

_v2.0 · 2026-07-24 锡哥拍板"推倒重来" · 码农虾落档_
_基于 3 轮三司会审（31 共识 + 19 警示 + 44 问答）_