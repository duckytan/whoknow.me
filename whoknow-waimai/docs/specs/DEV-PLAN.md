# 🛠️ 胡闹外卖 · 详细开发计划

> **制定日期**：2026-07-21
> **依据文档**：DEVELOPER.md + PROJECT-STATUS.md + 三司会审痛点审计
> **最后更新**：2026-07-21（整合 15 个开源参考项目：9 GitHub + 6 Gitee）
> **原则**：任何功能先过痛点滤网，答不出来就不做

---

## 📦 参考项目速查表

> 开发时按需打开对应目录 `opensource-refs/<项目名>/`

**GitHub 项目（9 个）**

| 缩写 | 路径 | 最有价值的东西 |
|------|------|--------------|
| **vue-mt** | `github/vue-meituan/` | UI 截图 + 商家详情/购物车 Vue2 结构 |
| **mt-app** | `github/Meituan-app/` | 左右联动逻辑 + shopcart.vue + cartcontrol |
| **iphone3** | `github/v1/` | `pro.server.js`（37 行 Mock Server）+ data.json |
| **nextord** | `github/NextOrders/` | food-schema Zod 模型（722行）+ Pinia order store（258行）|
| **rush33** | `github/food-delivery/` | 5 状态订单机枚举 + 三端拆分 + dishes/orderDishes 分表 |
| **adrian** | `github/food_ordering/` | CartCustomization 模型 + Zustand→Pinia cart store |
| **wechat-mt** | `github/wechat-meituan/` | 首页 6 排序逻辑 + 商家 schema（8 种活动类型）|

**Gitee 项目（6 个）**

| 缩写 | 路径 | 最有价值的东西 |
|------|------|--------------|
| **elm** | `gitee/vue2-elm/` | **mutations.js 购物车状态管理最完整**（14 种 mutation，含 localStorage 同步）|
| **flash** | `gitee/flash-waimai/` | **confirmOrder.vue 下单确认页最完整**（地址/时间/支付/食物/备注五区块）|
| **fang-mt** | `gitee/vueFangMeiTuanWaiMai/` | **ratings.vue 评价 UI + foods.vue 左右联动完整版**（含菜品弹窗+角标）|
| **gitee-vue-mt** | `gitee/vue-meituan/` | Vue3+Koa 全栈，有 SQL 数据表，store 骨架参考 |
| **rn-mt** | `gitee/MeiTuan/` | React Native，仅 53 张真实 App 截图有参考价值 |
| **miniprogram-mt** | `gitee/meituan-takeout/` | 小程序，review 页标签数据结构参考 |

---

## 📌 开发前置清单（Day 0 · 开工前确认）

- [ ] 确认域名方案（建议 `nofood.foodcheck-ai.com` 做验证期）
- [ ] 确认 Vercel 账号已注册
- [ ] 确认本地 Node.js 版本 ≥ 18
- [ ] 确认 onboarding 文案（#014 议题，开工前最好拍板）

### Day 0 预操作：先抄这 3 件事（省 2 天）

1. **抄数据结构** → 打开 `opensource-refs/NextOrders/packages/food-schema/src/`，参考 `Menu.ts` / `Order.ts` / `OrderItem.ts` 改造成 `shops.json` / `dishes.json`
2. **抄订单状态枚举** → 打开 `opensource-refs/food-delivery/`，找 `order status` 相关枚举（pending/accepted/cooking/delivering/delivered），扩展 NPC 字段变成 8 状态
3. **抄 Mock Server** → 复制 `opensource-refs/v1/pro.server.js`，改端口 3001，就是 Mock Server 起点（Phase 2 用，Day 0 先备好）

---

## 🗺️ 里程碑总览

```
M1 能下单  ██████░░░░  5-6 天（参考项目加持，原 6-7 天）← 当前目标
M2 能评价  ░░░░░░░░░░  M1 后 1-2 周
M3 能上线  ░░░░░░░░░░  M2 后 1 周
M4 能传播  ░░░░░░░░░░  M3 后 1 周（可并行）
```

---

## 📅 M1：能下单（5-6 天）

### Day 1 · 项目骨架

**目标**：空壳能在浏览器跑起来

**任务清单**：
- [ ] `npm create vite@latest chaos-waimai -- --template vue-ts`
- [ ] 安装依赖：`vant@^4` `vue-router@4` `pinia` `sass`
- [ ] 配置 Vant 按需引入（`@vant/auto-import-resolver`）
- [ ] 配置 Vue Router：定义 5 个页面路由
- [ ] 配置 Pinia：创建 store 目录骨架
- [ ] 配置 SCSS：`vant-override.scss`（主题色改为胡闹橙 `#ff6b35`）+ `global.scss`
- [ ] 配置移动端 viewport meta（`width=device-width, initial-scale=1`）
- [ ] Vercel 项目初始化（`vercel init`），确认能部署空壳

> 📎 **参考**：`vue-mt` 的 `src/` 目录结构 → 照抄分层模式（components/pages/store）
> 📎 **参考**：`nextord` 的 Pinia store 命名/分层模式（`packages/core/` 里的 store 文件）

**产出**：`localhost:5173` 能跑，Vercel 上能访问

---

### Day 2 · 首页 + 商家列表

**目标**：看到 15 家 NPC 商家

**任务清单**：

#### 数据层
- [ ] 创建 `src/data/shops.json`（15 家商家，含名字/头像/类型/评分/月销/配送费/配送时长/距离/老板性格/老板语录 5 条）
  - 5 种性格各 3 家：angry × 3 / gentle × 3 / weird × 3 / lazy × 3 / philosophical × 3
  - 参考 DEVELOPER.md 中 shops.json 示例

> 📎 **直接参考字段**：`wechat-mt` 的商家 schema（含 8 种活动类型 `activities[]`，月销、评分、配送信息字段名已规范化）
> 📎 **直接参考字段**：`opensource-refs/Meituan-app/data.json` 前 60 行（商家+菜品混合 JSON，解包可用）
> 📎 **直接参考字段**：`nextord/packages/food-schema/src/Restaurant.ts`（Zod schema 定义，字段全）

#### 组件层
- [ ] `components/shop/ShopCard.vue`（商家卡片：头图+名字+评分+月销+配送信息）
- [ ] `components/base/AppHeader.vue`（顶部导航：Logo + 「胡闹外卖」+ 搜索框）
- [ ] `components/base/AppTabBar.vue`（底部 Tab：🍜买家 / 👨‍🍳老板演示 / 🛵骑手演示）

> 📎 **UI 截图参考**：`vue-mt` 的首页截图（`screenshots/` 或项目 README 图），ShopCard 布局参考 `restaurant-list.vue`

#### 页面层
- [ ] `pages/Home.vue`
  - Vant Swipe 轮播（3 张本地占位图）
  - 8 分类 icon（烧烤/奶茶/麻辣烫/寿司/炸鸡/黄焖鸡/披萨/饺子）
  - 顶部品牌 slogan：**「零卡路里的外卖，越点越瘦」**
  - 商家列表（ShopCard 列表渲染）
- [ ] `pages/ShopList.vue`（分类筛选页，简单列表即可）

> 📎 **代码参考**：`vue-mt/src/components/index/index.vue`（首页骨架逻辑，分类 icon + 商家列表组合方式）
> 📎 **代码参考**：`wechat-mt` 的 6 种排序逻辑（综合/销量/距离/评分，可作为筛选功能参考）

#### Store 层
- [ ] `store/shop.ts`（商家列表数据，加载 shops.json）

**产出**：首页能刷 15 家店，有品牌 slogan

---

### Day 3 · 商家详情 + 购物车

**目标**：能把菜加进购物车

**任务清单**：

#### 数据层
- [ ] 创建 `src/data/dishes.json`（100 道菜，每家 6-7 道，含 id/shopId/名字/价格/图片/月销/老板说）
- [ ] 创建 `src/data/riders.json`（5 个骑手，含 id/名字/头像/座驾/口头禅库 5 条）

> 📎 **数据结构参考**：`nextord/packages/food-schema/src/MenuItem.ts`（菜品 Zod 模型，含 `category / price / description / imageUrl`）
> 📎 **数据结构参考**：`rush33` 的 `dishes` 表字段（id / restaurantId / name / price / image / available）
> 📎 **数据结构参考**：`adrian` 的 `CartCustomization`（选项/规格字段，可作为后续扩展参考）

#### 组件层
- [ ] `components/shop/DishCard.vue`（菜品卡片：图+名字+价格+加减按钮）
- [ ] `components/shop/CartBar.vue`（底部购物车浮层：总价+数量+去结算按钮）

> 📎 **直接翻译**：`github/Meituan-app/src/components/shopcart.vue` → Vue3 + Pinia 版（购物车底部浮层逻辑 1:1 可用）
> 📎 **直接翻译**：`github/Meituan-app/src/components/cartcontrol.vue` → DishCard 里的加减按钮逻辑（`+/-` 按钮绑定 store action）
> 📎 **UI 参考**：`github/vue-meituan/src/components/index/restaurant-detail/goods/goods.vue`（左分类+右菜品+购物车三合一布局）
> 📎 **左右联动进阶版**：`gitee/vueFangMeiTuanWaiMai/src/components/foods/foods.vue`（含 `getBoughtNumber` 分类角标 + 菜品弹窗 `middle-modal`，比 mt-app 更完整）

#### 页面层
- [ ] `pages/ShopDetail.vue`
  - 商家头部（头图/名字/评分/配送信息）
  - 左侧菜单分类 + 右侧菜品列表（Vant Sidebar + Cell）
  - 底部 CartBar
  - 商家已有戏精评价展示区（写死 3 条，Day 6 再做完整）

> 📎 **布局参考**：`vue-mt/src/components/index/restaurant-detail/restaurant-detail.vue`（商家详情页完整结构，Vue2→3 改造）

#### Store 层
- [ ] `store/cart.ts`（购物车：加减商品/计算总价/清空）

> 📎 **逻辑参考**：`github/Meituan-app` 的 Vuex cart module → 直接翻译成 Pinia defineStore（addItem/removeItem/clearCart/totalPrice 计算属性）
> 📎 **逻辑参考**：`github/NextOrders` 的 Pinia order store（`packages/core/` 里，258 行，含 localStorage 持久化模式）
> 📎 **最全 mutation 参考**：`gitee/vue2-elm/src/store/mutations.js` L51-L117（ADD_CART / REDUCE_CART / INIT_BUYCART / CLEAR_CART，含 localStorage 双向同步，翻译成 Pinia action 最省力）

**产出**：能浏览 100 道菜，能加减购物车，底部浮层显示总价

---

### Day 4 · 下单流程 + NPC 状态机

**目标**：能下单 + 看 NPC 演戏（核心功能）

**任务清单**：

#### 下单流程
- [ ] `pages/Checkout.vue`（下单确认页）
  - 收货地址（写死一个假地址，或 localStorage 存简单文本）
  - 订单详情（商家/商品/总价）
  - 备注输入（Vant Field）
  - 确认下单按钮

> 📎 **UI 布局最佳参考**：`gitee/flash-waimai/.../confirmOrder/confirmOrder.vue`（5 区块布局：地址+送达时间+支付方式+食物列表+备注，是目前最完整的下单页模板）

#### NPC 引擎（核心创新）
- [ ] `utils/npcEngine.ts`
  - `triggerOrderFlow(order)` — 触发完整 NPC 事件链
  - `getBossQuote(personality, shopName, dishName)` — 生成老板甩话
  - `getRiderQuote(vehicle, riderName)` — 生成骑手甩话
  - 状态机定时器（用 `setTimeout` 模拟真实延迟）：
    ```
    接单(2-5s) → 出餐(5-10s) → 骑手抢单(1-3s) → 配送(10-20s) → 送达
    ```

> 📎 **直接用**：`rush33` 的 5 状态枚举（`PENDING / ACCEPTED / COOKING / OUT_FOR_DELIVERY / DELIVERED`）→ 扩展 2 个 NPC 专属状态（`BOSS_COMPLAINING / RIDER_LOST`）变成 7 状态
> 📎 **架构参考**：`rush33` 的三端拆分思路（顾客端/商家端/骑手端状态同步逻辑），用于理解状态流转时序

#### 组件层
- [ ] `components/npc/BossBubble.vue`（老板说话气泡，带性格对应表情/颜色）
- [ ] `components/npc/RiderBubble.vue`（骑手说话气泡）
- [ ] `components/npc/NpcStatus.vue`（NPC 状态标签：接单中/出餐中/配送中）

#### 页面层
- [ ] `pages/OrderDetail.vue`
  - Vant Steps 订单时间线
  - NPC 状态 + 气泡实时更新
  - 简化 SVG 地图（Day 5 完善）

#### Store 层
- [ ] `store/order.ts`（订单：创建/状态更新/历史记录 localStorage）
- [ ] `store/npc.ts`（NPC 状态机状态）

> 📎 **Store 结构参考**：`github/NextOrders` 的 Pinia order store（`packages/core/stores/order.ts`，258 行，actions 命名/结构直接参考）
> 📎 **数据模型参考**：`github/food-delivery` 的 `orderDishes` 关联表设计（orderDishes 存快照：dishName / price / quantity，防止菜品改价影响历史订单）

**产出**：完整下单 → NPC 接单出餐配送 → 送达 全流程跑通

---

### Day 5 · NPC 话术 + 骑手地图动画

**目标**：NPC 有灵魂，骑手会动

**任务清单**：

#### NPC 话术库
- [ ] `src/data/quotes.json`（20 条话术模板 × 10 变量 = 200 种组合）
  - 格式：`"[shopName] 的老板对 [dishName] 翻了个白眼：「[quote]」"`
  - 变量：shopName / dishName / riderName / vehicle / emotion
  - 按性格分组：angry(5) / gentle(4) / weird(4) / lazy(4) / philosophical(3)
- [ ] 更新 `npcEngine.ts`，接入 quotes.json 变量替换逻辑

> 📎 **Schema 参考**：`wechat-mt` 的商家 activities 字段（8 种活动类型），同样的"枚举+文案"模式可以照搬到 quotes.json 结构设计

#### 骑手地图动画
- [ ] `components/order/RiderMap.vue`
  - 简化 SVG 画布（300×200 px，不用真地图）
  - 起点（商家图标）→ 终点（家图标）直线路径
  - 骑手小图标沿路径做 CSS `animation` 移动（10-20s）
  - 配合订单状态，配送开始时触发动画

**产出**：每次下单老板/骑手说不同的话，骑手在地图上会动

---

### Day 6 · 戏精评价系统 + 完整闭环

**目标**：订单完成后可以写戏精评价，形成完整闭环

**任务清单**：

#### 评价系统
- [ ] `utils/reviewGenerator.ts`（戏精评价生成器）
  - 20 条评价模板库（搞笑/夸张/哲学/吐槽 4 类各 5 条）
  - 随机抽取 + 变量填充

#### 组件层
- [ ] `components/review/ReviewModal.vue`（评价弹窗）
  - Vant Popup
  - 5 星评分（Vant Rate）
  - 标签选择（"老板脾气好大"/"骑手会飞"/"差点没吃到"等 8 个 Vant Tag）
  - 戏精评论文本（预生成一条，可编辑）
  - 提交按钮
- [ ] `components/review/ReviewCard.vue`（评价展示卡片）

> 📎 **ReviewCard UI 最佳参考**：`gitee/vueFangMeiTuanWaiMai/src/components/ratings/ratings.vue`（头像+用户名+星级+送达时间+评论+标签+**商家回复** 的完整布局 — 把「商家回复」字段改成 NPC 老板的戏精回话）
> 📎 **标签 Tag 池结构参考**：`gitee/meituan-takeout/pages/review/`（预设评价标签数组结构，替换成胡闹系标签如「老板差点把锅扔过来」「骑手骑的像在飞」）

#### 订单完成页彩蛋
- [ ] `OrderDetail.vue` 送达状态 → 弹出胡闹彩蛋卡片（随机一句送达感言）
- [ ] 触发 ReviewModal 评价弹窗

#### 品牌元素补齐（4 处）
- [ ] ① 顶部 Logo「胡闹外卖」
- [ ] ② 首页 slogan「零卡路里的外卖，越点越瘦」（Day 2 已加）
- [ ] ③ 评价戏精标签（已在 ReviewModal）
- [ ] ④ 订单完成彩蛋页

**产出**：下单 → NPC 演戏 → 送达 → 写戏精评价，完整闭环跑通

---

### Day 7（备用缓冲） · 测试 + Vercel 部署

**目标**：上线，发链接

> 若 Day 1-6 顺利，此天可提前到 Day 6 晚上；若有卡点，此天作为缓冲

**任务清单**：

#### 测试
- [ ] 完整下单流程测试（首页 → 商家 → 加购 → 下单 → 等 NPC → 送达 → 评价）
- [ ] 移动端适配测试（iPhone/Android Chrome）
- [ ] 边界情况：购物车为空下单/多次连续下单
- [ ] NPC 话术不重复验证（连续下 5 单看是否有重复）

#### 部署
- [ ] `vercel build` 本地验证
- [ ] `vercel --prod` 部署
- [ ] 配置子域名 `nofood.foodcheck-ai.com`（Vercel 自定义域名 CNAME）
- [ ] 在手机上打开验证真机效果

#### 收尾
- [ ] 更新 `PROJECT-STATUS.md` 进度（M1 ✅）
- [ ] 截图/录屏留档

**产出**：`nofood.foodcheck-ai.com` 可公开访问，准备发朋友圈

---

## 📅 M2：能评价（M1 后 1-2 周）

> 待 M1 上线，收集用户反馈后再细化

**待做功能**：
- [ ] 历史订单页（查看所有下过的单）
- [ ] 戏精评价扩充到 200 条模板
- [ ] 三 Tab 入口（商家 NPC 演示 / 骑手 NPC 演示页面）
- [ ] 虚拟币系统（localStorage，下单 +50，仅记录）
- [ ] 个人中心（简化版：展示下单次数/虚拟币/最近评价）

---

## 📅 M3：能上线（M2 后 1 周）

**合规 + 正式域名**：
- [ ] 顶部合规 banner（「本产品为虚拟娱乐，不涉及真实外卖/支付」）
- [ ] 隐私政策页（简版，说明 localStorage 本地存储，不收集个人信息）
- [ ] 用户协议页
- [ ] 决定正式域名（`nofood.foodcheck-ai.com` 或新购）
- [ ] Vercel 正式域名绑定

---

## 📅 M4：能传播（M3 后 1 周，可并行）

**传播工具链**（AI 辅助）：
- [ ] 录制 3-5 条短视频（剪映/必剪录屏 + 文案）
- [ ] V2EX 发帖（「我做了个虚拟外卖 App，永远送不到」）
- [ ] 即刻 / 少数派发文
- [ ] 小红书图文（可选）
- [ ] 朋友圈发布

---

## 🚫 始终不做（痛点滤网已砍）

| 功能 | 原因 |
|------|------|
| 签到系统 | 0 痛点覆盖，过度设计 |
| 真实支付 | 个人开发者不可用 |
| 用户登录注册 | Phase 1 localStorage UUID 够用 |
| 后端 API | Phase 1 全 JSON 写死 |
| 撮合引擎/信誉分 | Phase 3 以后再说 |
| 皮肤/会员/UGC 分成 | 商业模式简化，纯广告 |

---

## 📊 技术架构速查

```
前端：Vue 3 + Vite + TypeScript
UI：Vant UI 4.x（主题色：胡闹橙 #ff6b35）
路由：Vue Router 4
状态：Pinia
样式：SCSS
数据：JSON 写死 + localStorage
部署：Vercel
域名（验证期）：nofood.foodcheck-ai.com
```

---

## 📁 文件结构（M1 完成态）

```
src/
├── main.ts
├── App.vue
├── router/index.ts
├── store/
│   ├── shop.ts
│   ├── cart.ts
│   ├── order.ts
│   └── npc.ts
├── pages/
│   ├── Home.vue
│   ├── ShopList.vue
│   ├── ShopDetail.vue
│   ├── Checkout.vue
│   └── OrderDetail.vue
├── components/
│   ├── base/
│   │   ├── AppHeader.vue
│   │   └── AppTabBar.vue
│   ├── shop/
│   │   ├── ShopCard.vue
│   │   ├── DishCard.vue
│   │   └── CartBar.vue
│   ├── npc/
│   │   ├── BossBubble.vue
│   │   ├── RiderBubble.vue
│   │   └── NpcStatus.vue
│   ├── order/
│   │   └── RiderMap.vue
│   └── review/
│       ├── ReviewModal.vue
│       └── ReviewCard.vue
├── data/
│   ├── shops.json      # 15 家 NPC 商家
│   ├── dishes.json     # 100 道菜
│   ├── riders.json     # 5 个骑手
│   └── quotes.json     # 20 模板 × 10 变量
├── utils/
│   ├── npcEngine.ts
│   └── reviewGenerator.ts
└── styles/
    ├── vant-override.scss
    └── global.scss
```

---

## ✅ M1 完成验收标准

上线后确认以下 5 件事：
1. 手机浏览器打开，UI 8 分像美团
2. 首页能刷 15 家戏精商家
3. 能完整走完：加购 → 下单 → NPC 演戏（老板/骑手说话）→ 骑手地图移动 → 送达 → 写评价
4. 连续下 3 单，NPC 话术不完全相同
5. slogan「零卡路里的外卖，越点越瘦」在首页可见

---

_计划制定：码农虾 💻 · 2026-07-21_
_参考资源整合 v1：2026-07-21（9 个 GitHub 开源项目代码导图）_
_参考资源整合 v2：2026-07-21（新增 6 个 Gitee 项目分析，总计 15 个参考项目）_
