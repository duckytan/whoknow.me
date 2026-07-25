# prototype/config/ — 部署副本（非权威源）

## 这是做什么的
Vercel 当前以 `prototype/` 为静态 `outputDirectory` 部署（见根 `vercel.json`）。
只有 `prototype/` 内的文件会被发布，因此产品配置 `latest-config.json` / `fallback.json`
必须在此副本里，才能通过 `/waimai/config/*` 与 `/config/*` 路由暴露给前端拉取。

## 权威源在哪
**真实产品配置权威源 = `whoknow-waimai/public/config/`**（brain 生成 / 前端运行时拉取）。
本目录是它的一份只读部署副本。

## 同步规则（改了权威源必须同步）
```bash
cp whoknow-waimai/public/config/latest-config.json prototype/config/latest-config.json
cp whoknow-waimai/public/config/fallback.json      prototype/config/fallback.json
```
改完务必重跑 `tests/scan-product-surface.ts`（红线闸门）确认 `red_light_count === 0`。

## 未来迁移（Vue 应用上线后）
- `vercel.json` 的 `outputDirectory` 改指 Vue 构建输出目录（如 `whoknow-waimai/dist`）；
- 删除本目录副本；
- `config` 改由 Vue 的 `public/` 提供，或继续从 `whoknow-waimai/public/config/` 经构建拷贝。
