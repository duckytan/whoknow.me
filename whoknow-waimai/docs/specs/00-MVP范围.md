# 📐 MVP 功能规格（草案 v0.1）

> **最后更新**：2026-07-20
> **状态**：草案，等待锡哥过审

---

## 🎯 MVP 范围（2 周跑通）

### P0 必须有 ✅

#### 1. 美团 UI 1:1 复刻
- [ ] 首页（轮播图 + 8 个分类入口 + 附近商家列表）
- [ ] 商家列表页（分类筛选 + 排序 + 商家卡片）
- [ ] 商家详情页（头部 + 商品列表 + 购物车 + 评价 + 商家信息）
- [ ] 购物车页
- [ ] 下单确认页（地址 + 备注 + 支付方式）
- [ ] 订单详情页（状态追踪 + 骑手位置地图 + 联系按钮）
- [ ] 个人中心（虚拟币余额 + 历史订单 + 收藏店铺）
- [ ] 评价弹窗（5 星 + 标签 + 戏精评论）

#### 2. 三 Tab 身份入口
- [ ] 我是买家（默认 Tab）
- [ ] 我是商家（NPC 模式入口，提示"该身份为 NPC 演示"）
- [ ] 我是骑手（NPC 模式入口，提示"该身份为 NPC 演示"）

#### 3. 买家端 = 真人
- [ ] 用户注册（简单版，手机号/邮箱）
- [ ] 用户登录
- [ ] 下单流程完整跑通

#### 4. 商家端 = NPC（写死数据）
- [ ] 20 个 NPC 商家（名字/头像/菜单/出餐时长/老板性格）
- [ ] 商家自动接单逻辑（基于概率 + 性格）
- [ ] 商家出餐动画（3-10 分钟倒计时）

#### 5. 骑手端 = NPC（写死数据）
- [ ] 8 个 NPC 骑手（名字/头像/座驾/口头禅）
- [ ] 骑手自动抢单逻辑
- [ ] 骑手地图移动动画（基于 SVG/Canvas）
- [ ] 配送时间随机（10-30 分钟）

#### 6. 评价系统
- [ ] 5 星评分
- [ ] 标签选择（好吃/慢/小哥态度好/包装精美...）
- [ ] 戏精评论（预设 50 条+随机模板）
- [ ] 评价展示

### P1 第二批做 🟡

- [ ] 角色等级 + 信誉分
- [ ] 收藏店铺功能
- [ ] 历史订单
- [ ] 虚拟币明细（充值/消费/获取来源）
- [ ] 签到系统
- [ ] 看广告得虚拟币（激励视频）
- [ ] 戏精评价模板库（收集 200+ 条）

### P2 暂不做 ❌

- [ ] 真实玩家商家
- [ ] 真实玩家骑手
- [ ] 公会/排行榜
- [ ] 语音/视频
- [ ] 真实支付
- [ ] 真实定位

---

## 🛠 技术规格

### 技术栈
```
前端框架：Vue 3 + Vite
UI 组件库：Vant UI 4.x（移动端，长得像美团）
路由：Vue Router 4
状态管理：Pinia
CSS 预处理：SCSS
像素风覆盖：CSS Pixel Art 全局变量
数据：JSON 写死（20 商家 + 8 骑手 + 50 商品 + 50 评论）
部署：Vercel
```

### 数据模型（初稿）
```typescript
// 商家
{
  id: string,
  name: string,        // "老王烧烤"
  avatar: string,      // 像素头像 URL
  type: string,        // "烧烤/小吃/正餐/甜品"
  rating: number,      // 4.5
  monthlySales: number,// 1000+
  deliveryFee: number, // 3
  deliveryTime: number,// 30 分钟
  distance: number,    // 1.2 km
  bossPersonality: string, // "火爆" / "佛系"
  menus: MenuItem[]
}

// 骑手
{
  id: string,
  name: string,        // "张师傅"
  avatar: string,
  vehicle: string,     // "电动车"
  motto: string,       // "风里雨里，我等你"
  rating: number
}

// 商品
{
  id: string,
  shopId: string,
  name: string,        // "麻辣小龙虾"
  price: number,
  originalPrice: number,
  image: string,
  description: string,
  sales: number
}

// 订单
{
  id: string,
  userId: string,
  shopId: string,
  riderId: string,
  items: CartItem[],
  totalPrice: number,
  virtualCoinUsed: number,
  status: 'pending' | 'cooking' | 'delivering' | 'completed',
  createdAt: timestamp,
  riderLocation: {x: number, y: number} // 地图坐标
}

// 评价
{
  id: string,
  orderId: string,
  shopRating: number,
  riderRating: number,
  tags: string[],
  comment: string,     // 戏精评论
  createdAt: timestamp
}
```

### 文件结构
```
src/
├── api/                  # 数据接口（mock）
├── assets/               # 静态资源（图片、字体）
├── components/           # 通用组件
│   ├── base/             # 基础组件（按钮/卡片/星级）
│   ├── shop/             # 商家相关组件
│   ├── order/            # 订单相关组件
│   └── rider/            # 骑手相关组件
├── pages/                # 页面
│   ├── Home.vue          # 首页
│   ├── ShopList.vue      # 商家列表
│   ├── ShopDetail.vue    # 商家详情
│   ├── Cart.vue          # 购物车
│   ├── Checkout.vue      # 下单确认
│   ├── OrderDetail.vue   # 订单详情（含地图动画）
│   ├── Profile.vue       # 个人中心
│   └── Role/             # 三身份入口
├── router/               # 路由
├── store/                # Pinia store
├── styles/               # 全局样式 + 像素风变量
├── data/                 # NPC 数据（JSON）
├── utils/                # 工具函数
├── App.vue
└── main.ts
```

---

## 📅 工期估算（10-12 天）

| Day | 任务 | 产出 |
|-----|------|------|
| Day 1 | Vite 起项目 + Vant 集成 + 路由 | 空壳能跑 |
| Day 2 | 首页 + 商家列表页 | 看到 20 个 NPC 商家 |
| Day 3 | 商家详情页 + 商品+购物车 | 能加入购物车 |
| Day 4 | 下单流程 + 订单创建 | 能下单 |
| Day 5 | 订单详情页 + 骑手地图动画 | 看到骑手移动 |
| Day 6 | 评价系统 + 个人中心 | 能写戏精评价 |
| Day 7 | 三 Tab 入口（买家/商家/骑手 NPC） | 身份切换 |
| Day 8 | 像素风 CSS 滤镜 | 视觉风格统一 |
| Day 9 | 戏精评论库 + 数据填充 | 内容丰满 |
| Day 10 | 测试 + 修复 + 部署 Vercel | 上线 |
| Day 11-12 | 缓冲 + 锡哥反馈调整 | 优化 |

---

## 🚨 风险与备案

| 风险 | 备案 |
|------|------|
| 像素风 UI 太丑 | 准备两套风格，锡哥不满意就切 |
| Vercel 部署慢 | 准备 Netlify 备选 |
| NPC 数据不够丰富 | 准备 50 商家/20 骑手/200 商品备用 |
| 戏精评论太套路 | 收集真实小红书/Twitter 评论当素材 |

---

_起草人：码农虾 💻 · 2026-07-20_