<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
const faqs = [
  { q: '为什么老板总骂人？', a: '这是「胡闹外卖」的设定——老板们都是戏精，演得越凶，段子越香。' },
  { q: '骑手会真的送餐吗？', a: '不会。这是假外卖、真段子机，下单只为看 NPC 演戏。' },
  { q: '成就有什么用？', a: '纯收藏。集齐 12 个成就，你是胡闹宇宙的资深看戏人。' },
  { q: '数据存在哪？', a: '全部存在你本机浏览器 localStorage，不上传任何服务器。' },
  { q: '怎么触发隐藏剧情？', a: '下单选不同店、连下多单、在备注/地址里写「私房菜」「拉黑」「奇葩地址」等关键词。' },
]
</script>

<template>
  <div class="mt-nav">
    <div class="mt-nav__top">
      <div class="mt-nav__back" @click="router.back()">‹</div>
      <div class="mt-nav__title">客服 · 常见问题</div>
    </div>
  </div>
  <div class="page-pad">
    <div v-for="(f, i) in faqs" :key="i" class="qa-card">
      <div class="q">Q：{{ f.q }}</div>
      <div class="a">A：{{ f.a }}</div>
    </div>
    <div class="muted" style="margin-top: 16px">更多问题？去「关于」页找锡哥留言入口，或翻翻「段子流」里别人的笑点。</div>
  </div>
</template>
