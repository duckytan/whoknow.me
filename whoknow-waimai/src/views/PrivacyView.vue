<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="mt-nav">
    <div class="mt-nav__top">
      <div class="mt-nav__back" @click="router.back()">‹</div>
      <div class="mt-nav__title">隐私政策</div>
    </div>
  </div>
  <div class="page-pad">
    <div class="legal">
      <p><b>1. 我们不收集你的真实信息。</b>「胡闹外卖」是段子机，不下真实订单、不接入任何外卖平台、不要求登录。</p>
      <p><b>2. 数据只存在你本机。</b>成就、订单历史、店铺访问次数等全部写入浏览器 localStorage，关掉页面即留在本机，不上传任何服务器。</p>
      <p><b>3. 没有账号体系。</b>你不需要注册，每次打开都是匿名看客。清空数据只需在「设置」页一键操作。</p>
      <p><b>4. 没有广告与追踪。</b>本产品不含第三方统计 SDK、不含个性化广告。</p>
      <p><b>5. 联系我们。</b>若有隐私疑问，去「关于」页找锡哥留言入口。</p>
      <p class="muted">本政策为产品设定说明，不构成真实法律协议。</p>
    </div>
  </div>
</template>
