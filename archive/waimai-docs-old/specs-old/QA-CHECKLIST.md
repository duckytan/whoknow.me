# 🔍 胡闹外卖 · QA 自检清单

> **适用范围**：M1 开发过程中的每日自检 + 上线前质量门
> **制定日期**：2026-07-21
> **使用方法**：
> - **每天结束**前跑一遍当天对应的「每日 QA」
> - **Day 7 上线前**跑一遍「上线质量门」
> - 有未通过项 → 修复后才能进入下一步

---

## 📋 每日 QA（每天任务完成后必跑）

### Day 1 · 项目骨架 QA

```
□ npm run dev 无报错启动
□ npm run build 构建成功（无 TypeScript 编译错误）
□ 5 个路由都可访问（手动在地址栏输入路径）
□ Pinia store 文件结构已创建（shop/cart/order/npc）
□ 主题色 #ff6b35 已在 vant-override.scss 中定义
□ global.scss 已引入
□ package.json 版本锁定（vant^4, vue-router@4, pinia, sass）
```

### Day 2 · 首页 + 商家列表 QA

```
□ shops.json 商家数量 = 15，字段完整（id/name/rating/monthlySales/
  deliveryFee/deliveryTime/bossPersonality/bossMottos）
□ 5 种性格各 3 家（angry×3, gentle×3, weird×3, lazy×3, philosophical×3）
□ 首页 slogan 文案精确：「零卡路里的外卖，越点越瘦」（不能有错别字）
□ ShopCard 组件无 props 类型报错
□ 点击商家跳转路由正常（/shop/:id）
□ 图片加载失败有占位处理（不显示破损图标）
□ 控制台无报错
```

### Day 3 · 商家详情 + 购物车 QA

```
□ dishes.json 商品总数 = 100（每家 6-7 道）
□ 每道菜必须字段完整：id / shopId / name / price / image / monthlySales
□ 购物车 store：addItem / removeItem / clearCart / totalPrice 全部有效
□ 加减购物车后，CartBar 浮层数量和总价实时更新
□ localStorage 键名统一：cart_items（不要用中文键名）
□ 刷新页面：购物车数据不丢失
□ 左右联动：点左侧分类，右侧滚动到对应分类（不会滚到错误位置）
□ 购物车为空时，CartBar 浮层隐藏（不显示「¥0.00 · 去结算」）
□ 控制台无报错
```

### Day 4 · 下单 + NPC 状态机 QA

```
□ 订单状态枚举 7 个全部存在：
  pending / accepted / cooking / rider_assigned / delivering /
  boss_complaining / completed
□ npcEngine.ts 的 triggerOrderFlow() 能完整走完全部状态
□ setTimeout 定时器：组件销毁时 clearTimeout（防内存泄漏）
□ 多次下单：每次生成唯一 orderId（不能重复）
□ 老板气泡文案：与商家 bossPersonality 对应（angry 的不能说温柔的话）
□ 下单完成后：购物车自动清空（store.clearCart() 已调用）
□ 订单存入 localStorage：键名 orders（数组形式）
□ 刷新页面：订单列表不丢失
□ 控制台无报错
```

### Day 5 · NPC 话术 + 骑手地图 QA

```
□ quotes.json 模板数量 ≥ 20 条
□ 按性格分组：angry/gentle/weird/lazy/philosophical 各有对应模板
□ 变量替换测试：传入 {shopName:"老王烧烤", dishName:"翅根"} 后
  输出文案中含有这两个词
□ 骑手地图 SVG：起点图标 + 终点图标 + 骑手移动图标 3 个元素都存在
□ 动画触发时机：仅在 status = "delivering" 时开始
□ 动画结束时机：status = "completed" 时停止（不继续循环）
□ 连续下 3 单：老板话术不完全相同（肉眼可辨）
□ 控制台无报错
```

### Day 6 · 评价 + 完整闭环 QA

```
□ 评价弹窗触发时机：status = "completed" 后自动弹出（或点彩蛋后弹出）
□ 评价弹窗必填项：评分（默认 5 星，可修改）
□ 评价预填文案：从 reviewGenerator 生成，不是固定字符串
□ 提交后：评价数据存入对应订单的 review 字段（localStorage）
□ 商家详情页：能看到刚提交的评价（review 列表）
□ 4 处品牌元素检查：
  ① Logo「胡闹外卖」存在
  ② 首页 slogan「零卡路里的外卖，越点越瘦」存在
  ③ 评价标签有胡闹风文案（≥ 6 个）
  ④ 送达彩蛋页/卡片存在
□ 完整流程跑一遍：首页→进店→加购→下单→等 NPC→送达→评价，无崩溃
□ 控制台无报错
```

---

## 🚨 上线质量门（Day 7 · 发链接前必过）

> **以下任何一项未通过 = 不准上线**

### 🔴 P0 · 核心流程（必须 100% 通过）

```
□ 完整下单流程 × 3 次：全部无报错崩溃
□ NPC 状态机 3 次中至少 2 次话术不同
□ 评价提交后数据持久化（刷新后还在）
□ 手机真机（Safari / Chrome）打开 Vercel 链接可用
□ 合规声明文字可见（「本产品为虚拟娱乐，不涉及真实外卖或支付」）
```

### 🟡 P1 · 体验质量（建议通过，不通过记录问题）

```
□ 首屏白屏时间 < 5 秒（手机 4G 模拟）
□ 所有按钮点击区域 ≥ 44×44px（手指可准确点击）
□ 无横向滚动（iPhone 390px 宽度下）
□ 图片加载失败时有占位图（不显示破碎图标）
□ 所有页面标题/导航显示正确（不是「undefined」或「NaN」）
□ 购物车总价计算正确（多件商品不同价格加总）
□ NPC 定时器在页面切换后不继续输出（不在控制台打印已跑完的状态）
```

### 🟢 P2 · 文案 & 品牌（建议通过）

```
□ 没有中文错别字（产品名/slogan/NPC 话术）
□ 没有「TODO」「测试」「placeholder」「FIXME」等临时文字残留
□ 15 家商家名字有创意，不是「商家1」「商家2」
□ 100 道菜菜名有创意，不是「菜品1」「菜品2」
□ NPC 话术有笑点（让人看了想分享）
```

---

## 🐛 Bug 等级定义（修复优先级）

| 等级 | 定义 | 处理方式 |
|------|------|---------|
| **P0** | 核心流程崩溃/白屏/数据丢失 | **立即修复，不进下一步** |
| **P1** | 功能异常但有 workaround | 当天修复 |
| **P2** | UI 不好看/文案问题 | 有时间再改 |
| **P3** | 完善性建议 | 记录到 M2 Backlog |

---

## 📝 问题记录模板

每天发现问题用以下格式记录（直接追加到本文档末尾）：

```
日期：YYYY-MM-DD
问题描述：[具体描述，例：iOS Safari 下购物车浮层被键盘遮挡]
复现步骤：[步骤1] → [步骤2] → [看到什么]
等级：P0 / P1 / P2 / P3
修复状态：未修复 / 已修复（说明怎么修的）
```

---

## 📋 M2 Backlog（M1 发现但不影响上线的问题）

> M1 结束后发现的非必要问题，记录在这里等 M2 处理

_（开发过程中持续追加）_

---

_制定：码农虾 💻 · 2026-07-21_
