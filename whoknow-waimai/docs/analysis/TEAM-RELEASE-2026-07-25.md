# 胡闹外卖 v2 · M1 发布就绪度评估报告

**评估人**：路远行（release-ops）｜**日期**：2026-07-25｜**评审强度**：lean/solo

## 结论：⚠️ CONCERNS（设计就绪，发布前置物有缺口，清掉即可软上线）

M1 的契约 / 4 级降级 / 发布闸门设计完整，且「brain 未建、M1 用本地 seed 独立上线」这一事实已被正确吸收，路径成立。但仓库当前**缺失 4 个可清除的硬阻塞**，尚不具备直接发布条件。

## 1. M1 发布清单（就绪 / 缺失）

| 维度 | 状态 | 说明 |
|---|---|---|
| Vercel 部署路由 | ⚠️ 路由对、构建缺 | `vercel.json` 的 `/waimai → /waimai/index.html` 与 SPA fallback 正确；但 `buildCommand: npm run build` 指向**根目录无 package.json**（仅 archive 有），`dist/` 不存在，**构建会失败**；waimai 产物如何落到 `dist/waimai/index.html` 未定义 |
| 版本号策略 | ⚠️ 策略有、客户端未定 | `config version YYYY-MM-DD.NNN` 已定；`effective_until` 过期→降级映射**未写明**（建议本地 seed 设远过期 + 客户端视 bundled seed 恒鲜） |
| forbidden_check 客户端闸门 | ❌ 未实现 | GDD §9.7 要求拉取后先校验 `passed===true && red_light_count===0`，否则丢弃+回退上一版+告警——M1 待开发，必须落地 |
| 4 级降级对发布影响 | ✅ 设计正确 | L4「今天没新段子」仅温和弹窗+显示菜单，**不阻断主流程**；seed 阶段 L1 恒成功，降级链休眠但代码路径须保留 |
| 本地 seed 策略 | ❌ 缺口关键 | 仅 `DRAMA-SEED-v1`（branches 子数组）存在；**完整信封 `latest-config.json`（含 boss/rider/soul_layer/meta/forbidden_check/fallback+branches）缺失**，而它是 M1 独立上线的前提；seed 话术已禁忌词洗稿合规，但信封级 `forbidden_check.passed` 需锡哥手置 |
| 本地化/社区/Live Ops/回滚 | ⚠️ 可推迟+有缺口 | 单人 ad 模式：本地化（纯中文市场）、社区、Live Ops（无赛季）**全部可推迟**；**回滚/热修 SOP 缺失**（Vercel 即时回滚可覆盖代码，配置热修=修 seed 重部署，须成文） |

## 2. 发布风险清单

- **P0**：完整 `latest-config.json` 信封种子缺失 → 客户端无 envelope 可拉取/校验，NPC persona 池与首屏 3 秒爆点空转（P1 红线）。**M1 软上线硬前置**。
- **P1 · brain 未建却要上线**：已用 seed 路径正确承接，风险可控；但须确保客户端「fetch 失败/无 brain」时静默走 bundled seed，不误触 L4。
- **P1 · seed 与未来 brain JSON 契约一致性**：权威形状（DATA-STRUCTURE §3.6 / DRAMA-SEED）用 `moodDelta`+`speaker`；但 **GDD §9.4 示例仍写 `mood` 且无 `speaker`**。若 brain 的 `prompt.ts` 照 GDD §9.4 产 JSON，将发错字段→moodDelta 不生效→因果链断裂→P1 红线。须以 DATA-STRUCTURE 为唯一金标准，加 golden-file 契约测试。
- **P1 · 水印诚实性**：总纲 §2 明令「不得暗示已自动化」，而 L1 文案「🧠 今日 AI 更新」在 seed 阶段（锡哥手编、非每日 AI）属虚假陈述。须为 bundled-seed 改用诚实文案（如「🎭 锡哥精选段子」）。
- **P2 · 构建接线 / 回滚 SOP / effective_until 映射**：见上方清单。

## 3. 建议发布节奏（solo 1 人）

- **M1 软上线（用本地 seed）**：补完整 `latest-config.json` 信封（锡哥过禁忌词）→ 接通 Vercel 构建→`dist/waimai` → 实现 forbidden_check 闸门 + 诚实水印 → 灰度。硬闸门：①红线 0 漏出；②断网/L4 有水印不崩；③同店第 5 单≠第 1 单；④前 3 秒有爆点。
- **M1.5（brain M0 手动跑通）**：码农虾建 generator/forbidden/deployer，锡哥走 P0-2 审核落盘，brain JSON 无缝替换 seed（同信封）。硬闸门：brain 输出通过同一 golden-file 校验；替换后红线仍 0。
- **M2**：戏精深化+截图传播+图鉴。硬闸门：真机 playtest「笑率+第 5 单差异」（总纲行动项 C）。

## 4. 给主理人的结论

**CONCERNS**。设计层已具备 M1 软上线条件，但仓库当前**缺完整 seed 信封、缺 Vercel 构建接线、缺客户端闸门实现、水印文案需改诚实**。这 4 项均为可清除的具体阻塞，无设计级死结；清掉后即可以本地 seed 独立软上线，brain 后续无缝替换。建议按 M1 软上线 → M1.5 → M2 节奏推进，每个节点守「红线 0 漏出 + 降级不崩」双硬闸门。
