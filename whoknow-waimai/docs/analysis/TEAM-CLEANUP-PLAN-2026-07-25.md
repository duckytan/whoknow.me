# 胡闹外卖 v2 · 清场执行计划（P0-A 红线 + P0-B 字段）

> 状态：**待用户拍板 + 批准后才落盘**。本文件由主理人依两份 cleanup 专员回传方案合并，未改动任何项目源文件。
> 范围：P0-A 红线漏网（质量 FAIL 子闸门）+ P0-B 跨文档字段歧义。P0-C/D/E 本轮不动。

---

## 一、总览

| 块 | 来源 | 命中 | 落点 |
|---|---|---|---|
| **P0-A 红线** | 审计 29 处 + 额外发现 9 处 | **38 处** | `DRAMA-ENGINE-V2.md`（15 行）+ `prototype/`（8 文件 + 1 css 改名 + 12 处 link 引用） |
| **P0-B 字段** | 设计审计 5 冲突 | 跨 3 文档 | `GDD-v2` / `DRAMA-SEED-v1.json` / `DRAMA-ENGINE-V2.md` |
| **待拍板** | 两 agent 各标 | **3 处取舍** | 见第四节 |

**统一替换词表（P0-A 全局一致，避免再漏）**

| 类别 | 旧（禁用） | 新（虚构/中性） |
|---|---|---|
| 医院场景 | 医院 / hosp / hosp_survivor / hosp_visit | 暗黑料理 / 神秘仓库 / odd_eats 系列 |
| 隐藏料理 | rare_dish_survivor / dark_dish_{shopId}(早期) | odd_eats_survivor / odd_eats_{shopId} |
| 居委会 | 居委会 | 骑手 |
| 真实美团 | 美团 / 美团黄 / 真实美团外卖 | 胡闹外卖 / 胡闹黄 / 胡闹外卖参考截图 |
| 美团系 UI | 美团支付 / 美团红包 | 胡闹支付 / 胡闹红包 |
| 真实卡尾号 | 尾号 1288 / 7353 / 3593 / 庄** | 尾号 ****（明显假占位） |
| 真实银行 | 中国工商银行 | 胡闹银行 |
| 真实支付 | 微信支付 / 支付宝 / 银联 | 胡闹钱包 / 戏精宝 / 胡闹卡 |
| 真实商户 | 江小鱼挪威三文鱼 | 胡闹深海三文鱼（虚构） |

---

## 二、P0-A 红线清扫（逐处 old→new）

### A1. `docs/specs/DRAMA-ENGINE-V2.md`（12 行 / 14 处，医院·hosp 家族）
| 行 | old | new |
|---|---|---|
| 103 | `地址是否奇葩（天台/出租屋/医院 → bossMood -20~-30）` | `…（天台/出租屋/神秘仓库 → bossMood -20~-30）` |
| 165 | `addressTag: 'home' \| 'school' \| 'company' \| 'rooftop' \| 'weird_addr' \| 'hosp'` | 末尾删 `'hosp'` |
| 194 | `// 例: ["married_r003", "dark_dish_s001", "rare_dish_survivor"]` | `"…", "odd_eats_s001", "odd_eats_survivor"]` |
| 214 | `` `dark_dish_{shopId}` \| 某店食物离奇 \| 下次点该店，老板以为你拉黑，吓进医院 `` | `` `odd_eats_{shopId}` \| … 吓得连夜改行卖烤肠 `` |
| 215 | `` `rare_dish_survivor` \| 隐藏料理幸存 \| 下次点餐，居委会上门回访 `` | `` `odd_eats_survivor` \| … 骑手上门回访 `` |
| 216 | `` `hosp_survivor` \| 暴食进过 医院 \| 老板：「又是你？上次吃进医院的？」 `` | `` `odd_eats_survivor` \| 暴食过暗黑料理 \| 老板：「又是你？上次那顿你还没缓过来？」 `` |
| 235 | `家庭/学校/公司/天台/出租屋/医院` | `…/神秘仓库` |
| 393 | `暴食进 医院 → rare` | `暴食进 暗黑料理 → rare` |
| 585 | `rare 金色🥇 "暴进医院" "骑手拒单成就"` | `"暗黑料理勇士" "骑手拒单成就"` |
| 616 | `连3天 医院` | `连3天 神秘仓库` |
| 633 | `` `hosp_visit` \| 医院 观光 \| rare \| 暴食进 医院 `` | `` `odd_eats_visit` \| 暗黑料理观光 \| … 暴食进 暗黑料理 `` |
| 635 | `` `rare_dish_survivor` \| 隐藏料理幸存 \| legendary \| 触发隐藏料理结局 `` | `` `odd_eats_survivor` \| … `` |

### A2. `prototype/terms.html`
| 行 | old | new |
|---|---|---|
| 40 | `请不要为了解锁「辣度一姐」而去<strong>医院</strong>，<b>健康比成就重要</b>。` | `…而去挑战暗黑料理，<b>健康比成就重要</b>。` |

### A3. `prototype/index.html`（4 处，真实美团）
| 行 | old | new |
|---|---|---|
| 6 | `<title>胡闹外卖 · 高仿美团原型 v3</title>` | `<title>胡闹外卖 · 高保真原型 v3</title>` |
| 38 | `<h1>胡闹外卖 · 美团高仿原型</h1>` | `<h1>胡闹外卖 · 高保真原型</h1>` |
| 39 | `<p>基于 5 张真实美团长截图逐像素校准 · 戏精灵魂保留</p>` | `<p>基于 5 张虚构外卖参考截图逐像素校准 · 戏精灵魂保留</p>` |
| 156 | `校准于真实美团外卖 2026-07 · 戏精灵魂由 whoknow-waimai NPC 引擎驱动` | `校准于胡闹外卖 2026-07 · …` |

### A4. `prototype/css/meituan.css`（3 处，真实美团）
| 行 | old | new |
|---|---|---|
| 2 | `胡闹外卖 · 高仿美团外卖 设计系统 v2` | `胡闹外卖 · 设计系统 v2` |
| 3 | `主色：美团黄 #FFD100 ｜ 价格红 #FF4B10` | `主色：胡闹黄 #FFD100 ｜ 价格红 #FF4B10` |
| 4 | `基于真实美团截图逐像素校准` | `基于虚构外卖参考截图逐像素校准` |

### A5. `prototype/pages/order.html`（真实美团 + 真实卡尾号）
| 行 | old | new |
|---|---|---|
| 70 | `订单已支付成功<span>20:30 · 美团支付 · 庄**尾号 1288</span>` | `…20:30 · 胡闹支付 · 尾号 ****</span>` |

### A6. `prototype/pages/checkout.html`（3 处，真实美团）
| 行 | old | new |
|---|---|---|
| 103 | `美团红包` | `胡闹红包` |
| 134 | `美团支付` | `胡闹支付` |
| 145 | `更多美团支付方式 ›` | `更多胡闹支付方式 ›` |

### A7. `prototype/pages/shop.html`
| 行 | old | new |
|---|---|---|
| 70 | `<!-- 左浮动章节导航（按真实美团哈哈蒸鸡） -->` | `<!-- …（按 胡闹外卖 虚构商户「哈哈蒸鸡」） -->` |

### A8. `prototype/pages/privacy.html`
| 行 | old | new |
|---|---|---|
| 71 | `…且<b>不代表任何真实商家 / 骑手的真实人格</b>…` | `…且<b>不代表任何具体商家 / 骑手的真实人格</b>…` |

### B. 额外发现（审计未列，真实机构/卡号/品牌泄漏，高危）
| 文件 | 行 | old | new |
|---|---|---|---|
| checkout.html | 138 | `中国工商银行储蓄卡（7353）` | `胡闹银行储蓄卡（****）` |
| checkout.html | 142 | `中国工商银行信用卡（3593）` | `胡闹银行信用卡（****）` |
| checkout.html | 148 | `微信支付` | `胡闹钱包` |
| checkout.html | 153 | `支付宝支付` | `戏精宝` |
| terms.html | 54 | `支持微信 / 支付宝 / 银联 / 「找我同事代付」` | `支持胡闹钱包 / 戏精宝 / 胡闹卡 / 「找我同事代付」` |
| home.html | 99 | `<!-- 商家大卡（江小鱼挪威三文鱼 - 真实截图同款） -->` | `<!-- 商家大卡（胡闹深海三文鱼 - 虚构示例） -->` |
| **css 改名** | — | `meituan.css` → `whoknow.css` | 连带 12 处 `<link href="../css/meituan.css">` → `whoknow.css`（index + pages/ 下 11 个） |
| DRAMA L158 | 注释 | `…隐藏料理 / 居委会 / 医院 拉黑等…` | `…隐藏料理 / 骑手回访 / 暗黑料理 拉黑等…` |
| DRAMA L437 | 注释 | `红线已洗：…「 / 医院 / 隐藏料理 / 居委会 / 拉黑 / 拉黑」…` | `…「 / 暗黑料理 / 隐藏料理 / 骑手回访 / 拉黑 / 拉黑」…` |
| DRAMA L586 | `epic "破产救赎" "隐藏料理幸存者"` | `epic "破产救赎" "暗黑料理幸存者"` |

> B 节 CSS 内部 `--mt-*` 变量为内部标识符、非用户可见，**可保留**以减小改动面；若门控需 100% 字面通过可批量改 `--mt-`→`--wk-`（可选）。

---

## 三、P0-B 字段对齐（DATA-STRUCTURE-v1 为唯一权威）

### B1. `GDD-v2-2026-07-24.md`
| 行 | old | new |
|---|---|---|
| 371/391/401/412 | `"mood": -30 / -10 / -60 / -20` | `"moodDelta": …` |
| 114/118/404 | `dark_survivor_{shopId}` | `dark_dish_{shopId}`（与权威 §5.2 对齐） |
| 142/143 | `flag(married_r003) & riderId=r003` / `flag(dark_survivor, s001) & shopId=s001` | `flag(married_{riderId}) & riderId={riderId}` / `flag(blacklisted_{shopId}) & shopId={shopId}` |
| 303 | `philosophical` | `philosopher` |
| §9.4 分支 6→7 | `poor/bankrupt_love/overeat/dark_dish/old_acquaintance/complaint` | 替换为 SEED 7 条，并全量 `speaker`→`actor`；删 `old_acquaintance`+`complaint`、加 `cheap_no_rider/fate_reunion/blacklist_reunion`、`overeat`→`overeat_cares`、删 L397 `"neverExpire": true` |

### B2. `DRAMA-SEED-v1-2026-07-24.json`
| 范围 | old | new |
|---|---|---|
| 全文链节点 | `"speaker":` | `"actor":`（直接 replace_all，值不变） |

### B3. `DRAMA-ENGINE-V2.md`
| 行 | old | new |
|---|---|---|
| §6.4 全部实例 | `"speaker"` | `"actor"`（replace_all） |
| 157 红灯清单 | 含 `dark_dish` | **摘除 `dark_dish`**（权威 §5.2 明确定义其为合规） |
| 220 | `flag(married_r003)`、`flag(dark_dish, s001)` | `flag(married_{riderId})`、`flag(dark_dish_{shopId})` |
| 165/166 | `addressTag` 枚举含 `hosp` / `remarkTag` 末尾缺 `weird` | 删 `hosp` / 补 `weird` |
| §6.2 接口 | `description` / `neverExpire` / `firstEvent` 多余字段 | 删；`cooldown`→`cooldownMin`；`stateModifiers`→`effect` |
| 334/335 | `hasTag(weird_addr)` / `!flag(hasHadDarkDish)` | `addressTag = weird` / `!flag(dark_dish_{shopId})` |
| 604 | `achievementUnlocked` | `achievements` |

### B4. `DATA-STRUCTURE-v1`（权威需反向补字段）
| 位置 | 补丁 |
|---|---|
| §3.6 链节点扩展字段 | 补 `id?: string`（节点自引用）、`nextWeights?: number[]`（多分支权重，与 `next: string[]` 配对）；§3.6 poor 示例补 `"actor": "boss"` |

---

## 四、待你拍板（3 处取舍，非阻塞但影响落盘口径）

1. **`dark_dish` 最终口径**
   - 方案 A（推荐，向 DATA 看齐）：**保留 `dark_dish`**，仅从 DRAMA §四 红灯清单摘除（B3-L157）。注意：P0-A 的 A1-L214 把示例表里的 `dark_dish`→`odd_eats`，与此冲突，若选 A 则该行不改。
   - 方案 B：全量 `dark_dish`→`odd_eats`（P0-A 全量改名），口径最干净但改动面更大、需同步 SEED/§6.4。

2. **`nextWeights` / `id` 是否补进权威**
   - 推荐：补进 DATA §3.6（种子已依赖，删之会破坏多路径分支）。
   - 备选：从 SEED 删除这两个字段（破坏多分支）。

3. **分支语义：`blacklist_reunion`（SEED/DATA）vs `old_acquaintance`（GDD）**
   - 推荐：以 SEED/DATA 为准，GDD §9.4 的「旧识重逢」替换为「拉黑重逢·冰释前嫌（blacklist_reunion）」。
   - 备选：保留「旧识重逢」语义，则需在 SEED 新增该分支（并定义合规 flag，不能用已退役的 `regular_s001`）。

---

## 五、执行与验证计划（批准后）

1. 按答复固化上述 3 取舍。
2. 落地顺序：B4（补权威）→ B2（SEED speaker→actor，纯 replace_all）→ B3（DRAMA 逐项）→ B1（GDD，含 §9.4 整块替换）→ P0-A 的 B4（改名+12 link）→ A3/A4/A5/A6/A7/A8（原型品牌/卡号）→ B1/B2/B3（原型真实机构/支付/商户）→ A1/A2（DRAMA 医院/hosp）→ B 注释行（DRAMA L158/437/586）。
3. **验证（必须）**：重跑 forbidden_check 红线扫描，确认 `red_light_count === 0` 后，本轮 P0-A 子闸门由 FAIL 转 PASS。
4. 全部为 spec / 原型文档改动，不动 `whoknow-waimai/src`（v2 重建尚未开始）。
