# 胡闹外卖 v2 · 项目现状合并审计报告（主理人汇编）

> **评估人**：游承峰（工作室主理人）｜**日期**：2026-07-25
> **方法**：Phase 0 主理人诊断 → 建团队 → 5 位专家并行审计（设计/工程/质量/美术/发布）→ 主理人汇编
> **评审强度**：lean / solo（1 人项目，Vercel 海外部署，纯广告，无固定工期）
> **范围**：`whoknow.me` 宇宙，旗舰产品 `whoknow-waimai` v2 重建前现状

---

## 0. 一句话定位

**设计文档 A+，落地执行 0 分，红线当前漏网。**

项目处在「七阶段流水线」的 **Phase 4 预制作前夜**——设计/契约/品牌规范极其完备且经三司会审收敛，但 `whoknow-waimai/src` 一行重建代码都没写（v1 已归档），而**发布唯一 0 容忍闸门（禁忌词红线）实测 FAIL**。这不是「设计没写对」，是「写满了、但既不能落地、还漏着红灯」。

---

## 1. 专家裁决汇总

| 专家 | 维度 | 裁决 | 一句话 |
|---|---|---|---|
| `design-auditor` 文策渊 | 设计一致性 / 过度设计 | 🔶 **CONCERNS** | 骨架健全，但 5 项 P0 跨文档冲突 + 1 项核心乐趣缺口须先清 |
| `eng-auditor` 程基岩 | 技术就绪度 / 重建范围 | 🔶 **CONCERNS** | 方向已就绪，但 4 个「设计已定、工程未决」空白点会致返工 |
| `quality-auditor` 严守真 | 禁忌词红线 / QA 就绪 | 🔴 **FAIL** | spec 假洗 + 原型泄漏真实品牌，29 处命中，红线闸门不过 |
| `art-auditor` 林绘澄 | 视觉识别 / 截图传播 | 🔶 **CONCERNS** | 策略自洽，但原型是「11 分美团皮 + 0 分锚色」，无障碍 3 项回归 |
| `release-auditor` 路远行 | M1 发布就绪度 | 🔶 **CONCERNS** | 本地 seed 独立上线路径成立，但 4 个可清除硬阻塞未解 |
| **主理人总裁** | **整体** | **🔶 CONCERNS（含 1 个 FAIL 子闸门）** | **设计满分、落地零分、红线漏网——先清 FAIL 再谈 M1** |

> **关键判读**：5 份里 4 份 CONCERNS、1 份 FAIL。CONCERNS 都属「可闭环的文档/资产缺口」，不阻塞方向；但 **quality 的 FAIL 是发布硬闸门**，必须在任何代码落地前清零。

---

## 2. 合并后的 P0 阻塞项（去重 · 按致命度）

### 🔴 P0-A · 禁忌词红线漏网（质量 FAIL · 必须最先清零）
实测工作树（非 archive/）**29 处命中**：
- **硬红灯内容词 15 处**：`DRAMA-ENGINE-V2.md` 12 行仍含「医院 / hosp / hosp_survivor / rare_dish_survivor」等（§5.1 枚举、§8 成就表、§5 参数表），且第 437 行谎称「红线已洗…绝不上线」→ **spec 级假洗**；`prototype/terms.html:40` 用户可见「不要去医院」。
- **真实品牌用户可见 14 处**（违反 GDD §12）：`prototype/` 全量渲染真实「美团」品牌，含 `order.html:70` 的**真实银行卡尾号 1288** → 侵权灰区；`meituan.css` 文件名即美团。
- **已确认干净（正面证据）**：✅ `DRAMA-SEED-v1.json`（ship 级真洗）、✅ `data/home.json`、✅ 工作树无 `whoknow-waimai/src|data|public`（旧 app 已归档）。
- **归档残留 P1**：`archive/v1-waimai-app` 旧活数据（config/quotes/dishes.json、DEVELOPER.md、PRODUCT-V3.md）仍含 公厕/百慕大/ICU/炸弹/诈尸/吃死你 → 三司总审计 v2 点名的「实际清洗活数据」行动未执行。

**为何致命**：GDD §11 第 1 条与 §9.7 `forbidden_check` 均定红线为**唯一 0 容忍发布闸门**。当前状态 = 闸门 FAIL。

### 🔶 P0-B · 跨文档字段二义（设计 + 工程共同 P0）
M1 写 DRAMA 解释器 / 渲染层前**必须先对齐**，否则按冲突文档编码必返工。以 `DATA-STRUCTURE-v1` 为唯一权威：
1. `mood`（GDD §9.4）vs `moodDelta`（DATA/SEED）→ 渲染层若只读 `moodDelta` 会静默丢 mood、断因果链。
2. `speaker`（SEED / DRAMA §6.4）vs `actor`（DATA §3.3，且含 `kitchen`）→ 渲染层不知谁说话。
3. 分支目录 **6 ≠ 7**：GDD §9.4 列 6 条，SEED/DATA/DRAMA 为 7 条（缺 `cheap_no_rider`/`fate_reunion`/`blacklist_reunion`）。
4. `flag()` 语法冲突：逗号双参 `flag(dark_survivor, s001)` vs 花括号单参 `flag(married_{riderId})` → 解析器只能吃一种。
5. flag 命名 `dark_survivor_*`（GDD/SEED）vs `dark_dish_*`（DATA §5.2）。
6. chain 节点：`id`+`next:string[]`+`nextWeights`（SEED）vs `next:string|null` 且无 `id`（DATA）。

### 🔶 P0-C · M1 落地前置物缺失（发布 + 工程 P0）
- **完整信封种子 `latest-config.json` 缺失**：仓库仅有 `DRAMA-SEED-v1`（branches 子数组），缺含 `boss/rider/soul_layer/meta/forbidden_check/fallback` 的完整信封——这是 M1 用本地 seed 独立上线的**硬前提**（话术已合规，但 `forbidden_check.passed` 需锡哥手置）。
- **Vercel 构建接线断**：`vercel.json` 的 `buildCommand: npm run build` 指向**根目录不存在的 package.json**（仅 archive 有），`dist/` 不存在 → 构建必失败；waimai 产物如何落到 `dist/waimai/index.html` 未定义。
- **`forbidden_check` 客户端闸门未实现**（仅 spec 声明）→ 0 容忍红线无自动兜底。
- **水印诚实性**：总纲 §2 明令「不得暗示已自动化」，但 L1 文案「🧠 今日 AI 更新」在 seed 阶段（锡哥手编、非每日 AI）属虚假陈述 → 须改「🎭 锡哥精选段子」。

### 🔶 P0-D · 核心乐趣缺口（设计 P0）
`DRAMA-SEED-v1` 的 7 条分支**无一消费 `remarkTag`/`addressTag`**，而 P1/P4 与 fun hypothesis 的核心是「因你的备注/选择看到 NPC 跌宕反应」。当前种子只能按金额/次数/flag 反应 → **「写了备注 vs 没写」无差异 = P1/P4 未兑现**。M1 种子至少须补 2–3 条 `remarkTag`/`addressTag` 触发分支，否则跑通也验证不了核心乐趣。

### 🔶 P0-E · 视觉「前品牌」状态（美术 P0）
原型是「11 分美团皮 + 0 分锚色」：`meituan.css` 完全未 `@import` `design-tokens.css`，锚色（绿/橙/紫）近乎缺席（橙 #ff7849 **完全缺席**；Logo/戏精弹层/品牌按钮/徽章四处皆无锚色）→ 「一眼认出是 whoknow」未成立。叠加**无障碍 3 项回归**：`user-scalable=no` 锁缩放、`focus-visible` 全无、`prefers-reduced-motion` 全无、弱文字 #999 对比度不足。M1 严禁「先美团皮后补品牌」——令牌接入、锚色四点注入、无障碍清零、P6 两屏爆点接线须与逻辑同级列硬完成项。

---

## 3. 已知风险与缓解（SOP Phase 8）

| 风险 | 等级 | 缓解 |
|---|---|---|
| DRAMA spec 假洗，开发者按 spec 复制红灯词上线 | P0 | 洗 DRAMA-ENGINE-V2 早期章节/枚举/成就（医院→weird、hosp 家族退市），并删「已洗」假声明 |
| 原型泄漏真实美团 + 真实卡尾号 → 上线即侵权 | P0 | 原型去真名（改某团/平台）+ 删卡尾号；GDD §12 拦截须进重建清单 |
| 跨文档字段二义致解释器/渲染层返工 | P0 | 以 DATA-STRUCTURE v1 为唯一权威，强制 GDD/SEED/DRAMA 三处对齐，加 golden-file 契约测试 |
| 归档旧活数据红灯未清 | P1 | 执行三司总审计 v2 点名的「实际清洗」行动（archive/v1 旧数据洗稿） |
| M1 构建/部署接线断 | P0 | 补根 package.json + monorepo 构建路径 + vercel rewrites 例外（`/waimai/config/*` 先于 catch-all） |
| 核心乐趣（备注驱动）未验证 | P0 | SEED 补 remarkTag/addressTag 分支 |
| 无障碍回归（公开广告产品门槛） | P0 | M1 重建时清零缩放/焦点环/动效降级 |
| 全部 `[PLACEHOLDER]` 调参值未标定 | P2 | 等 M1 后用真机 playtest 标定（总纲行动项 C） |

---

## 4. 给主理人的结论与建议节奏

**整体不 FAIL（方向对、设计强、缺口可闭环），但被 quality 的红线 FAIL 卡住闸门。** 在 M1 写第一行 DRAMA 解释器之前，必须先做一轮「清场」：

1. **先清 P0-A（红线，最高优先）**：洗 DRAMA-ENGINE-V2 假洗章节 + 原型去美团真名/卡尾号 + 归档旧活数据洗稿。完成后重跑 quality 红线扫描，必须 `red_light_count === 0` 才算过闸门。
2. **再清 P0-B（字段权威）**：出一份 ADR，定 DATA-STRUCTURE v1 为唯一权威，修正 GDD §9.4 / SEED / DRAMA 三处，加 golden-file 契约测试。
3. **补 P0-C（落地前置）**：起草完整 `latest-config.json` 信封（锡哥手置 `forbidden_check`）+ 接通 Vercel 构建 + 实现客户端 `forbidden_check` 闸门 + 诚实水印。
4. **补 P0-D（乐趣）**：SEED 加 2–3 条 remarkTag/addressTag 分支。
5. **清 P0-E（视觉）**：重建首步接入令牌 + 锚色四点 + 无障碍清零。
6. **然后**按工程建议做 MVP 垂直切片：1 店 + 记忆引擎 + 四阶段 + 1 条 seed → 跑通「写备注→不同结局」「同店第 5 单 ≠ 第 1 单」；客服/Feed/零卡/图鉴/分享全部推迟 M2。

**发布节奏**：M1 软上线（本地 seed，守「红线 0 漏出 + 降级不崩 + 第 5 单≠第 1 单 + 3 秒爆点」）→ M1.5（brain M0 手动跑通，同信封无缝替换）→ M2（戏精深化 + 真机 playtest 笑率闸门，总纲行动项 C）。

---

## 5. 各专家完整报告路径
- 设计：`whoknow-waimai/docs/analysis/TEAM-DESIGN-2026-07-25.md`
- 工程：`whoknow-waimai/docs/analysis/TEAM-ENGINEERING-2026-07-25.md`
- 质量（红线）：`whoknow-waimai/docs/analysis/TEAM-QUALITY-2026-07-25.md`
- 美术：`whoknow-waimai/docs/analysis/TEAM-ART-2026-07-25.md`
- 发布：`whoknow-waimai/docs/analysis/TEAM-RELEASE-2026-07-25.md`

> _whoknow — 设计必须一眼认出是胡闹，红线必须一眼都不漏。_
