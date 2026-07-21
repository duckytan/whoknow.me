# 🤖 胡闹外卖 · AI 开发规范（AI-DEV-GUIDE）

> **这是给所有参与开发的 AI 看的工作规范**
> **制定日期**：2026-07-21
> **优先级**：本文件 > 任何 AI 的默认行为习惯
>
> 锡哥不懂技术，所有开发由 AI 执行。本文件是 AI 的「工作合同」——
> 让不同对话/不同 AI 产出的代码保持一致风格，不返工。

---

## 第一章：开始新对话前必读

**每次新对话开始，AI 必须先读这 4 个文件，再动手：**

```
1. docs/specs/AI-DEV-GUIDE.md   ← 本文件（规范）
2. docs/specs/DEV-PLAN.md        ← 今天做什么（任务）
3. docs/specs/ACCEPTANCE.md      ← 做完怎么算完成（标准）
4. DEVELOPER.md                  ← 技术栈/数据模型/NPC 设计（背景）
```

**不允许**：没读文档就直接写代码。

---

## 第二章：任务执行规范

### 2.1 每次只做一个 Day 的任务

- 不要超前做（Day 2 没做完，不要动 Day 3）
- 每完成一个 Task，立即对照 `ACCEPTANCE.md` 验收对应条目
- 当天任务全部完成 + 验收通过 → 更新 `DEV-PLAN.md` 把完成的 `[ ]` 改为 `[x]`

### 2.2 遇到不确定的设计决策

**不要自己拍板，改为列出选项问锡哥：**

```
❌ 错误：自己决定用 Swiper 还是 Vant Swipe
✅ 正确：「这里需要选择：A方案… B方案… 你倾向哪个？」
```

**以下可以自己决定（不需要问）**：
- 具体变量命名
- 函数内部实现细节
- CSS 样式细节（颜色/间距/字号，以 Vant 默认为准）
- 错误处理方式

### 2.3 遇到卡点

按顺序处理：
1. 先查 `opensource-refs/` 对应的参考项目（DEV-PLAN 里有指引）
2. 查 Vant UI 4.x 文档
3. 还不行 → 告诉锡哥「这里我需要确认：[具体问题]」

---

## 第三章：代码规范

### 3.1 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| Vue 组件 | PascalCase | `ShopCard.vue` / `CartBar.vue` |
| TypeScript 工具 | camelCase | `npcEngine.ts` / `reviewGenerator.ts` |
| Store 文件 | camelCase | `cart.ts` / `order.ts` |
| JSON 数据 | kebab-case | `shops.json` / `quotes.json` |
| SCSS 文件 | kebab-case | `vant-override.scss` / `global.scss` |

### 3.2 目录结构（不得随意创建新目录）

```
src/
├── pages/          ← 页面级组件（直接被路由引用）
├── components/     ← 可复用组件
│   ├── base/       ← 通用基础组件（Header/TabBar）
│   ├── shop/       ← 商家相关
│   ├── npc/        ← NPC 系统
│   ├── order/      ← 订单相关
│   └── review/     ← 评价相关
├── store/          ← Pinia store
├── data/           ← JSON 写死数据
├── utils/          ← 工具函数
├── styles/         ← 全局样式
└── router/         ← 路由配置
```

**新建目录必须有充分理由，不能随意在 src/ 下创建新层级。**

### 3.3 TypeScript 规范

```typescript
// ✅ 正确：所有数据模型必须有 interface 定义
interface Shop {
  id: string;
  name: string;
  bossPersonality: 'angry' | 'gentle' | 'weird' | 'lazy' | 'philosophical';
  // ...
}

// ❌ 错误：用 any
const shop: any = { ... }

// ✅ 正确：Pinia store 有类型
const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);
  // ...
})

// ❌ 错误：直接操作 localStorage 散落在组件里
// ✅ 正确：localStorage 操作只在 store 里做
```

### 3.4 Vue 组件规范

```vue
<!-- ✅ 正确写法 -->
<script setup lang="ts">
// 1. import 放最前面
import { ref, computed } from 'vue'
import { useCartStore } from '@/store/cart'

// 2. props 定义
const props = defineProps<{
  shop: Shop
}>()

// 3. store
const cartStore = useCartStore()

// 4. 本地状态
const isLoading = ref(false)

// 5. 计算属性
const totalPrice = computed(() => cartStore.totalPrice)
</script>

<template>
  <!-- 移动端优先，不写 PC 布局 -->
</template>

<style lang="scss" scoped>
/* 只写当前组件的样式，不写全局覆盖 */
/* 全局覆盖放 global.scss 或 vant-override.scss */
</style>
```

### 3.5 LocalStorage 规范

**统一键名**（不能用中文、不能随意命名）：

| 数据 | localStorage 键名 |
|------|-----------------|
| 购物车 | `chaos_cart` |
| 订单列表 | `chaos_orders` |
| 用户 ID | `chaos_user_id` |
| 评价列表 | `chaos_reviews` |

**读写统一在 store 里做，组件不直接操作 localStorage。**

### 3.6 NPC 定时器规范

```typescript
// ✅ 正确：保存 timer 引用，组件销毁时清除
const timers: ReturnType<typeof setTimeout>[] = []

function triggerOrderFlow(order: Order) {
  const t1 = setTimeout(() => {
    // 接单逻辑
  }, randomDelay(2000, 5000))
  timers.push(t1)
}

// 在 onUnmounted 中清除
onUnmounted(() => {
  timers.forEach(t => clearTimeout(t))
})

// ❌ 错误：不保存引用，不清除
setTimeout(() => { /* ... */ }, 3000)
```

---

## 第四章：禁止事项

以下是**绝对禁止**的行为，违反会导致大量返工：

### ❌ 绝对不做

1. **不做后端** —— Phase 1 全 JSON 写死，没有 API，没有数据库
2. **不做用户登录/注册** —— localStorage UUID 足够
3. **不做真实地图**（百度/高德/Google Maps）—— 简单 SVG 就行
4. **不做真实支付** —— 永远不做
5. **不做签到系统** —— 已被痛点审计砍掉
6. **不在 M1 做历史订单页** —— M2 的功能
7. **不用 class 组件**，只用 `<script setup>`
8. **不用 Options API**，只用 Composition API
9. **不随意安装新依赖**（新增依赖必须说明理由，只允许 Vant 生态相关）
10. **不写 `console.log` 调试代码** 提交代码时必须清除

### ❌ 功能克制原则

> 做任何新功能前，先问：「这解决了 4 大痛点里的哪一个？」
> 答不出来 → 不做，记录到 M2 Backlog

---

## 第五章：数据规范

### 5.1 商家数据要求（shops.json）

- 15 家，不能随意减少
- 5 种性格各 3 家（不能偏倚）
- 名字有创意、有代入感（不能是「商家1」）
- `bossMottos` 每家 5 条，每条不超过 20 字，有笑点
- 图片用 `https://api.dicebear.com/7.x/bottts/svg?seed={唯一seed}` 生成（不需要真实图片）

### 5.2 菜品数据要求（dishes.json）

- 100 道，每家 6-7 道
- 菜名有创意（配合老板性格，angry 的店菜名也带点凶）
- 价格范围：8-68 元（不要全是 9.9/99 这种极端）
- `description` 字段就是「老板说」，必须有，不能为空

### 5.3 话术要求（quotes.json）

- 模板数 ≥ 20 条
- 变量用 `{shopName}` `{dishName}` `{riderName}` 格式
- 每条有笑点，能让人看了发出「哈」的反应
- 按性格分组，各性格的语气有明显区别

---

## 第六章：进度汇报规范

每完成一个重要步骤，用以下格式告诉锡哥：

```
✅ 完成：[做了什么]
📋 验收：[ACCEPTANCE.md 哪几条已通过]
🔴 问题：[有无未解决问题，没有就写「无」]
⏭️ 下一步：[准备做什么]
```

**不要**长篇大论解释技术实现细节——锡哥不懂技术，只关心「做好了没有」。

---

## 第七章：项目上下文速查

| 项目 | 值 |
|------|----|
| 产品名 | 胡闹外卖 |
| Slogan | 零卡路里的外卖，越点越瘦 |
| 主题色 | #ff6b35（胡闹橙）|
| GitHub 仓库 | duckytan/chaos-waimai（私有）|
| 技术栈 | Vue 3 + Vite + TypeScript + Vant 4.x + Pinia |
| 部署平台 | Vercel |
| 验证期域名 | nofood.foodcheck-ai.com |
| 当前目标 | M1 能下单（5-6 天）|
| 参考项目位置 | opensource-refs/github/ 和 opensource-refs/gitee/ |

---

## 第八章：文档更新规范

开发过程中需要更新的文档：

| 文档 | 何时更新 |
|------|---------|
| `DEV-PLAN.md` | 每完成一个任务，把 `[ ]` 改为 `[x]` |
| `QA-CHECKLIST.md` | 发现 Bug 时追加到「问题记录」区 |
| `PROJECT-STATUS.md` | 每完成一个 Day，更新进度 |
| `ACCEPTANCE.md` | 通过验收的条目标记 `[x]` |

**不需要更新**的文档：DEVELOPER.md / AI-DEV-GUIDE.md（本文件）——除非有重大技术决策变更。

---

_制定：码农虾 💻 · 2026-07-21_
_适用：所有参与胡闹外卖开发的 AI（CodeBuddy / Claude / GPT / Cursor 等）_
