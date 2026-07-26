// useMart.ts — mart 运行时门控 composable（零改写消费信封 + 红线扫描）
//
// 接已建核心：
//  - loader.loadMartConfig：信封 6 字段 + 红灯门控（否决#3）取出 mart 子树
//  - forbiddenCheck.runForbiddenCheck：运行时红线扫描（演示门控在 UI 层存活）
// 真实 taboo 词表（red_light/yellow_light）为 design-strategist 交付物，
// 此处以空词表运行，证明管线接通且当前占位内容必然通过。

import { reactive, computed } from 'vue'
import { MART_STATIC_ENVELOPE } from '../config/l1mart.static.ts'
import { loadMartConfig, type LoadStatus } from '../config/loader.ts'
import { runForbiddenCheck, type TabooList, type ForbiddenResult } from '../core/forbiddenCheck.ts'
import { MART_TABOO } from '../config/forbiddenWords.ts'
import type { L1Mart } from '../types/contract.ts'

const state = reactive({
  load: loadMartConfig(MART_STATIC_ENVELOPE),
})

export function useMartGate() {
  const status = computed<LoadStatus>(() => state.load.status)
  const config = computed<L1Mart | null>(() => state.load.config ?? null)
  const ok = computed(() => state.load.status === 'OK')

  /** 运行时红线扫描（否决#3 同款管线；UI 层实时演示）。 */
  function scanTexts(texts: string[]): ForbiddenResult {
    return runForbiddenCheck(texts, MART_TABOO)
  }

  return { status, config, ok, scanTexts }
}
