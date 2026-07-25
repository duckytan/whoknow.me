# 胡闹外卖 v2 · 技术就绪度与重建范围评估

> 评估人：eng-auditor（程基岩）｜日期：2026-07-25｜范围：M1 核心循环重建｜评审强度：lean/solo
> 依据：`胡闹宇宙总体设计方案 v3`、`GDD-v2-2.2`、`DATA-STRUCTURE-v1`、`DRAMA-ENGINE-V2`、`api-spec v2.2`、`DRAMA-SEED-v1`、`vercel.json`、`design-tokens.css`
> 已核实：`whoknow-waimai/` 当前**仅含 docs，无 `src`、无 `package.json`**，v1 已归档 → M1 为从零重建。

---

## 一、技术就绪度总判定 → **CONCERNS**

设计文档（总纲 + GDD + DATA-STRUCTURE + 引擎 + 契约）已相当完整，且 `DRAMA-SEED-v1` 7 条内置分支可直接喂 MVP。但存在 **4 个「设计已定、工程未决」的空白点**和 **多处跨文档字段不一致**，均集中在「算法/契约/部署」层——它们不阻止开工，但**若直接按当前冲突文档编码解析器/渲染层，必然返工**。故判定 **CONCERNS（带条件 PASS）**：补齐 4 项工程决策（ADR + 原型验证）后即可开工。

---

## 二、设计已定但工程未决的空白点

1. **DRAMA 条件串解释器算法**：DATA-STRUCTURE §3.7 只列了操作符（`> < >= <= = != ? ! & | ()` + `flag()/hasTag()`），但**未定义运算符优先级**（`&` 与 `|`、`!`/`?` 与比较符的关系）、**未定义 `{riderId}/{shopId}` 插值作用域**（引擎须在 parse 前用已知作用域替换，seed 用花括号、GDD §5.2 用字面量，二者都要兼容）、**未定义 `=`/`!=` 字符串 vs 数值比较语义**、**未定义 `[...]` 数组字面量解析**。需递归下降/调度场实现 + 高覆盖单测。

2. **DramaState 四阶段状态机编排**：仅叙事性描述了 accept/cook/deliver/complete，缺算法。核心歧义：**整单选 1 个分支（其 chain 跨阶段）还是每阶段各选？** seed 暗示「整单选一、chain 跨阶段」；**persona 台词池（boss 分级）如何与各阶段事件交织**未规定；DRAMA §三的「骰子判定事件」与 seed 的「脚本化 moodDelta/delay」两套因果机制如何合并未定义；**初始 `tags` 由 OrderInput 哪些字段播种**未指定（`hasTag(dark_dish)` 依赖此）。

3. **localStorage `UserStats` 读写/迁移/损坏**：DATA-STRUCTURE §5.3/§8.3 只概念性写了「损坏重置、低版本跑迁移、单键 <50KB」。缺具体策略：默认合并（保留已有计数、补齐缺失字段）的 merge 函数、JSON.parse 失败的 try/catch 回退、`schemaVersion` 迁移框架（v1 首发无迁移函数，但框架须建）、序列化体积兜底（超阈值裁剪策略）。

4. **config fetch + 4 级降级的客户端责任（静态化重译）**：api-spec 描述的是**服务端 API**（`GET /api/v1/food/config`、日期查询、ETag、health），但本作是**1 人无后端静态站**。须把「API」重译为静态 JSON 托管：`latest-config.json` 放哪、锡哥审核后如何重新部署、L2「昨日」如何用**版本化静态文件**（`config/archive/YYYY-MM-DD.json`）+ `fallback.json` 落地、4 级全在客户端实现、跨仓库 handoff（brain→码农虾→提交仓库→部署）流程未工程化。

---

## 三、重建风险清单（按严重度）

| 严重度 | 风险 | 工程影响 |
|---|---|---|
| **P0** | 跨文档字段不一致 | seed 用 `speaker`；DATA-STRUCTURE 用 `actor`（且枚举含 `kitchen`）；GDD §9.4 **两者皆无** → 渲染层不知谁说话。GDD §9.4 用 `mood` 而 seed/DATA 用 `moodDelta` → 若解析器只读 `moodDelta`，GDD 形分支静默丢 mood，因果链断。seed/DATA 链节点：`id` + `next:string[]` + `nextWeights`；DATA-STRUCTURE 写 `next:string\|null` 且**无 `id`** → 解析器须扩宽，否则 `next` 引用失效。**UserStats** 在 DRAMA §四与 DATA-STRUCTURE §5.1 字段不同（后者权威但前者易误读）。 |
| **P0** | 条件解析器复杂度 + 单测 | 见空白点 1；须覆盖优先级、插值、数组包含、flag/hasTag 解析。 |
| **P1** | Vant 主题覆盖 | `design-tokens.css` **无 `--van-*` 覆盖、无美团黄 token**（仅 brand-orange 作 CTA）。须新增美团黄并映射到 `--van-primary-color`，锚色留给戏精弹层；api-spec 提过「Vant 跨 chunk 坑」——按需组件 CSS 落在异步 chunk，须在 `main.ts` 入口（非懒加载）先导入 `vant-theme.css` 且用 `:root`/`[data-theme]` 作用域压过默认蓝，否则闪蓝。 |
| **P1** | Vercel monorepo 路由 + config 静态托管 | `vercel.json` outputDirectory=`dist`、rewrites 把 `/waimai/(.*)`→`index.html`。**SPA catch-all 会劫持 `/waimai/config/*.json` → 返回 HTML，断 fetch**。须加 `/waimai/config/(.*)`→`/waimai/config/$1` 例外规则置于 catch-all 前。另：monorepo 构建产物落到 `dist/waimai/` 还是设 `rootDirectory=whoknow-waimai` 未定，二者与 rewrites 互斥，须先拍板。 |
| **P2** | localStorage 50KB 自然封顶 | 已知 flag 词表有限（§5.2 ~6 模板）、图鉴数组小，自然封顶成立；但无序列化兜底守卫，建议后续加超阈值裁剪+告警，非阻塞。 |

---

## 四、MVP 最小可玩切片建议（solo / 先跑通再扩展）

**先做什么（垂直切片，验证核心循环）**：
1. **先拍板数据形状（阻塞项·0.5d）**：以 seed 为准，修正 DATA-STRUCTURE §3.3/§3.6（`actor`→统一、`moodDelta` 唯一、`next:string[]`+`nextWeights`+可选 `id`），GDD §9.4 降为非权威示例。出 ADR。
2. **核心引擎（硬骨头·3–4d，含单测）**：条件解析器 + DramaState 四阶段 + 分支执行器（整单选一、chain 跨阶段、persona 池交织）+ OrderInput→初始 tags 播种。
3. **localStorage `UserStats` store**（read/merge/migrate/corrupt-reset + 单测）。
4. **1 店 + 7 页薄壳 + persona 标签（P6 3 秒爆点）** → 跑通「写备注 → 不同结局」「同店第 5 单 ≠ 第 1 单」。
5. **静态配置加载 + 4 级降级 + 页脚水印 + forbidden_check 闸门**（seed→`latest-config.json` 无缝替换）。

**哪些推迟到 M2**：客服对话、订单详情彩蛋卡（Feed 替代）、零卡路里、图鉴/称号、截图边框分享、今日梗。
**更后**：多店/多骑手扩展、brain 自动化。

---

## 五、技术风险等级清单 + 结论

- **P0（开工前必须解决）**：① 数据形状跨文档对齐（actor/speaker、mood/moodDelta、chain id/next）；② 条件解析器算法 + 优先级 + 插值作用域；③ 四阶段状态机编排算法（选支策略/persona 交织/双因果合并/初始 tags）；④ config 静态化重译 + Vercel `config/*.json` 路由例外。
- **P1（应解决）**：Vant 美团黄主题覆盖 + 跨 chunk 坑；monorepo 构建产物路径；hasTag/flag 语义与 OrderInput→tags 映射。
- **P2（记录即可）**：localStorage 50KB 兜底守卫；brain 跨仓库 handoff 流程；全部 `[PLACEHOLDER]` 调参值（预期由真机 playtest 标定）。

**结论：CONCERNS。** 设计支撑 M1 重建的总体方向已就绪、seed 可直接食用；但 4 项 P0 工程决策未落成算法/契约，**不可直接按冲突文档编码**。建议先花约 1 周做「数据形状 ADR + 解析器/状态机原型 + 静态配置部署验证」三件事，再全面铺 7 页。无 FAIL 级硬阻塞（无技术不可行项、无引擎版本缺口）。
