# Route B 执行计划 · 核心循环优先（2026-07-25）

> 目标：以原型图（`prototype/`，commit 6194643）的**设计系统 + 选店/成就墙/段子层骨架**为皮，
> 把 M1 游戏内核（DRAMA 引擎 + 11 分支种子 + 记忆 + 红线门控）填进去。
> 路线 B：先翻主题 + 建 **选店 → 下单 → 订单详情(drama 渲染) → 历史 + 成就墙** 主链路；其余页后续。

## 一、核心设计决策（已定）

1. **保留 M1 内核种子为权威**：`DRAMA-SEED-v1`（11 分支，用 `{orderTotal}`/`{deliveryFee}`，含 `default` 兜底）不动。
   - 理由：占位符正确、含 default 兜底（普通订单有反应）、已 27/27 测试绿。原型 config 用 `{price}/{fee}` 且缺 remark/address/default，不宜直接替换。
   - 因此任务 #38（占位符统一）在本路线**按设计消解**：不加载原型 config，M1 种子已是正确变量名。改为加一条测试断言种子无 `{price}`/`{fee}` 残留。
2. **翻主题**：`style.css` 整本替换为原型 `whoknow.css`（胡闹黄 #FFD100 / 价格红 #FF4B10，浅色外卖皮）。组件改用 `--mt-*` 变量。
3. **personality 作视觉 flavor（非引擎维度）**：商店挂 `personality` 字段 + 徽章；订单详情顶部显示该店老板 persona 开场白。引擎暂不做 per-personality 分支（深做留待后续）。
4. **成就墙数据驱动**：建成就目录（10 个引擎成就 ID → 名称/图标/描述/人格/奖励），`memory` 记录解锁集合，已解锁点亮、未解锁置灰。
5. **段子层水印**：`ui_meta._watermark_note` → 首页 + 订单详情显示「🎭 锡哥精选段子」水印条（禁用「🧠 今日 AI 更新」）。

## 二、文件清单（对照任务）

| 任务 | 文件 | 动作 |
|---|---|---|
| #36 主题 | `src/style.css` | 整本替换为浅色胡闹黄（含表单输入样式） |
| #40 数据 | `src/data/shops.ts` | 新建：商店目录（5 人格 + 3 骑手）+ persona 映射 |
| #44 数据 | `src/data/achievements.ts` | 新建：10 引擎成就 ID → 展示元数据目录 |
| #42/#43 记忆 | `src/store/memory.ts` | 扩展：`unlockAchievements`/`getAchievements`/`recordOrderHistory`/`getOrderHistory` |
| #37 组件 | `src/components/PhoneFrame.vue` | 手机框 + 状态栏 + TabBar 容器 |
| #37 组件 | `src/components/Statusbar.vue` | 状态栏 |
| #37 组件 | `src/components/TabBar.vue` | 底部导航（外卖/订单/成就，读 route 高亮） |
| #37 组件 | `src/components/ShopCard.vue` | 商家卡 + persona 徽章 |
| #37 组件 | `src/components/PersonaBadge.vue` | persona chip |
| #37 组件 | `src/components/RiderCard.vue` | 骑手卡（订单详情头） |
| #37 组件 | `src/components/DramaTimeline.vue` | 四阶段 drama 渲染进时间线（替换原 DramaStage 色块） |
| #37 组件 | `src/components/AchievementCard.vue` | 成就墙卡片 |
| #40 页 | `src/views/ShopListView.vue` | 商家列表（ShopCard 列表 + 搜索头 + TabBar） |
| #40 页 | `src/views/ShopView.vue` | 店铺详情（persona 徽章 + 开场白 + 去下单） |
| #41 页 | `src/views/OrderView.vue` | 重写：选店带入（query `?shop=`）+ 表单 + 结果态=订单详情 |
| #43 页 | `src/views/OrdersView.vue` | 历史列表（memory.getOrderHistory） |
| #44 页 | `src/views/AchievementsView.vue` | 成就墙（目录 + 解锁集合） |
| #45 路由 | `src/router/index.ts` | 加 /shops /shop/:id /orders /achievements |
| #45 壳 | `src/App.vue` | 用 PhoneFrame 包裹 router-view |
| #41 壳 | `src/views/HomeView.vue` | 原型 home 风（黄区 + 搜索 + 金刚区 + 段子水印 + 去 /shops） |
| #46 测试 | `src/store/memory.test.ts` | 成就追踪 + 历史记录 |
| #46 测试 | `src/data/shops.test.ts` | 商店目录 + persona 映射 |
| #46 测试 | `src/config/loader.test.ts`（改） | 断言种子无 `{price}`/`{fee}` 残留 |

## 三、drama → 原型组件映射

- 引擎 `RunResult.events[]`（4 阶段 accept/cook/deliver/complete）→ `DramaTimeline` 竖向时间线，每行：persona 头像(老板🍳/骑手🛵/系统⚙️) + 角色标签 + 台词 + 心情Δ + 延时。
- 订单详情头：`RiderCard`（骑手名/人格/距离）+ `eta-bar`（老板心情 + 段子气泡）。
- 红线门控：保留（渲染后检查台词，red_light 命中即拦截不发布）。
- 成就：结果含 `branch.achievements` → `memory.unlockAchievements` + 详情页成就 toast。

## 四、验收标准

- `npm test` 全绿（原 27 + 新增 ≈ 6）。
- `npm run build` 通过（vue-tsc 0 错 + vite 打包）。
- 手动核对（沙箱禁端口，仅静态核对）：`/shops` 列表有 persona 徽章；`/shop/:id` 显示人格；`/order?shop=` 表单预填；下单后详情时间线渲染四阶段、无 `{price}` 原样；`/orders` 有历史；`/achievements` 解锁点亮。
- 部署：预构建 `waimai/` 重新提交 + push，线上浅色皮 + 主链路可用。

## 五、风险

- 浅色主题下旧深色组件样式需全量改写（非叠加）——已通过整本替换 style.css 规避。
- `default` 兜底文案偏平淡 → 顺手改得更胡闹（不影响命中逻辑）。
- personality 仅作视觉 flavor，未进入引擎分支（已知范围，后续可深做）。
