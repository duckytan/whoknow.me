<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  title?: string
  showSearch?: boolean
}>()

const emit = defineEmits<{
  (e: 'search', keyword: string): void
}>()

const router = useRouter()
const searchValue = ref('')

function onSearch(val: string) {
  if (val.trim()) {
    emit('search', val.trim())
  }
}

function onClickSearch() {
  router.push('/shops')
}
</script>

<template>
  <div class="app-header">
    <div class="header-brand">
      <span class="brand-icon">🍜</span>
      <span class="brand-name">{{ title || '胡闹外卖' }}</span>
    </div>
    <div v-if="showSearch" class="header-search">
      <van-search
        v-model="searchValue"
        placeholder="搜索商家或菜品"
        shape="round"
        background="transparent"
        @search="onSearch"
        @click-input="onClickSearch"
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
