# ♿ 胡闹导购（whoknow-mart）· 可访问性分级（ACCESSIBILITY.md）

> **版本**：v0.1 · 2026-07-26
> **主责**：林绘澄（art-director，胡闹宇宙工作室）
> **状态**：🟡 Phase 3 美术侧可访问性分级（与 engineering-lead 架构评估并行）
> **评审强度**：full
> **上游权威**：`docs/art/ART-BIBLE.md`（v0.1，视觉身份九节）· `docs/gdd/REVIEW.md` §5.1（五导购规范锚表）· `BRAND.md` §2/§3/§17 · `whoknow-waimai/src/style.css`（H4 回归）· `whoknow-brain/docs/api-spec.md` v2.2 D3（水印裁定）
> **技术栈**：Vue3 + Vite + Vant · Vercel PWA · MVP 纯前端

---

## 0. 范围与依据

本文件为 `whoknow-mart` 定义**可访问性分级**（Basic / Standard / Comprehensive），给出各档**特性矩阵**与 MVP 目标档判定，并确认可访问性方案**不破坏**品牌锚色与双胜利视觉。

- 对比度阈值采用 WCAG 2.1 AA：正文 ≥ **4.5:1**，大字（≥24px 或 ≥19px 粗）≥ **3:1**，图形/UI 组件（边框、图标、状态指示）≥ **3:1**。
- 本文件与 `ART-BIBLE.md` 互补：ART-BIBLE 定义视觉身份，本文件定义该身份下的可访问性下限与进阶档。
- 表述纪律遵循 L2-C9：使用机器名/角色名/令牌名/文件路径指代，禁用读者相对代词与模糊指代。

---

## 1. 分级模型总览

| 档 | 定位 | 对应标准 | MVP 目标 |
|----|------|----------|----------|
| **Basic** | 合规底线：仅保证 WCAG AA 文本最小线与 3 项硬约束（reduced-motion / 44px / 色盲 emoji+名） | WCAG 2.1 AA 子集 | — |
| **Standard** | 产品可用基线：Basic + 焦点环 + 屏幕阅读器语义 + 200% 缩放 + 非颜色独载状态 + 对比度终检 | WCAG 2.1 AA 完整 | ✅ **MVP 目标档** |
| **Comprehensive** | 进阶包容：Standard + 高对比/大字体主题 + 自定义文字间距 + 认知负荷优化 + 真机实测 | WCAG 2.1 AA + 部分 AAA 实践 | 后续迭代 |

**MVP 目标 = Standard 的理由**：mart MVP 为纯前端 PWA，Standard 已覆盖键盘可达、屏幕阅读器、缩放、色盲、触控、动效减弱、非颜色状态全部 6 项必备维度；Comprehensive 的高级项（主题切换/间距自定义/真机实测）不阻断 MVP 上线，列为后续。

---

## 2. 特性矩阵对比表

> 符号：✅ 满足 · ◐ 部分满足/需校验 · — 不覆盖

| # | 维度（必备 6 项 + 扩展） | Basic | Standard（MVP） | Comprehensive |
|---|--------------------------|-------|-----------------|---------------|
| **A** | 文本对比度（4.5:1 正文 / 3:1 大字） | ✅ `--fg`#222 on `--bg-2`#fff 达标 | ✅ + 全字号/价格/水印对比度终检（§6） | ✅ + 高对比主题 |
| **B** | 图形/UI 组件对比度（≥3:1） | ✅ 边框/图标/破防度轨道 | ✅ | ✅ |
| **C** | 宿主色/角色色可读对比（分区校验） | ◐ 仅大号 CTA 校验 | ✅ 宿主暗字/角色色仅作 accent/chip 文本改 `--fg`（§6） | ✅ + 真机色盲模拟 |
| **D** | 文本尺寸与缩放（200% 不破版） | — 未验证 | ✅ rem/相对单位 + Vant 组件缩放验证 | ✅ + 自定义文字间距 |
| **E** | 戏精弹层文案缩放 | — | ✅ 手写体 1.65 行高 + 弹层不破版 | ✅ |
| **F** | 动效减弱（`prefers-reduced-motion`） | ✅ 戏精弹层动画降级瞬时 | ✅ + 全局动画/过渡降级（对齐 waimai H4） | ✅ + 可暂停/颗粒度 |
| **G** | 水印可读性（页脚，不侵入戏精区） | ✅ 达 4.5:1 + 只进页脚 | ✅ + 不侵入戏精弹层/气泡/结局卡（api-spec D3） | ✅ + 高对比模式 |
| **H** | 触控目标 ≥44×44（Vant 按钮/选项/Tab） | ✅ Vant 按钮达标 | ✅ + 选招 4 选项/底部 TabBar/min-height（对齐 waimai H4） | ✅ + 间距优化 |
| **I** | 色盲友好（5 导购非色相独载） | ✅ emoji + 导购名强制（REVIEW §5.1） | ✅ + 戏精标签 chip 叠加 emoji/文字 | ✅ + 色盲模拟测试 |
| **J** | 键盘焦点可见（focus-visible 环） | — | ✅ `3px solid var(--brand-orange); offset 2px`（对齐 waimai H4） | ✅ + 可见性增强 |
| **K** | 屏幕阅读器语义 | — | ✅ `button`/`nav`/`main` + `aria-label` + 装饰 `aria-hidden` | ✅ + 全组件 role/state |
| **L** | 非颜色独载状态 | ◐ 双胜利本就双文案 | ✅ 破防度 meter `role=progressbar`+`aria-valuenow`+可见数值+阶段文案 | ✅ |
| **M** | 语言声明 / 错误预防 | — | ✅ `<html lang="zh-CN">` + 表单 `<label>`+实时校验 | ✅ |
| **N** | 进阶（高对比主题/间距/认知负荷/实测） | — | — | ✅ |

> **6 项必备维度**（任务指定）对应：A/B/C=色彩对比度，D/E=文本尺寸与缩放，F=动效减弱，G=水印可读性，H=触控目标，I=色盲友好。Standard 档全部 ✅。

---

## 3. 各档详细定义

### 3.1 Basic 档（合规底线）

- **达成项**：A（正文对比度达标）、B（图形 3:1）、F（戏精弹层 `prefers-reduced-motion` 降级瞬时）、G（水印达 4.5:1 且只进页脚）、H（Vant 按钮 ≥44×44）、I（5 导购 emoji+名 强制，非色相独载）。
- **缺口**：无焦点环精细规范（J）、无屏幕阅读器语义（K）、无 200% 缩放验证（D/E）、无破防度 meter ARIA（L）、无语言声明（M）。
- **适用**：仅作最低合规兜底；MVP **不采用** Basic 作为目标档。

### 3.2 Standard 档（MVP 目标）

在 Basic 之上补齐 J/K/D/E/L/M，并对 C 做对比度修正（§6）：

- **焦点环（J）**：所有可交互元素 `a/button/input/.tabbar .tb/.cat-item/.mt-nav__icon` 等 → `outline: 3px solid var(--brand-orange); outline-offset: 2px; border-radius: 8px;`——**逐字复用 `whoknow-waimai/src/style.css` H4 回归区块**。
- **屏幕阅读器（K）**：语义标签（`button`/`nav`/`main`/`dialog`）+ 必要 `aria-label`；装饰图标/角标 `aria-hidden`；戏精弹层用 `role="dialog"` + `aria-modal`。
- **缩放（D/E）**：全局用 `rem`/相对单位，禁固定 `px` 高；`html { -webkit-text-size-adjust:100%; text-size-adjust:100% }`；Vant 组件在 200% 缩放下不破版（工程验证）；戏精弹层手写体（`--font-script`）行高 1.65，弹层布局用相对单位不溢出。
- **非颜色独载（L）**：破防度 meter 须带 `role="progressbar"` + `aria-valuenow` + 可见数值（`--font-mono`，如「破防 72」）+ 阶段文案（轻劝/狠劝/松动/破防）；选招 4 选项 icon+文字双标识。
- **语言/错误（M）**：`<html lang="zh-CN">`；表单有 `<label>` + 实时校验 + 错误文案（非仅靠颜色）。
- **色盲（I）**：5 导购始终以 emoji + 中文名 + 戏精标签(chip 含文字) 三重标识（§5）。

### 3.3 Comprehensive 档（后续迭代）

Standard +：高对比/大字体主题切换（`--theme-high-contrast` 令牌）、自定义文字间距（支持 `letter-spacing`/`line-height` 用户偏好）、可暂停自动动效（非仅 reduced-motion 二值）、认知负荷优化（戏精弹层可「简洁模式」隐藏装饰）、真实设备屏幕阅读器（VoiceOver/NVDA）与色盲模拟（daltonize）实测覆盖。

---

## 4. MVP 目标档 = Standard · 未覆盖风险

**MVP 目标档裁定**：Standard（§3.2）。以下为 Standard 档**未覆盖**、需主理人/后续迭代关注的残留风险：

| # | 未覆盖项 | 风险 | 建议归属 |
|---|----------|------|----------|
| R1 | 高对比/大字体主题切换 | 低视力用户仅能靠系统缩放，无应用内主题 | Comprehensive |
| R2 | 自定义文字间距 |  dyslexia/阅读障碍用户无间距偏好 | Comprehensive |
| R3 | 真机屏幕阅读器实测 | 仅规范标注，未实测 VoiceOver/NVDA 朗读顺序 | Comprehensive（MVP 后补测） |
| R4 | 角色色 chip / 宿主色实测对比度 | §6 为计算估值，需 engineering 用对比度工具终检 | engineering-lead 验收（§8） |
| R5 | 截图社交压缩后对比度 | 戏精弹层/结局卡截屏压缩可能掉对比度 | playtest 抽检 |
| R6 | 可暂停自动动效 | 仅 reduced-motion 二值，无粒度暂停 | Comprehensive |

> R4 为 MVP 上线前**必须**由 engineering-lead 用工具终检项；其余为后续迭代项，不阻断 MVP。

---

## 5. 色盲友好专项（对齐 REVIEW §5.1）

**铁律**：5 导购角色色区分**绝不只靠色相**。每个导购在任何视图中必须同时呈现以下至少两项非色相标识：

1. **Emoji 头像**（固定，见 §9 表）
2. **中文导购名**（王二麻/李算盘/赵拖拖/钱满满/周暗暗）
3. **戏精标签 chip 文字**（毒舌/理性/散漫/鸡汤/腹黑）

角色色（`--role-*`）仅作**底色点缀 / 左边框 accent / 破防高光描边**，不单独承担辨识（对齐 `ART-BIBLE.md` §2.5「角色色不承载小号正文」）。

**4 招式同样非色相独载**：每选项 = icon（💪📊🥺🤬）+ 文字标签（我需要！/我比过价了/求求了/爱卖不卖），位置随机但 icon+文字恒定（对齐 `ART-BIBLE.md` §5.5）。

**规范锚**（全系统唯一，引用 `REVIEW.md` §5.1）：

| `guideId` | `archetype` | 中文型 | `--role-*` | HEX | Emoji | 导购名 |
|-----------|-------------|--------|------------|-----|-------|--------|
| `guide_wanger_ma` | `poison_tongue` | 毒舌型 | `--role-angry` | #FF4B10 | 🔥 | 王二麻 |
| `guide_li_suanpan` | `rational` | 理性型 | `--role-gentle` | #2BB14A | 🤓 | 李算盘 |
| `guide_zhao_tuotuo` | `lazy` | 散漫型 | `--role-lazy` | #3A7BFF | 😴 | 赵拖拖 |
| `guide_qian_manman` | `philosopher` | 鸡汤型 | `--role-philo` | #1FB6A6 | 🧘 | 钱满满 |
| `guide_zhou_anan` | `dark` | 腹黑型 | `--role-weird` | #8B5CF6 | 😈 | 周暗暗 |

> 注：`--role-gentle`(#2BB14A) 映射「理性型」、`--role-weird`(#8B5CF6) 映射「腹黑型」为 `ART-BIBLE.md` §2.5 既有裁定（绿=冷静、紫=神秘腹黑），与 REVIEW §5.1 完全一致；色盲冗余使该语义映射不依赖色相辨识。

---

## 6. 对比度校验要点（计算估值 + 修正）

> 以下为美术侧计算估值，MVP 上线前须由 engineering-lead 用对比度工具（如 axe/Colour Contrast Analyser）终检（R4）。

| 组合 | 计算对比度 | AA 要求 | 结论 | Standard 修正 |
|------|-----------|--------|------|---------------|
| `--fg`#222 on `--bg-2`#fff | ≈15:1 | 4.5:1 | ✅ | — |
| `--fg-dim`#666 on `#fff` | ≈5.7:1 | 4.5:1 | ✅ | — |
| `--fg-mute`#999 on `#f7f7f8` | ≈2.6:1 | 4.5:1 | ❌ | 水印改 `--fg-dim`#666(≈5.5:1) 或新增 `--watermark-fg`#595959(≈6.4:1) |
| `--mart-host`#FF5000 + 白字 | ≈3.3:1 | 4.5:1(小字) | ❌ | **改暗字 `#1a1a1a`(≈5.5:1)**，对齐 waimai 黄底暗字（修正 `ART-BIBLE.md` §2.2「白字」建议） |
| `--mart-host`#FF5000 作图形/≥19px 粗字 | 3.3:1 | 3:1 | ✅ | 仅用于大粗/UI 组件 |
| `--mart-price`#FF0036 on `#fff` | ≈4.0:1 | 4.5:1(常规) | ❌(常规) | 价格文本 ≥19px **bold**（大文本 3:1 阈值，4.0 通过） |
| 角色色 chip 文本（原 role 色 on tint） | ≈2.8:1 | 4.5:1 | ❌ | **chip 文本改 `--fg`#222** + 角色色作 3px 左边框/圆点 accent（对齐 `ART-BIBLE.md` §2.5） |
| `--brand-orange`#ff7849 焦点环 on 浅底 | 3:1(图形) | 3:1 | ✅ | 焦点环属图形，达标 |
| 语义 success `#10b981` on `#fff` | ≈3.0:1 | 4.5:1(文字) | ⚠️ | success 仅作图形/大粗/绿框，不作小号正文 |

**关键修正（修订 ART-BIBLE 假设）**：
- `ART-BIBLE.md` §2.2 曾写「宿主色 #FF5000 配白字」——计算仅 3.3:1，**不达标**。Standard 修正为**暗字 `#1a1a1a`**（对齐 waimai 黄底暗字模式），既达 AA 又保持宿主橙红皮观感。
- 角色色 chip 文本原 waimai 模式（role 色 on tint ≈2.8:1）不达标；Standard 改为 `--fg`#222 文本 + 角色色作左边框/圆点，与 `ART-BIBLE.md` §2.5「角色色不承载小号正文」一致。

---

## 7. 对照 ART-BIBLE：不破坏品牌锚色与双胜利 — 明确结论

**结论：可访问性方案与品牌锚色、双胜利视觉正交且不冲突；并在色盲 / 对比度 / 非颜色状态三处强化表达。**

逐项确认：

1. **品牌锚色值不变**：`--brand-green`#6eda78 / `--brand-orange`#ff7849 / `--brand-purple`#8b5cf6 **HEX 零修改**。a11y 仅约束其**使用方式**（不承载小号正文、焦点环用 `--brand-orange` 本就是品牌动作色）。
2. **角色色 HEX 不变**：`--role-*` 五值零修改；色盲冗余是**叠加** emoji+名+chip 文字，非替换/改值，宇宙一致性（对齐 `ART-BIBLE.md` §8）保持。
3. **宿主色分区不变**：`--mart-host`#FF5000（宿主皮）vs `--brand-orange`#ff7849（胡闹动作/戏精）分区规则（§2.2）不因 a11y 改变；a11y 仅要求各自使用区达对比度（宿主改暗字）。
4. **双胜利无红叉（核心）**：a11y「非颜色独载」要求（L）与双胜利**同向**——破防态（affinity≥100）与反消费胜利态（affinity≤0）本就是两种不同文案 + 绿框 + 印章（`--font-brush`），均归 `--c-success` 语义（`ART-BIBLE.md` §2.4）。归零态用 success 绿，**绝不**用 `--c-error`#ef4444 红叉。a11y 的「状态带数值+形状」反而强化双胜利的清晰可读。
5. **动效减弱不损戏精内容**：`prefers-reduced-motion` 仅去动画（弹簧/抖动/光晕），**台词/绿框/印章保留**，截图传播层（§5.3 安全区）不受影响。
6. **水印可读不侵入**：a11y 要求页脚水印达 4.5:1（§6 改 `--fg-dim`）且不侵入戏精弹层/气泡/结局卡，与 `api-spec.md` v2.2 D3 截图安全区一致。

> 综上，a11y Standard 档是品牌锚色与双胜利视觉的**保护者而非破坏者**，无冲突项。

---

## 8. 实现交接（engineering-lead 验收清单 · 不 commit）

engineering-lead 在架构评估中须就以下项验收（本文件不替代实现，不擅自 git 操作）：

- [ ] 焦点环 `3px solid var(--brand-orange); offset 2px` 逐字复用 waimai H4 区块（J）
- [ ] 触控目标 ≥44×44：`min-height:44px` 应用于 Vant 按钮/选招 4 选项/底部 TabBar（H，对齐 waimai H4）
- [ ] `prefers-reduced-motion` 全局降级瞬时，含戏精弹层弹簧/抖动/光晕（F）
- [ ] 破防度 meter `role="progressbar"` + `aria-valuenow` + 可见数值 + 阶段文案（L）
- [ ] 5 导购 emoji+名+chip 文字三重标识；4 招式 icon+文字（I，对齐 REVIEW §5.1）
- [ ] 宿主 CTA 暗字 `#1a1a1a`（非白字）；价格文本 ≥19px bold（C，§6）
- [ ] chip 文本 `--fg`#222 + 角色色左边框/圆点（C，§6）
- [ ] 水印 `--fg-dim`#666 或 `--watermark-fg`#595959，只进页脚（G，§6）
- [ ] `<html lang="zh-CN">` + 表单 `<label>`+实时校验（M）
- [ ] 200% 缩放下 Vant 组件与戏精弹层不破版（D/E）
- [ ] 用对比度工具终检 §6 全部组合（R4）

---

## 9. 附录：规范锚表

### 9.1 五导购（REVIEW §5.1，全系统唯一锚）

| `guideId` | `archetype` | 中文型 | `--role-*` | HEX | Emoji | 导购名 |
|-----------|-------------|--------|------------|-----|-------|--------|
| `guide_wanger_ma` | `poison_tongue` | 毒舌型 | `--role-angry` | #FF4B10 | 🔥 | 王二麻 |
| `guide_li_suanpan` | `rational` | 理性型 | `--role-gentle` | #2BB14A | 🤓 | 李算盘 |
| `guide_zhao_tuotuo` | `lazy` | 散漫型 | `--role-lazy` | #3A7BFF | 😴 | 赵拖拖 |
| `guide_qian_manman` | `philosopher` | 鸡汤型 | `--role-philo` | #1FB6A6 | 🧘 | 钱满满 |
| `guide_zhou_anan` | `dark` | 腹黑型 | `--role-weird` | #8B5CF6 | 😈 | 周暗暗 |

### 9.2 四招式（位置随机，固定语义，非色相独载）

| `moveId` | `label` | icon | 非色相标识 |
|----------|---------|------|-----------|
| `move_firm` | 我需要！ | 💪 | icon + 文字 |
| `move_compare` | 我比过价了 | 📊 | icon + 文字 |
| `move_pity` | 求求了 | 🥺 | icon + 文字 |
| `move_poison` | 爱卖不卖 | 🤬 | icon + 文字 |

---

_胡闹宇宙 · whoknow-mart 可访问性分级 v0.1 · art-director 林绘澄 · 2026-07-26 · Phase 3 备料（非实现，不 commit）_
