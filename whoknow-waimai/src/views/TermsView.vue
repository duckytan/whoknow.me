<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="mt-nav">
    <div class="mt-nav__top">
      <div class="mt-nav__back" @click="router.back()">‹</div>
      <div class="mt-nav__title">用户条款</div>
    </div>
  </div>
  <div class="page-pad">
    <div class="legal">
      <p><b>1. 产品性质。</b>「胡闹外卖」是虚构的段子机产品，所有店铺、老板、骑手、订单均为剧本演出，与现实无关。</p>
      <p><b>2. 内容演绎。</b>NPC 的台词为喜剧效果设计，含夸张、吐槽、反转，不代表任何真实立场或建议。</p>
      <p><b>3. 数据归属。</b>你在本机产生的游玩记录归你所有，随时可在「设置」页清空。</p>
      <p><b>4. 免责声明。</b>因使用本产品产生的笑到肚子疼、想点真外卖等后果，均由你自己承担（并乐在其中）。</p>
      <p><b>5. 变更。</b>条款可能随版本更新，重大变更会在「关于」页说明。</p>
      <p class="muted">本条款为产品设定说明，不构成真实法律协议。</p>
    </div>
  </div>
</template>
