// platformConfig.ts — 管理平台配置仓储（M0–M2 手动，VersionedStore 版本化）
//
// 落地到 <dataRoot>/config，与 formulas / knowledge 平行的 data 树（被 .gitignore 忽略，本地居留）。
// 一份配置包 = 一个 VersionedStore 记录（id 默认 'default'），同时含 sources + weights。
// 改配置 = 追加新版本（旧版不可变，支持回退追溯），契合 ADR-001「只增不删改」。

import { join } from 'node:path'
import { VersionedStore, type RecordStatus, type StoredRecord } from '../storage/versionedStore.ts'
import type { PlatformConfig, SourceChannel, TypeWeight } from './types.ts'

export const CONFIG_SCHEMA = 'brain.platform-config/1'
export const DEFAULT_CONFIG_ID = 'default'

export type PlatformConfigRecord = StoredRecord<PlatformConfig>

/** M0-M2 手动初始配置种子：2 条可用信源 + 1 条涉敏源默认暂停，权重档位给示范值。 */
export function makeDefaultConfig(): PlatformConfig {
  const sources: SourceChannel[] = [
    {
      id: 'rss-ithome',
      name: 'IT之家科技 RSS',
      kind: 'rss',
      category: 'tech',
      url: 'https://www.ithome.com/rss/',
      politics_sensitive: false,
      health: 0.8,
      weight: 0.7,
      status: 'active',
    },
    {
      id: 'api-openweather',
      name: 'OpenWeather 免费天气 API',
      kind: 'api',
      category: 'weather',
      url: 'https://api.openweathermap.org/data/2.5/weather',
      politics_sensitive: false,
      health: 0.9,
      weight: 0.9,
      status: 'active',
    },
    {
      id: 'rss-politics',
      name: '时政 RSS（涉敏，默认暂停）',
      kind: 'rss',
      category: 'news',
      url: 'http://example.com/rss/politics.xml',
      politics_sensitive: true,
      health: 0.6,
      weight: 0.0,
      status: 'paused',
    },
  ]
  const weights: TypeWeight = {
    app_priority: { waimai: 1.0, mart: 0.8 },
    genre_priority: { weather: 1.0, workplace: 0.9, silly_news: 1.0, meme: 0.85 },
    dimension_weights: {
      hit_rate: 1,
      freshness: 1,
      relevance: 1,
      authority: 1,
      stability: 1,
      meme: 1.2,
    },
  }
  return {
    sources,
    weights,
    meta: {
      version_label: 'v1 初始配置',
      updated_by: 'seed',
      notes: 'M0-M2 手动初始配置；cron 自动升降留 M3',
    },
  }
}

export class PlatformConfigRepo {
  readonly store: VersionedStore<PlatformConfig>

  constructor(dataRoot: string, now?: () => Date) {
    this.store = new VersionedStore<PlatformConfig>({
      root: join(dataRoot, 'config'),
      store: 'config',
      schema: CONFIG_SCHEMA,
      now,
    })
  }

  /** 配置包是否存在（M0-M2 手动：init 前先查，避免覆盖）。 */
  async exists(id: string): Promise<boolean> {
    return (await this.store.listVersions(id)).length > 0
  }

  /** 新建配置包（v1）。已存在抛 RECORD_EXISTS。 */
  create(id: string, body: PlatformConfig): Promise<PlatformConfigRecord> {
    return this.store.create(id, body)
  }

  /** 修改配置 = 追加新版本（旧版保留，可回退）。 */
  revise(id: string, body: PlatformConfig): Promise<PlatformConfigRecord> {
    return this.store.addVersion(id, body)
  }

  latest(id: string): Promise<PlatformConfigRecord> {
    return this.store.getLatest(id)
  }

  version(id: string, version: number): Promise<PlatformConfigRecord> {
    return this.store.get(id, version)
  }

  setStatus(id: string, status: RecordStatus, reason?: string): Promise<void> {
    return this.store.setStatus(id, status, reason)
  }

  listIds(): Promise<string[]> {
    return this.store.listIds()
  }

  readIndex() {
    return this.store.readIndex()
  }

  rebuildIndex() {
    return this.store.rebuildIndex()
  }
}
