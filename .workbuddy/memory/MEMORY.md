# whoknow.me 项目长期记忆

## 项目定位
- 品牌：whoknow · 胡闹宇宙（whoknow.me，创始人 Ducky 錡 / 锡哥）
- 人格：胡闹 + Who knows? + 家人们谁懂啊。娱乐化、梗向、截图传播驱动
- 主体：个人开发者，无营业执照；Vercel 海外部署 + 纯广告模式；里程碑制 M1-M4，无固定工期

## 产品矩阵（whoknow-* 统一前缀）
| 子项目 | 定位 | 阶段 | 技术栈 |
|---|---|---|---|
| whoknow-waimai | 胡闹外卖：披美团外衣的虚拟外卖 | M1 代码完工 | Vue3 + Vite + Vant + Pinia + vue-router + SCSS |
| whoknow-mart | 胡闹导购：披淘宝外衣的反骨导购博弈（选招制） | 概念 | 拟复用 Vue3+Vant |
| whoknow-brain | 胡闹控制中心：共用 AI 后台（导演角色，不上台） | 概念 | api-spec 已定义 |

## 设计相关要点
- 主站 index.html：暗色霓虹风（黑紫底 #0a0612 + 绿 #6eda78 + 橙 #ff7849），字体 Inter/Noto Sans SC/JetBrains Mono/Bungee/ZCOOL
- whoknow-waimai UI 决策：8 分相似美团 + 少量品牌独有元素（錡哥拍板）
- 品牌视觉规范 BRAND.md 已创建（2026-07-24 · UI Designer）：双主题（宇宙暗色主站 + 产品浅色子App）+ 品牌锚色（绿#6eda78/橙#ff7849/紫#8b5cf6）统一策略；配套 `styles/design-tokens.css` 可 import 令牌
- 传播铁律：每个交互必须能回答"用户会截图发朋友圈吗？"

## 关键约束
- 四大痛点滤网：无聊 / 想笑 / 没时间没钱 / 想减肥管不住手（任何功能先过此滤网）
- 用户思维铁律：能用吗？会爽吗？会传播吗？

## 工程约定
- Git 代理坑：克隆/拉取须用 127.0.0.1:12000 代理（见 2026-07-24.md）
- 单 Vercel 整仓托管多 app（非标准 monorepo）；每 app 走 `/短名` rewrite → `whoknow-<app>/dist`；vercel.json 路由 /waimai → whoknow-waimai/dist（旧记 `waimai/index.html` 已过时，以 `胡闹宇宙总体设计方案.md` §11 为准）
