# Sprint 1 · whoknow-mart 垂直切片（Phase 4 收口 → Phase 5 入口）

> **主理人汇编** · 游承峰 · 2026-07-26
> 范围：把 Phase 4 三路交付固化为首个可验证冲刺，定义 Phase 5 制作入口。
> 关联门控：`docs/gdd/PHASE4-GATE.md`（PASS-with-CONCERNS）

---

## 1. Sprint 目标

验证「导购对线」核心循环在纯前端可跑通、且三大否决项机检能拦坏配置；为 Phase 5 内容填值与 MVP 打磨铺路。

---

## 2. 本冲刺已完成（Definition of Done 达成）

- [x] Vue3+Vite+Vant+TS+PWA 脚手架（`base:'/mart/'`、端口 5174 避 waimai 5173）
- [x] 核心模块：02-memory / 03-matrix(1+1+2 锁) / 04-forbidden-check(同源复制) / 07-selection-state-machine(自建 `MartRoundState`)
- [x] 三大否决项单测 **12/12 绿**（实测 `npm test`）
- [x] CI 门禁脚本（L1-T5 / forbiddenCheck 双份 / 单测 / vue-tsc+构建）全 ✅（实测 `npm run ci`）
- [x] `UX-SPEC.md` + `PHASE4-CONTENT.md` + `ASSET-SPECS.md` 三文档齐
- [x] L1-T5 红线守住（0 个 waimai 文件改动）

---

## 3. Phase 5 制作 Backlog（Epic / Story）

### Epic A · 内容填值与标定（`design-strategist` + `eng-lead`）
- **A1** 填 5 导购 `lineBuckets` 台词（first/regular/vip），过 `forbidden_check` 终审（红灯 0 容忍）
- **A2** 定 4 型矩阵 delta（保持 1+1+2），playtest 标定 H5 分布均衡
- **A3** 填商品池（价格占位字符串 / 店名化名）+ 比价素材
- **A4** 标定 `affinity.initial` / `roundCap` / 记忆分级阈值(3/10) / 保底轮次 N

### Epic B · 视觉与可访问性（`art-director` + `eng-lead`）
- **B1** 对比度工具终检（`ASSET-SPECS.md` §4 四值），据结果补 `ART-BIBLE.md` §2.2/§2.5（C2）
- **B2** 实现 5 导购立绘/头像/角色色 chip（emoji+中文名+chip 三重标识）
- **B3** 实现 UI 组件（对线气泡 / 4 选项卡随机 / 双胜利结算卡 / 归零态中性）/ 动效

### Epic C · 部署与集成（`eng-lead` + `release-ops-lead`）
- **C1** 首部署联调（`vercel.json` `/mart` rewrite ↔ `dist/mart` 一致性，C3）
- **C2** EVOL-1 落地后实现 `BrainConfigSource`（v2 接 brain）

### Epic D · 质量门（`quality-lead`，Phase 6）
- **D1** Playtest ≥3 轮，验证「好玩」假说（笑率 H2 / 分布 H5 / 记忆 H1）
- **D2** 三大否决项回归 + 红线机检

---

## 4. 本冲刺明确排除

- 不接 brain（P0-C 挂起）
- 不做社交 / 图鉴 / 成就扩展（留待后续冲刺）
- 不编造手感数值（全 `[待测试]`，待 playtest）

---

## 5. 验收

- 本地 `npm run dev` 可进 `GameView` 跑通一局双胜利
- `npm run ci` 全绿
- 三文档 + 门控（`PHASE4-GATE.md`）齐备

---

_胡闹导购 · whoknow-mart Sprint 1 · 主理人 游承峰 · 2026-07-26_
