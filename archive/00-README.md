# 📦 archive/ · 已归档的废旧资产

> 本目录存放**已被取代、废弃或过期**的胡闹宇宙资产。工作树（根 + 各子项目）只保留「最新可用」文件。
> 权威总纲见根目录 `胡闹宇宙总体设计方案.md`。

## 归档内容

| 目录 | 来源 | 为何归档 |
|---|---|---|
| `v1-waimai-app/` | `whoknow-waimai/` 的 v1 实现 | 锡哥拍板**放弃 v1**（美团换皮 + 静态戏精文案），v2 重建中。代码 + 旧 DEVELOPER/PROJECT-STATUS |
| `waimai-docs-old/` | `whoknow-waimai/docs/` 的旧 audit/research/decisions/reviews/specs | 被三司会审总审计-v2、GDD-v2、DATA-STRUCTURE、DRAMA-ENGINE-V2 取代 |
| `root-obsolete/` | 根目录 index/styleguide/experiments/ROADMAP/ARCHITECTURE/.rebrand_tmp.py 等 | v1 门面与过时路线图；ROADMAP/ARCH 已被总纲取代 |
| `brain-audit-v1/` | `whoknow-brain/docs/` 的总审计-v1 + 升级方案 | 被「总审计-v2」取代，升级方案已收敛进总纲 §9 |
| `temp-scratch/` | 根 `temp/`（子 agent 跑出的 sanshi-pack 草稿等） | 临时暂存，非项目资产 |

## 红线提醒

`v1-waimai-app/src/data/*.json`、`DEVELOPER.md`、`PRODUCT-V3.md`、旧 `DRAMA-ENGINE.md` 内**仍含禁忌词红灯**（公厕 / 百慕大 / ICU / 炸弹 / 诈尸 / 吃死 等）。这些文件已不在构建路径，但**切勿拷贝回工作树**——v2 的合规数据以 `DRAMA-SEED-v1` + `DATA-STRUCTURE` 为准。

## 还原方式

如需还原某文件：`git mv archive/<path> <原路径>` 即可（git 历史保留为 rename）。
