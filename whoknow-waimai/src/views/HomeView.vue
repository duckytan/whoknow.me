<template>
  <div class="home">
    <div class="logo">🍜</div>
    <h1>胡闹外卖</h1>
    <p class="tagline">外卖越点越瘦，老板越骂越上头</p>
    <router-link to="/order" class="cta">开始下单 →</router-link>
    <p class="back"><router-link to="/">← 回胡闹宇宙</router-link></p>
  </div>
</template>

<script setup lang="ts">
// 首页：入口。
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 12px;
  text-align: center;
  padding: 24px;
}
.logo {
  font-size: 64px;
}
h1 {
  margin: 0;
  font-size: 28px;
  letter-spacing: 2px;
}
.tagline {
  color: var(--wk-dim);
  margin: 0 0 12px;
}
.cta {
  display: inline-block;
  padding: 12px 28px;
  background: var(--wk-accent);
  color: #fff;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
}
.back {
  margin-top: 18px;
  font-size: 13px;
}
.back a {
  color: var(--wk-dim);
  text-decoration: none;
}
</style>
