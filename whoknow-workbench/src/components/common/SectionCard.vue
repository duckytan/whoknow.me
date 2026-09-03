<script setup lang="ts">
/**
 * 带标题的卡片容器：统一模块外观（标题 / 副标题 / 右上操作区 / 底部脚注）。
 */
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    tag?: string;
    tagColor?: string;
    footnote?: string;
    minHeight?: number;
    priority?: string;
  }>(),
  {
    subtitle: '',
    tag: '',
    tagColor: 'var(--wb-green)',
    footnote: '',
    minHeight: 0,
    priority: '',
  },
);
</script>

<template>
  <section class="wb-card" :style="minHeight > 0 ? { minHeight: `${minHeight}px` } : undefined">
    <header class="wb-card__head">
      <div class="wb-card__titles">
        <h3 class="wb-card__title">
          {{ title }}
          <span v-if="priority" class="wb-card__priority">{{ priority }}</span>
        </h3>
        <p v-if="subtitle" class="wb-card__subtitle">{{ subtitle }}</p>
      </div>
      <div class="wb-card__extra">
        <span v-if="tag" class="wb-card__tag" :style="{ color: tagColor, borderColor: tagColor }">
          {{ tag }}
        </span>
        <slot name="extra" />
      </div>
    </header>
    <div class="wb-card__body">
      <slot />
    </div>
    <footer v-if="footnote || $slots.footer" class="wb-card__foot">
      <slot name="footer">
        <span class="wb-note">{{ footnote }}</span>
      </slot>
    </footer>
  </section>
</template>

<style scoped>
.wb-card {
  display: flex;
  flex-direction: column;
  background: var(--wb-panel);
  border: 1px solid var(--wb-border);
  border-radius: var(--wb-radius);
  box-shadow: var(--wb-shadow);
  padding: 14px 16px 12px;
  height: 100%;
}

.wb-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--wb-border-soft);
  padding-bottom: 10px;
  margin-bottom: 12px;
}

.wb-card__titles {
  min-width: 0;
}

.wb-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--wb-text);
  letter-spacing: 0.2px;
}

.wb-card__priority {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--wb-purple);
  border: 1px solid var(--wb-purple);
  border-radius: 4px;
  padding: 0 5px;
  vertical-align: middle;
}

.wb-card__subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--wb-text-muted);
}

.wb-card__extra {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.wb-card__tag {
  font-size: 12px;
  border: 1px solid;
  border-radius: 4px;
  padding: 1px 7px;
  white-space: nowrap;
}

.wb-card__body {
  flex: 1 1 auto;
  min-height: 0;
}

.wb-card__foot {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--wb-border-soft);
}
</style>
