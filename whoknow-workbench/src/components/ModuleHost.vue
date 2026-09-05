<script setup lang="ts">
/**
 * 模块宿主（T6）：按 module id 从 MODULE_REGISTRY 解析组件并渲染。
 * 未注册 id 渲染占位块（PRD R-P0-06 验收⑤：不白屏、其余区域正常）。
 */
import { computed } from 'vue';
import { MODULE_REGISTRY } from '@/skins/registry';

const props = defineProps<{
  /** 模块 id（= 组件文件名去 .vue） */
  id: string;
  /** 模块变体（预留，模块组件可按 variant 调整内部呈现） */
  variant?: string;
}>();

const entry = computed(() => MODULE_REGISTRY[props.id]);
</script>

<template>
  <component :is="entry.component" v-if="entry" :variant="props.variant" />
  <div v-else class="module-fallback" role="note">
    模块未注册：{{ props.id }}
  </div>
</template>

<style scoped>
.module-fallback {
  padding: 14px 16px;
  border: 1px dashed var(--wb-border-strong);
  border-radius: 10px;
  color: var(--wb-text-muted);
  font-size: 12px;
}
</style>
