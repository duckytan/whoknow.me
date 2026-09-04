# 美团交互范式保真 · P1 全八项工程规范验收报告

> 任务：T-P1-AUDIT-01 · 验收人：严守真（quality-lead）
> 日期：2026-07-31
> 验收基准：`docs/designs/waimai-meituan-soul-fidelity-spec.md` §4 / §5 / §6
> 被验提交：`e1ad096` (T-MS-02) → `5ab655d` (T-MS-03) → `22c877c` (T-MS-04) → `0a8cdca` (T-MS-05)
> 验收方式：逐文件 Read + 行号取证 + 对真实数据模块求值 + 三项动态检查。**未采信任何既往结论。**

---

## 1. 验收结论摘要

**一句话结论：P1 八项确实全部动手落地了，没有一项是纯空壳；但其中 3 项存在「代码写了、条件恒不成立」或「新旧控件状态打架」的实质缺陷，因此整体判定 CONCERNS，不建议无条件放行 P2。**

**整体判定：`CONCERNS`**

- 主理人此前用 grep 抽查得出的「P1 全部完成」结论 —— **方向正确，强度不足**。八项的 DOM 结构、CSS、事件绑定确实都真实存在（grep 命中不是假象），但 grep 无法发现「`tags.includes('月售')` 精确匹配对 `'月售28'` 恒为 false」这类缺陷。本次验收**证实了「都做了」，同时证伪了「都做对了」**。
- 三条硬门槛全绿：类型 0 错、测试 61/61、构建成功且产物与仓库 `dist/` 字节一致。
- **无 Blocker（本报告口径）。** 无崩溃、无构建阻断、无红线违规。**注：并行的代码评审对其中 2 条判为 Blocker，属严重度口径差异，已在 §9 交叉比对中说明分歧与建议。**
- Major × 6，Minor × 5。全部为「功能不正确 / 状态不一致 / 保真度破口 / 健壮性缺口」，均可在 P2 前以小改量修复。

### 八项判定一览表

| # | 改造项 | 子要求通过率 | 判定 | 一句话说明 |
|---|--------|------------|------|-----------|
| P1-1 | 首页神抢手横向滚动 | 3/4 | **PASS** | 真实渲染 2 张卡（`flash:true` 有数据）；仅「复用 ShopCard」一条按自建卡片实现 |
| P1-2 | 首页定位地址行 | 4/4 | **PASS** | 位置、图标、戏精提示、不唤键盘 全部达标 |
| P1-3 | 商家列表筛选+红包+CTA | 2.5/4 | **CONCERNS** | chip/横幅/CTA 都真实；但 2 个 chip 无筛选力，且与旧排序 tab 状态打架 |
| P1-4 | 客服 IM 页 | 5/5 | **PASS** | 五大件齐全、输入栏非 input 守住纯点击；扣分在 `alert()` 与硬编码件数 |
| P1-5 | 店铺页菜品卡片 | 4/5 | **CONCERNS** | 月售分支恒 false（死代码）+ 折扣角标单位错误，5 道菜可见错误文案 |
| P1-6 | 状态栏真实化 | 4/4 | **PASS** | 内联 SVG 信号/WiFi/电池 + 真实时钟，`setInterval` 已在 `onUnmounted` 清理 |
| P1-7 | 结算栏动效 | 2/3 | **CONCERNS** | 出现动效与 press 反馈达标；价格跳动机制写对了但本页价格不可变，实际不可达 |
| P1-8 | 路由与 TabBar 选中态 | 2/2 | **PASS** | `/` 精确高亮「外卖」；`/order` 走规格允许的 z-index:11 覆盖方案 |

**合计：PASS 5 · CONCERNS 3 · FAIL 0**

---

## 2. 逐项验收明细

### P1-1 首页神抢手横向滚动 —— `PASS`

**规格原文**：在金刚区与 Feed 之间新增「神抢手」横向卡片区，复用 ShopCard miniature 样式，数据来自 SHOPS 中标记爆款店铺。

| # | 子要求 | 证据 | 判定 |
|---|--------|------|------|
| 1 | 位于金刚区与 Feed 之间 | `HomeView.vue:89-94` 金刚区 `.cat-grid` → `:98-113` 神抢手 → `:116-119` Feed Tab。顺序正确 | PASS |
| 2 | 横向滚动 | `style.css:402` `.flash-scroll { overflow-x:auto; scroll-snap-type:x mandatory; white-space:nowrap }` + `:404` `.flash-card{ display:inline-flex; width:140px; flex-shrink:0 }`。真实横向滚动容器，非伪装 | PASS |
| 3 | 数据来自 SHOPS 爆款标记 | `HomeView.vue:39` `SHOPS.filter(s => s.flash)`；`shops.ts:23` 定义 `flash?: boolean`；`shops.ts:76` (s01 老王烧烤) 与 `:123` (s04 怪味研究所) 实际标了 `flash: true` | PASS |
| 4 | 复用 ShopCard miniature 样式 | 实现为自建 `.flash-card`（`HomeView.vue:105-112`，`fc-img/fc-body/fc-name/fc-price/fc-tag`），**未复用 ShopCard 组件** | CONCERNS |

**空壳排查（重点）**：整区受 `v-if="flashShops.length"` 控制（`:98`、`:104`）。求值验证 —— `flash:true` 命中 **老王烧烤、怪味研究所 共 2 家**，条件为真，**区块真实渲染，不是恒隐藏的死区**。CSS 类 `.flash-scroll` / `.flash-card` / `.fc-img` / `.fc-body` 在 `style.css:402-407` 均有实体定义，非孤儿 class。

**问题**：子要求 4 与规格文字不符。规格写「复用 ShopCard miniature 样式」，实现是另起炉灶的 140px 卡片。视觉效果成立（黄色渐变图头 + 店名 + 价格 + 促销标），但若后续 ShopCard 改版，两套卡片样式会漂移。属实现选择偏差，非功能缺陷，记 Minor 备查（m3）。

---

### P1-2 首页定位地址行 —— `PASS`

**规格原文**：在 `.yellow-zone` 搜索栏上方增加 `📍 地址 >` 行，点击给出戏精提示，不触发键盘。

| # | 子要求 | 证据 | 判定 |
|---|--------|------|------|
| 1 | 位于 `.yellow-zone` 内、搜索栏上方 | `.yellow-zone` 开于 `HomeView.vue:64`；定位行 `:73-77`；搜索栏 `:80-86`。定位行在黄区内且在搜索栏之前 | PASS |
| 2 | `📍 地址 >` 三段结构 | `:74` `<span class="loc-icon">📍</span>`、`:75` `汇展华城`、`:76` `<span class="loc-arrow">›</span>`。CSS `style.css:393-395` 实体存在 | PASS |
| 3 | 点击给戏精提示 | `:73` `@click="onLocClick"` → `:20-22` `showToast('地址由锡哥随机分配，无法修改')`。Toast 渲染于 `:152` | PASS |
| 4 | 不触发键盘 | 载体为 `<div>`，非 input/contenteditable。全仓 `<input>` 仅 2 处（见 §6），此处不在其中 | PASS |

**空壳排查**：`onLocClick` 已绑定且函数体非空；`showToast` 定义于 `:50-54` 并真实驱动 `:152` 的 v-if。链路完整。

---

### P1-3 商家列表筛选 chip + 红包横幅 —— `CONCERNS`

**规格原文**：`ShopListView.vue` 在搜索栏下增加可横向滚动的筛选 chip（满减/免配送费/销量/距离/新店等）与红包优惠横幅；ShopCard 增加右侧黄色 CTA。

| # | 子要求 | 证据 | 判定 |
|---|--------|------|------|
| 1 | 可横向滚动的 chip 行 | `ShopListView.vue:110-121` v-for 渲染；`style.css:644` `.filter-chips{ overflow-x:auto; -webkit-overflow-scrolling:touch }` + `:646` `.fc-chip{ flex-shrink:0; white-space:nowrap }`。选中态 `:648` 用 `--mt-yellow` | PASS |
| 2 | 筛选项覆盖（满减/免配送费/销量/距离/新店） | `:19-26` 六项齐全（全部/满减优惠/免配送费/销量优先/距离最近/新店）。**但 2 项无筛选力，详见下方** | **CONCERNS** |
| 3 | 红包优惠横幅 | `:97-101` `.rp-banner`，含 🧧 图标 / 主副文案 / 领取按钮 / `@click` Toast；`style.css:636-641` 红橙渐变实体样式 | PASS |
| 4 | ShopCard 右侧黄色 CTA | `ShopCard.vue:37` `<button class="card-cta" @click.stop="go">领券</button>`；`style.css:655` `background: var(--mt-yellow)`，`.promo-line` flex 右侧定位（`:652-654`） | PASS |

**数据穿透验证（对 SHOPS 真实求值）**：

| chip | 判据（代码位置） | 实际命中 | 结论 |
|------|-----------------|---------|------|
| 全部 | — | 5/5 | 正常 |
| 满减优惠 | `:46` `s.promo.includes('减')` | **5/5** | **与「全部」结果完全相同 —— 该 chip 不产生任何过滤效果（no-op）** |
| 免配送费 | `:48` `s.deliveryFee === 0` | **0/5** | **数据中无任何 `deliveryFee:0` 店铺，该 chip 永远空结果** |
| 销量优先 | `:50` `salesOf` 降序 | 5600>3000>2200>1800>900 | 真实排序，正确 |
| 距离最近 | `:52` `distanceOf` 升序 | 600m>700m>800m>1200m>1500m | 真实排序，**且正确处理 km/m 混单位**（`:36-40`），实现质量高 |
| 新店 | `:54` `badge==='新店' \|\| flash` | 3/5 | 有结果，但把 `flash`（爆款）当「新店」语义略勉强 |

→ 缺陷 **M4**。注：两项失效 chip 均有定制空态文案兜底（`:22` `:25` + `:124` 渲染），不会白屏，作者应有察觉；但「点了永远没结果 / 点了跟没点一样」在保真类需求里仍是坏掉的可用性承诺。

**新旧控件冲突（重点）**：`:103-107` 存在一段**纯静态、无任何事件绑定**的旧排序 tab：

```
:104  <div style="... color: var(--mt-price); border-bottom: 2px solid var(--mt-price)">综合排序</div>
:105  <div style="... color: var(--mt-text-2)">销量优先</div>
:106  <div style="... color: var(--mt-text-2)">距离最近</div>
```

「综合排序」被**硬编码为永久红色高亮**，三个 div 均无 `@click`、无状态绑定。而紧随其下的 chip 行（`:110-121`）含同名的「销量优先」「距离最近」。经 `git diff 0a8cdca~1 0a8cdca` 核对：P1-3 只新增了 `filter-chips` 与 `rp-banner`，**完全没有处理这段旧 tab**。

→ 实际后果：用户点 chip「销量优先」，列表确实重排了，但上方 tab 仍显示「综合排序」为选中态 —— **两个控件对同一件事给出矛盾的状态显示**。缺陷 **M3**。

**`?cat=` 叠加验证（回归点）**：`:15` `baseList` 先按 `?cat=` 过滤 → `:42-59` `list` 再在 `baseList` 之上做 chip 筛选/排序。**单向组合，无互相覆盖**，设计正确 ✓。

---

### P1-4 客服 IM 页 —— `PASS`

**规格原文**：`ServiceView.vue` 从 FAQ 改为 IM 聊天页：顶部店名、订单信息卡、聊天气泡、快捷回复 chip、底部输入栏；内容使用 whoknow 戏精回复。

| # | 子要求 | 证据 | 判定 |
|---|--------|------|------|
| 1 | 顶部店名 | `ServiceView.vue:58-66` `.im-nav`，`:60` 动态店名 `${shop.name}(${shop.distance})`，含返回/电话/复制/更多 | PASS |
| 2 | 订单信息卡 | `:69-82` `.im-order-card`，含商品图/店名/件数/合计/状态/订单号/下单时间；`:85-88` 无订单时有兜底空态 | PASS |
| 3 | 聊天气泡 | `:94-103` 左侧商家气泡（头像+名称+正文+时间+已读）、`:105-113` 右侧用户气泡。结构对称完整 | PASS |
| 4 | 快捷回复 chip | `:118-120` 四个 chip，与规格 §1.2 截图清单逐字一致（少送/错送 · 口味不佳 · 菜品与描述不符 · 开发票），`@click="sendQuickReply"` 已绑定 | PASS |
| 5 | 底部输入栏 | `:123-129` `.im-input`，五件套（🎤/输入框/😊/⊕/⋯）。**输入框是 `<div class="ii-box">` 而非 `<input>`**（`:125`）—— 视觉像美团，交互守住纯点击原则 | PASS |
| 6 | 戏精回复内容 | `:30-35` `replyMap` 四条定制文案，`:42` 有兜底回复。风格符合 whoknow 调性 | PASS |

**空壳排查**：`sendQuickReply`（`:37-45`）真实 push 用户气泡 + 600ms 后 push 商家回复，`messages` 为 `ref` 且驱动 `:92` 的 v-for。**交互闭环成立，不是静态截图**。

**扣分项（不影响判定，另计缺陷）**：
- `:51` `alert('已复制：…')` —— 原生浏览器弹窗，见 **M5**。
- `:74` `共1件` **硬编码**。`memory.ts:34-35` 已扩展 `items[]`（含 `qty`），测试 M10 明确验证「Σqty 可算」，此处却写死。见 **m2**。
- `:41` `setTimeout` 未存 handle、未在 `onUnmounted` 清理。见 **m1**。

---

### P1-5 店铺页菜品卡片丰富度 —— `CONCERNS`

**规格原文**：菜品行升级为卡片：大图、月售、标签（招牌/买贵必赔）、原价划线、黄色大加购按钮。

| # | 子要求 | 证据 | 判定 |
|---|--------|------|------|
| 1 | 大图 | `ShopView.vue:187` `.dish-thumb`；`style.css:445` `78×78px` + 黄色渐变底 + `font-size:34px`。规格 §1.4 明确允许 emoji/渐变占位 | PASS |
| 2 | 月售 | `ShopView.vue:191-193` —— **两个分支条件恒为 false**，详见下方 | **FAIL** |
| 3 | 标签（招牌/买贵必赔） | `:195-197` v-for 渲染全部 tags，`dt-hot`(招牌)/`dt-safe`(买贵必赔)/`dt-promo` 三态分色；`style.css:453-455` 实体样式；数据侧 `dishes.ts` 确有 `'招牌'`/`'买贵必赔'` | PASS |
| 4 | 原价划线 | `:200` `v-if="d.originalPrice"` → `.dc-old`；`style.css:458` `text-decoration: line-through` ✓。数据侧多道菜有 `originalPrice` | PASS（但角标有 bug，见 M2） |
| 5 | 黄色大加购按钮 | `:213` `.dish-cta` `@click="addItem"`；`style.css:460` `32×32` 圆形 `var(--mt-yellow)`。已加购时切换为 stepper（`:205-211`，±均绑定） | PASS |

**死代码取证（重点）** —— 对 `dishes.ts` 真实求值：

```
全部 tag 取值: ["招牌","月售28","买贵必赔","月售100+","月售50+","月售30+","月售80+"]
带 tags 的菜品数: 8 / 30
命中 tags.includes('月售') 精确匹配: 0     ← :191 恒 false
命中 tags.includes('人觉') 精确匹配: 0     ← :192 恒 false（且数据里根本无此类 tag）
走 fallback (!tags?.length) 的菜品: 22     ← :193
```

`Array.prototype.includes()` 是**精确相等匹配**，`['招牌','月售28'].includes('月售')` → `false`。因此：

- **8 道带真实月售数据的菜品** → `:191` false、`:192` false、`:193` false（因为有 tags）→ **专属月售行渲染 0 次**；
- **22 道无 tags 的菜品** → 走 `:193`，显示由 `monthSales()`（`:70-73`）**合成**的假月售。

即：**有真数据的不显示，没数据的反而显示合成值 —— 逻辑完全倒置。**

**这是 bug 而非设计选择的铁证**：同一文件 `:51` 的 `popular` 计算属性用的是**正确写法** `d.tags?.some((t) => t.includes('月售'))`（`.some()` + 子串匹配）。作者在 140 行之前就知道正确模式，模板里写错了。

**缓解事实（不粉饰）**：`月售28` 这类 tag 仍会被 `:195-197` 的 `dish-tags` 当作 `dt-promo` 渲染出来，所以用户**看得见「月售28」文字**，只是落在了「促销标签」的视觉槽位（`style.css:455` 米黄底棕字），而非规格要求的月售元信息行（`style.css:449` 灰色副文本）。故判 **Major 而非 Blocker**。→ 缺陷 **M1**。

**折扣角标单位错误** —— `:201` `低至{{ Math.round(d.price / d.originalPrice * 100) }}折`。中文「折」为十分制，`*100` 应为 `*10`。实际渲染（5 道菜可见）：

| 菜品 | 现价/原价 | 实际显示 | 正确应为 |
|------|----------|---------|---------|
| 羊肉串 | ¥6/¥9 | 低至 **67折** | 6.7折 |
| 烤茄子 | ¥12/¥16 | 低至 **75折** | 7.5折 |
| 烤鸡翅 | ¥8/¥12 | 低至 **67折** | 6.7折 |
| 香菜冰淇淋 | ¥15/¥20 | 低至 **75折** | 7.5折 |
| 榴莲披萨 | ¥28/¥38 | 低至 **74折** | 7.4折 |

「低至67折」在中文语境下等于「打 6.7 折的 10 倍」，是明确的错误文案，且与「保真美团」目标直接冲突。→ 缺陷 **M2**。

---

### P1-6 状态栏真实化 —— `PASS`

**规格原文**：`Statusbar.vue` 使用更接近真机的系统图标与时间，保持非功能装饰。

| # | 子要求 | 证据 | 判定 |
|---|--------|------|------|
| 1 | 更接近真机的系统图标 | `Statusbar.vue:38-43` 信号四格内联 SVG（第四格 `opacity:.3` 模拟弱信号）、`:45-59` WiFi 三段弧+圆点、`:68-82` 电池含边框/电量条/充电标。**全部为内联 SVG 路径，非 emoji** | PASS |
| 2 | 真实时间 | `:12-14` `fmtClock` → `HH:MM`；`:16` 初始化；`:21-23` 每秒采样 | PASS |
| 3 | 保持非功能装饰 | `:8` `BATTERY = 86` 为常量非系统读数；`:35` `aria-hidden="true"`；`:2-4` 注释明示纯装饰。未接任何系统 API | PASS |
| 4 | 电量条按电量缩放 | `:10` `batteryWidth = 16*BATTERY/100` → `:79` 绑定 `:width`。真实计算，非写死 | PASS |

**定时器泄漏排查（回归风险 #1，重点）**：**通过 ✓**

```
:17  let timer: ReturnType<typeof setInterval> | null = null
:19-24  onMounted(() => { timer = setInterval(..., 1000) })
:26-31  onUnmounted(() => { if (timer) { clearInterval(timer); timer = null } })
```

`clearInterval` + 置 null 双重处理，**无内存泄漏**。这是全仓定时器处理的**正确范式**（另一处正确范式是 `ShopListView.vue:75-77`）。

`style.css:57-63` `.statusbar` 及 `.sb-side/.sb-ico/.sb-carrier/.sb-time/.sb-batt-num` 全部有实体样式，其中 `:62`/`:63` 用了 `font-variant-numeric: tabular-nums`（等宽数字防时间跳动抖动）—— 细节到位。

*观察（非缺陷）*：`:13` 小时未补零，9 点显示 `9:05`。此为 iOS 真机实际行为，不判问题。

---

### P1-7 下单页粘性结算栏动效 —— `CONCERNS`

**规格原文**：底部结算条增加出现/press 微动效；价格变化时数字跳动提示。

| # | 子要求 | 证据 | 判定 |
|---|--------|------|------|
| 1 | 出现动效 | `style.css:660` `.pay-bar { animation: pay-bar-up 0.24s ease-out }`；keyframes 定义于 `:661-664` **且被引用**（非孤儿）。关键：keyframes 内**正确保留了 `translateX(-50%)`**（`:662-663`），未破坏 `.pay-bar` 的居中定位 | PASS |
| 2 | press 微动效 | `:667` `.pb-btn { transition: transform .1s }` + `:668` `:active { transform: scale(.97); opacity:.85 }`。作用于 `OrderView.vue:348` 的实际按钮 | PASS |
| 3 | 价格变化时数字跳动 | 机制**写对了**但当前**不可达**，详见下方 | **CONCERNS** |

**动效重放机制核查（重点）**：静态 CSS `animation` 只在元素挂载时播放一次，要在数值变化时重放必须强制重新挂载。实现方案：

```
OrderView.vue:132   const priceBumpKey = ref(0)
OrderView.vue:133-135  watch(finalPay, () => { priceBumpKey.value++ })
OrderView.vue:345   <span class="pb-price" :key="priceBumpKey">¥{{ finalPay.toFixed(1) }}</span>
style.css:671       .pay-bar .pb-price { display:inline-block; animation: price-pop .34s ease-out }
style.css:672-676   @keyframes price-pop { 0%,100% scale(1); 35% scale(1.16) + 变红 }
```

**机制本身完全正确** —— `:key` 变更 → Vue 卸载重挂 span → CSS 动画重放。作者甚至在 `style.css:670` 写了注释说明原理。这一点值得肯定，**不是死代码**。

**但是**：`finalPay`（`:128`）= `basePrice + deliveryFee + packingFee - totalDiscount`，其上游为：
- `basePrice`（`:121`）← `cartTotal(shopId)` —— **下单页不提供任何改数量的控件**（规格 P0-4 明确「只读展示，不可在此页修改数量」）；
- `deliveryFeeVal`（`:122`）← 店铺常量；
- `packingFee`（`:123`）← `dishCountVal`，同样只读；
- 三项优惠（`:124-127`）← 全部由 `basePrice` 派生。

页面上可交互的 `addressTag / remarkTag / selectedUtensil / payMethod / orderMode / timeSlot` **没有任何一个进入 `finalPay` 的计算链**。规格 P0-4 提到的「点击红包/代金券行展开可选券列表」**尚未实现**（属 P0-4 范围，不在本次 P1 追责）。

→ 结论：`watch(finalPay)` 在 `/order` 页整个生命周期内**永不触发**，`priceBumpKey` 恒为 0。`price-pop` 只在首次挂载时随结算栏一起播一次。**「价格变化时数字跳动」这一用户可见承诺当前不可观测。**

判定为 CONCERNS 而非 FAIL：代码正确、无需返工，等 P0-4 补上选券交互后即自动生效。属**休眠功能**而非坏功能。→ 缺陷 **m6（观察项）**。

---

### P1-8 路由与 TabBar 选中态 —— `PASS`

**规格原文**：修复 `/` 首页对应「外卖」高亮；`/order` 页面按需隐藏 TabBar 或调整 z-index。

| # | 子要求 | 证据 | 判定 |
|---|--------|------|------|
| 1 | `/` 对应「外卖」高亮 | `TabBar.vue:6` 首项 `{ to:'/', icon:'🛵', label:'外卖' }`；`:11-14` `isActive`：`if (to === '/') return route.path === '/'` —— **精确相等**，避免了「所有以 / 开头的路径都点亮首页」的经典 bug，与规格 §3 P0-1「`isActive('/')` 仅在 path 严格等于 `/` 时高亮」逐字吻合 | PASS |
| 2 | `/order` 隐藏 TabBar 或调 z-index | 走「调 z-index」方案：`style.css:533` `.pay-bar { bottom:0; z-index:11 }` > `.tabbar` `z-index:10`（`:125`）。规格 §6 明确列此为允许备选：「若必须保留 TabBar，将 `.pay-bar` 设为 `z-index:11` 并 `bottom:0` 覆盖 TabBar 区域」 | PASS |

**旁证**：`/order` 时四个 tab 均不高亮 —— `'/order'.startsWith('/orders')` 为 `false`（`/order` 比 `/orders` 短），不会误点亮「订单」tab。逻辑无边界 bug ✓

**发现的死代码（不影响判定）**：`PhoneFrame.vue:5-8` 定义了 `showStatus` / `showTab` 两个 prop 并 `v-if` 消费（`:13`、`:17`），但全仓检索确认 **唯一调用方 `App.vue:6` `<PhoneFrame>` 未传任何 prop**，`router/index.ts` 也无 `meta.hideTab`。两个 prop 恒为默认 `true`，**从未被任何代码驱动过**。功能上无害（z-index 方案已达标），但属未接线的死 prop。→ 缺陷 **m4**。

---

## 3. 动态检查结果

三项全部实跑，均使用规定命令（**未使用 `npx vitest run`**）。

### 3.1 类型检查 `npx vue-tsc --noEmit`

```
退出码: 0
输出: (无任何内容)
```
**结果：PASS —— 0 错误 0 警告。**

### 3.2 单元测试 `npm test`

实际命令：`node --test --experimental-strip-types "src/**/*.test.ts"`

```
1..61
# tests 61
# suites 0
# pass 61
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 2114.69
退出码: 0
```
**结果：PASS —— 61/61 全绿，与基线 61 完全一致，无新增/丢失/跳过用例，无 flaky 迹象。**

### 3.3 生产构建 `npx vite build`

```
vite v5.4.21 building for production...
✓ 93 modules transformed.
dist/index.html                   0.51 kB │ gzip:  0.35 kB
dist/assets/index-DBP5Ilsa.css   53.98 kB │ gzip: 10.17 kB
dist/assets/index-BVSYmol8.js   172.48 kB │ gzip: 68.55 kB
✓ built in 2.62s
退出码: 0
```
**结果：PASS —— 构建成功，无警告，无 chunk 体积告警。**

**附加发现（正面）**：构建后 `git status` 对 `whoknow-waimai/` **无任何改动**，产物哈希 `index-DBP5Ilsa.css` / `index-BVSYmol8.js` 与 `0a8cdca` 提交内的 `dist/` **完全一致** → **构建可复现，仓库内 dist 与当前源码同步，无「源码改了但产物没重建」的漂移风险。**

### 3.4 临时文件残留检查

- **未发现** `vite.config.ts.timestamp-*.mjs` 残留。
- `.qa-tmp/` 存在 4 个历史文件（`boundary.ts`、`qa-validate.mjs`、`qa-validate-report.txt`、`reverify-rider.mts`，均为 2026-07-26 产物）。该目录已被 `722a029` 提交加入 `.gitignore`，**按要求仅记录、未删除**，交主理人处置。
- 本次验收使用的一次性求值脚本建在系统临时目录（非仓库内），**已删除**。项目目录零污染。

---

## 4. 测试覆盖评估 + 最小补测清单

### 4.1 现有 61 个测试覆盖了什么

| 测试文件 | 用例数 | 覆盖模块 | 层次 |
|---------|-------|---------|------|
| `engine/dramaEngine.test.ts` | 21 | 剧本引擎分支/优先级 | 纯逻辑 |
| `store/memory.test.ts` | 10 | 记忆引擎/订单历史/骑手计数 | 纯逻辑 |
| `engine/sliceDrama.test.ts` | 7 | 切片编排 | 纯逻辑 |
| `config/loader.test.ts` | 5 | 配置加载 | 纯逻辑 |
| `core/forbiddenCheck.test.ts` | 5 | 红线门控 | 纯逻辑 |
| `core/orderInput.test.ts` | 4 | 下单数值映射 | 纯逻辑 |
| `data/shops.test.ts` | 3 | 店铺数据形状 | 数据 |
| `engine/dramaEngine.coverage.test.ts` | 3 | 分支覆盖率 | 纯逻辑 |
| `data/achievements.test.ts` | 2 | 成就数据 | 数据 |
| `store/cart.test.ts` | 1 | 购物车 | 纯逻辑 |

**合计 61。全部集中在引擎 / 核心 / 存储 / 数据四层。**

### 4.2 P1 涉及的 UI 层有没有任何测试覆盖

**答案：零。一个都没有。**

- 全仓检索确认：**没有任何测试文件引用过任何 `.vue` 组件**（`find src tests -name "*.test.*" | xargs grep -l "\.vue"` → 空）。
- `package.json` 中**无** `@vue/test-utils`、无 `jsdom`、无 `happy-dom`、无任何组件测试运行器。当前技术栈**不具备组件测试能力**。
- P1 改动的 8 个文件 —— `HomeView.vue`、`ShopListView.vue`、`ShopCard.vue`、`ServiceView.vue`、`ShopView.vue`、`OrderView.vue`、`Statusbar.vue`、`TabBar.vue` —— **覆盖率 0%**。

### 4.3 现有测试能否防住 P1 回归

**不能。已被本次验收实证证伪：**

> 本报告查出的 5 个 Major 缺陷（月售死分支、折扣单位错误、排序 tab 冲突、失效 chip、原生 alert）**全部处于活跃状态**，而 61 个测试**全部通过**。

测试全绿与产品有缺陷同时成立 —— 这就是「现有测试对 P1 零防护力」的直接证据。当前测试套件保护的是胡闹内核（引擎/记忆/红线），这部分保护得很好且本次 P1 未触碰；但保真外壳层完全裸奔。

### 4.4 最小可行补测清单（仅出清单，不在本次实施）

**Tier 1 · 零新依赖，纯函数化后即可测（能直接防住 M1/M2/M4，性价比最高）**

| # | 建议文件 | 断言要点 | 防住的缺陷 |
|---|---------|---------|-----------|
| T1-1 | `src/views/shopFilter.test.ts`（需先把 `ShopListView` 的 `FILTERS`/`salesOf`/`distanceOf`/`list` 抽成独立 `shopFilter.ts` 纯函数） | ① 每个 FilterId 对 SHOPS 命中数 ≥1；② 「满减优惠」结果 ≠ 「全部」结果（防 no-op）；③ 混单位距离排序 `600m<1.2km`；④ `?cat=` + chip 叠加后结果 ⊆ cat 集合 | **M4** + 排序正确性 |
| T1-2 | `src/data/dishes.tags.test.ts` | ① 抽出 `pickMonthlySales(tags)` 后断言：每道带 `月售*` tag 的菜都能取到非空值（当前会红）；② 抽出 `discountLabel(price, orig)` 后断言输出数值 ∈ [1.0, 9.9]（当前 67 会红） | **M1、M2** |
| T1-3 | 扩充 `src/data/shops.test.ts` | ① `SHOPS.some(s => s.flash)` 为真（防神抢手整区消失）；② 金刚区 10 分类每类命中 ≥1，或显式维护「允许为空」白名单并断言白名单外全部非空 | 神抢手空区 + 金刚区死链 |

**Tier 2 · 需引入 `@vue/test-utils` + `happy-dom`（2 个 devDep，需主理人拍板）**

| # | 建议文件 | 断言要点 | 防住的缺陷 |
|---|---------|---------|-----------|
| T2-1 | `TabBar.test.ts` | 路由表驱动：`/`→外卖亮且仅亮一个；`/order`→无 tab 亮；`/orders`→订单亮；`/shop/s01`→无误亮 | P1-8 回归 |
| T2-2 | `ShopCard.test.ts` | mount 后点 `.card-cta`，断言 `router.push` **恰好被调用 1 次**（防 `@click.stop` 被误删导致双跳转） | 冒泡回归 |
| T2-3 | `Statusbar.test.ts` | 用 fake timers：unmount 后断言 `clearInterval` 被调用、时钟不再 tick | P1-6 泄漏回归 |
| T2-4 | `ShopListView.test.ts` | 点各 chip 后断言渲染出的 ShopCard 数量 >0（「点了永远没结果」的兜底守卫） | M4 端到端 |

**Tier 3 · CI 门禁固化（0 成本，建议立即做）**

当前 `npm test` / `vue-tsc --noEmit` / `vite build` **三项皆绿**，具备直接固化为提交门禁的条件：
```
npm test && npx vue-tsc --noEmit && npx vite build
```
建议同时在门禁里加一条「`dist/` 重建后 `git diff --exit-code dist/`」，把本次验证到的「产物可复现」性质固化下来。

---

## 5. 回归风险扫描结果

对主理人点名的四项风险逐一实测：

### 5.1 Statusbar `setInterval` 是否在 `onUnmounted` 清理 —— **无风险 ✓**

`Statusbar.vue:26-31` 已 `clearInterval(timer)` 并置 `null`。**无内存泄漏。**

顺带全仓扫描定时器卫生，发现**不一致但影响有限**的情况：

| 位置 | 类型 | 存 handle | onUnmounted 清理 | 评估 |
|------|------|----------|-----------------|------|
| `Statusbar.vue:21` | setInterval | ✓ | **✓** | 正确范式 |
| `ShopListView.vue:71` | setTimeout | ✓ | **✓** | 正确范式 |
| `HomeView.vue:53` | setTimeout | ✓ | ✗ | 见 m1 |
| `ServiceView.vue:41` | setTimeout | ✗ | ✗ | 见 m1 |
| `ShopView.vue:61` | setTimeout | ✗ | ✗ | 见 m1 |
| `OrdersView.vue:37` | setTimeout | ✗ | ✗ | 见 m1 |

**须澄清（不夸大）**：后四处均为 **≤2 秒的一次性 `setTimeout`**，会自然到期，**不构成内存泄漏**。真实影响仅为：① 卸载后仍向已销毁组件的 ref 写值（Vue 静默容忍，不报错）；② 未存 handle 的三处在连点时无法互相取消，toast 计时会竞态早消。定级 Minor。

### 5.2 ShopListView 筛选/排序是否与 `?cat=` 及排序 tab 冲突 —— **`?cat=` 无风险 ✓ / 排序 tab 有冲突 ✗**

- **与 `?cat=`：无冲突 ✓**。`:15` `baseList` 先按 cat 过滤，`:42-59` `list` 在其之上再做 chip 处理，单向组合、语义清晰，不会互相覆盖。设计正确。
- **与旧排序 tab：状态冲突 ✗**。`:103-107` 静态死 HTML，「综合排序」永久高亮，与 chip 行同名项状态不同步。详见 **M3**。

### 5.3 pay-bar 动效是否影响 `z-index:11` 压 TabBar 的既有行为 / 是否遮挡弹层 —— **无风险 ✓**

- P1-7 只追加了 `animation` / `transition` 声明（`style.css:660、667-668、671`），**未改动 `.pay-bar` 的 `z-index` 与 `bottom`**（基础规则仍在 `:533`，且 `:659` 注释明确写了「不改 z-index/bottom」）。压 TabBar 行为不变 ✓
- **关键正确点**：`pay-bar-up` keyframes（`:662-663`）在 `from`/`to` 里都保留了 `translateX(-50%)`。若遗漏，动画会覆盖 `.pay-bar` 基础规则的居中 transform，导致结算栏动画期间**横向跳到右半屏**。这个坑绕过去了 ✓
- **层叠栈完整核查，无遮挡**：

```
.cart-bar        9
.tabbar / .quick-replies   10
.pay-bar / .im-input       11   ← 覆盖 TabBar（规格允许）
.wk-mark         50
.sheet-overlay   100
.sheet-panel     101            ← 抽屉选择器在 pay-bar 之上 ✓
.ph-toast        200
PushNotifier     1000 (Teleport to body)  ← 最高 ✓
```
pay-bar(11) **低于** 抽屉(100/101)、Toast(200)、推送(1000)，**不会遮挡任何弹层** ✓。`MapTrack`/`DramaChat`/`PushNotifier` 均未被本次改动触及。

*低置信观察（需真机/截图确认，未判缺陷）*：`/service` 页 `.im-input`(z11, bottom:0) 覆盖 `.tabbar`(z10, bottom:0)，但两者高度分别约 50px 与 56px+安全区，理论上 TabBar 底部可能露出数像素。静态代码无法确证，建议 P2 走查时截图核对。

### 5.4 ShopCard 新增 CTA 是否与整卡点击产生冒泡冲突 —— **无风险 ✓**

`ShopCard.vue:14` 整卡 `@click="go"`，`:37` CTA `@click.stop="go"`。**`.stop` 修饰符已正确阻断冒泡**，点 CTA 只触发一次 `router.push`，**不会双跳转**。

*观察（非缺陷）*：CTA 文案为「领券」，实际行为是进店（与点整卡完全相同），无发券动作。规格 §1.5 原文允许「如"领券"/"选购"」且未要求独立券流程，故不判问题，但文案与行为的轻微不符建议 P2 统一（改文案为「选购」或补券逻辑）。

---

## 6. 红线合规检查结果（规格 §5）

| # | 红线条款 | 检查方法 | 结论 |
|---|---------|---------|------|
| 1 | 胡闹内核内容（台词/人设/成就名） | 通读 P1 各视图文案 | **合规 ✓** 新增文案（「地址由锡哥随机分配」「戏票红包已自动领取」「老板们都想赚这几块钱」「本单戏票不支持报销」等）均保持戏精调性，未稀释内核 |
| 2 | `sliceDrama` 引擎逻辑不动 | `git diff e1ad096~1 0a8cdca -- src/engine/` | **合规 ✓ 零改动** |
| 3 | 纯点击原则（不引入自由文本输入） | 全仓 `<input>` / `<textarea>` / `contenteditable` 检索 | **合规 ✓** 详见下方专项 |
| 4 | `runForbiddenCheck` 红线门控不动 | `git diff … -- src/core/` | **合规 ✓ 零改动** |
| 5 | 品牌锚色点缀策略 | 全仓 `--brand-*` 使用点审查 | **合规 ✓** 详见下方专项 |
| 6 | 核心数据模型字段语义不动 | `git diff … -- src/store/ src/data/` | **合规 ✓** 详见下方专项 |

**附加**：`DramaChat.vue` / `MapTrack.vue` / `PushNotifier.vue` 三个组件在 `e1ad096~1 → 0a8cdca` 全区间内 **零改动** ✓

### 6.1 纯点击原则专项（重点检查项）

全仓 `<input>` 仅 **2 处**，`<textarea>` / `contenteditable` **0 处**：

| 位置 | 代码 | 是否唤起键盘 | 判定 |
|------|------|------------|------|
| `HomeView.vue:83` | `<input placeholder="肯德基" readonly @click="goSearch" />` | **否**（`readonly`） | 合规 ✓ |
| `ShopListView.vue:87` | `<input placeholder="烧烤 / 饺子 / 粥 ..." />` | **是**（无 readonly） | **不判违规**，理由见下 |

**关于 `ShopListView.vue:87`**：
1. 该 input 属**全局搜索框**，按主理人明示，是 BRAND.md 既有允许项，**不算红线违规**；
2. `git log -L 82,92:src/views/ShopListView.vue` 追溯确认，此代码来自 **`a6a1e35`（Route B 核心循环落地）**，**远早于 P1，非本次 P1 引入**；
3. 但仍须指出两点客观事实：① 同为搜索框，HomeView 那处加了 `readonly` 做键盘抑制，此处没有，**两处范式不一致**；② 此处 input **无 `v-model`、无 `@click`、无任何 handler**，旁边的「搜索」按钮（`:88`）**也无 `@click`** —— 整个搜索栏是**完全无交互的死 UI**（HomeView 那处至少会跳 `/shops`）。

→ 归为 **m5（Minor，既有问题）**，不计入 P1 红线违规。

**P1 新增交互的纯点击守法情况（全部合规 ✓）**：
- P1-2 定位行 → `<div>` + Toast
- P1-3 筛选 chip / 红包横幅 → `<button>` / `<div>`
- P1-4 IM 输入栏 → **`<div class="ii-box">输入消息…</div>`**（`ServiceView.vue:125`），刻意用 div 伪装输入框，视觉像美团、零键盘 —— **这是本次 P1 守红线守得最漂亮的一处**
- P1-5 加购 → `<button>`
- P1-7 结算 → `<button>`

### 6.2 品牌锚色专项

`--brand-green` / `--brand-orange` / `--brand-purple` 全部使用点审查结果：

| 用途类别 | 位置 | 合规性 |
|---------|------|-------|
| Logo 角标 | `style.css:274` `.wk-mark` (green) | ✓ 允许 |
| 成就徽章 | `:239` `.achv-card .ic::after` (green) | ✓ 允许 |
| 戏精水印/演出 | `:250` `.story-watermark`(orange)、`:268` `.timeline .who`(orange)、`:289` `.feed-branch`(green)、`DramaChat.vue:262`(green)、`DramaTimeline.vue:103`(orange) | ✓ 允许 |
| 品牌页面 | `:294` `.profile-hero`、`:304` `.about .logo` (green) | ✓ 允许 |
| **无障碍焦点环** | `:331`(全局既有)、**`:649` `.fc-chip:focus-visible`**、**`:657` `.card-cta:focus-visible`**、`OrderView.vue:438` (orange) | ✓ 允许 |

**P1 新增的两处品牌色用法（`:649`、`:657`）均为 `:focus-visible` 焦点环**，沿用 `:331` 既有全局无障碍范式，**未用作功能填充色**。

**关键验证**：P1 新增控件的功能色**全部正确使用美团黄** —— chip 选中态 `:648` `background: var(--mt-yellow)`、CTA `:655` `background: var(--mt-yellow)`、加购按钮 `:460` `var(--mt-yellow)`；价格红 `:457` `var(--mt-price)`。**未发生「用品牌橙替代美团黄」的偏色**。→ **合规 ✓**

`--brand-purple` 当前**零使用**（仅在 `:33` 定义），非违规，记录备查。

### 6.3 核心数据模型专项

P1 区间内数据层改动仅 3 处，**全部为「扩展可选字段」，符合 §5 第 6 条「仅允许扩展可选字段」**：

| 文件 | 改动 | 合规性 |
|------|------|-------|
| `shops.ts:23` | 新增 `flash?: boolean` | ✓ 可选字段，规格 §6 明确列举允许 |
| `shops.ts:25` | 新增 `cat?: string` | ✓ 可选字段，规格 §6 明确列举允许 |
| `dishes.ts:12-16` | 新增 `category?` / `originalPrice?` / `tags?` | ✓ 可选字段，规格 §6 明确列举允许 |
| `memory.ts:34-35` | 新增 `items?: {...}[]`，注释「扩展可选字段，不改变既有字段语义」 | ✓ 可选字段，且同步补了 29 行测试（memory.test.ts M10） |

**无任何既有字段被改名、改类型或改语义** ✓

---

## 7. 缺陷清单

### Blocker（0 条 · 本报告口径）

**无。** 无崩溃、无构建/类型/测试阻断、无红线违规、无数据损坏。

> **口径说明**：本报告将 Blocker 定义为「阻断构建/测试/发布，或违反红线，或导致数据损坏」。并行的 `docs/reviews/P1-CODE-REVIEW-2026-07-31.md` 采用「阻断 P1 承诺交付项的验收」口径，故将 M1、M2 判为 Blocker。**两者事实认定完全一致，仅严重度标尺不同。** 详见 §9。

### Major（6 条）

---

**M1 · P1-5 菜品月售分支恒为 false，8 道菜的真实月售数据无法进入指定展示位**

- **现象**：`tags.includes('月售')` 是精确相等匹配，而实际 tag 值是 `'月售28'`、`'月售100+'` 等，**恒不命中**（实测命中 0/30）。`'人觉'` 分支同样恒 false（数据中根本不存在该类 tag）。结果：8 道带真实月售数据的菜品，专属月售行渲染 **0 次**；22 道**无**数据的菜品反而通过 fallback 显示 `monthSales()` 合成的假月售 —— **逻辑倒置**。
- **位置**：`src/views/ShopView.vue:191`、`:192`
- **影响**：规格 P1-5「月售」子要求实质未达成。缓解：`月售28` 文字仍会被 `:195-197` 的 `dish-tags` 渲染为促销色标签，用户看得见，但落在错误的视觉槽位（促销标签 vs 月售元信息）。故非 Blocker。
- **建议修法**：
  ```
  :191  v-if="d.tags?.some(t => t.startsWith('月售'))"
        {{ d.tags.find(t => t.startsWith('月售')) }}
  :192  删除恒 false 的 '人觉' 分支，或补充对应数据
  :193  改为 v-else 兜底，避免「有 tags 但无月售 tag」的菜品两头落空
  ```
  **同文件 `:51` 的 `popular` 已用正确写法 `d.tags?.some(t => t.includes('月售'))`，可直接对齐。**

---

**M2 · P1-5 折扣角标单位错误，5 道菜显示「低至67折」等错误文案**

- **现象**：`Math.round(price / originalPrice * 100)` 输出百分数，但后缀是中文「折」（十分制）。实测可见：羊肉串「低至67折」、烤茄子「低至75折」、烤鸡翅「低至67折」、香菜冰淇淋「低至75折」、榴莲披萨「低至74折」。正确应为 6.7折 / 7.5折 / 6.7折 / 7.5折 / 7.4折。
- **位置**：`src/views/ShopView.vue:201`
- **影响**：面向用户的价格文案错误，与「保真美团」目标直接冲突（美团显示「6.7折」）。5 道菜实际可见。
- **建议修法**：`(d.price / d.originalPrice * 10).toFixed(1)`，并去掉 `.0` 尾缀（如 7.5折 / 7折）。建议同时抽成纯函数 `discountLabel()` 以便加测（见 T1-2）。

---

**M3 · P1-3 新增筛选 chip 与旧静态排序 tab 状态互相矛盾**

- **现象**：`:103-107` 是一段**无任何事件绑定的静态 HTML**，「综合排序」被硬编码为永久红色高亮；而其下方 chip 行含同名的「销量优先」「距离最近」。用户点 chip「销量优先」后列表确实重排，但上方 tab 仍显示「综合排序」选中 —— 两个控件对同一状态给出**矛盾显示**。经 git diff 核对，P1-3 只新增 chip 与横幅，**完全未处理这段旧 tab**。
- **位置**：`src/views/ShopListView.vue:103-107`
- **影响**：功能性重复 + 状态不一致，用户无法判断当前生效的排序。美团实际只有一套筛选控件，此处的双套控件本身就偏离保真目标。
- **建议修法**：二选一 —— ① **删除** `:103-107` 静态 tab，只保留 chip 行（推荐，最贴美团且改动最小）；② 将 tab 接到 `activeFilter`，与 chip 共享同一状态源，并从 chip 行移除重复的销量/距离项。

---

**M4 · P1-3 两个筛选 chip 无实际筛选力（一个恒空、一个 no-op）**

- **现象**（对 SHOPS 实测）：
  - 「**免配送费**」判据 `s.deliveryFee === 0` → 命中 **0/5**（数据中 deliveryFee 为 3/2/2/4/3，**无任何 0 值**）→ 点击后**永远空结果**。
  - 「**满减优惠**」判据 `s.promo.includes('减')` → 命中 **5/5**，与「全部」结果**完全相同** → 点了等于没点（no-op）。
- **位置**：`src/views/ShopListView.vue:46`（满减）、`:48`（免配送费）；数据侧 `src/data/shops.ts:71,88,104,119,135`
- **影响**：6 个 chip 里 2 个是无效承诺，占 1/3。缓解：两者均有定制空态文案兜底（`:22`、`:25` → `:124` 渲染），不会白屏，作者应有察觉；但在保真类需求里「点了永远没结果」仍是坏掉的可用性契约。
- **建议修法**：① 给 1–2 家店补 `deliveryFee: 0`（属允许的数据扩展，且能顺带丰富「免配送费」的美团感）；② 「满减优惠」改判据使其有区分度（如满减门槛 ≤30 元），或直接移除该 chip。**修完建议同步加 T1-1 测试守住「每个 chip 命中 ≥1」。**

---

**M5 · 原生 `alert()` 严重破坏美团保真度**

- **现象**：项目已有统一 Toast 组件（`.ph-toast`，`style.css:480`）并在 HomeView/ShopListView/ShopView/OrdersView 广泛使用，但仍有 3 处调用浏览器原生 `alert()`。原生弹窗带浏览器域名标题栏、系统字体、阻塞主线程，是**最强烈的「出戏」信号** —— 与规格「operation = identity，用户一操作就感知到这是美团」的核心目标直接冲突。
- **位置**：`src/views/OrderView.vue:117`（开发票）、`src/views/ServiceView.vue:51`（复制电话）、`src/views/SettingsView.vue:10`（清空数据，P1 范围外，一并列出）
- **影响**：下单页点「开发票」、客服页点「电话/复制」这两条都是**高频保真路径**，一弹原生框，前面所有像素级打磨的观感瞬间归零。
- **建议修法**：全部替换为既有 `showToast()`。`ServiceView` / `OrderView` 中引入与 `ShopListView.vue:68-77` 相同的 toast 范式（含 `onUnmounted` 清理），可与 m1 一并修复。

---

---

**M6 · `memory.ts` 中 5 处 `JSON.parse` 无异常保护，脏 localStorage 会导致订单页/客服页整页白屏**

> **来源声明**：本条为并行代码评审（`docs/reviews/P1-CODE-REVIEW-2026-07-31.md` M-5）首先提出，**是本次验收自身的漏项**。我已独立复核源码确认属实，并在其基础上修正了两处细节（见下）。

- **现象**：`src/store/memory.ts` 中同一个类，`readShop:77-81` 与 `readRider:88-93` **有** `try/catch` 兜底，但另外 **5 处** `JSON.parse` **没有**：
  - `:102` `readGlobal`
  - `:170` `unlockAchievements`
  - `:183` `getAchievements`
  - `:192` `recordOrderHistory`
  - `:198` `getOrderHistory`

  **修正 1**：并行评审列为「4 处」，实测为 **5 处** —— 其遗漏了 `:192` `recordOrderHistory`（写入路径，同样会在读取旧数据时抛错）。
- **触发路径**：`getOrderHistory()` 在 **`ServiceView.vue:6`** 与 **`OrdersView.vue:9`** 的 **setup 顶层同步调用**（我已在 P1-4 验收中读到 `ServiceView.vue:6` 的 `const history = memory.getOrderHistory()`）。只要 `waimai:history` 内容损坏（手动改、旧格式残留、写入中途页面被杀、配额溢出截断），异常将在 setup 阶段冒泡 → 组件渲染失败 → **白屏，且无自恢复路径**。
- **与 P1 的关系（修正 2 · 本报告补充的定性）**：这是**既有潜在缺陷**，非 P1 新引入。但 **P1-4 把客服页改造成 IM 页时新增了 `memory.getOrderHistory()` 的 setup 顶层调用，使受影响页面从 1 个（订单页）扩大到 2 个（订单页 + 客服页）**。即 **P1 扩大了该缺陷的爆炸半径**，因此纳入本次验收缺陷清单是恰当的。
- **影响**：全部已发现问题中**唯一可能导致页面完全不可用**的一条。但需如实说明：**触发需要 localStorage 已损坏，非正常路径**，属健壮性缺口而非常规功能缺陷，故定 Major 而非 Blocker。
- **建议修法**：抽私有助手统一收口，把已有的 `try/catch` 范式补齐到全部 7 处读取点：
  ```ts
  private readJSON<T>(key: string, fallback: T): T {
    const raw = this.store.getItem(key)
    if (!raw) return fallback
    try { return JSON.parse(raw) as T } catch { return fallback }
  }
  ```
  **补测（强烈建议同批做）**：`memory.test.ts` 加一条「注入损坏 JSON 时降级到默认值且不抛错」。`MemStore` 已支持注入，成本极低，且这是**唯一一条能被现有纯逻辑测试体系直接覆盖的缺陷** —— 见 §4.4 的测试盲区讨论。

---

### Minor（5 条）

---

**m1 · 4 处一次性 `setTimeout` 未在 `onUnmounted` 清理，其中 3 处连 handle 都未保存**

- **位置**：`HomeView.vue:53`（存了 handle，未清理）、`ServiceView.vue:41`、`ShopView.vue:61`、`OrdersView.vue:37`（三者均未存 handle）
- **影响**：**须澄清 —— 不是内存泄漏**。均为 ≤2s 一次性定时器，会自然到期。真实影响：① 卸载后仍向已销毁组件 ref 写值（Vue 静默容忍，不报错、不崩溃）；② 未存 handle 的 3 处在快速连点时无法互相取消，toast 计时竞态、提示会提前消失。
- **建议修法**：统一对齐 `ShopListView.vue:66-77` 的范式（存 handle + `clearTimeout` + `onUnmounted` 清理）。`Statusbar.vue:26-31` 是 interval 版正确范式。

---

**m2 · P1-4 客服订单卡「共1件」为硬编码，未使用已有的真实件数**

- **位置**：`src/views/ServiceView.vue:74` —— `{{ lastOrder.shopName }} · 共1件`
- **影响**：`memory.ts:34-35` 已扩展 `items[]`（含 `qty`），且测试 M10（`memory.test.ts`）明确验证过「items 原样保留，Σqty 可算」—— 数据链路完备，此处却写死 1。用户下 3 件商品后进客服页仍显示「共1件」，信息错误。
- **建议修法**：`共{{ lastOrder.items?.reduce((a,i) => a + i.qty, 0) ?? 1 }}件`

---

**m3 · P1-1 神抢手未复用 ShopCard，另建 `.flash-card`**

- **位置**：`src/views/HomeView.vue:105-112`；`style.css:404-407`
- **影响**：规格 P1-1 原文为「复用 ShopCard miniature 样式」，实现是独立的 140px 卡片。当前视觉成立、功能正常，但后续 ShopCard 改版时两套卡片样式会漂移。属实现选择偏差，非功能缺陷。
- **建议修法**：不急于改。若 P2 要做卡片体系统一，再把 `.flash-card` 收敛为 ShopCard 的 `variant="mini"`。

---

**m4 · `PhoneFrame` 的 `showTab` / `showStatus` prop 是未接线的死代码**

- **位置**：`src/components/PhoneFrame.vue:5-8`（定义并 `v-if` 消费）；唯一调用方 `src/App.vue:6` `<PhoneFrame>` **未传任何 prop**；`src/router/index.ts` 无 `meta.hideTab`
- **影响**：两个 prop 恒为默认 `true`，从未被驱动。**功能上无害** —— P1-8 走的是规格允许的 `.pay-bar z-index:11` 覆盖方案，验收已 PASS。但留着一个「看起来能隐藏 TabBar 实际没接线」的接口，会误导后续维护者。
- **建议修法**：二选一 —— ① 接线：router 加 `meta:{hideTab:true}`，App.vue 传 `:show-tab="!$route.meta.hideTab"`（规格 §6 首选方案）；② 删除未使用的 prop，在注释里写明「/order 靠 pay-bar z-index:11 覆盖」。

---

**m5 · `/shops` 搜索栏完全无交互（既有问题，非 P1 引入）**

- **位置**：`src/views/ShopListView.vue:87`（input 无 `readonly`、无 handler）、`:88`（「搜索」按钮无 `@click`）
- **溯源**：`git log -L 82,92` 确认来自 **`a6a1e35`**，**远早于 P1**。
- **影响**：① 整个搜索栏是死 UI，点按钮无任何反应（HomeView 同类控件至少会跳 `/shops`）；② 该 input 无 `readonly`，在移动端**会唤起软键盘**。按主理人明示，全局搜索框属 BRAND.md 既有允许项，**不判红线违规**；但与 HomeView `:83` 的 `readonly` 写法**范式不一致**。
- **建议修法**：对齐 HomeView —— 加 `readonly`，`input` 与按钮均绑 `@click` 打开预设热门词 chip 选择器（保持纯点击）。

---

### 观察项（不计缺陷，供 P2 参考）

- **o1 · P1-7 价格跳动当前不可达**：`priceBumpKey` + `watch(finalPay)` + `:key` 机制**完全正确**，但 `/order` 页无任何控件能改变 `finalPay`（购物车只读，选券交互属 P0-4 尚未实现），故 `watch` 永不触发。属**休眠功能**，等 P0-4 补上选券后自动生效，**无需返工**。
- **o2 · 金刚区 8/10 分类点进去是空列表**：实测各类命中数 —— 美食 2、家常菜 3，其余 8 类（甜点饮品/超市便利/蔬菜水果/看病买药/夜宵/拼好饭/跑腿/天天津贴）**均为 0**。有兜底文案不白屏，且属 P0-2 数据面而非 P1 项，故仅记录。P2 若要提升首屏可信度，建议给 SHOPS 补 `cat` 分布或收敛金刚区为「有货」的 4–5 类。
- **o3 · ShopCard CTA 文案「领券」与行为（进店）不符**：规格 §1.5 允许「领券/选购」文案且未要求独立券流程，不判问题。建议 P2 统一为「选购」或补真实券逻辑。
- **o4 · `.qa-tmp/` 残留 4 个 2026-07-26 历史文件**：已在 `.gitignore` 中，按要求仅记录未删除，交主理人处置。
- **o5 · `package.json` 声明了 `vant: ^4.9.0` 依赖但全仓零 import**：与「自定义 UI（无 Vant）」的技术栈声明不符，属无用依赖，建议 P2 清理以减小依赖面。

---

## 8. 验收签字意见

### 结论：**有条件放行 · 建议先清 Major 再进 P2**

**判定：`CONCERNS`（非 FAIL，非无条件 PASS）**

**放行理由（为什么不是 FAIL）**：
1. **八项全部真实落地，无一空壳。** 逐项追到了 DOM 结构、CSS 实体、事件绑定与数据源，最容易造假的 P1-1 神抢手（依赖 `flash` 标记）实测有 2 家店命中、区块真实渲染；最容易偷懒的 P1-4 IM 页做出了完整交互闭环。
2. **三条硬门槛全绿**：类型 0 错、测试 61/61、构建成功，且**构建产物与仓库 dist 字节一致**（可复现）。
3. **红线零违规**：引擎 / 门控 / DramaChat / MapTrack / PushNotifier **零改动**；数据层 4 处改动全部是「扩展可选字段」；品牌锚色未越界；纯点击原则守住（IM 输入栏用 div 伪装是加分项）。
4. **主理人点名的 4 项回归风险，3 项完全无风险**（Statusbar 已清理定时器、pay-bar 层叠正确且不遮弹层、CTA `.stop` 不双跳转），仅第 2 项的旧排序 tab 有状态冲突。

**必须先解决的阻塞项（进 P2 前）—— 3 条**：

| 优先级 | 缺陷 | 理由 | 预估改动量 |
|-------|------|------|-----------|
| **P0** | **M2** 折扣角标「低至67折」 | 面向用户的**错误文案**，5 道菜可见，一眼假，与保真目标正面冲突 | 1 行 |
| **P0** | **M5** 原生 `alert()` × 3 | **最强出戏信号**，位于下单/客服两条高频保真路径，一弹框前面所有打磨归零 | 3 处替换为既有 showToast |
| **P1** | **M3** 排序 tab 与 chip 状态矛盾 | 用户无法判断当前排序，且双套控件本身偏离美团范式 | 删 5 行 或 接 1 个状态 |

**建议同批解决（成本极低，不单独设卡）**：
- **M1** 月售死分支 —— 同文件 `:51` 已有正确写法可直接对齐，约 3 行。
- **M4** 失效 chip —— 给 1–2 家店补 `deliveryFee: 0` 即可（顺带增强美团感），约 2 行数据。

**可延后至 P2/P3**：m1（定时器卫生）、m2（硬编码件数）、m3（卡片复用）、m4（死 prop）、m5（既有搜索栏）、o1–o5 全部观察项。

**质量门附加建议（强烈推荐立即执行，0 成本）**：

当前三项检查皆绿，**具备直接固化为提交门禁的条件**：
```
npm test && npx vue-tsc --noEmit && npx vite build
```
但必须清醒认识到：**这道门禁目前对 UI 层零防护力** —— 本报告 5 个 Major 缺陷全部活跃的同时，61 个测试全绿。因此建议**至少落地 Tier 1 的 3 个纯函数测试**（T1-1/T1-2/T1-3，无需引入任何新依赖），把「chip 必须能筛到店」「月售必须取得到」「折扣必须在 1–9.9 折区间」「flash 必须有店」这四条固化成机器可验的契约。**否则 P2 一改，本次查出的问题会原样复发，而且照样全绿。**

---

**关于「信任但核实」的最终答复**：

主理人用 grep 抽查得出的「P1 全部完成」—— **结论方向正确，判定强度不足**。

grep 能证明「代码写了」，本次逐行 + 数据求值验收进一步证明了「结构和绑定也是真的」。但 grep 无法发现三类问题，而这三类恰好构成了本次全部 5 个 Major：

1. **条件恒不成立**（M1：`includes('月售')` 对 `'月售28'` 永远 false）——「代码在，逻辑死」；
2. **数据侧穿透为空**（M4：`deliveryFee===0` 命中 0 家）——「功能在，数据空」；
3. **新旧控件并存打架**（M3：静态排序 tab vs 新 chip）——「新的对，旧的没删」。

这正是「grep 抽查」与「工程验收」之间的差值，也是本次任务的价值所在。

---

**签字**：严守真 · quality-lead
**日期**：2026-07-31
**质量门性质**：advisory（建议性门控）—— 本报告给出判定，**最终是否放行由主理人决定**。
**验收范围声明**：本次为**静态代码验收 + 数据求值 + 三项动态检查**。未执行真机/浏览器视觉走查，故所有视觉呈现类结论（如 §5.3 中 `/service` 页 TabBar 是否露出）均已标注置信度，建议 P2 阶段补一轮 UI 截图走查。
**利益声明**：本次验收未修改任何 `src/` 代码，未执行 git commit / push，除本报告外未新建或改动任何项目文件。
