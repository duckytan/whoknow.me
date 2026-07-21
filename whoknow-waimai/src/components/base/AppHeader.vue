<script setup lang="ts">
defineProps<{
  title?: string
  showSearch?: boolean
}>()
</script>

<template>
  <div class="app-header">
    <div class="header-brand">
      <span class="brand-icon">🍜</span>
      <span class="brand-name">{{ title || '胡闹外卖' }}</span>
    </div>
    <div v-if="showSearch" class="header-search">
      <van-search
        placeholder="搜索商家或菜品"
        readonly
        shape="round"
        background="transparent"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-header {
  background: #ff6b35;
  padding: 0 12px 8px;

  .header-brand {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 4px 4px;

    .brand-icon { font-size: 22px; }
    .brand-name {
      font-size: 18px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 1px;
    }
  }

  :deep(.van-search) {
    padding: 4px 0;

    .van-search__content {
      background: rgba(255, 255, 255, 0.9);
    }
  }
}
</style>
