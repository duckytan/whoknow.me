# 胡闹外卖埋点设计（INSTRUMENTATION）

## 这东西实际干嘛

上线前没法用真人笑率把关（笑率闸门已豁免），所以上线后用"用户行为"代替"好笑与否"：

- 用户愿不愿意**截图分享** → 东西值不值得发朋友圈（传播力）
- 用户愿不愿意**复玩（再来一单）** → 看一遍够不够、会不会腻（可持续性）

这两个信号喂给"重复疲劳代理指标"，决定要不要启动 P3 内容扩容。详见 `docs/release/P2-VALIDATION-PLAN.md`。

## 模块位置

`src/analytics/tracker.ts` —— 极简事件总线，**零第三方依赖**。

## 事件定义

| 事件 | 触发点 | context（组合上下文） |
|---|---|---|
| `share_click` | 完成页「📸 截图分享」按钮（纯点击，无文本框） | `addressTag`, `remarkTag`（刚完成的组合） |
| `replay` | 完成页「再来一单」(`reset`) + 历史页「再来一单」(`goReorder`) | 完成页带 `addressTag/remarkTag`；历史页不带 |

## 存储与读取

- 事件落 `localStorage`（key `whoknow_waimai_events_v1`），最多保留 **500 条**，超出丢最旧。
- 读：`tracker.getStats()` → `{ share_click, replay, total }`。
- 清：`tracker.clearStats()`。
- 无 `localStorage` 环境（如 node 测试）**自动回退内存**，保证可测、不崩。

## 前期省成本说明（主理人拍板"前期能省则省"）

- 不引任何第三方分析库（Firebase / GA 等）。
- `ANALYTICS_ENDPOINT` 默认空 = 不上报后端，纯本地。
- 前期靠手动观察 + 读 `localStorage` 即可回收信号，零运维成本。

## 跨项目配合（喂未来 whoknow-brain）

- 事件 schema 预留 `app` + `context{addressTag, remarkTag}`，未来 **whoknow-brain** 的"反馈加权自我进化"可直接消费：哪组段子 `share/replay` 高 = 好，低 = 疲劳，自动调权重。
- 后期"该花就花"时：把 `ANALYTICS_ENDPOINT` 填成大脑 ingestion 端点（或 Vercel Analytics），`track` 会自动 `navigator.sendBeacon` 异步上报，**主流程零改动**。

## 接后端的位置（唯一改动点）

`tracker.ts` 顶部：

```ts
const ANALYTICS_ENDPOINT = '' // 填 Vercel/自建端点即启用上报；留空则纯本地
```

## 测试

`src/analytics/tracker.test.ts` 覆盖计数累计、context 透传、500 条上限。纳入 `npm test`（node:test）。
