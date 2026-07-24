# 📐 Phase 1 MVP 规格（v2 - 三阶段渐进方案）

> **最后更新**：2026-07-20
> **状态**：Phase 1 草案，等待锡哥过审

---

## 🎯 Phase 1 目标（Week 1-2，10-12 天）

**核心**：跑通"真实买家 + NPC 商家骑手"的完整下单流程，验证情绪产品力

**用户旅程**：
1. 用户打开"胡闹外卖"（美团 UI）
2. 浏览 20 个 NPC 商家（有戏精老板名字/性格）
3. 加入购物车 → 选地址 → 下单
4. NPC 商家"接单"（2-5 分钟倒计时 + 老板甩话）
5. NPC 骑手"抢单"（5-10 分钟倒计时 + 骑手甩话）
6. 骑手在地图上"移动"（SVG 动画）
7. 送达 → 写戏精评价
8. 获得虚拟币 → 解锁新商家/新菜品

---

## 📦 Phase 1 功能清单（P0 必须有）

### 🎨 UI 层
- [ ] 美团风首页（轮播图 + 8 分类 + 商家列表）
- [ ] 商家列表页（分类筛选 + 排序）
- [ ] 商家详情页（头部 + 商品 + 购物车 + 评价 + 商家信息）
- [ ] 购物车
- [ ] 下单确认页
- [ ] 订单详情页（状态追踪 + 地图移动动画）
- [ ] 个人中心
- [ ] 评价弹窗

### 🎭 三身份入口
- [ ] 我是买家（默认 Tab）
- [ ] 我是商家（NPC 演示，提示"该身份由 NPC 扮演"）
- [ ] 我是骑手（NPC 演示，提示"该身份由 NPC 扮演"）

### 👤 NPC 系统（核心创新）
- [ ] 20 个 NPC 商家（写死数据，含名字/头像/菜单/出餐时长/老板性格/口头禅）
- [ ] NPC 商家状态机：待接单 → 已接单 → 出餐中 → 已出餐
- [ ] NPC 商家"说话气泡"（基于性格生成文案）
- [ ] 8 个 NPC 骑手（名字/头像/座驾/口头禅）
- [ ] NPC 骑手状态机：待抢单 → 已抢单 → 取餐中 → 配送中 → 已送达
- [ ] NPC 骑手地图移动动画（SVG path）

### 💬 戏精评价系统
- [ ] 5 星评分
- [ ] 标签选择（好吃/慢/小哥态度好/包装精美...）
- [ ] 戏精评论（预设 50 条 + 随机模板生成）
- [ ] 评价展示

### 💰 虚拟币系统（P1 · M2 再做 · Phase 1 无限刷无限点）
- [ ] 完成订单 +50 金币（仅记录，不下限制）
- [ ] 看广告（激励视频）获得金币
- [⚠️] ~~每日签到~~ ❌ **已砍（7-21 痛点审计：0 痛点覆盖）**

---

## 🛠 技术规格（Phase 1）

### 技术栈
```
前端框架：Vue 3 + Vite
UI 组件库：Vant UI 4.x（移动端美团风）
路由：Vue Router 4
状态管理：Pinia
样式：SCSS + 像素风变量
数据：JSON 写死（20 商家 + 8 骑手 + 200 商品 + 50 评价模板）
部署：Vercel 免费

数据持久化：localStorage（Phase 1 不上数据库）
状态广播：不需要（Phase 2 才需要 WebSocket）
```

### 关键数据模型（Phase 1 简化版）
```typescript
// 商家（写死）
{
  id: string,
  name: string,        // "老王烧烤"
  avatar: string,      // 像素头像
  type: string,        // "烧烤"
  rating: number,      // 4.5
  monthlySales: number,// 1000+
  bossPersonality: 'angry' | 'gentle' | 'weird' | 'fast',
  bossMottos: string[],// 老板甩话库
  menus: Dish[]
}

// 骑手（写死）
{
  id: string,
  name: string,        // "张师傅"
  avatar: string,
  vehicle: 'bike' | 'ebike' | 'motor',
  mottos: string[]     // 口头禅库
}

// 订单（运行时生成）
{
  id: string,
  userId: string,
  shopId: string,
  riderId: string,
  items: Dish[],
  totalPrice: number,
  status: 'pending' | 'cooking' | 'delivering' | 'completed',
  riderLocation: {x, y},
  createdAt: timestamp
}
```

---

## 📁 文件结构

```
src/
├── api/                  # 数据接口（mock）
├── assets/               # 静态资源
├── components/
│   ├── base/             # 基础组件
│   ├── shop/             # 商家相关
│   ├── order/            # 订单相关
│   ├── rider/            # 骑手相关
│   └── npc/              # NPC 戏精系统
├── pages/
│   ├── Home.vue
│   ├── ShopList.vue
│   ├── ShopDetail.vue
│   ├── Cart.vue
│   ├── Checkout.vue
│   ├── OrderDetail.vue
│   ├── Profile.vue
│   └── Role/
│       ├── Buyer.vue
│       ├── Boss.vue     # 商家 NPC 演示
│       └── Rider.vue    # 骑手 NPC 演示
├── router/
├── store/                # Pinia stores
│   ├── shop.ts
│   ├── cart.ts
│   ├── order.ts
│   └── npc.ts           # NPC 状态机
├── styles/
├── data/
│   ├── shops.json       # 20 商家
│   ├── riders.json      # 8 骑手
│   ├── dishes.json      # 200 商品
│   └── quotes.json      # 评价模板
├── utils/
│   └── npcEngine.ts     # NPC 行为引擎
├── App.vue
└── main.ts
```

---

## 📅 Phase 1 工期（10-12 天）

| Day | 任务 | 产出 |
|-----|------|------|
| Day 1 | Vite 起项目 + Vant 集成 + 路由 + Pinia | 空壳能跑 |
| Day 2 | 首页 + 商家列表（15 家） | 看到 NPC 商家们 |
| Day 3 | 商家详情页 + 购物车 + 100 道菜 | 能加入购物车 |
| Day 4 | 下单流程 + NPC 商家/骑手状态机 | 能下单 + 看 NPC 演戏 |
| Day 5 | 戏精话术 20×10 变量 + 骑手地图简化动画 | NPC 开始有灵魂 |
| Day 6 | 戏精评价 20 条 + Slogan「零卡路里的外卖，越点越瘦」| 完整闭环 |
| Day 7 | 测试 + 部署 Vercel | 上线 |

> **砍掉的（痛点滤网审计）**：签到系统 · 三 Tab 身份切换 · 个人中心 · 虚拟币经济约束 · 复杂 SVG

---

## 🚦 Phase 1 结束后的成功指标

上线 1 周后看：
- [ ] DAU ≥ 100
- [ ] 平均会话时长 ≥ 5 分钟
- [ ] 单用户下单次数 ≥ 3
- [ ] 戏精评价率 ≥ 30%（说明"戏精"调性有效）
- [ ] 分享/截图率 ≥ 5%

**达到 → 进入 Phase 2**
**未达到 → 调整定位，可能需要换赛道**

---

## 🚧 Phase 2 增量（在 Phase 1 基础上 +2 周）

### 技术增量
- 后端 API（Node.js + Express + SQLite）
- WebSocket 实时推送（骑手抢单实时同步）
- 用户认证（手机号/邮箱登录）

### 功能增量
- 骑手=真人（独立客户端/页面）
- 抢单大厅（WebSocket 实时刷单）
- 骑手收益提现（虚拟币）
- NPC 骑手兜底（真人少的时候自动派）

---

## 🚧 Phase 3 增量（在 Phase 2 基础上 +4-6 周）

### 技术增量
- 撮合引擎（订单分配算法）
- 信誉分系统
- 实时状态广播（三方）
- 商家后台（独立 Web 端）

### 功能增量
- 商家=真人（开店系统）
- 商家装修 + 菜单编辑 + 定价
- 平台抽成系统
- 投诉/仲裁机制

---

## 🚨 风险清单

| 风险 | 应对 |
|------|------|
| Phase 1 数据不够丰富（15 家店）| 够刷就够了——痛点①需要的是「有内容」，不是「海量内容」🥇 准备 30 商家备用 |
| Vercel 部署慢 | 准备 Netlify 备选 |
| 戏精评价太套路（20 条）| 20 条 × 10 变量 = 200 组合；观察用户行为再扩充
| NPC 话术 2 周看穿 | 第 1 周先上路，收集真实小红书/Twitter 评论 → 2 周三期扩充
| 减肥痛点无留存 | Slogan「零卡路里的外卖，越点越瘦」首页可见
| Phase 2/3 没人接骑手 | NPC 骑手 100% 兜底，永远不让玩家卡单
| Phase 3 三方不可能同时有玩家 | 三方各自有 NPC 兜底，按比例动态调

---

_起草人：码农虾 💻 · 2026-07-20_