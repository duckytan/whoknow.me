# 🎯 胡闹导购（whoknow-mart）· 资产规格（ASSET-SPECS.md）

> **版本**：v0.1 · 2026-07-26
> **主责**：林绘澄（art-director，胡闹宇宙工作室）
> **状态**：🟡 Phase 4 预制作 · 资产规格（冻结期备料，非实现）
> **评审强度**：full
> **上游权威**：`docs/art/ART-BIBLE.md`(v0.1) · `docs/art/ACCESSIBILITY.md`(v0.1) · `docs/gdd/REVIEW.md` §5.1（五导购锚表）· `docs/gdd/02-selection-statemachine.md` · `docs/gdd/03-break-defense-engine.md` · `docs/gdd/06-drama-dialog-ui.md` · `docs/gdd/08-screenshot-share.md` · `BRAND.md` §2/§3/§7/§17
> **纪律**：不碰 `whoknow-mart/src/` 代码；表述遵循 L2-C9（机器名/角色名/令牌名/路径指代）。

---

## 0. 范围与依据

本文件定义 `whoknow-mart` MVP 的**资产规格**，覆盖四类资产：① 5 导购角色视觉资产、② UI 组件资产、③ 动效清单、④ 对比度达标色值。本文件为生产/实现提供**可执行规格**，不产出代码。

- 5 导购标识符严格对齐 `REVIEW.md` §5.1 规范锚表（`guideId` ↔ `archetype` ↔ 中文型 ↔ `--role-*` ↔ HEX ↔ Emoji ↔ 导购名）。
- 对比度标准采用 WCAG 2.1 AA：正文 ≥ **4.5:1**，大字（≥24px 或 ≥19px 粗）≥ **3:1**，图形/UI 组件 ≥ **3:1**。MVP = Standard 档（见 `ACCESSIBILITY.md`）。
- 双胜利语义（破防态/反消费胜利态均 success）与「归零态禁红叉」强制贯穿全资产（对齐 `02`/`03`/`08` 与 `ART-BIBLE.md` §2.4/§9.1）。

---

## 1. 五导购角色视觉资产清单

### 1.1 共享头像/立绘规范

| 项 | 规格 |
|----|------|
| MVP 头像 | 圆形底，填充角色色 `--role-*`；中心固定 **Emoji**（32–40px）；外层白边 2px + `--shadow-md`（对齐 `ART-BIBLE.md` §4.1） |
| 后续立绘 | 反骨客服半身立绘（角色色制服/配饰），**仍须叠加 Emoji + 中文名 + chip**，禁纯立绘辨识 |
| 头像尺寸 | 对话气泡 48px / 结局卡 56px / 时间线小图 32px |
| 破防高光 | 命中弱点时 `--shadow-glow-green`(`0 0 0 3px rgba(110,218,120,.28)`) + 单次抖动 ≤300ms（对齐 `ART-BIBLE.md` §4.1 / `06` §3） |
| 色盲铁律 | 每个导购**必带** Emoji + 中文名 + 戏精标签 chip 文字三重标识；角色色仅作底色点缀/左边框 accent，**不独载辨识**（对齐 `ACCESSIBILITY.md` §5） |

### 1.2 五导购逐项规格（对齐 REVIEW §5.1 + ART-BIBLE §4.2）

| `archetype` | 中文型 | `--role-*` | HEX | Emoji | 导购名 | 头像底 | 戏精标签 chip | 动机化名角标 |
|-------------|--------|------------|-----|-------|--------|--------|--------------|--------------|
| `poison_tongue` | 毒舌型 | `--role-angry` | #FF4B10 | 🔥 | 王二麻 | 红橙渐变 | 毒舌 | 嘴替 |
| `rational` | 理性型 | `--role-gentle` | #2BB14A | 🤓 | 李算盘 | 绿渐变 | 理性 | 算账 |
| `lazy` | 散漫型 | `--role-lazy` | #3A7BFF | 😴 | 赵拖拖 | 蓝渐变 | 散漫 | 想下班 |
| `philosopher` | 鸡汤型 | `--role-philo` | #1FB6A6 | 🧘 | 钱满满 | 青渐变 | 鸡汤 | 为你好 |
| `dark` | 腹黑型 | `--role-weird` | #8B5CF6 | 😈 | 周暗暗 | 紫渐变 | 腹黑 | KPI怪 |

> 角色色映射裁定（ART-BIBLE §2.5）：`rational`→`--role-gentle`(绿=冷静)、`dark`→`--role-weird`(紫=神秘腹黑)，与 REVIEW §5.1 一致。动机化名角标**仅用文字**（如「整老板」「为你好」），禁真实老板肖像/公司 logo/工资数字（对齐 `mart-禁忌词终审.md` + `ART-BIBLE.md` §9）。

### 1.3 戏精标签 chip 资产规格

- **形状**：圆角药丸 `--radius-pill`，内边距 6px×12px，最小触控 44×44（含 padding）。
- **文本**：戏精分类文字（毒舌/理性/散漫/鸡汤/腹黑），`--font-body` 10–12px，**文本色 `--fg`#222**（达标对比度，见 §4.3）。
- **角色色用法**：仅作 **3px 左边框** 或 左侧 **6px 圆点** accent；**不**用作 chip 文字色（对齐 `ART-BIBLE.md` §2.5「角色色不承载小号正文」）。
- **色盲**：chip 文字 + Emoji + 中文名三重，角色色仅 accent。

---

## 2. UI 组件资产

### 2.1 对线气泡（Dialog Bubble）

| 项 | 规格 |
|----|------|
| 容器 | 白底 `--bg-2` + `--radius-lg` + `--shadow-md`；说话者名 `--brand-orange`#ff7849（对齐 `ART-BIBLE.md` §4.1） |
| 金句文本 | `--font-script`(ZCOOL KuaiLe) `--fs-base`(16) + 品牌绿高亮底 `rgba(110,218,120,0.08)`（对齐 waimai `.timeline .txt`） |
| 导购标识 | 头像（§1.1）+ 中文名 + 戏精标签 chip（§1.3）|
| 截图安全 | 气泡为截图爆点，**无水印**（对齐 `api-spec` v2.2 D3 / `ART-BIBLE.md` §5.3） |

### 2.2 4 选项卡（位置随机）

| 项 | 规格 |
|----|------|
| 招式（固定语义，位置随机） | `move_firm`「我需要！」💪 / `move_compare`「我比过价了」📊 / `move_pity`「求求了」🥺 / `move_poison`「爱卖不卖」🤬（对齐 REVIEW §5.2 / `02` §2） |
| 位置随机 | 每轮 4 招**全出现、shuffle 位置**（seed 真随机），防肌肉记忆（对齐 `02` §1） |
| 按钮 | 白底 + `--fg`#222 文字 + `--radius-md` + 轻阴影；hover `translateY(-1px)`+阴影；press `scale(.97)` |
| 焦点环 | `outline: 3px solid var(--brand-orange); outline-offset:2px`（对齐 waimai H4 / `ART-BIBLE.md` §7.1） |
| 触控 | 每选项 ≥44×44px（`min-height:44px`） |
| 色盲 | 每选项 **icon + 文字** 双标识，不靠色相（对齐 `ACCESSIBILITY.md` §5） |
| C3 分区 | 选项为戏精层，用 `--brand-orange` 焦点环；宿主色 `--mart-host` 不进入选项按钮 |

### 2.3 双胜利结算卡（结局卡）

| 卡 | 触发 | 大标题 | 视觉 |
|----|------|--------|------|
| **破防态** | `affinity >= 100` | 「服了，下单吧」（`--font-title` 24px） | 白卡 + 绿高亮梗框（`--brand-green` 描边/底）+ 导购破功表情 + 破防度满槽绿光（success 语义） |
| **反消费胜利态** | `affinity <= 0` | 「省钱了，下次别来」（`--font-title` 24px） | 白卡 + 绿高亮梗框 + 「反套路赢」印章（`--font-brush` Ma Shan Zheng）+ 导购得意/瘫软表情（**success 语义，非失败**） |

- 尺寸：移动端基准 `375×N`，圆角 `--radius-xl`(24px)，**禁水印侵入**（对齐 `08` §2/§4）。
- 对比度：截屏社交压缩后仍 ≥4.5:1（正文 `--fg`#222 on `--bg-2`#fff 或绿高亮底；对齐 `08` §2/§5）。
- 双胜利**皆 success 绿框**，归零态（反消费胜利态）**绝不**红叉/失败渲染（对齐 `03` §3 / `ART-BIBLE.md` §2.4）。

### 2.4 归零态（明确禁用红叉 · 仅中性反馈）

> **关键裁定**：mart **无「输/失败」态**。`affinity <= 0` = **反消费胜利态**（双胜利第二赢法），渲染为 success 绿框 + 印章（§2.3），**禁用红叉 / 失败态 / 「你输了」文案**（红线 `ART-BIBLE.md` §9.1 #5 / `08` §4）。

- **终端归零态**（`affinity==0`）：见 §2.3 反消费胜利态——中性偏正反馈（「省了钱还逗乐他」），非惩戒。
- **轮内踩雷反馈**（-10，非终端）：选项按钮/气泡**轻微红边**（`--c-error`#ef4444 1px）闪烁一次 ≤200ms + 浮动「−10」（`--font-mono`，`--c-error`）——属**瞬时游戏反馈**，区别于终端失败红叉；**不制造焦虑**（不出现倒计时/FOMO/资产暗示，对齐 `ART-BIBLE.md` §9.1 #5/#6）。
- **轮内中性反馈**（+10）：轻微上移/光晕，浮动「+10」（`--font-mono`，`--fg-dim`#666），无强色。

### 2.5 其余复用组件（规格引用，不重定义）

- **whoknow 角标**：绿圆(`--brand-green`)白「?」，`--font-display`，右上角绝对定位，`pointer-events:none`（复用 waimai `.wk-mark` / `ART-BIBLE.md` §5.2）。
- **段子卡**：手写体(`--font-script`)+绿高亮底+说话者名`--brand-orange`（对齐 `08` §2）。
- **成就卡**：已解锁态 `--brand-green` 光晕（`box-shadow:0 0 0 3px rgba(110,218,120,.28)`），`Rarity` 枚举复用（`ART-BIBLE.md` §5.2 / `05`）。
- **底部 TabBar**：白底+顶边线；选中态 `--brand-orange` 填充图标+上凸（复用 waimai `.tabbar .tb.on`）。

---

## 3. 动效清单

> 原则：动效服务「戏」与「反馈」，单动作 ≤300ms；全部包 `@media (prefers-reduced-motion: reduce)` 降级瞬时（对齐 `BRAND.md` §8/§16、`ART-BIBLE.md` §7.1）。

### 3.1 选项随机呈现

| 项 | 规格 |
|----|------|
| 入场 | 4 选项按 shuffle 顺序淡入（stagger ≤80ms/项，总 ≤300ms）；`prefers-reduced-motion` 下无 stagger、瞬时出现 |
| 位置 | 每轮重随机，4 招全出现、不重复（逻辑见 `02` §1；视觉仅负责呈现） |

### 3.2 克制反馈演出（+40 / −10 / +10）

| delta | 视觉演出 | 色值/令牌 |
|-------|----------|-----------|
| **+40 弱点命中** | 导购头像/气泡 `--shadow-glow-green` 光晕 + 单次抖动 ≤300ms + 浮动「+40」 | 光晕 `rgba(110,218,120,.28)`；数字 `--font-mono` + `--brand-green`#6eda78 |
| **−10 踩雷** | 选项按钮/气泡轻微红边闪烁一次 ≤200ms + 浮动「−10」（瞬时游戏反馈，非失败屏） | 边 `--c-error`#ef4444；数字 `--font-mono` + `--c-error` |
| **+10 中性** | 轻微上移/光晕 + 浮动「+10」 | 数字 `--font-mono` + `--fg-dim`#666 |

> 破防度 meter 同步更新：带 `role="progressbar"` + `aria-valuenow` + 可见数值（「破防 72」）+ 阶段文案（轻劝/狠劝/松动/破防），非颜色独载（对齐 `03` §4 / `ACCESSIBILITY.md` §2 L）。

### 3.3 破防 / 反消费胜利演出

| 态 | 演出 |
|----|------|
| **破防态**(`>=100`) | 弹层弹簧放大（`cubic-bezier(.34,1.56,.64,1)` 300ms）+ 导购破功表情 + 绿光晕爆发 + 「服了，下单吧」逐字浮现 → 移交结局卡（§2.3） |
| **反消费胜利态**(`<=0`) | 导购得意/瘫软 + 绿框浮现 + 「反套路赢」印章盖下（`--font-brush`）+ 「省钱了，下次别来」→ 结局卡（§2.3） |
| 共通 | 二者皆 **success 绿**，无红叉；`prefers-reduced-motion` 下去动画、保留台词/绿框/印章（截图层不受影响） |

### 3.4 通用微交互

| 交互 | Duration | Easing | 位移/透明度 |
|------|----------|--------|------------|
| hover 反馈 | 150ms | `--ease-smooth` | `translateY(-1~2px)` + 阴影加深 |
| 按钮 press | 100ms | `--ease-smooth` | `scale(.97)` |
| 戏精弹层入 | 300ms | `--ease-spring` | `opacity 0→1` + `translateY(8px→0)` + `scale(.96→1)` |
| 浮动数字(+40/−10/+10) | 600ms | `--ease-smooth` | `translateY(0→-16px)` + `opacity 1→0` |
| reduced-motion | — | — | 全瞬时（`* { animation:none!important; transition:none!important }`，对齐 waimai H4） |

---

## 4. 对比度达标（MVP=Standard · WCAG 2.1 AA）

> 本节吸收 `ACCESSIBILITY.md` §6 已识别的 **4 处不达标**，给出**达标色值与尺寸**。**本节即为主理人后续补 `ART-BIBLE.md` §2.2（宿主令牌）与 §2.5（角色色）的依据**。

### 4.1 四处修正与达标值

| # | 原不达标组合 | 原对比度 | 修正（达标） | 达标对比度 | 落地令牌/约束 |
|---|-------------|----------|--------------|-----------|--------------|
| **C1** | `--mart-host`#FF5000 + 白字 | ≈3.3:1（小字不达标） | **暗字 `#1a1a1a`**（对齐 waimai 黄底暗字） | ≈5.5:1 ✅ | 新增 `--mart-host-fg: #1a1a1a`；宿主 CTA/标签文字用此 |
| **C2** | `--mart-price`#FF0036 常规字 | ≈4.0:1（不达标） | **价格文本 ≥19px bold**（大文本 3:1 阈值） | ≈4.0:1 ✅(大文本) | 价格数字 `--fs-xl`(20)+weight 800 或 `--fs-lg`(18)+weight 800；禁小号常规字 |
| **C3** | 角色色 chip 文本（role 色 on tint） | ≈2.8:1（不达标） | **chip 文本改 `--fg`#222** + 角色色作 3px 左边框/圆点 | ≈14:1 ✅ | chip 文本 `--fg`#222；角色色仅 accent（对齐 ART-BIBLE §2.5） |
| **C4** | 水印 `--fg-mute`#999 on `#f7f7f8` | ≈2.6:1（不达标） | **`--watermark-fg: #595959`**（或 `--fg-dim`#666） | ≈6.4:1 / 5.5:1 ✅ | 新增 `--watermark-fg: #595959`；水印只进页脚 |

### 4.2 达标已确认组合（无需修正）

| 组合 | 对比度 | 结论 |
|------|--------|------|
| `--fg`#222 on `--bg-2`#fff | ≈15:1 | ✅ 正文基准 |
| `--fg-dim`#666 on `#fff` | ≈5.7:1 | ✅ 次级文字 |
| `--brand-orange`#ff7849 焦点环（图形） | 3:1 | ✅ 焦点环属图形 |
| `--brand-green`#6eda78 on `#0a0612` | ≈9:1 | ✅（暗底装饰） |
| 语义 success `#10b981` 作图形/大粗/绿框 | — | ✅ 不作小号正文 |

### 4.3 待补 ART-BIBLE 依据（主理人采纳项）

- **补 §2.2**：新增 `--mart-host-fg: #1a1a1a`（宿主 CTA/标签文字），并注明「宿主色配**暗字**非白字」；新增 `--watermark-fg: #595959`。
- **补 §2.5**：角色色 chip 文本规则改为「`--fg`#222 文本 + 角色色左边框/圆点 accent，角色色不承载小号正文」。
- **补 §2.4/价格**：价格 `#FF0036` 须 ≥19px bold 使用（C2）。
- 以上为 Standard 档强制，MVP 上线前由 engineering-lead 用对比度工具终检（R4，见 `ACCESSIBILITY.md` §4）。

---

## 5. 资产总清单（生产/实现对照）

| # | 资产 | 类型 | 尺寸/令牌 | 字体 | 动效 | 对比度/色盲 | 状态 |
|---|------|------|-----------|------|------|-------------|------|
| A1–A5 | 5 导购头像 | 圆底+Emoji | 48/56/32px；`--role-*` | — | 破防抖动 | Emoji+名+chip 三重 | MVP |
| A6–A10 | 5 导购立绘 | 半身（后续） | 角色色制服 | — | — | 仍叠三重标识 | 后续 |
| B1 | 对线气泡 | 组件 | `--bg-2`+绿高亮底 | `--font-script` | 弹簧入 | 绿底≥4.5:1 | MVP |
| B2 | 4 选项卡 | 组件 | ≥44×44；`--brand-orange` 环 | `--font-body` | 随机淡入 | icon+文字 | MVP |
| B3 | 破防态结算卡 | 卡 | 375×N；`--radius-xl` | `--font-title`24 | 绿光晕+逐字 | success 绿框 | MVP |
| B4 | 反消费胜利态卡 | 卡 | 375×N；`--radius-xl` | `--font-title`24+`--font-brush`印 | 印章盖下 | success 绿框·禁红叉 | MVP |
| B5 | 段子卡 | 卡 | 375×N | `--font-script` | — | 绿底≥4.5:1 | MVP |
| B6 | whoknow 角标 | 组件 | 20px 圆 | `--font-display` | — | 绿底白「?」 | MVP |
| M1 | 选项随机 | 动效 | stagger≤80ms | — | 淡入 | reduced-motion 瞬时 | MVP |
| M2 | +40 反馈 | 动效 | ≤300ms | `--font-mono` | 绿光晕+抖动+「+40」 | 数字 `--brand-green` | MVP |
| M3 | −10 反馈 | 动效 | ≤200ms | `--font-mono` | 红边闪+「−10」 | 瞬时·非失败屏 | MVP |
| M4 | 破防/反消费演出 | 动效 | 300ms | — | 弹簧/印章 | 皆 success 绿 | MVP |
| C1 | 宿主 CTA 文字 | 色值 | `--mart-host-fg`#1a1a1a | — | — | 5.5:1 | MVP（补§2.2） |
| C2 | 价格数字 | 色值/尺寸 | `--mart-price`#FF0036 + ≥19px bold | `--font-body`/mono | — | 大文本 3:1 | MVP（补§2.4） |
| C3 | 角色色 chip 文本 | 色值 | `--fg`#222 + 角色色边框 | `--font-body` | — | 14:1 | MVP（补§2.5） |
| C4 | 水印文字 | 色值 | `--watermark-fg`#595959 | `--font-body` | — | 6.4:1 | MVP（补§2.2） |

---

## 6. 备注

- 本文件为 Phase 4 预制作备料（非实现），**未修改 `whoknow-mart/src/` 任何代码**，未修改 waimai 或其他 app 文件。
- 表述遵循 L2-C9 客观指代；规格与 `ART-BIBLE.md` / `ACCESSIBILITY.md` / `REVIEW.md` §5.1 / `BRAND.md` / `02`–`08` GDD 全链条对齐。
- 禁忌红线（真实 logo/价格/明星、红叉失败态、焦虑制造）贯穿全资产，运行时 `forbidden_check` `red_light_count>0` 整包拒绝（对齐 `07`）。

---

_胡闹宇宙 · whoknow-mart 资产规格 v0.1 · art-director 林绘澄 · 2026-07-26 · Phase 4 备料（非实现）_
