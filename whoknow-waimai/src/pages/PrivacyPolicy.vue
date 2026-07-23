<script setup lang="ts">
/**
 * PrivacyPolicy.vue
 *
 * v16 M3 隐私政策页（个人开发者版 · 决策 #011）
 * 强调不收集 / 不追踪 / 0 元 / 纯娱乐
 */
import AppHeader from '@/components/base/AppHeader.vue'
</script>

<template>
  <div class="policy-page">
    <AppHeader title="隐私政策" show-back />
    <div class="policy-content">
      <div class="policy-update">最后更新：2026-07-23</div>

      <section class="policy-section">
        <h2>📋 一句话总结</h2>
        <p>
          <strong>本应用不收集任何个人信息</strong>。所有"订单""购物车""评价"都存在你本地的浏览器里，
          关掉浏览器就没了。我们也没法看到。
        </p>
      </section>

      <section class="policy-section">
        <h2>🎭 这是个啥？</h2>
        <p>
          胡闹外卖是一个<strong>纯娱乐 / 虚构作品</strong>。里面的商家、骑手、菜品、地址都是假的，
          没有任何真实餐饮服务。本应用不收取任何费用，也不支持任何支付功能。
        </p>
      </section>

      <section class="policy-section">
        <h2>📦 我们存了什么？</h2>
        <p>存在你<strong>本地浏览器（localStorage）</strong>，不在任何服务器：</p>
        <ul>
          <li><code>chaos_orders</code> — 你点过的"订单"（其实没真下单）</li>
          <li><code>chaos_cart</code> — 购物车</li>
          <li><code>chaos_demo_speed</code> — 倍速偏好</li>
          <li><code>chaos_onboarded</code> — onboarding 是否已看过</li>
        </ul>
        <p>清除浏览器数据 = 全部清零。</p>
      </section>

      <section class="policy-section">
        <h2>🚫 我们没做的事</h2>
        <ul>
          <li>❌ 不收集你的姓名/手机号/位置</li>
          <li>❌ 不接任何第三方追踪 SDK</li>
          <li>❌ 不接 Google Analytics / 百度统计</li>
          <li>❌ 不接广告 SDK（未来可能加顶层 banner 广告，会更新此页）</li>
          <li>❌ 不向任何第三方分享数据</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>📮 联系方式</h2>
        <p>
          有问题反馈？发邮件到 <a href="mailto:hi@whoknow.me">hi@whoknow.me</a>。
          这是个人开发者项目，回复可能不及时，谅解。
        </p>
      </section>

      <section class="policy-footer">
        <p>本政策由码农虾 💻 起草 · 最后更新 2026-07-23</p>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.policy-page {
  min-height: 100vh;
  background: #fff;
}

.policy-content {
  padding: 16px 20px 60px;
  max-width: 720px;
  margin: 0 auto;
}

.policy-update {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-bottom: 20px;
}

.policy-section {
  margin-bottom: 24px;

  h2 {
    font-size: 16px;
    font-weight: 700;
    color: #333;
    margin-bottom: 10px;
  }

  p, li {
    font-size: 14px;
    line-height: 1.7;
    color: #555;
    margin-bottom: 8px;
  }

  ul {
    padding-left: 20px;
  }

  code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    color: #ff6b35;
  }

  strong {
    color: #ff6b35;
  }

  a {
    color: #ff6b35;
    text-decoration: underline;
  }
}

.policy-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px dashed #eee;
  text-align: center;

  p {
    font-size: 11px;
    color: #bbb;
  }
}
</style>