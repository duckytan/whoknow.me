> **本 RUNBOOK 已作废（2026-08-01）**
> 原因：产品已改为纯点击（无自由文本输入），且切片引擎由 `sliceDrama` 驱动、无 `branch_id` 概念。本手册中的"填备注文本""抄 branch_id""12 单普通单"等流程均已失效。
> 现行 Playtest 流程见 `../qa/LAUGH-GATE-KIT-2026-07-31.md`（笑率闸门降级 3-5 人执行包：阈值 / 脚本 / 记录表 / 外壳 vs 内核归因法 / 两道新门）。
> 本文件仅作历史存档，照此招人会当场卡住。

# 胡闹外卖 · 真机 Playtest 操作手册（RUNBOOK）【已作废】

> 配套：`PLAYTEST-CHECKLIST-2026-07-25.md`（硬闸门口径）、`scorecard-template.csv`（评分表）、`scripts/playtest-aggregate.ts`（CSV → 判定）。
> 本手册把"什么叫产品做完了"变成 tester 能照着点、能精确记录的动作。

## 0. 环境
- 线上地址：`https://www.whoknow.me/waimai/`（手机浏览器或桌面均可，建议用手机尺寸验证）
- 结果页**已显示命中分支 id**（"命中：xxx"），请照抄到评分表 `branch_id` 列
- 同店递进依赖 `localStorage` 持久化的"本店第 N 单"，**同一浏览器连续下单才会累加**；开始一个场景前用「我的 → 设置 → 清空数据」重置

## 1. 评分表怎么填
打开 `scorecard-template.csv`，**删掉示例行**，每下一单记一行：

| 列 | 含义 | 取值 |
|----|------|------|
| `tester_id` | 测试者代号 | 你名字/缩写 |
| `session_id` | 本轮会话编号 | 同一轮连玩用同一个，如 `S1` |
| `order_seq` | 本轮第几单 | 1,2,3… |
| `shop_id` | 选的店 | `s01`~`s05` |
| `branch_id` | 结果页显示的命中分支 | 照抄，如 `default`、`regular_3rd`、`rider_r003_lost` |
| `funny_score` | 好笑程度 | 1–5（5=笑出声） |
| `repeat_feel` | 是否觉得"又是这套" | `0`=新鲜 / `1`=重复感 |
| `note` | 自由备注 | 别用裸逗号；含逗号用双引号包裹 |

## 2. 四个必跑场景（覆盖 H1–H4）

### 场景 A — 普通单疲劳（验 H1 重复疲劳）
- 选 **s01**，连续点 **12 单普通单**（金额/备注随机，不触发特殊分支）。
- 记录 12 行 `branch_id` 序列。期望：能看到 `default / default_b / default_c / default_d / default_e / default_f / default_g / default_h` 轮换，**不应出现 ≥3 次连续相同分支**。
- `repeat_feel` 如实勾：如果某一单你心里"嗐又来"，记 1。

### 场景 B — 同店递进差异（验 H2）
- 先「清空数据」。选 **s01**，连续点 **5 单**（每次都下单，不要切店）。
- 重点看第 **3 单**是否命中 `regular_3rd`（解锁成就「老主顾」）、第 **5 单**是否命中 `vip_5th`（解锁「铁粉 VIP」），且这两单台词明显不同于普通单。
- 若没触发：检查结果页"本店第 N 单"计数是否随下单增长；若卡住，清数据重来。

### 场景 C — 成就全可达（验 H3）
逐店/逐条件触发特殊分支，核对成就墙（「我的 → 成就」）解锁：
- 穷鬼：`orderTotal` 设很低（如 ¥8）→ `poor` / `poor_b`
- 黑暗料理：`avgDishPrice` 设很高（如 ¥88）→ `odd_eats` / `odd_eats_b` / `odd_eats_c`
- 老板拉黑：备注填「拉黑」→ `boss_blacklist`
- 多放辣：备注填「多放辣」→ `remark_more_spicy`
- 别骂了：备注填「别骂了」→ `remark_no_scold`
- 奇葩地址：地址填奇怪内容 → `address_weird`
- 店专属人格：分别选 s01–s05 各点几单，会命中 `shop_s0X_*` 系列
- 骑手专属：多换骑手，命中 `rider_r00X_*`
- 目标：把 12 个成就（含 `regular` / `vip_fan`）全部点亮。

### 场景 D — 无障碍（验 H4）
- 键盘：`Tab` 能否走通 选店→填单→下单→再来一单，焦点环是否清晰可见
- 动效：系统开「减少动态效果」后，进场动画应消失
- 热区：按钮/入口点击区域是否够大（≥44px），不会误触
- 字号：正文字号是否readable，无溢出

## 3. 交回与汇总
- 把填好的 `scorecard.csv` 放回 `docs/playtest/`（或发回主理人）。
- 主理人跑 `node --experimental-strip-types scripts/playtest-aggregate.ts docs/playtest/scorecard.csv` 自动出 H1–H4 判定。
- 判定口径见 `PLAYTEST-CHECKLIST-2026-07-25.md` §2：
  - **H1 笑率**：`funny_score` 中位 ≥3.5 且 ≥60% 订单 ≥4 → PASS
  - **H1 疲劳**：`repeat_feel=1` 占比应低（建议 <30%）；场景 A 出现 ≥3 连相同 → FAIL
  - **H2 同店**：第3单 `regular_3rd` + 第5单 `vip_5th` 均触发且台词异 → PASS
  - **H3 成就**：12/12 解锁 → PASS
  - **H4 无障碍**：D 项无阻断 → PASS
