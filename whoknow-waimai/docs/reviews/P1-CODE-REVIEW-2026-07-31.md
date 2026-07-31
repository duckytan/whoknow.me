# P1「美团交互范式保真」工程规范代码审查报告

| 项 | 值 |
|---|---|
| TASK ID | T-P1-AUDIT-02 |
| 审查人 | 程基岩（engineering-lead / 技术方向） |
| 日期 | 2026-07-31 |
| 审查类型 | 工程规范代码审查（只读，未修改任何 src 代码） |
| 审查范围 | P1-1 ~ P1-8 涉及的 12 个源文件 + `style.css` + 数据/存储层 |
| 权威规格 | `docs/designs/waimai-meituan-soul-fidelity-spec.md` §4（P1 清单）/ §5（不动清单） |
| 基线校验 | `npm test` **61/61 绿** ｜ `npx vue-tsc --noEmit` **0 error** ｜ `npx vite build` **成功**（172.48 kB JS / 53.98 kB CSS） |

> 审查者立场声明：本报告以第三方视角撰写。P1 代码由 engineering-lead 角色自己产出，本次审查刻意不做辩护。
> 所有"逻辑类"缺陷均已用脚本复现验证（不改动源码，仅复刻表达式），验证结论标注为 ✅ **已复现**。

---

## 1. 审查结论摘要

### 整体代码健康度评级：**C+（黄灯 · 有条件放行）**

| 维度 | 评级 | 一句话 |
|---|---|---|
| 架构合理性 | B | 分层清晰（data / store / engine / views），引擎红线守得很干净 |
| 红线合规 | **A−** | 引擎/核心零改动（4 个提交 0 文件命中 `src/engine`、`src/core`），数据仅做可选字段扩展 |
| 类型安全 | B− | `vue-tsc` 全绿，但存在 3 处 `as string` 断言绕过窄化 |
| 功能正确性 | **D+** | **P1-5 / P1-3 / P1-8 三项的核心表现层逻辑存在用户可见缺陷** |
| CSS 规范 | C | 令牌体系完备但执行不彻底；约 16 组死 CSS；z-index 无层级体系 |
| 性能 | B | 无重计算热点；但 4 个组件定时器未在卸载时清理 |
| 可访问性 | C− | 有 focus-visible / reduced-motion / aria-pressed 等亮点，但触控目标与语义化标签系统性不达标 |
| 健壮性 | C | 空态覆盖良好；但 `JSON.parse` 无保护，脏 localStorage 可白屏 |
| 测试工程性 | **D** | P1 引入的全部纯逻辑均埋在 `.vue` 内，测试运行器结构性够不着，覆盖率为 0 |

### 问题计数

| 级别 | 数量 | 定义 |
|---|---|---|
| 🔴 **Blocker** | **3** | 用户可见的功能性缺陷，且恰好命中 P1 本阶段承诺交付的能力 |
| 🟠 **Major** | **14** | 不致命但会导致错误体验、维护成本上升或线上白屏风险 |
| 🟡 **Minor** | **21** | 技术债 / 一致性 / 死代码，可排期处理 |

### 是否建议放行进 P2

> ### ⚠️ **不建议直接放行。建议「小修后放行」。**

理由不是代码写得差 —— 架构、红线、类型、构建都是健康的。**问题在于 3 个 Blocker 全部落在 P1 自己承诺的交付项上**：

- P1-5 承诺"菜品卡片显示月售/标签" → 实测**所有带 tags 的菜品月售行都不渲染**（B-1）
- P1-5 承诺"原价划线 + 折扣" → 实测渲染成 **"低至67折"**（真值应为 6.7 折）（B-2）
- P1-8 承诺"修复选中态" → 实测**下单页/店铺页/首页共 3 处 Tab 永远无法取消高亮**（B-3）

这三条如果带进 P2，quality-lead 的符合性验收必然打回，且 P2 会在错误的视觉基线上继续叠加。

**建议路径**：先修 `B-1 / B-2 / B-3` 三个 Blocker + `M-4`（定时器泄漏）+ `M-5`（localStorage 白屏），预计 **2.5–3.5 人时**，回归 `npm test` + `vue-tsc` 后即可放行 P2。其余 Major/Minor 转入技术债看板，与 P2 并行消化。

---

## 2. 问题清单

### 🔴 Blocker

---

#### **B-1 · 菜品「月售/评价」副标题对所有带标签菜品静默失效（数组 `includes` 与字符串 `includes` 混用）**

- **文件**：`src/views/ShopView.vue:191-193`
- **现象**：
  ```
  <span v-if="d.tags?.includes('月售')" class="dc-monthly">{{ d.tags.find(t => t.includes('月售')) }}</span>
  ```
  `v-if` 用的是 `Array.prototype.includes('月售')`——要求数组里存在一个**恰好等于** `'月售'` 的元素；
  而渲染体用的是 `String.prototype.includes('月售')`——匹配 `'月售28'` 这类前缀串。
  数据层 `dishes.ts` 里的标签实际是 `'月售28'` / `'月售100+'` / `'月售50+'`，**没有任何一个等于 `'月售'`**。

- **✅ 已复现**（复刻表达式跑真实数据）：
  ```
  s01_d1 tags=["招牌","月售28"]    => v-if=false  (本应渲染 "月售28")
  s02_d1 tags=["招牌","月售100+"]  => v-if=false  (本应渲染 "月售100+")
  s01_d4 tags=["买贵必赔"]         => v-if=false
  s01_d2 tags=undefined            => v-if=undefined
  ```
  同一 bug 影响 `:192` 的 `'人觉'` 评价行（数据层甚至没有该类标签，恒不渲染）。

- **为什么是问题 / 不修会怎样**：
  P1-5 的验收要点就是"菜品行升级为卡片：大图、**月售**、标签、原价划线"。当前结果是**反向的**——
  有真实月售数据的菜（5 道）什么都不显示；没有 tags 的菜反而走 `:193` 分支显示 `monthSales()` **编造**的假数字。
  即"有数据的不显示，没数据的显示假数据"。quality-lead 逐屏比对时必然打回，且这是静默失效，没有任何报错。

- **修法建议**（勿在本次改动）：
  统一为字符串语义匹配，并把"找标签"抽成一个纯函数便于单测：
  ```ts
  // 建议落到 src/lib/dishTags.ts（可单测）
  export function findTag(tags: string[] | undefined, prefix: string): string | undefined {
    return tags?.find((t) => t.includes(prefix))
  }
  ```
  模板改为先取值再判空，避免"判断条件"与"渲染表达式"两套语义：
  ```
  <span v-if="findTag(d.tags,'月售')" class="dc-monthly">{{ findTag(d.tags,'月售') }}</span>
  ```
  （或用 `computed` 预派生 `monthlyLabel` / `reviewLabel`，模板零逻辑。）

- **工作量**：S（15–25 min，含补 2 条单测）

---

#### **B-2 · 折扣率计算错 10 倍，渲染出「低至67折」这类无意义文案**

- **文件**：`src/views/ShopView.vue:201`
- **现象**：
  ```
  <span v-if="d.originalPrice && d.originalPrice > d.price * 1.3" class="dc-off">
    低至{{ Math.round(d.price / d.originalPrice * 100) }}折
  </span>
  ```
  `price/originalPrice*100` 得到的是**百分比**（现价占原价的百分数），但文案单位是**「折」**（中文语境下折是十分制）。

- **✅ 已复现**：
  ```
  price 6  / orig 9   => 渲染 "低至67折"  (正确: 6.7折)
  price 12 / orig 16  => 渲染 "低至75折"  (正确: 7.5折)
  price 8  / orig 12  => 渲染 "低至67折"  (正确: 6.7折)
  price 28 / orig 38  => 渲染 "低至74折"  (正确: 7.4折)
  ```

- **为什么是问题 / 不修会怎样**：
  「67折」在中文零售语境里不存在（折只到 10）。用户第一眼读到的是"完全没打折"甚至"看不懂"。
  本项目 P1 的全部意义是**范式保真**——让用户不看 Logo 也觉得"这是美团"。
  一个真美团永远不会出现的文案，是对保真目标的直接破坏，且出现在最吸睛的红色促销角标上。

- **修法建议**：
  除以 10 并保留一位小数，注意 `10折` 应退化为不显示（无折扣）：
  ```ts
  const discountTenths = (price: number, orig: number) => Math.round((price / orig) * 100) / 10
  // 6/9 -> 6.7 ; 渲染 `低至${discountTenths}折`
  ```
  建议同样抽到 `src/lib/price.ts` 并单测边界（`orig === price`、`orig < price`、`orig === 0`）。
  注意当前 `v-if` 的 `> price * 1.3` 阈值意味着只有 ≤7.7 折才显示，逻辑本身合理，保留即可。

- **工作量**：S（10–15 min，含单测）

---

#### **B-3 · 静态 `class="... on"` 与动态 `:class="{ on: ... }"` 并存，Tab 选中态永远无法取消**

- **文件 / 行号**（3 处真实破损 + 1 处侥幸正确）：

  | # | 位置 | 代码 | 后果 |
  |---|---|---|---|
  | a | `src/views/OrderView.vue:218` | `class="pt-item on" :class="{ on: orderMode === 'delivery' }"` | 切到「到店自取」后，**两个 Tab 同时高亮+下划线** |
  | b | `src/views/ShopView.vue:129` | `class="st on" :class="{ on: menuTab === 'dishes' }"` | 切到「评价」/「商家」后，**「点菜」仍保持选中下划线** |
  | c | `src/views/HomeView.vue:68` | `<span class="seg-3__item on">首页</span>` | 点「自取」后**首页与自取同时高亮**，且首页无 handler，**无法切回** |
  | d | `src/views/ShopView.vue:108` | `class="ss-pill on" :class="{ off: ... }"` | ⚠️ 目前**表现正确，但属侥幸**：`.ss-pill.off`（style.css:422）定义在 `.ss-pill.on`（:421）之后，同特异性下后者胜出才盖住。调整 CSS 顺序即破 |

- **机制说明**：Vue 会把静态 `class` 与动态 `:class` **合并**而非覆盖，静态的 `on` 恒定存在。

- **为什么是问题 / 不修会怎样**：
  P1-8 这一项的标题就是「路由与 TabBar **选中态**」。选中态是移动端范式最基础的反馈信号，
  "两个 Tab 同时亮"是一眼可见的塑料感，恰恰摧毁 P1 想营造的"手感级"保真。
  另外 (c) 让首页三段导航进入**不可逆状态**——用户点了「自取」就再也回不到「首页」态，属交互死锁。

- **修法建议**：
  删除静态 `on`，只保留单一数据源的动态绑定；(c) 还需给「首页」补 handler：
  ```
  <!-- a -->
  <button class="pt-item" :class="{ on: orderMode === 'delivery' }" @click="orderMode='delivery'">外卖配送</button>
  <!-- b -->
  <button class="st" :class="{ on: menuTab === 'dishes' }" @click="menuTab='dishes'">点菜</button>
  <!-- c -->
  <button class="seg-3__item" :class="{ on: segActive === '首页' }" @click="onSegClick('首页')">首页</button>
  <!-- d 同步清理静态 on，改为 :class="{ on: deliveryMode==='delivery', off: deliveryMode!=='delivery' }" -->
  ```
  **建议顺手加一条 lint 约束或 review checklist 项**：`class="x on"` + `:class="{on}"` 是本仓库反复出现的模式（`grep 'class="[^"]* on"'` 共 7 处命中），属系统性习惯问题而非孤例。

- **工作量**：S（20–30 min，4 处 + 目视回归）

---

### 🟠 Major

---

#### **M-1 · 「免配送费」筛选 chip 在现有数据下永远返回空**

- **文件**：`src/views/ShopListView.vue:48`（`s.deliveryFee === 0`）× `src/data/shops.ts`（5 家店 deliveryFee = 3/2/2/4/3）
- **✅ 已复现**：`freeship => 0 shops`，chip 恒命中空态。
- **叠加矛盾**：`src/views/ShopView.vue:123` 硬编码渲染了 `<span class="promo-tag yellow">免配送费</span>`。
  → 店铺详情页宣称"免配送费"，列表页筛选却说"一家都没有"。**同一 App 内自相矛盾**。
- **不修会怎样**：6 个 chip 里有 1 个是死按钮，用户点了只会看到"暂无免配送费商家 · 老板们都想赚这几块钱"。
  空态文案写得很俏皮，掩盖了这其实是数据缺口而非设计意图。
- **修法建议**：二选一 ——
  (a) 数据层给 1–2 家店 `deliveryFee: 0`（最小改动，符合 §5.6 仅扩展语义）；
  (b) 把 ShopView:123 的硬编码 `免配送费` 改为 `v-if="shop.deliveryFee === 0"` 条件渲染，消除矛盾。
  **推荐 (a)+(b) 同做**，让"筛选—展示"闭环自洽。
- **工作量**：S（15 min）

---

#### **M-2 · 「满减优惠」筛选 chip 是空操作（5/5 全命中）**

- **文件**：`src/views/ShopListView.vue:46`（`s.promo.includes('减')`）
- **✅ 已复现**：`promo => 5 of 5`，筛选前后列表完全一致。
- **不修会怎样**：用户点击后页面**毫无变化**，看起来像卡了/没响应。比返回空态更糟——空态至少有反馈。
- **修法建议**：改为有区分度的判据，例如按满减门槛过滤（`满20/满25/满30` 属低门槛）或按最大减免额排序：
  ```ts
  // 解析 "满50减15 | 满100减30" -> [{full:50,cut:15},{full:100,cut:30}]
  // promo chip 改为「低门槛优先」排序，或过滤 minFull <= 30
  ```
  该解析函数应落 `src/lib/promo.ts` 并单测（当前 `promo` 字段是自由文本，解析逻辑必须有测试兜底）。
- **工作量**：M（40–60 min）

---

#### **M-3 · 金刚区 10 个分类中 8 个点进去是空页**

- **文件**：`src/views/HomeView.vue:25-36`（10 个分类）× `src/data/shops.ts`（`cat` 仅覆盖 `家常菜`/`美食`）
- **✅ 已复现**：`甜点饮品 / 超市便利 / 蔬菜水果 / 看病买药 / 夜宵 / 拼好饭 / 跑腿 / 天天津贴` **8/10 dead-end**。
- **不修会怎样**：首页最显眼的 5×2 宫格，80% 的入口是死路。
  *客观地说*：代码侧处理得体（`cat-banner` + `emptyHint` 空态齐全，不会崩），这是**数据覆盖问题不是代码缺陷**。
  但从产品完成度看，这是 P1-1/P1-2 首页改造留下的最大观感缺口。
- **修法建议**：不必造 40 家店。两个低成本方案：
  (a) 给现有 5 家店补充多分类归属（`cat: string` → `cats: string[]`，属 §5.6 允许的可选扩展）；
  (b) 对无店分类，空态文案做戏精化差异（现在 8 个分类共用同一句"该分类暂未上架胡闹商家"），
     把"数据缺口"转化为"胡闹宇宙设定"（如「跑腿：骑手都去送外卖了」）。
  **推荐 (b) 优先**（纯文案，10 分钟），(a) 排入 P2。
- **工作量**：S（(b) 15 min）/ M（(a) 1h）

---

#### **M-4 · 4 个组件的定时器未在卸载时清理（与仓库内已有的正确范式不一致）**

- **文件 / 行号**：
  | 文件 | 位置 | 情况 |
  |---|---|---|
  | `src/views/HomeView.vue:48-54` | `toastTimer` | 有防抖 `clearTimeout`，**但无 `onUnmounted`** |
  | `src/views/ShopView.vue:59-62` | `showToast` | **完全裸奔**：无 timer 变量、无防抖、无清理 |
  | `src/views/OrdersView.vue:35-38` | `showToast` | 同上，裸奔 |
  | `src/views/ServiceView.vue:41-44` | `sendQuickReply` 内 600ms 回复 | 无跟踪、无清理 |

- **重点核对结论（Statusbar）**：`src/components/Statusbar.vue:19-31` ✅ **完全正确**
  —— `onMounted` 建 interval、`onUnmounted` `clearInterval` 并置 `null`。本次重点怀疑对象反而是全仓最干净的一个。
- **同样清白**：`ShopListView.vue:75-77` ✅、`PushNotifier.vue:69-71`（`Set` 跟踪全部 timer + `onBeforeUnmount` 批量清）✅、`DramaTimeline.vue:59-60` ✅。
- **不修会怎样**：
  Vue 3 对已卸载组件的 ref 赋值不会抛错，所以**不会崩**——这也是它容易被忽略的原因。
  实际代价：(1) 快速切路由时定时器堆积，属真实内存泄漏；(2) `ServiceView` 的 600ms 回调会向已销毁组件的 `messages` 数组推数据；
  (3) **最关键的是一致性**——同一仓库里 6 个组件用了 3 种不同的定时器管理风格，后来者不知道该抄哪个。
- **修法建议**：抽一个 `useToast()` composable，一次解决"定时器清理 + 三份重复 toast 实现"（见 M-15 与 §4）：
  ```ts
  // src/composables/useToast.ts
  export function useToast(duration = 2000) {
    const msg = ref('')
    let t: ReturnType<typeof setTimeout> | null = null
    const show = (m: string) => { msg.value = m; if (t) clearTimeout(t); t = setTimeout(() => (msg.value = ''), duration) }
    onUnmounted(() => { if (t) clearTimeout(t) })
    return { msg, show }
  }
  ```
- **工作量**：M（45 min，含替换 4 处调用点）

---

#### **M-5 · `JSON.parse` 无异常保护，脏 localStorage 会导致整页白屏**

- **文件**：`src/store/memory.ts:102`（`readGlobal`）、`:170`（`unlockAchievements`）、`:183`（`getAchievements`）、`:198`（`getOrderHistory`）
- **现象**：同文件的 `readShop:77-81` / `readRider:89-93` **有** `try/catch` 兜底，但上述 4 个方法**没有**。
- **不修会怎样**：
  `getOrderHistory()` 在 `OrdersView.vue:9` 和 `ServiceView.vue:6` 的 **setup 顶层同步调用**。
  只要 `waimai:history` 这个 key 的内容损坏（用户手动改、旧版本格式残留、写入中途标签页被杀、存储配额溢出截断），
  `JSON.parse` 抛出的异常会在 setup 阶段冒泡 → **组件渲染失败 → 订单页/客服页白屏**，且无自恢复路径（用户不会去清 localStorage）。
  这是全部问题里**唯一可能导致页面完全不可用**的一条，因此列 Major 上位。
- **修法建议**：把同文件已有的 `try/catch` 范式补齐，统一走一个私有助手：
  ```ts
  private readJSON<T>(key: string, fallback: T): T {
    const raw = this.store.getItem(key)
    if (!raw) return fallback
    try { return JSON.parse(raw) as T } catch { return fallback }
  }
  ```
  然后 `readShop / readRider / readGlobal / getAchievements / getOrderHistory` 全部改用它。
  **补测**：`memory.test.ts` 加一条"注入损坏 JSON 时降级到默认值不抛错"（`MemStore` 已支持注入，成本极低）。
- **工作量**：S（30 min，含单测）

---

#### **M-6 · `route.query` / `route.params` 用 `as string` 断言绕过窄化**

- **文件**：`src/views/OrderView.vue:30`、`src/views/ShopView.vue:11`、`src/views/OrderView.vue:26`
  ```ts
  const shopId = (route.query.shop as string) || 's01'   // OrderView:30
  const shop = getShop(route.params.id as string)        // ShopView:11
  const taboo = tabooRaw as unknown as TabooList         // OrderView:26（双重断言）
  ```
- **现象**：`route.query.shop` 的真实类型是 `string | string[] | null`（`/order?shop=a&shop=b` 会得到数组）。
  断言只是让编译器闭嘴，运行时数组照样流下去 → `getShop(['a','b'])` 返回 `undefined` → 页面进"店铺不存在"分支。
- **对比**：`ShopListView.vue:9-12` **做对了**——用 `typeof q === 'string'` 正确窄化。同仓库两套写法。
- **不修会怎样**：不是高频崩溃路径（正常导航不会产生重复 query），但这是**类型系统被主动关闭**的地方，
  `vue-tsc` 全绿的信号因此含水分。`as unknown as` 双重断言尤其危险——它能把任何类型强转成任何类型，
  一旦 `taboo-list.json` 结构变化，编译期零告警、运行期直接炸在红线门控上。
- **修法建议**：
  ```ts
  // 抽 src/lib/route.ts，全仓复用
  export const queryStr = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)
  // 用法：const shopId = queryStr(route.query.shop) ?? 's01'
  ```
  `tabooRaw` 则应给 JSON 写一个运行时校验（或至少 `satisfies TabooList`），而不是双重断言。
- **工作量**：S（25 min）

---

#### **M-7 · `ShopView` 对路由参数变化完全无响应（组件复用时数据陈旧）**

- **文件**：`src/views/ShopView.vue:11`、`:31-32`
  ```ts
  const shop = getShop(route.params.id as string)      // :11  普通常量，非 computed
  const activeCat = computed(() => categories.value[0] || '招牌')
  const selectedCategory = ref(activeCat.value)        // :32  ref 只在 setup 时取一次快照
  ```
- **现象**：`/shop/s01` → `/shop/s02` 属同一路由记录，vue-router **复用组件实例不重新 setup**。
  此时 `shop` 仍指向 s01，`selectedCategory` 仍是 s01 的首个分类（如「招牌」），
  而 s02 的分类是「招牌水饺/汤品/蘸料」→ `filteredDishes` 过滤结果**为空**，右侧菜品区空白。
- **触发条件（客观说明）**：当前 UI 没有"店铺页直达另一店铺页"的入口（返回键去 `/shops`），所以**线上暂不可复现**。
  但首页神抢手卡（`HomeView.vue:105`）已经是 `/shop/:id` 直链，P2 只要新增"相似店铺推荐/换一家"就会立刻踩中。
- **不修会怎样**：属**埋雷型**缺陷——现在不炸，P2 加一个入口就炸，且症状（菜单空白）离根因（ref 快照）很远，排查成本高。
- **修法建议**：
  ```ts
  const shop = computed(() => getShop(String(route.params.id)))
  // selectedCategory 改为「可覆盖的 computed」或加 watch 重置
  watch(() => shop.value?.id, () => { selectedCategory.value = categories.value[0] ?? '招牌' })
  ```
  顺带：`activeCat`（:31）目前**只被用来给 ref 赋初值一次**，是一个几乎无意义的 computed，重构时应一并消除。
- **工作量**：M（40 min，需回归购物车联动）

---

#### **M-8 · `ServiceView` 硬编码「共1件」，而同仓库 `OrdersView` 已有正确实现**

- **文件**：`src/views/ServiceView.vue:74`
  ```
  <div class="ioc-name">{{ lastOrder.shopName }} · 共1件</div>
  ```
- **对比**：`src/views/OrdersView.vue:27-30` 的 `itemCount()` **做对了**——`h.items.reduce((a,b)=>a+b.qty,0)` 且带回退。
  而 `OrderHistoryEntry.items`（`memory.ts:35`）里明明存了真实 `qty`。
- **不修会怎样**：客服页订单卡对一个 5 件的订单也显示"共1件"，与订单页显示的"共 5 件"**互相打架**。
  用户在客服页咨询时看到的是错的。
- **修法建议**：把 `OrdersView` 的 `itemCount` 抽到 `src/lib/order.ts` 供两处共用（这正是任务里点名的"可测纯函数"之一）：
  ```ts
  export function itemCount(entry: OrderHistoryEntry, fallback = 0): number {
    return entry.items?.length ? entry.items.reduce((a, b) => a + b.qty, 0) : fallback
  }
  ```
- **工作量**：S（20 min，含单测）

---

#### **M-9 · `OrderView` 的 `timeSlot` 是完全无效状态 + 一个恒等三元表达式**

- **文件**：`src/views/OrderView.vue:70`、`:239`、`:243`
  ```
  <div class="time-cell on" @click="timeSlot = timeSlot === 'auto' ? 'auto' : 'auto'">   <!-- :239 -->
  <div class="time-cell"    @click="timeSlot = timeSlot === 'reserve' ? 'auto' : 'reserve'"> <!-- :243 -->
  ```
- **现象**：三处问题叠加 ——
  1. `:239` 的 `timeSlot === 'auto' ? 'auto' : 'auto'` **两个分支返回同一个值**，是恒等空操作（任务清单 §7"恒真/恒假判断"正中）。
  2. 两个 `.time-cell` 的 `on` 类是**静态**的（第一个恒 on，第二个恒 off），`timeSlot` 的值**从未参与任何渲染**。
  3. 因此 `timeSlot` 这个 ref **写了但从来没被读过**，是纯死状态。
- **不修会怎样**：用户点击"预约配送"卡片**零反馈**（不高亮、不弹选择器、不改文案），看起来是坏的。
  同时留下一个会误导后来者的假状态机——有人会以为 `timeSlot` 真的在控制什么。
- **修法建议**：要么接上，要么删干净，不要留半截：
  ```
  <div class="time-cell" :class="{ on: timeSlot === 'auto' }"    @click="timeSlot='auto'">
  <div class="time-cell" :class="{ on: timeSlot === 'reserve' }" @click="openTimeSheet()">
  ```
  「预约配送」建议复用现成的 `openSheet()` 抽屉（纯点击原则下给几个固定时段选项），成本很低且补齐了 P0-4 的表单完整度。
- **工作量**：S（30 min）

---

#### **M-10 · `ShopListView` 的搜索框是全仓唯一可唤起键盘的自由文本输入，且输入无任何效果**

- **文件**：`src/views/ShopListView.vue:87`
  ```
  <input placeholder="烧烤 / 饺子 / 粥 ..." />     <!-- 无 readonly / 无 v-model / 无 handler -->
  ```
- **对比**：`src/views/HomeView.vue:83` 在 P0 阶段被**显式硬化**过：
  ```
  <input placeholder="肯德基" readonly @click="goSearch" />
  ```
- **红线判定（据实认定）**：
  `git log -S` 显示该 input 来自 `a6a1e35`（Route B 初版），**早于全部 P0/P1 提交** → **不是 P1 新增，不构成 §5.3 红线违规**。
  但它是"既有允许项"里**唯一没做 readonly 硬化**的一个，而 P1-3 恰好重写了这个文件却没顺手处理。
- **不修会怎样**：
  (1) 移动端点击直接弹起软键盘，顶起布局，违背"纯点击"的体验承诺（即使不违背条文）；
  (2) 用户敲进去的字**不做任何事**——没有搜索、没有过滤、没有提示，是彻底的死交互；
  (3) 与同一个 App 里另一个搜索框行为不一致。
- **修法建议**：对齐 HomeView 的处理，改为 `readonly` + 点击唤起（可先弹"搜索功能开发中"的戏精 Toast，或滚动到筛选 chip 行）：
  ```
  <input placeholder="烧烤 / 饺子 / 粥 ..." readonly @click="showToast('搜索还没做，先用下面的筛选凑合一下')" />
  ```
- **工作量**：S（10 min）

---

#### **M-11 · 核心触控目标普遍小于 44px，与本仓库自己制定的 a11y 标准冲突**

- **文件**：`src/style.css`
  | 元素 | 行号 | 实际尺寸 | 用途 |
  |---|---|---|---|
  | `.stepper .st` | :352 | **28×28** | 菜品 +/− （**全 App 点击频率最高**） |
  | `.ph-card .ph-add` | :477 | **26×26** | 促销卡加购 |
  | `.dish-cta` | :460 | **32×32** | 菜品加购 |
  | `.filter-chips .fc-chip` | :646 | min-height **30** | P1-3 筛选 chip |
  | `.shop-card .card-cta` | :655 | min-height **32** | P1-3 领券 CTA |
  | `.qr-chip` | :607 | ~30 | P1-4 快捷回复 |
- **自相矛盾之处**：同一文件 `:335-338` 明确立了标准并对三类元素落地了：
  ```css
  /* 最小点击热区 44×44：小药丸按钮 / 入口项 / 底部 Tab */
  .more-links span { min-height: 44px; }
  .order-card .btn-row .b { min-height: 44px; }
  .tabbar .tb { min-height: 44px; }
  ```
  即**规范已经写下并执行过一轮，但 P0/P1 新增的所有控件都没有遵守**。
- **不修会怎样**：拇指在 26px 的 `＋` 上误触率显著上升，恰好落在"加购"这个转化关键路径上。
  且这是可量化的规范违反，不是主观审美问题。
- **修法建议**：不必改变视觉尺寸——用**透明扩展热区**保持美团的紧凑观感同时满足 44px：
  ```css
  .stepper .st, .ph-card .ph-add, .dish-cta { position: relative; }
  .stepper .st::after, .ph-card .ph-add::after, .dish-cta::after {
    content: ''; position: absolute; inset: 50% auto auto 50%;
    width: 44px; height: 44px; transform: translate(-50%, -50%);
  }
  ```
  chip 类直接提 `min-height: 44px`（美团真机 chip 本身也接近这个高度）。
- **工作量**：M（1h，含各页目视回归）

---

#### **M-12 · 可点击元素大量使用 `<div>` / `<span>` + `@click`，键盘与读屏不可达**

- **文件 / 行号**（抽样，非穷举）：
  | 位置 | 代码 |
  |---|---|
  | `ServiceView.vue:59,62,63,64` | `<span class="imn-btn" @click="...">` ×4（返回/电话/复制/更多） |
  | `OrderView.vue:229,279,287,327` | `<div class="cell" @click="...">` ×4（地址/备注/餐具/发票，**表单主干**） |
  | `OrderView.vue:296-322` | `<div class="pay-item" @click>` ×7（支付方式，本质是 radio group） |
  | `OrderView.vue:211,363,379` | `<div class="mt-nav__back">` / `.sheet-opt` / `.back` |
  | `ShopView.vue:82,139-147,157` | `.icon-btn` / `.cat-side__item` / `.ph-card` |
  | `HomeView.vue:73,90,141-145` | `.loc-row` / `.cat-item` / `.more-links span` |
  | `OrdersView.vue:52,53` | `.ohm-ico` ×2 |
- **不修会怎样**：这些元素**无法 Tab 聚焦、无法回车触发、读屏读不出角色**。
  `style.css:322-334` 精心写了 `:focus-visible` 焦点环，但 `<div>` 根本不进入 Tab 序列，那套焦点环对上述元素**全部失效**——
  即已投入的 a11y 成本被这个问题抵消了。
- **值得肯定的对照**：`ShopListView` 的 chip、`ShopCard` 的 CTA、`TabBar` 的 `router-link`、`HomeView` 的 feed tab **都用对了语义标签**。说明团队知道怎么做，只是不彻底。
- **修法建议**：分两档处理，不必一次全改 ——
  - **P1 补丁档（优先）**：`OrderView` 的 4 个 `.cell` + 7 个 `.pay-item` 改 `<button type="button">`（表单主干，影响最大）。
    `.pay-item` 建议进一步用 `role="radiogroup"` + `aria-checked`。
  - **技术债档**：其余装饰性图标按钮加 `<button class="..." aria-label="...">`。
  注意 `.cell` / `.pay-item` 改 `<button>` 后需补 `width:100%; text-align:left; background:none; border:none;`，否则布局会变。
- **工作量**：M（1.5h 分档做，P1 补丁档 40 min）

---

#### **M-13 · `/order` 与 `/service` 页 TabBar 仍在 DOM 中且可聚焦，被遮挡但未移除；`PhoneFrame` 的开关 props 是死 API**

- **文件**：`src/components/PhoneFrame.vue:5-7,17`、`src/App.vue:6`、`src/router/index.ts`（全表无 `meta`）
  ```ts
  withDefaults(defineProps<{ showStatus?: boolean; showTab?: boolean }>(), { showStatus: true, showTab: true })
  ```
  `App.vue` 里 `<PhoneFrame>` **不传任何 prop** → 两个开关永远是 `true` → **这对 props 从未被使用过**。
- **与规格的偏差**：spec §6 风险表明确建议
  > 在 `/order` 路由配置 `meta: { hideTab: true }`，`PhoneFrame` 读取后隐藏 `TabBar`

  实际 P1-8 选择了 `.pay-bar { z-index: 11 }` 盖住 `.tabbar { z-index: 10 }` 的方案。
- **不修会怎样**：
  (1) 视觉上"盖住"了，但 TabBar 仍在 Tab 键序列里——键盘用户会 Tab 到**看不见的**"外卖/神券/订单/我的"上；
  (2) `.pay-bar` 与 `.tabbar` 高度接近但不保证相等（前者 ~56px 取决于按钮，后者含 `env(safe-area-inset-bottom)`），
     在带 home indicator 的机型上有露边风险；
  (3) 留下一对**永不生效的 props**，是典型的"看起来有能力其实没接线"的误导性 API。
- **修法建议**：按 spec 原方案接线，同时保留 z-index 作为双保险：
  ```ts
  // router/index.ts
  { path: '/order', name: 'order', component: OrderView, meta: { hideTab: true } },
  { path: '/service', name: 'service', component: ServiceView, meta: { hideTab: true } },
  // App.vue
  <PhoneFrame :show-tab="!$route.meta.hideTab">
  ```
- **工作量**：S（25 min）

---

#### **M-14 · 三套重复的 Toast 实现 + 两处 `alert()` 打断沉浸**

- **文件**：
  | 位置 | 实现方式 |
  |---|---|
  | `HomeView.vue:152` | 内联 `style="position:fixed;..."` 长串 |
  | `OrdersView.vue:128` | 内联 `style="position:fixed;..."` 长串（与上面**逐字重复**） |
  | `ShopView.vue:246` / `ShopListView.vue:128` | `class="ph-toast"`（style.css:480 已有正式类） |
  | `OrderView.vue:117` | **`alert('本单戏票不支持报销 🎭')`** |
  | `ServiceView.vue:51` | **`alert(\`已复制：${phone}\`)`** |
- **不修会怎样**：
  (1) 同一个 UI 元素 3 种写法，改样式要改 3 处，`.ph-toast` 这个正式类形同虚设；
  (2) `alert()` 是**浏览器原生模态**——弹出系统级对话框，标题栏显示 `localhost:5173 显示`，
     在一个刻意模拟手机 App 的产品里，这是最破坏沉浸感的一种交互，且阻塞主线程；
  (3) 内联 style 长串让模板可读性显著下降。
- **修法建议**：统一到 M-4 提出的 `useToast()` composable + `.ph-toast` 类，两处 `alert()` 一并替换为 Toast。
  （`ServiceView` 的复制反馈用 Toast 反而更贴近真机行为。）
- **工作量**：S（与 M-4 合并做，增量 20 min）

---

### 🟡 Minor

> 以下为技术债 / 一致性问题，**不建议阻塞 P2**，建议排期消化。已按"影响面"排序。

| # | 标题 | 文件:行号 | 现象与影响 | 修法 |
|---|---|---|---|---|
| **N-1** | 死 CSS 约 16 组 | `style.css` | `.dish-row`(:345-350)、`.menu-head`(:343)、`.menu-list`(:344)、`.cart-summary`(:365-372)、`.shop-greeting`(:144-145)、`.boss-bubble`(:158-161)、`.order-cta`(:146)、`.cat-cyan`(:98)、`.tag-x`(:115)、`.mt-nav__sub`(:72-74)、`.mt-nav__icon(s)`(:76-77)、`.form*`(:258-262)、`.ph-d`(:472)、`.order-page`(:205)、`.order-head`(:206)、`.eta-bar`(:174-180) 在 `.vue` 中**零引用**（已 grep 验证）。约占 CSS 体积 8–10% | 删除；`.form input` 尤其应删——它是"纯点击原则"之前的自由文本表单遗留样式，留着会误导 |
| **N-2** | `OrderView` 内 35 行死 scoped CSS，且含一个无效 rgba | `OrderView.vue:418-452` | `.chip-block/.chip-label/.chips/.chip/.chip.on` 等在该文件模板中**完全没有引用**（已 grep 验证）。其中 `:448` `box-shadow: 0 2px 8px rgba(255,193,0,35)` —— alpha **35** 会被 clamp 到 1.0，本意应是 `0.35`。✅ 已复现。**因整块 CSS 是死的，该 bug 当前零视觉影响** | 整块删除。若将来复活 chip 样式，注意修正 alpha |
| **N-3** | z-index 无层级体系，10 个魔法值散落 | `style.css` + 3 处内联 | 现存层级：`1,2,5,9(cart-bar),10(tabbar/quick-replies),11(pay-bar/im-input),50(wk-mark),100/101(sheet),200(toast),1000(push)`。无常量、无注释说明层级契约 | 建 `--z-*` 令牌：`--z-bar:10 / --z-bar-over:11 / --z-overlay:100 / --z-toast:200 / --z-push:1000`，并在 style.css 顶部写一段层级约定 |
| **N-4** | 缩略图渐变色硬编码重复 6+ 处 | `style.css:108,210,346,445,558,565,586` + `OrderView.vue:257` + `ShopView.vue:92`（内联） | `linear-gradient(135deg,#FFE08A,#FFC93C)` 逐字重复 9 次；`linear-gradient(90deg,#FF7E45,#FF4B10)` 重复 3 次，而 `--mt-orange`/`--mt-price` 令牌**已存在却没用** | 加 `--grad-thumb` / `--grad-hot` 两个令牌，全量替换 |
| **N-5** | `vant` 是未使用的依赖 | `package.json:15` | 项目声明"自定义 UI（无组件库）"，全仓 grep `vant` **零引用**。虽被 tree-shaking 排除（不进包），但污染依赖树与安装体积 | `npm uninstall vant` |
| **N-6** | `.phone-body` 类被使用但从未定义 | `PhoneFrame.vue:15` × `style.css` | `.phone` 是 flex column，`.phone-body` 无 `flex:1` 定义。当前靠子内容自身 min-height 撑开，属**巧合成立** | 补 `.phone-body { flex: 1; min-width: 0; }` |
| **N-7** | `memory.ts` 的"今天"按 UTC 计算 | `memory.ts:54-56` | `d.toISOString().slice(0,10)` 是 UTC 日期。✅ 已复现：北京时间 07-31 02:00 → 判定为 `2026-07-30`。即 `todayOrderCount` 在**早上 8 点**而非午夜清零 | 改用本地日期：`` `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` `` |
| **N-8** | `memory.reset()` 行为与注释不符 | `memory.ts:201-207` | 注释写"清掉某店或**全部**"，但无参分支只重置 `global`，**不清** shop 记录 / 骑手 / 成就 / 订单历史 | 补齐实现，或改注释为"重置全局计数器" |
| **N-9** | 7 段近乎逐字重复的支付方式 DOM | `OrderView.vue:296-322` | 27 行模板只因文案不同而重复 7 次，是全文件最大的复制粘贴块 | `const PAY_METHODS = ['极速支付','美团支付',...]` + `v-for`，同时消除 `:298` 硬编码在文案里的 `✓` |
| **N-10** | 地址文案用四层嵌套三元写死在模板里 | `OrderView.vue:232` | `addressTag==='home' ? '...' : addressTag==='company' ? '...' : ...` 单行 190+ 字符，4 个地址字符串硬编码在模板 | 并入 `addressChips` 数据结构加 `detail` 字段，模板改 `addressChips.find(...)?.detail` |
| **N-11** | `payMethod` / `selectedUtensil` / `orderMode` 选了但不进订单数据 | `OrderView.vue:63,64,67` × `:174-189` | 三个选择状态用户可改，但 `OrderHistoryEntry` 不记录，下单后即丢弃。属"装饰性表单"——可接受，但应有注释说明是刻意的 | 加一行注释标明"纯视觉，不入库"，避免后来者误以为是 bug |
| **N-12** | `eta()` 在 `OrderView` 内重复造轮子 | `OrderView.vue:143-148` × `src/lib/eta.ts` | `src/lib/eta.ts` 已存在且明确是"确定性 ETA 纯函数"，`OrderView` 又内联了一个同名 `eta()`（算法不同、用途不同：一个算送达秒数，一个算时间区间）。命名冲突会误导 | `OrderView` 内的改名 `deriveEtaRange()` 并移入 `src/lib/eta.ts`，与 `etaForAddress` 并列（顺带获得可测性） |
| **N-13** | 模板里直接 `new Date()`，非响应式且绕过本地 helper | `OrderView.vue:240` | `String(new Date().getHours()).padStart(2,'0')` 写在模板中：(1) 跨小时不会更新；(2) 同文件 `:149-151` 已有 `pad()` helper 却没用 | 提到 setup 里算，或用 `pad(new Date().getHours())` |
| **N-14** | `OrdersView` 常量 class 绑定 + 冗余内联 style | `OrdersView.vue:59` | `:class="{ white: true, yellow: false }"` 是恒定值，无意义；同时 `:style` 又覆盖了 `background`，与 `.ot-pill.white` 类规则争夺同一属性 | 删掉常量 `:class`，统一用 `:class="{ on: activeTab==='all' }"` + CSS 控制背景 |
| **N-15** | 「待评价」角标硬编码 `1` | `OrdersView.vue:61` | `v-if="history.length"` 成立就显示字面量 `1`，与实际订单数无关 | 显示真实数量或直接移除角标 |
| **N-16** | `Statusbar` 时钟每秒轮询，且小时不补零 | `Statusbar.vue:13,21-23` | (1) 1Hz interval 驱动一个分钟级显示，60 次里 59 次是无效采样（代码注释已自觉说明"代价可忽略"，属实，但可优化）；(2) `${d.getHours()}` 不补零 → 上午显示 `9:05`，iOS 真机为 `09:05`，与"真机观感"目标有细微出入 | 改为对齐到下一分钟的自校正 `setTimeout`；`getHours()` 套 `padStart(2,'0')` |
| **N-17** | `price-pop` 动画包含 `color`（非合成属性） | `style.css:672-676` | `35% { transform: scale(1.16); color: var(--mt-price); }` —— `transform` 走合成器，但 `color` 触发 paint。单元素小范围，实测影响可忽略 | 若追求纯 GPU：用一个绝对定位的变色副本叠加，或接受现状（**建议接受**，性价比低） |
| **N-18** | `OrdersView` 用数组下标作 `:key` | `OrdersView.vue:68` | `:key="i"` 在列表可能重排/插入时会导致复用错位。当前 `history` 只在 setup 读一次不变，**暂无实际影响** | 改 `:key="h.ts"`（`OrderHistoryEntry.ts` 是天然唯一键） |
| **N-19** | `TabBar` 自造 `isActive` 而非用内置激活态，且缺 `aria-current` | `TabBar.vue:11-14,24` | vue-router 的 `router-link` 自带 `router-link-active` / `v-slot="{ isActive }"`，此处手写 `startsWith` 逻辑（虽然当前 `/order` vs `/orders` 的边界是**正确**的）；另缺 `aria-current="page"` | 改用 `v-slot="{ isActive }"`，或至少补 `:aria-current="isActive(it.to) ? 'page' : undefined"` |
| **N-20** | `.fine-print` 对比度不足 | `style.css:628` | `color:#999` 于 `#F5F5F5` 底 ≈ **2.8:1**，低于 WCAG AA 的 4.5:1，且字号仅 10px | 改 `var(--mt-text-2)`（#666，约 5.7:1）或提字号 |
| **N-21** | `.quick-replies` 与 TabBar 可能重叠 | `style.css:605` × `:125` | `.quick-replies { bottom:52px; z-index:10 }` 与 `.tabbar { bottom:0; z-index:10 }` **同层**，TabBar 实际高度约 56px（含 safe-area 更高）→ 底部约 4px 可能被压。同 z-index 下由 DOM 顺序决定（TabBar 在 PhoneFrame 中后渲染，会压住 chip 条） | `.quick-replies` 的 `bottom` 改为 `calc(56px + env(safe-area-inset-bottom))` |

---

## 3. 分维度审查结果

### 3.1 类型安全

**好的地方**
- `npx vue-tsc --noEmit` **零报错**，`npm run build` 亦包含类型门禁，CI 基线是干净的。
- 数据模型定义扎实：`Shop` / `Dish` / `OrderHistoryEntry` / `KVStore` 接口清晰，可选字段用 `?` 明确标注并配注释说明用途。
- `FilterId` 用字面量联合类型 + `FILTERS` 表驱动（`ShopListView.vue:18-26`），新增筛选项时类型系统会强制补全 —— 这是本次 P1 里最好的一处类型设计。
- `PERSONA_LABEL` / `PERSONA_CLASS` 用 `Record<Personality, string>` 保证映射完整性，且有单测守着（`shops.test.ts` S3）。
- `props` 定义规范：`defineProps<{ shop: Shop }>()`、`withDefaults` 用法正确。

**问题**
- 3 处 `as` 断言绕过窄化（**M-6**），其中 `as unknown as TabooList` 是双重断言，等于对红线门控的输入完全放弃类型保护。
- `ShopView.vue:48` 的 `b.originalPrice! - b.price - (a.originalPrice! - a.price)` 用了非空断言。虽然上游 `.filter(d => d.originalPrice)` 保证了非空，但这种"filter 后断言"的模式在重构时极易失效。建议改用类型守卫 `filter((d): d is Dish & { originalPrice: number } => !!d.originalPrice)`。
- 全仓 **零 `any`** ✅（已 grep 确认），这一点值得肯定。
- computed 返回类型稳定，未见联合类型抖动。

### 3.2 组件职责与可维护性

**好的地方**
- 目录分层清晰且被严格遵守：`data`（纯数据）/ `store`（状态）/ `engine`（剧情引擎）/ `core`（红线）/ `lib`（纯函数）/ `composables` / `components` / `views`。
- `ShopCard` / `PersonaBadge` / `RiderCard` / `PhoneFrame` 等原子组件职责单一、体量克制（16–41 行）。
- `ShopListView`（143 行）的 `FILTERS` 表驱动设计很好——筛选 id / 标签 / 空态文案三者绑定在一处，新增筛选只改一行数据。
- `memory.ts` 用 `KVStore` 注入式设计（浏览器 localStorage / 测试 MemStore），可测性设计得当，这也是它能有 10 条单测的原因。

**问题**
- **`OrderView.vue` 476 行严重超载**，一个文件同时承担：表单态 + 结果态两套完整 UI、7 个选择器状态、8 个价格计算 computed、抽屉系统、订单落库、红线门控展示。是全仓最需要拆分的文件。
- 重复结构未抽象：3 套 Toast（**M-14**）、7 段支付项（**N-9**）、`itemCount` 逻辑两地不一致（**M-8**）。
- 魔法数字/硬编码文案散落：`HomeView.vue:123,126` 的 `.slice(0,4)` / `.slice(0,3)`；`OrderView.vue:123-127` 的 `2 / 0.12 / 10 / 3 / 0.05` 定价系数无常量无注释；`OrderView.vue:232` 四个地址字符串写死在模板。
- 命名一致性总体不错（`fc-` / `ph-` / `ocr-` / `imn-` / `pb-` 前缀分区清晰），但 `.st` 在 `.shop-tabs .st`（Tab）与 `.stepper .st`（步进器）中同名。
  **据实说明**：二者都有父级选择器限定作用域，**不构成真实冲突**，仅属命名易混淆，不单独计为缺陷。

### 3.3 CSS 规范与设计令牌一致性

**好的地方**
- `:root` 令牌体系相当完整：美团皮色（`--mt-*`）、角色色（`--role-*`）、品牌锚色（`--brand-*`）、字体栈（`--font-*`）、圆角/阴影/最大宽度，且每组都有注释标明出处（BRAND.md 章节号）。
- 品牌锚色使用**严格遵守 §5.5**：`--brand-green` 只出现在 whoknow 角标 / 成就光晕 / 段子卡底色，`--brand-orange` 只用于焦点环与段子卡人名。**美团黄始终是主色，未被喧宾夺主** ✅。
- P1 新增样式（`.rp-banner` / `.filter-chips` / `.card-cta` / `pay-bar` 动效）分区注释清楚，有"P1-3"、"P1-7"标记，可追溯性好。
- `prefers-reduced-motion` 全局兜底存在且写法正确（用 `!important` 因此不受声明顺序影响）。

**问题**
- 约 16 组死 CSS（**N-1**）+ OrderView 35 行死 scoped CSS（**N-2**）。
- 令牌执行不彻底：渐变色硬编码重复 9 次（**N-4**），`#1a1a1a` 作为"近黑"重复约 30 次却没有令牌，`#fff` 大量直写。
- z-index 无体系（**N-3**）。
- 全局 CSS 无 scoped 隔离，靠 BEM-ish 前缀约定防冲突。当前**未发现真实冲突**，但 `.badge`（在 `.shop-card .logo` / `.cart-bar .cart-ico` / `.story-watermark` 三处不同语义下复用）、`.info` / `.nm` / `.av` 这类过于通用的短名，随页面增多冲突概率会上升。
- `.story-watermark` 在 `style.css:249` 定义了渐变胶囊样式，又在 `OrderView.vue:455-475` 的 scoped 里被整体覆盖成透明无边框 —— 两套定义打架，属重构残留。

### 3.4 性能

**好的地方**
- 数据量级极小（5 店 × 6 菜 = 30 条），computed 内的 `filter`/`sort` 开销可忽略，**不存在重计算热点**。
- `sort` 前用 `[...src]` 复制，**没有原地修改** `SHOPS` 源数组（`ShopListView.vue:50,52`）——这是很容易踩的坑，此处避开了 ✅。
- 确定性派生取代 `Math.random()`：`monthSales()`（ShopView:70-73）与 `eta()`（OrderView:143-148）都用 id 字符码求和派生稳定值，代码注释明确写了"去掉 Math.random 跳数（重渲染不再变）"——**这是一个正确且有意识的性能/正确性决策**。
- 动效均使用 `transform` / `opacity`（`pay-bar-up`、`price-pop`、`sheet-slide-up`、各种 `:active` scale），GPU 友好，**未发现 width/top/left 类布局抖动动画** ✅。
- 横向滚动区用 `overflow-x:auto` + `scroll-snap-type`，未用 JS 模拟滚动。
- 无大数组被不必要地 `ref()` 包裹；`SHOPS`/`DISHES` 是模块级常量，未进响应式系统 ✅。

**问题**
- 4 处定时器未清理（**M-4**）—— 这是本维度唯一的实质问题。
- `Statusbar` 1Hz 轮询驱动分钟级显示（**N-16**），代价确实可忽略，但可用自校正 timeout 做到零浪费。
- `price-pop` 动画含 `color`（**N-17**），影响可忽略。
- `ShopView.vue:53` 的 `menu.value.filter(d => !p.includes(d))` 是 O(n²)，但 n=6，无意义优化点，**不建议改**。

### 3.5 可访问性（a11y）

**好的地方**
- `Statusbar` 整条 `aria-hidden="true"`（Statusbar.vue:35）—— 判断准确，它是手机外壳装饰不是内容，读屏应跳过。`wk-mark` 同样处理 ✅。
- **筛选 chip 带 `:aria-pressed`**（ShopListView.vue:116）—— 这是本次 P1 里最专业的一处 a11y 细节，切换按钮的正确 ARIA 模式。
- `ShopCard` 的 CTA 带动态 `:aria-label="进入${shop.name}领券"`（ShopCard.vue:37），比裸"领券"信息量大得多 ✅。
- `prefers-reduced-motion` 全局生效，P1-7 新增的三个动画自动被禁用 ✅。
- `:focus-visible` 焦点环体系（style.css:322-334）+ `text-size-adjust` 尊重用户字体缩放。
- `TabBar` 用 `<nav>` + `router-link`，语义正确。

**问题**
- **触控目标系统性小于 44px**（**M-11**），且与本文件自己定的标准矛盾。
- **大量 `<div @click>`**（**M-12**），导致上面那套 `:focus-visible` 对它们全部失效——a11y 投入被抵消。
- `/order` 页 TabBar 被遮挡但仍可 Tab 聚焦（**M-13**）——焦点会跑到不可见元素上。
- 对比度：`.fine-print` #999/#F5F5F5 ≈ 2.8:1（**N-20**）；`.cart-go:disabled` #999/#555 ≈ 2.5:1（禁用态，可接受）；`.ph-old` #999/#fff ≈ 2.85:1（划线价，次要信息）。
  **未发现"白字叠浅色"级别的严重问题** —— `.rp-banner` 白字叠红橙渐变、`.ph-card` 白字叠红橙，对比度都是充足的。
- `ServiceView` 聊天区无 `aria-live`，新消息不会被读屏播报。

### 3.6 健壮性 / 边界

**好的地方**
- 空态覆盖**相当完整**：筛选无结果（ShopListView:124，且每个 chip 有专属文案）、店铺不存在（ShopView:248）、购物车为空（OrderView:222）、无订单（OrdersView:112 + 117 分 Tab 空态）、无历史（ServiceView:85）、本店无特价（ShopView:166）、无推荐（ShopView:181）。**这是全仓做得最好的一个维度**。
- 缺字段降级到位：`d.originalPrice` 全部 `v-if` 保护、`shop?.` 可选链一致、`h.items?.length` 有回退到反查菜单的逻辑（OrdersView:87-89,93）、`getDish` 返回 undefined 时 `?? 0` / `?? '🍽️'` 兜底（OrderView:182-187）。
- **事件冒泡处理正确**：`ShopCard.vue:37` 卡片整体可点 + 内部 CTA 用 `@click.stop`，避免双触发；`ShopView.vue:164,179` 促销卡同款处理；`OrderView.vue:353` 抽屉遮罩用 `@click.self` 精确判定 ✅。
- `cart.ts` 的 `decItem` 在数量归零时 `delete` 键、店铺清空时 `delete` 店铺条目，没有留下空对象垃圾 ✅。
- `ServiceView.vue:50` 的 `navigator.clipboard?.writeText(phone).catch(()=>{})` —— 可选链会短路整条链，**在无 clipboard API 的环境下不会抛错**，写法正确 ✅。

**问题**
- **`JSON.parse` 无保护可致白屏**（**M-5**）—— 本维度唯一的高危项。
- 定时器卸载后回调（**M-4**）：Vue 3 下不会抛错，但属泄漏。
- `ShopView` 路由参数变化不响应（**M-7**）—— 埋雷型。
- `memory.ts` UTC 跨日（**N-7**）。

### 3.7 死代码 / 遗留

**好的地方**
- **未发现任何注释掉的旧代码块** ✅
- **未发现遗留 TODO / FIXME / XXX / HACK** ✅（已全仓 grep）
- 未发现未使用的 import（`vue-tsc` 配合 `noUnusedLocals` 会捕获，且实测零告警）
- 注释质量高：多处解释"为什么"而非"是什么"，例如 `ShopListView.vue:35`（`混单位下 parseInt 会排错序`）、`OrderView.vue:173`（`必须在 clearShop 之前：此时 dish 仍在购物车`）、`Statusbar.vue:20`（`ref 赋同值不触发重渲染`）。这类注释很有价值。

**问题**
- 死 CSS 约 16 组 + 35 行 scoped（**N-1 / N-2**）—— 本维度的主要问题，全部集中在样式层。
- 死状态 / 死 API：`timeSlot`（**M-9**）、`PhoneFrame.showTab/showStatus`（**M-13**）、`activeCat` 近乎无用的 computed（**M-7** 附带）。
- 恒等条件：`OrderView.vue:239` 的 `timeSlot === 'auto' ? 'auto' : 'auto'`（**M-9**）、`OrdersView.vue:59` 的 `{ white: true, yellow: false }`（**N-14**）。
- 未使用依赖 `vant`（**N-5**）。

### 3.8 红线合规（spec §5）

| § | 红线条款 | 判定 | 依据 |
|---|---|---|---|
| §5.1 | 胡闹内核内容（文案/人设/成就名）不动 | ✅ **合规** | P1 新增文案均为界面壳文案（"红包到账"、"神抢手"），戏精台词由 `sliceDrama` 产出，未改动 |
| §5.2 | **`sliceDrama` 引擎逻辑不动** | ✅ **合规（强证据）** | `git show --stat` 四个 P0/P1 提交（`e1ad096`/`5ab655d`/`22c877c`/`0a8cdca`）**命中 `src/engine/` 与 `src/core/` 的文件数为 0**。`OrderView` 仅**调用** `sliceDrama()`，未改其输入契约 |
| §5.3 | **纯点击原则，不引入自由文本输入框** | ✅ **未违规**（附一条改进建议） | 全仓仅 2 个 `<input>`：`HomeView:83`（`readonly`，允许项）与 `ShopListView:87`（无 readonly）。`git log -S` 证明后者来自 `a6a1e35`（**早于所有 P0/P1 提交**），**非本阶段新增**。全仓 **零 `v-model`、零 `contenteditable`** ✅。地址/备注/餐具/时间全部走 chip + 抽屉，符合条款精神。建议见 **M-10** |
| §5.4 | `runForbiddenCheck` 与 `isDev` 显示逻辑不动 | ✅ **合规** | `OrderView.vue:170-171,403-406` 调用与展示逻辑与 P0 前一致，`core/forbiddenCheck.ts` 零改动 |
| §5.5 | 品牌锚色仅作点缀，不替代美团功能色 | ✅ **合规** | `--brand-green` 仅用于 wk-mark / 成就光晕 / 段子卡底；`--brand-orange` 仅用于焦点环 / 段子卡人名。P1 新增的所有功能色（chip 选中、CTA、pay-bar、TabBar 选中）**一律用 `--mt-yellow`** ✅ |
| §5.6 | 核心数据模型仅允许扩展可选字段 | ✅ **合规** | 新增字段全部带 `?`：`Shop.flash?` / `Shop.cat?`、`Dish.category?` / `originalPrice?` / `tags?`、`OrderHistoryEntry.items?`（且 `memory.ts:34` 有注释明示"扩展可选字段，不改变既有字段语义"）。`cart.ts` / `memoryStore.ts` 零改动 |

> **红线维度结论：6/6 全部合规，无违规项。** 这是本次审查中表现最好的维度，说明红线意识在执行层是到位的。

### 3.9 测试工程性

**好的地方**
- 基线健康：**61/61 通过**，覆盖 engine（sliceDrama / dramaEngine，含 coverage 专测）、core（forbiddenCheck / orderInput）、store（cart / memory）、data（shops / achievements）、config（loader）。
- `memory.ts` 的 `KVStore` 注入式设计让存储层完全可测，10 条 memory 测试就是这个设计的红利。
- 测试命令规范：`node --test --experimental-strip-types "src/**/*.test.ts"`，无第三方 runner 依赖，启动快（2.6s）。
- 测试与源码同目录（`*.test.ts` 紧邻实现），便于维护。

**问题（本维度是全报告评级最低项：D）**

- **P1 引入的全部纯逻辑，测试覆盖率为 0。** 清单：

  | 可测纯逻辑 | 位置 | 现状 | 本可拦截的缺陷 |
  |---|---|---|---|
  | `salesOf()` / `distanceOf()` | `ShopListView.vue:30-40` | 埋在 SFC | — |
  | 6 个筛选分支 `list` | `ShopListView.vue:42-59` | 埋在 SFC | **M-1**（freeship 恒空）、**M-2**（promo 恒全） |
  | `monthSales()` | `ShopView.vue:70-73` | 埋在 SFC | — |
  | `flashSale` / `popular` 派生 | `ShopView.vue:45-55` | 埋在 SFC | — |
  | 标签匹配 `includes` | `ShopView.vue:191-192` | 埋在 SFC | 🔴 **B-1** |
  | 折扣率计算 | `ShopView.vue:201` | 埋在 SFC | 🔴 **B-2** |
  | `itemCount()` | `OrdersView.vue:27-30` | 埋在 SFC | **M-8**（ServiceView 不一致） |
  | `eta()` | `OrderView.vue:143-148` | 埋在 SFC | — |
  | 价格链 `packingFee`→`finalPay` | `OrderView.vue:121-128` | 埋在 SFC | — |
  | `fmtClock()` | `Statusbar.vue:12-14` | 埋在 SFC | **N-16**（小时不补零） |
  | `isActive()` | `TabBar.vue:11-14` | 埋在 SFC | — |

- **结构性障碍**：测试 glob 是 `src/**/*.test.ts`，**只匹配 `.ts`**。`node:test` 无 SFC 编译能力，仓库也没有组件测试基建（无 `@vue/test-utils`、无 jsdom）。
  因此上述逻辑**不是"忘了写测试"，而是"物理上无法被测试"**。唯一出路是把纯函数搬出 `.vue`。

- **这是本次 3 个 Blocker 的共同根因**：B-1（数组/字符串 `includes` 混用）与 B-2（折扣算错 10 倍）都是**一条 3 行单测就能拦下**的低级错误，
  它们能活到审查阶段，正是因为这些逻辑处在测试的盲区里。修 Blocker 时**必须连带把函数抽出去并补测**，否则同类问题会持续复发。

---

## 4. 架构层面建议

### 4.1 应抽取的公共单元（按投资回报率排序）

| 优先级 | 抽取项 | 目标位置 | 解决的问题 | 收益 |
|---|---|---|---|---|
| **P0** | `useToast()` composable | `src/composables/useToast.ts` | M-4（4 处定时器泄漏）+ M-14（3 套重复实现 + 2 处 alert） | 一次性消灭 6 个问题，5 个调用点统一 |
| **P0** | 菜品/价格纯函数 | `src/lib/dish.ts`、`src/lib/price.ts` | B-1、B-2、N-12 —— 并**打开测试通道** | 让 Blocker 类缺陷可被单测拦截 |
| **P0** | 订单派生函数 `itemCount()` | `src/lib/order.ts` | M-8（两地实现不一致） | 单一事实来源 + 可测 |
| **P1** | 商家筛选/排序函数 | `src/lib/shopFilter.ts` | M-1、M-2 可被单测发现 | 筛选是产品核心逻辑，必须有测试 |
| **P1** | `queryStr()` 路由参数窄化 | `src/lib/route.ts` | M-6（3 处 `as` 断言） | 消除类型系统盲区 |
| **P1** | `<AppCell>` 组件 | `src/components/AppCell.vue` | M-12（4 个 `.cell` 语义化）+ OrderView 瘦身 | 一次改对，全表单受益 |
| **P2** | `<PriceBreakdown>` 组件 | `src/components/` | OrderView 476 行拆分（价格明细段约 12 行模板 + 8 个 computed） | 主文件降到 ~350 行 |
| **P2** | `<HorizontalScroller>` 组件 | `src/components/` | `.flash-scroll` / `.ph-scroll` / `.filter-chips` / `.order-tabs` / `.rights` 五处同构横滚 | 消除 5 份滚动条隐藏 CSS |
| **P2** | `<DishCard>` / `<PromoCard>` | `src/components/` | ShopView 265 行拆分，促销卡在两处重复（:157-165 与 :172-180 结构完全相同） | 消除模板级复制粘贴 |

### 4.2 令牌规范建议

1. **补 z-index 令牌层**（N-3）—— 在 `:root` 加一组 `--z-*` 并在 style.css 顶部写死层级契约注释。这是当前最容易失控的维度（已有 10 个魔法值）。
2. **补渐变/近黑令牌**（N-4）—— `--grad-thumb`、`--grad-hot`、`--mt-ink: #1a1a1a`（后者重复约 30 次）。
3. **建立"令牌优先"的 review 规则**：新增 CSS 中出现裸十六进制色值时，必须说明为何现有令牌不适用。当前令牌体系设计得很好，问题纯在执行。
4. **触控目标规范化**（M-11）—— 把 `style.css:335-338` 那段已有的 44px 规则升级为 `.hit-44` 工具类或 mixin，让新控件"默认合规"而非"事后补"。

### 4.3 中长期技术债清单（优先级排序）

| # | 技术债 | 影响面 | 建议时机 | 估时 |
|---|---|---|---|---|
| 1 | **P1 纯逻辑全部抽 `src/lib/` 并补单测** | 测试盲区是 3 个 Blocker 的共同根因 | **修 Blocker 时同步做**（否则同类问题复发） | 3h |
| 2 | 统一 Toast / 消灭 `alert()` / 定时器托管 | 6 个问题一次解决 | 与 Blocker 同批 | 1h |
| 3 | `OrderView.vue` 476 行拆分 | 全仓最大维护热点，后续任何下单页改动都受其拖累 | P2 启动前 | 3h |
| 4 | a11y 语义化改造（分档：先 OrderView 表单主干） | 已投入的 focus-visible 成本正在被浪费 | P2 期间分批 | 2h |
| 5 | 触控目标 44px 合规 | 影响加购转化路径的误触率 | P2 期间 | 1h |
| 6 | 死 CSS 清理 + z-index 令牌化 | CSS 体积 −8~10%，层级可控 | P2 期间 | 1.5h |
| 7 | 数据覆盖补齐（金刚区 8 类空、免配送费 0 家） | 首页 80% 入口是死路 | P2 内容阶段 | 2h |
| 8 | `PhoneFrame` 接线 `meta.hideTab` | 消除死 API，符合 spec 原方案 | P2 | 0.5h |
| 9 | 引入 `@vue/test-utils` + jsdom 建组件测试基建 | 让"渲染态"也可测（如静态 `on` 类冲突可被断言拦截） | P2 之后评估 | 4h |

> **关于第 9 项的取舍建议**：本项目是原型/演示性质，引入组件测试基建的边际收益需谨慎评估。
> **更划算的做法是先做第 1 项**——把逻辑挤出 `.vue`，用零成本的 `node:test` 覆盖。等 `.vue` 里只剩模板时，组件测试的必要性自然下降。

### 4.4 流程层面建议（针对系统性问题）

审查中发现三类**重复出现**的模式，说明不是个别疏忽而是缺乏检查点：

1. **静态 class + 动态 `:class` 并存**（7 处命中，3 处实际破损）→ 建议加入 code review checklist，或配 ESLint `vue/no-duplicate-attributes` 类规则。
2. **定时器不清理**（4/8 组件）→ 有了 `useToast()` 后应约定"组件内禁止裸用 `setTimeout`"。
3. **纯逻辑写在 `.vue` 里**（11 处）→ 建议约定"任何不依赖 DOM/响应式的函数一律放 `src/lib/`"，这条规则若早存在，B-1/B-2 不会发生。

---

## 5. 值得肯定的地方

以下均为客观认定，非平衡性措辞：

1. **红线执行 6/6 全合规，且有硬证据。** 四个 P0/P1 提交对 `src/engine/`、`src/core/` 的命中文件数为 **0**。在一个连续迭代四轮、涉及 12 个文件的改造中做到引擎零污染，是很强的纪律性。数据层扩展也严格走 `?` 可选字段并附注释说明"不改变既有字段语义"。

2. **`Statusbar.vue` 的定时器管理是教科书级的。** 本次任务点名"Statusbar 重点查"，实测它是全仓最干净的一个：`onMounted` 建、`onUnmounted` 清并置 `null`，还附了一句说明为何 1Hz 采样代价可忽略的注释。同样干净的还有 `PushNotifier`（用 `Set` 跟踪全部 timer 后批量清理）和 `DramaTimeline`。

3. **确定性派生取代 `Math.random()` 是一个有意识的正确决策。** `eta()` 与 `monthSales()` 都从 id 字符码派生稳定值，注释明确写了动机——"去掉 Math.random 跳数（重渲染不再变）"。这解决了一类很隐蔽的 UI 抖动 bug，说明作者理解渲染时机。

4. **`distanceOf()` 避开了一个真实的排序陷阱。** 数据里混用 `1.2km` 和 `800m`，直接 `parseInt` 会把 `800m` 排在 `1.2km` 后面。代码做了单位归一化并**在注释里写明了原因**（`混单位下 parseInt 会排错序`）。这是"想到了别人想不到的地方"。

5. **空态覆盖是全仓最完整的维度。** 7 个空态场景全部有处理，且 `ShopListView` 做到了**每个筛选 chip 有专属空态文案**（"这批老板今天不想打折"、"暂无免配送费商家 · 老板们都想赚这几块钱"）——把工程降级路径同时做成了内容资产。

6. **事件冒泡处理全部正确。** 卡片整体可点 + 内部按钮 `@click.stop` 的组合在 3 处出现且都对；抽屉遮罩用 `@click.self` 而非 `@click` + 判断，是更精确的写法。这类问题很常见，此处零失误。

7. **`aria-pressed` 与动态 `aria-label` 显示出真实的 a11y 认知。** `ShopListView.vue:116` 的 `:aria-pressed` 是切换按钮的正确 ARIA 模式；`ShopCard.vue:37` 的 `:aria-label="进入${shop.name}领券"` 比裸"领券"信息量大得多。a11y 的问题是**执行不彻底**，不是**不懂**。

8. **`memory.ts` 的 `KVStore` 注入式设计。** 让存储层脱离浏览器环境可测，直接带来 10 条 memory 单测。这是本仓库最好的一处可测性架构设计——**建议把这个思路复制到本次要抽取的 `src/lib/` 纯函数上**。

9. **零 `any`、零 TODO/FIXME、零注释掉的死代码块、类型检查与构建全绿。** 基础工程卫生良好。

10. **注释解释"为什么"而非"是什么"。** 多处注释记录了决策依据与陷阱（`必须在 clearShop 之前：此时 dish 仍在购物车`、`ref 赋同值不触发重渲染，代价可忽略`、`纯装饰：不接任何系统 API`）。这类注释在交接时价值极高。

---

## 附录 A · 审查方法与证据

| 手段 | 命令 / 方式 | 结果 |
|---|---|---|
| 类型检查 | `npx vue-tsc --noEmit` | 0 error |
| 测试基线 | `npm test`（`node --test --experimental-strip-types`） | **61/61 pass**，2.6s |
| 构建验证 | `npx vite build` | 成功，93 modules，JS 172.48 kB / CSS 53.98 kB |
| 逻辑复现 | 复刻源码表达式跑真实数据（**未修改任何源文件**，脚本置于系统临时目录） | B-1 / B-2 / M-1 / M-2 / M-3 / N-7 均已复现 |
| 死 CSS 检测 | 对 `style.css` 每个类名在 `src/**/*.vue` 中 grep 引用计数 | 16 组零引用 |
| 红线取证 | `git show --stat` × 4 个 P0/P1 提交；`git log -S` 追溯 input 引入点 | 引擎零命中；ShopListView input 来自 `a6a1e35`（早于 P1） |
| 定时器审计 | 逐文件比对 `setTimeout|setInterval` 与 `onUnmounted|onBeforeUnmount` | 8 个组件中 4 个缺清理 |

> **审查者备注（自我纠错记录）**：初次用 grep 统计清理钩子时，因只搜 `onUnmounted` 而漏掉了使用 `onBeforeUnmount` 的组件，
> 一度误判 `PushNotifier` 与 `DramaTimeline` 存在泄漏。经逐文件复核后更正——两者实现均正确，已从问题清单中移除并列入"值得肯定"。
> 同理，`ShopView.vue:108` 的 `.ss-pill` 经复核后确认**当前表现正确**（依赖 CSS 声明顺序），故未计入 Blocker 的破损计数，仅标注为脆弱。

## 附录 B · 约束遵守声明

- ✅ **只读审查**：除本报告外，未创建、修改、删除任何 `src/` 下文件。逻辑复现脚本写在系统临时目录，不在仓库内。
- ✅ **未执行 git commit / git push**（仅执行了 `git status` / `git log` / `git show --stat` 等只读查询）。
- ✅ 未使用 `npx vitest run`（仓库未装 vitest）；全部使用 `npm test`。
- ⚠️ `npx vite build` 会写入 `dist/`（构建产物目录，非源码）。若需保持工作区洁净，可按需清理。

---

**报告完 · 程基岩（engineering-lead）· 2026-07-31**
