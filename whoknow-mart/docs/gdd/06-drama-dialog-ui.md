# 🛒 胡闹导购 · 系统 GDD 06 · 戏精弹层 UI（L1/L2 渲染）

> **版本**：v1.0 · 2026-07-26 · design-strategist（与 art-director 对齐）
> **层**：UI（渲染层）· MVP 必做
> **上游**：`00-CONCEPT.md` §8（视觉锚点）§9.5（水印分离）· `ART-BIBLE.md` §4（导购视觉）§5（UI 语言）§7（无障碍）· `BRAND.md` §7.6（弹层）§17（WCAG）
> **下游**：`08-screenshot-share.md`（结局卡/段子卡出图）

---

## 1. 机制（Mechanics）

戏精弹层是「戏精由选择触发，非贴图」（P4）的视觉载体：导购头像 + 手写体金句 + 选招 4 选项组，弹簧入场。截图保持干净淘宝伪装（P2 截图即胜利）——水印只进页脚，绝不覆盖弹层/气泡/结局卡。

- **触发**：进商品页/点结算 → 导购闪现（首爆点 P6）；每轮出 4 选项。
- **戏精由选择触发**：弹层内容来自 02 状态机产出，非预置贴图。
- **截图安全区**：弹层/气泡/结局卡为截图爆点，无水印（api-spec §P0-3 D3）。

## 2. 数据（Data）

**令牌引用（精确，C3）**：

| 用途 | Token | HEX | 来源 |
|------|-------|-----|------|
| 宿主伪装主色（顶栏/搜索/价格标/结算 CTA） | `--mart-host` | #FF5000 | ART-BIBLE §2.2 |
| 胡闹动作/戏精强调/焦点环/说话者名 | `--brand-orange` | #ff7849 | ART-BIBLE §2.1 |
| 金句高亮底 | `--brand-green` | #6eda78 | BRAND §2.1 |
| 角色色（头像底/标签 chip/破防描边） | `--role-angry/gentle/lazy/philo/weird` | 见 REVIEW §5 | ART-BIBLE §2.5 |
| 戏精弹层底 | `--bg-2` | #ffffff | BRAND §2.3 |

**字体**：金句 `--font-script`（ZCOOL KuaiLe）；选项 `--font-body`；破防数值 `--font-mono`（ART-BIBLE §3.4）。

**组件**：戏精弹层 `BRAND.md` §7.6（弹簧入场 `cubic-bezier(.34,1.56,.64,1)`，≤300ms）；4 选项组白底+`--fg`+`--radius-md`+焦点环 `--brand-orange` 3px（ART-BIBLE §5.5）。

## 3. 状态（State）

| 态 | 说明 |
|----|------|
| 弹层出现 | 弹簧入场 + 导购头像 + 金句/4 选项 |
| 选项 hover/press | `scale(.97)` + 阴影 |
| 命中弱点反馈 | 头像/气泡 `--shadow-glow-green` 光晕 + 单次抖动 ≤300ms + 「+40」浮动（mono） |
| 弹层关闭 | 移交下一轮/结局卡 |

## 4. 边界（Boundaries）

- **水印只进页脚**（首页/结算底部），**绝不**覆盖戏精弹层/气泡/结局卡（api-spec D3，ART-BIBLE §5.3）。
- **C3 令牌分区**：宿主皮用 `--mart-host`，胡闹/戏精用 `--brand-orange`，二者不混用同一组件。
- 角色色仅用于头像底/标签 chip/破防描边，不承载小号正文（ART-BIBLE §2.5）。
- 锚色仅作点缀/大色块，不承载小号正文（BRAND §17）。

## 5. 失败模式（Failure modes）

| 失败 | 表现 | 处置 |
|------|------|------|
| 水印误覆盖弹层 | 截图被 brain 水印污染 | 红线 P2 → 视觉自检拒收，隔离页脚 |
| 破防 meter 缺数值 | 仅颜色表示状态 | WCAG 失败 → 强制带数值+阶段文案 |
| reduced-motion 未降级 | 动效未瞬时 | `@media (prefers-reduced-motion: reduce)` 全瞬时（BRAND §16/§17） |
| 焦点环缺失 | 键盘不可达 | 焦点环 `--brand-orange` 3px offset 2px（ART-BIBLE §7.1） |

## 6. 数值占位（[待测试]）

| 项 | 占位 | 标定 |
|----|------|------|
| 弹层入场时长 | 300ms（对齐 BRAND §16） | 动效手感 |
| 命中抖动 | ≤300ms | 反馈强度 |
| 4 选项触控 | ≥44×44px（WCAG，ART-BIBLE §7.1） | 可达性 |

## 7. 契约对齐（Contract alignment）

- **复用**：BRAND/ART-BIBLE 令牌与组件（戏精弹层/段子卡/焦点环/TabBar）；`ui_meta` 水印驱动页脚（§9.1）。
- **对话文案过 `forbidden_check`**（§9.5，见 07）。
- **不修改 waimai 文件**（L1-T5）；UI 令牌复制 waimai `:root` 与 H4 回归区块（ART-BIBLE §8.1）。

## 8. 验收（Acceptance）

- [ ] 截图文案/气泡/结局卡无水印（页脚除外，P2 截图即胜利）。
- [ ] 弹层弹簧入场（≤300ms），`prefers-reduced-motion` 降级瞬时。
- [ ] 4 选项图标+文字双标识（色盲友好），焦点环 `--brand-orange` 3px。
- [ ] 宿主皮用 `--mart-host`、戏精用 `--brand-orange`（C3 分区正确）。
- [ ] 破防 meter 带数值+阶段文案，色盲可理解（WCAG AA）。

---

_系统 GDD 06 · 戏精弹层 UI v1.0 · design-strategist · 2026-07-26_
