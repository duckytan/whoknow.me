# M1 × 原型图 整合分析（2026-07-25）

> 目标：以 `prototype/`（commit 6194643，12 页高保真 mock）的设计为皮肤，把 M1 游戏内核（DRAMA 引擎）填进去。
> 本文档只做整合分析 + 缺口清单 + 路线建议，不动代码。

---

## 一、两套资产的真实面貌

### 原型图（6194643）
- **12 页高保真静态 mock**：home / shoplist / shop / cart / checkout / order / orders / service / feed / achievements / privacy / terms。基于虚构外卖参考截图逐像素校准。
- **设计系统 `css/whoknow.css`**：
  - 浅色主题，主色 **胡闹黄 #FFD100 / 价格红 #FF4B10**（典型外卖皮）。
  - 角色色：暴躁 #FF4B10、佛系 #2BB14A、怪 #8B5CF6、懒 #3A7BFF、哲学 #1FB6A6、骑手 #FF8A00。
  - 完整移动端组件库：`.phone`(414px 手机框)、`.yellow-zone`、`.mt-nav`、`.cat-grid`(5×2 3D 圆标)、`.shop-card`、`.tabbar`、聊天气泡、进度时间线。
- **`config/latest-config.json` / `fallback.json`**：
  - `food.branches[]`：**7 条**（poor / cheap_no_rider / bankrupt_love / overeat_cares / odd_eats / fate_reunion / blacklist_reunion）。**无** remark/address tag 分支、**无** default 兜底。
  - `food.boss["s001-老王烧烤"].angry/gentle` 人格台词 + `food.rider["r001"]` 骑手台词。
  - `soul_layer`：NPC 人格（angry）、speech_style、forbidden_words。
  - `ui_meta`：`_watermark_note` = 禁用「🧠 今日 AI 更新」，须用「🎭 锡哥精选段子」。
- **隐含游戏内容**：5 老板人格、3 戏精骑手（雷速飞/李慢慢/张迷路）、成就墙、零卡路里调侃、胡闹式法律文案。

### M1 运行时（当前）
- **深色主题**（`--wk-bg:#0f0f12`，自写令牌），仅 **2 路由**（home / order）。
- **游戏内核完整**：DRAMA 引擎（**11 分支**，含 remark/address tag + default 兜底）、orderInput 播种、memory 记忆、forbiddenCheck 红线门控。
- **缺口**：
  - 视觉是深色极简，与原型浅色外卖皮**完全不沾边**。
  - 下单靠**手填 shopId / riderId**（原型是选店 + 选骑手）。
  - drama 用 4 个纯色块渲染，**没有**原型里的骑手气泡 / 进度时间线 / 送达彩蛋。

---

## 二、整合的四个维度与缺口

### 1. 主题 / 设计系统（最大缺口）
- 原型 = 浅色胡闹黄；M1 = 深色。**必须翻主题**。
- 动作：用 `whoknow.css` 令牌 + 组件类替换 M1 `style.css`；抽成共享 Vue 组件（PhoneFrame / YellowZone / ShopCard / TabBar / ChatBubble / Timeline）。

### 2. 页面覆盖（12 vs 2）
| 原型页 | 游戏内核接入点 | M1 现状 |
|---|---|---|
| home / shoplist / shop | 选店入口 | 仅 home 裸页，手填 shopId |
| checkout | 下单表单（备注/地址/人格提示） | OrderView 裸表单 |
| **order（订单详情）** | **drama 四阶段渲染（核心接入点）** | OrderView 色块渲染 |
| orders | 历史（memory） | 无 |
| feed（评价） | 过往 drama 作为评价 | 无 |
| achievements | 成就墙（分支 achievements 字段） | 无 |
| service（客服） | 老板对话（人格台词） | 无 |
| privacy / terms | 静态胡闹式法律 | 无 |

### 3. 数据 / 配置对齐（有冲突，先解决）
- ⚠️ **占位符不一致**：原型文案用 `{price}` / `{fee}`；M1 引擎只替换 `{orderTotal}` / `{deliveryFee}`。直接喂原型 config 会导致占位符**不替换、原样显示**。
  - 方案：以引擎变量名为准，把 config 文案改为 `{orderTotal}` / `{deliveryFee}`（或引擎加别名）。
- **分支集合**：M1(11) ⊃ 原型(7)。原型缺 remark/address tag 与 default。应取**并集**：保留 M1 11 条 + 把原型 boss/rider 人格台词作为 flavor 层接入。
- **soul_layer / ui_meta**：M1 完全没有。需补 NPC 人格 + 锡哥精选段子水印层。

### 4. 游戏内容层（原型有、M1 缺）
- **老板人格系统**：原型 5 人格 + 商店 persona 徽章；M1 引擎无 personality 维度。需给商店挂 personality，drama 渲染带人格语气（先内容层 flavor，深做需引擎扩展）。
- **成就系统**：原型成就墙 + 分支 `achievements` 字段（ID 已对齐：`poor_meal` / `cheap_ghost` / `bankrupt_legend`…）。M1 记忆**未追踪成就**。需 memory 记录解锁 → 成就墙页。
- **段子层**：🎭 锡哥精选段子 widget（首页 / 订单详情水印）。

---

## 三、还需要补充什么（清单）

- [ ] 设计令牌切换（深色 → 浅色胡闹黄）+ 组件库移植为共享 Vue 组件
- [ ] 占位符变量统一（`price`/`fee` ↔ `orderTotal`/`deliveryFee`）
- [ ] 分支并集合并（保留 M1 11 + 原型人格台词 flavor 层）
- [ ] 商店人格配置（personality 字段 + 徽章渲染）
- [ ] 成就追踪（memory 记录 achievements → 成就墙页）
- [ ] 段子 / 水印层（soul_layer + ui_meta）
- [ ] 页面重建：shop / shoplist / checkout / orders / feed / achievements / service + 静态 privacy / terms
- [ ] 核心接入：drama 输出渲染进 order 详情的骑手气泡 + 时间线
- [ ] 下单入口从「手填 shopId」改为「选店」

---

## 四、建议的分期路线（待拍板范围）

- **路线 A（忠实全套）**：12 页全重建 + 全部内容层。最贴合「套用原型图」，但工作量最大。
- **路线 B（核心循环优先）**：先翻主题 + 建 shop → checkout → order(drama 渲染) → orders 主链路 + 成就墙，其余页面后续。快速见到「原型皮 + 游戏核」。
- **路线 C（仅换皮）**：只把现有 2 页用原型设计系统重做，不动页面结构。最小改动，但内容层不补。

---

## 五、已知风险
- 占位符不匹配若不先修，换皮后 drama 台词会出现 `{price}` 原样。
- 原型 config 的 branches 缺 default 兜底，普通订单会无反应（M1 已修，合并时勿丢）。
- 浅色主题下 M1 现有深色组件样式需全量改写，非叠加。
