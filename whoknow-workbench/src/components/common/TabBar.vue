<script setup lang="ts">
/**
 * 轻量标签页切换条（子项目详情页 Tab 壳复用，SYSTEM_DESIGN §4.2）。
 */
export interface TabItem {
  key: string;
  label: string;
  badge?: string;
}

const props = defineProps<{
  items: TabItem[];
  modelValue: string;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();

function select(key: string): void {
  if (key !== props.modelValue) emit('update:modelValue', key);
}
</script>

<template>
  <nav class="wb-tabbar" role="tablist">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      role="tab"
      class="wb-tabbar__item"
      :class="{ 'wb-tabbar__item--active': item.key === modelValue }"
      :aria-selected="item.key === modelValue"
      @click="select(item.key)"
    >
      {{ item.label }}
      <span v-if="item.badge" class="wb-tabbar__badge">{{ item.badge }}</span>
    </button>
  </nav>
</template>

<style scoped>
.wb-tabbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-bottom: 1px solid var(--wb-border);
  padding-bottom: 8px;
}

.wb-tabbar__item {
  background: transparent;
  border: 1px solid var(--wb-border);
  color: var(--wb-text-dim);
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 13px;
  cursor: pointer;
  min-height: 32px;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.wb-tabbar__item:hover {
  color: var(--wb-text);
  border-color: var(--wb-text-muted);
}

.wb-tabbar__item--active {
  color: var(--wb-on-accent);
  background: var(--wb-green);
  border-color: var(--wb-green);
  font-weight: 600;
}

.wb-tabbar__badge {
  margin-left: 6px;
  font-size: 11px;
  opacity: 0.85;
}
</style>
