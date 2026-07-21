# 🧑‍💻 DEVELOPER.md · 胡闹外卖（ChaosWaimai）

> **给 CodeBuddy（或任何接手开发的 AI/人类）看的开发指南**
> **最后更新**：2026-07-21（整合 15 个参考项目，详见 DEV-PLAN.md）
> **产品文档在**：本仓库全部文档（决策/规格/审计）

> ⚡ **每次新对话的第一步**：「先读 `docs/specs/AI-DEV-GUIDE.md`，然后告诉我你理解了什么，再开始今天的任务。」

---

## 📋 1. 项目是什么

**胡闹外卖** = 披着美团外衣的虚拟外卖 App。**不是真外卖，是段子机 + 外卖解瘾器。**

### 4 大核心痛点（一切开发决策以此为准）

| # | 痛点 | 产品怎么解 |
|---|------|---------|
| ① 无聊 | 打开 App → 刷刷 15 家店 → 看看戏精老板 → 看看骑手翻车 |
| ② 想笑 | NPC 暴躁老板/佛系大叔/飙车骑手 + 20 条戏精评价模板+变量 = 200 种组合 |
| ③ 没时间没钱 | 打开像美团（0 学习成本）· 点几下就有反馈 · 不肝不氪 |
| ④ 想减肥管不住手 | 「同样的冲动，零卡路里出口」 —— 满足「点外卖」的瘾但吃不到真饭 |

> **铁律**：任何功能先过「解决了哪个痛点？」——答不出就不做。详见 `docs/audit/06-三司会审痛点审计-2026-07-21.md`

---

## 🛠️ 2. 技术栈

| 层 | 技术 | 理由 |
|----|------|------|
| 框架 | **Vue 3 + Vite** | 最新生态，开发快 |
| UI 组件库 | **Vant UI 4.x** | 有赞开源移动端组件库，原生美团风 |
| 路由 | Vue Router 4 | Vue3 标配 |
| 状态管理 | Pinia | Vue3 标配 |
| 样式 | SCSS | 方便全局覆盖 |
| 数据 | JSON 写死 | Phase 1 没后端，全放 `src/data/` |
| 部署 | Vercel | 免费，全球 CDN |

### 为什么用 Vant 而不是仿美团组件？

美团 UI 是**8 分相似**（不是 1:1 抄袭）。Vant UI 4.x 的移动端卡片/列表/购物车/评价组件天然像美团 UI，在此基础上改颜色/间距/品牌元素即可。不需要从零造轮子。

---

## 📁 3. 文件结构（Phase 1 M1 版）

```
src/
├── main.ts                    # 入口
├── App.vue                    # 根组件
├── router/index.ts            # 路由配置
├── store/                     # Pinia 状态
│   ├── shop.ts                # 商家列表/详情
│   ├── cart.ts                # 购物车
│   ├── order.ts               # 订单
│   └── npc.ts                 # NPC 状态机
├── pages/
│   ├── Home.vue               # 首页（轮播/分类/商家列表）
│   ├── ShopList.vue           # 商家列表页
│   ├── ShopDetail.vue         # 商家详情（商品/购物车/评价）
│   ├── Checkout.vue           # 下单确认页
│   └── OrderDetail.vue        # 订单追踪（NCP 状态 + 骑手地图）
├── components/
│   ├── base/                  # 基础组件（美团风）
│   ├── shop/                  # 商家卡片/商品卡片
│   ├── order/                 # 订单卡片/状态标签
│   ├── npc/                   # NPC 系统组件
│   │   ├── BossBubble.vue     # 老板说话气泡
│   │   ├── RiderBubble.vue    # 骑手说话气泡
│   │   └── NpcStatus.vue      # NPC 状态动画
│   └── review/                # 评价组件
│       ├── ReviewModal.vue    # 评价弹窗
│       └── ReviewCard.vue     # 评价展示卡片
├── data/                      # 写死数据（Phase 1 无后端）
│   ├── shops.json             # 15 家 NPC 商家
│   ├── riders.json            # 5 个 NPC 骑手
│   ├── dishes.json            # 100 道商品（每家 5-7 道）
│   └── quotes.json            # 20 条评价模板 × 10 变量 = 200 组合
├── utils/
│   ├── npcEngine.ts           # NPC 行为引擎（核心创新）
│   └── reviewGenerator.ts     # 戏精评价生成器
└── styles/
    ├── vant-override.scss     # Vant 主题覆盖 → 美团风
    └── global.scss            # 全局样式
```

---

## 🗃️ 4. 关键数据模型

```typescript
// 商家（15 家，写死）
interface Shop {
  id: string;
  name: string;            // "老王烧烤"
  avatar: string;          // URL
  type: string;            // "烧烤/奶茶/麻辣烫/寿司/炸鸡/黄焖鸡..."
  rating: number;          // 4.5
  monthlySales: number;    // 1000+
  deliveryFee: number;     // 3
  deliveryTime: number;    // 30
  distance: number;        // 1.2 km
  bossPersonality: 'angry' | 'gentle' | 'weird' | 'lazy' | 'philosophical';
  bossMottos: string[];    // 5 条老板甩话（变量化）
  menus: Dish[];
}

// 商品（100 道，写死）
interface Dish {
  id: string;
  shopId: string;
  name: string;            // "变态辣翅根"
  price: number;           // 28
  image: string;
  description: string;     // 老板说:"吃了别怪我"
  monthlySales: number;
}

// 骑手（5 个，写死）
interface Rider {
  id: string;
  name: string;            // "张师傅"
  avatar: string;
  vehicle: 'bike' | 'ebike' | 'motor' | 'rickshaw';
  mottos: string[];        // 口头禅库
  speed: number;           // 配送速度倍率（0.8-1.2）
}

// 订单（运行时生成）
interface Order {
  id: string;
  shopId: string;
  riderId: string;
  items: Dish[];
  status: 'pending' | 'accepted' | 'cooking' | 'delivering' | 'completed';
  timeline: { time: string; action: string; npcQuote?: string }[];
  riderLocation?: { x: number; y: number };
  createdAt: number;
  review?: Review;
}

// 评价（运行时生成）
interface Review {
  rating: number;      // 1-5
  tags: string[];      // 好吃/慢/小哥态度好...
  content: string;     // 戏精评论（从模板+变量组合生成）
  createdAt: number;
}
```

---

## 🎭 5. NPC 系统设计（核心创新 · P0 必须有）

### NPC 行为引擎（`npcEngine.ts`）

买家下单后，NPC 事件链自动触发：

```
下单 → 商家接单（2-5秒）→ 老板说话气泡 → 出餐（5-10秒）→ 
骑手抢单（1-3秒）→ 骑手说话气泡 → 配送（10-20秒 SVG 动画）→ 
送达 → 评价弹窗
```

### 老板性格变量（决定话术风格）

| 性格 | 示例话术 | 出餐速度 |
|------|---------|---------|
| `angry` | "催什么催！等着！" | 慢 |
| `gentle` | "好的亲，马上就好~" | 正常 |
| `weird` | "你点的菜......我研究一下" | 随机 |
| `lazy` | "啊？现在做啊？......行吧" | 很慢 |
| `philosophical` | "年轻人，你点的不是菜，是寂寞" | 正常 |

### 骑手性格变量

| 座驾 | 口头禅风格 | 速度 |
|------|-----------|------|
| bike | "马上到马上到" | 0.8x |
| ebike | "gogogo！" | 1.0x |
| motor | "让一下让一下" | 1.2x |
| rickshaw | "坐稳了您嘞！" | 0.6x |

### 话术变量化（抗套路）

每条模板用 5 个变量替换，不用纯固定文案：
```
模板："[老板] 对 [商品] [动作]，[吐槽]"
例： "老王烧烤 对 变态辣翅根 翻了个白眼，说'吃死你'"
变量：shopName, dishName, action, quote, emotion
```

---

## 🚫 6. 明确不做的事（痛点滤网审计 · 錡哥拍板）

| 功能 | 状态 | 原因 |
|------|:----:|------|
| 签到系统 | ❌ **已砍** | 0 痛点覆盖，过度设计 |
| 虚拟币消耗限制 | ❌ **降 P1** | Phase 1 无限刷无限点 |
| 三 Tab 身份切换 | ❌ **仅买家 Tab** | M1 只做买家视角 |
| 个人中心/历史订单 | ❌ **降 M2** | M1 只跑核心下单闭环 |
| 复杂 SVG 地图动画 | ❌ **简化版** | 直线路径即可，不走复杂 path |
| 后端 API | ❌ **Phase 2** | Phase 1 全 JSON 写死 |
| 用户登录/注册 | ❌ **简化** | Phase 1 无认证，localStorage 存 user_id |
| 真实支付 | ❌ **永远不做** | 个人开发者+虚拟 App |

---

## 📅 7. 开发顺序（7 天 M1）

| Day | 任务 | 产出 | 痛点 |
|-----|------|------|:----:|
| D1 | Vite 起项目 + Vant 集成 + Router + Pinia | 空壳能跑 | — |
| D2 | 首页 + 商家列表（15 家数据写死）| 能看到 NPC 商家们 | ① |
| D3 | 商家详情 + 购物车 + 100 道菜 | 能加购浏览 | ①③④ |
| D4 | 下单流程 + NPC 状态机（接单/出餐/配送）| 能下单 + NPC 演戏 | ②③④ |
| D5 | NPC 话术 20×10 变量 + 骑手地图简化动画 | NPC 有灵魂了 | ② |
| D6 | 戏精评价 20 条 + Slogan「零卡路里的外卖，越点越瘦」| 完整闭环 | ②④ |
| D7 | 测试 + 部署 Vercel | 上线 | 全部 |

> 📎 详细任务清单（含每步「抄哪个参考文件」的具体指引）→ `docs/specs/DEV-PLAN.md`

---

## 🎨 8. 美团风 UI 要点

**目标**：8 分相似美团 + 品牌点缀（不是 1:1 山寨）

| 元素 | 做法 |
|------|------|
| 头部颜色 | 美团绿 → 改品牌色 #ff6b35（胡闹橙）|
| 商家卡片 | Vant Card 组件 + 圆角 + 阴影 |
| 商品列表 | Vant Cell 或 Card + 价格右对齐 |
| 购物车 | Vant ActionBar + Sidebar |
| 评价弹窗 | Vant Popup + Rate + Field |
| 订单追踪 | Vant Steps + 自定义状态条 |
| 地图 | 简易 SVG（不是百度/高德地图）|
| 字体 | 沿用系统字体，不加自定义字体 |

**品牌点缀位置**（共 4 处）：
1. App 顶部 Logo + "胡闹外卖" 字样
2. 首页 Slogan 区域：「零卡路里的外卖，越点越瘦」
3. 评价区域：戏精标签（"老板脾气好大"/"骑手会飞"等）
4. 订单完成页：胡闹外送的彩蛋页

---

## 🔗 9. 参考链接

| 资源 | 地址 |
|------|------|
| GitHub 仓库 | `duckytan/chaos-waimai`（隐私，需要邀请） |
| Vant UI 4.x | https://vant-ui.github.io/vant/#/zh-CN |
| Vite 文档 | https://vitejs.dev/ |
| 灵感来源 | FoodNeverComes（70 万人下过单的韩国虚拟外卖 App）|
| **开发计划** | `docs/specs/DEV-PLAN.md`（Day by Day，含每步参考文件）|
| **参考项目** | `opensource-refs/github/`（9 个）+ `opensource-refs/gitee/`（6 个）|

---

## 📦 10. Mock 数据示例（Phase 1 起步用）

需要先在 `src/data/` 下准备好这些 JSON 文件：

### shops.json 示例
```json
[
  {
    "id": "s001",
    "name": "老王烧烤",
    "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=laowang",
    "type": "烧烤",
    "rating": 4.5,
    "monthlySales": 1024,
    "deliveryFee": 3,
    "deliveryTime": 30,
    "distance": 1.2,
    "bossPersonality": "angry",
    "bossMottos": [
      "又来了又来了，催什么催",
      "这单做不做？不做我下班了",
      "吃辣是吧？辣死你我可不管",
      "行行行，给你插个队",
      "你这点得也太多了..."
    ]
  }
]
```

### 人格特点记录
```
angry: 老王烧烤 · 暴躁小面 · 火辣川菜
gentle: 张阿姨厨房 · 温暖便当 · 好粥道
weird: 神秘寿司 · 实验料理 · 小黑汉堡
lazy: 老陈黄焖鸡 · 拖延奶茶 · 不想动烧烤
philosophical: 孔子饺子 · 禅意寿司 · 诗人豆浆
```

---

> **给 CodeBuddy 最后一句话**：这个产品的灵魂不在技术栈，在 **NPC 戏精人格**。UI 像不像美团不重要，NPC 会不会说话才重要。
> 代码跑通 = 50%，NPC 能让人笑 = 100%。
