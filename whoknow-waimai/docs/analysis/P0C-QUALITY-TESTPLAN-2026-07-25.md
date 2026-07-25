# P0-C · 红线闸门测试计划（QUALITY）

> **日期**：2026-07-25
> **负责人**：严守真（quality-lead）
> **关联任务**：P0-C·Q1 红线清单 + `forbidden_check` 单测
> **关联文档**：`whoknow-brain/docs/禁忌词清单-v1.0.md`、`whoknow-brain/docs/api-spec.md` §`forbidden_check`

---

## 0. 单一真源（canonical source of truth）

客户端红线闸门的所有判定，**必须**以本清单为准，不得各自硬编码：

```
whoknow-waimai/tests/taboo-list.json
```

- `version`: `"1.0"`
- `red_light`: 28 个红线 token（真实品牌 / 真实机构 / 医疗 / 暴力 / 政治敏感 / 违规短码）
- `yellow_light`: 3 个黄灯 token（`萌` / `亲` / `宝贝`）

> engineering 实现客户端闸门时，**直接 `import` 此 JSON**；本仓库 `tests/forbiddenCheck.test.ts` 已据此单测。
> 清单来源 = `禁忌词清单-v1.0.md` 红灯分级 + api-spec `forbidden_check` 形状 + P0-A 洗稿残留，**已显式排除本项目虚构合规词**（`odd_eats` / `暗黑料理` / `胡闹外卖` / `whoknow` / `锡哥` / `戏精` / `锡哥精选`），避免门控自爆。

---

## 1. 红线门控验证范围（三道闸）

发布硬闸门 = 红线 0 容忍：任何用户可见内容含 `red_light` token 一律不得发布。

| 闸 | 时机 | 校验对象 | 判定 | 失败动作 |
|----|------|---------|------|---------|
| **G1 发射前（build-time）** | 构建 / CI | 全部静态资源（seed、文案、文案模板）| `runForbiddenCheck` 对所有文本 `passed === true` | 阻断发布，报命中 token + 位置 |
| **G2 加载时（load-time）** | 客户端拉取 `latest-config.json` | 远程配置 envelope（整包 `JSON.stringify`）| `passed === true` 且 `red_light_count === 0` | 拒绝采用该配置，降级到上一档（见 api-spec 4 级降级）|
| **G3 渲染前（render-time）** | 每条话术渲染前 | 待渲染字符串（含 brain 动态注入 / 本地 seed 兜底）| `passed === true` | 该条话术不渲染，回退到干净占位 / 上一档内容 |

**判定逻辑（参考实现 `runForbiddenCheck`）**：
- 归一化：繁→简 + 全角→半角 + 小写，再做子串匹配 → 大小写 / 全半角 / 繁简 变体一律命中。
- `passed = (redLightCount === 0)`；黄灯只计 `yellowLightCount`，**不阻断**。
- 返回 `hits:[{token, index}]`，`index` 为原文位置，便于回溯整改。

**已知匹配局限（已写入单测“风险演示”，不计入失败，待优化）**：
1. 子串过匹配：短词“医院”会命中“植物医院”等良性连续串 → 清单优先用更精确短语 / 加 CJK 词边界。
2. 短码泛匹配：“1288”会命中任何 1288（含 ¥1288 正常价格）→ 账号类 token 加前后缀上下文（如“尾号 1288”）。

---

## 2. golden-file 契约测试（round2 补 `config-contract.test.ts`）

**前置依赖**：待 release 产出 `latest-config.json`（信封）后，由 round2 补充 `whoknow-waimai/tests/config-contract.test.ts`。

**约定（本计划先固化，round2 落地）**：

```
约定 C1 · 加载信封
  const envelope = JSON.parse(await fetch('/latest-config.json'))
  // 信封字段含 forbidden_check（version/passed/red_light_count/yellow_light_count）

约定 C2 · 整包字符串化校验
  // 防止“字段漏标 / 嵌套文案绕过 forbidden_check”的兜底
  const raw = JSON.stringify(envelope)
  const r = runForbiddenCheck(raw, taboo)   // taboo = import './taboo-list.json'
  assert.equal(r.passed, true)
  assert.equal(r.redLightCount, 0)

约定 C3 · 结构化字段校验
  assert.equal(envelope.forbidden_check.passed, true)
  assert.equal(envelope.forbidden_check.red_light_count, 0)
  // yellow_light_count 允许 > 0（黄灯不阻断）

约定 C4 · 版本对齐
  assert.equal(envelope.forbidden_check.version, taboo.version)  // 均为 "1.0"
```

**为什么整包 `JSON.stringify` 也要跑一遍**：单看 `forbidden_check` 字段易被“标注遗漏”绕过；对整包字符串做红线扫描，是发射前 G1 + 加载时 G2 的双保险。

**golden-file 管理**：`latest-config.json` 作为 golden file 入库；每次 brain 产出新版，先过本契约测试再允许发布。命中即红，人工复核后重出。

---

## 3. 真机 playtest 检查项（P0-C 发布前走查）

不依赖自动化，真机 / 真浏览器人工走查，重点三项：

| # | 检查项 | 预期 | 不通过后果 |
|---|--------|------|-----------|
| P1 | **前 3 秒爆点** | 首屏出现戏精高光（老板/骑手台词），且文案不含任何 `red_light` token | 爆点失效 / 红线漏出 |
| P2 | **断网 L4 有水印不崩** | 断网触发 L4（全部失败）时，显示“今天没新段子”温和弹窗 + 页脚水印仍在，页面不白屏、不抛错 | 体验崩坏 / 静默失败 |
| P3 | **同店第 5 单 ≠ 第 1 单** | 同一店铺重复下单，第 5 单触发的话术 / 分支应与第 1 单不同（验证动态分支 + seed 不串味）| 内容重复感 / 像静态页 |
| P4 | **截图伪装干净** | 戏精弹层 / 气泡 / 结局卡截图时**无水印**（水印只在环境页脚），保持 8 分美团皮 | 传播素材穿帮 |
| P5 | **黄灯不阻断** | 出现“宝贝/亲”等黄灯词时仍可正常发布与渲染（仅统计，不拦截）| 误杀合规话术 |

> P1–P3 为 P0-C 发布硬门；P4–P5 为体验门（建议同步验收）。

---

## 4. 当前交付物与运行状态

| 文件 | 状态 | 说明 |
|------|------|------|
| `tests/taboo-list.json` | ✅ 已落盘 | 单一真源，28 red + 3 yellow |
| `tests/forbiddenCheck.test.ts` | ✅ 已落盘 | 18 用例全绿（含边界 + 风险演示）|
| `docs/analysis/P0C-QUALITY-TESTPLAN-2026-07-25.md` | ✅ 本文件 | 三道闸 + 契约约定 + playtest |

**本地运行**（Node 22.6+ 自带 TS 剥离，无需 jest/vitest）：
```bash
node --test --experimental-strip-types tests/forbiddenCheck.test.ts
# => # tests 18  # pass 18  # fail 0
```

**质量门判定**：✅ PASS —— 红线清单完整、单测覆盖已知坏/好/边界、虚构合规词零误伤、门控逻辑自洽。后续 round2 接 `config-contract.test.ts` 后即为完整发射前 + 加载时双闸。
