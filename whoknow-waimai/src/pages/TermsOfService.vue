<script setup lang="ts">
/**
 * TermsOfService.vue
 *
 * v16 M3 用户协议页（个人开发者版 · 决策 #011）
 * 强调"虚构作品 / 不是真外卖 / 不收钱"
 */
import AppHeader from '@/components/base/AppHeader.vue'
</script>

<template>
  <div class="terms-page">
    <AppHeader title="用户协议" show-back />
    <div class="terms-content">
      <div class="terms-update">最后更新：2026-07-23</div>

      <section class="terms-section">
        <h2>🎭 这是个啥？</h2>
        <p>
          <strong>胡闹外卖</strong>是一个<strong>虚构娱乐作品</strong>，由独立开发者
          （个人，无营业执照）开发和维护。<strong>不是真实外卖平台</strong>，
          <strong>不提供任何真实餐饮服务</strong>，<strong>不收取任何费用</strong>，
          <strong>不进行任何真实交易</strong>。
        </p>
        <p>
          应用里的商家、骑手、菜品、地址、订单、评价——<strong>全是虚构的</strong>，
          请勿当真。
        </p>
      </section>

      <section class="terms-section">
        <h2>✅ 你可以做的</h2>
        <ul>
          <li>✓ 随便点单 / 随便评价 / 随便吐槽</li>
          <li>✓ 截图分享到朋友圈（鼓励 📢）</li>
          <li>✓ 推荐给朋友（更鼓励 🚀）</li>
          <li>✓ 反馈 bug 或想法给开发者</li>
        </ul>
      </section>

      <section class="terms-section">
        <h2>❌ 你不能做的</h2>
        <ul>
          <li>✗ 假装这是真实外卖平台骗别人</li>
          <li>✗ 用本应用进行任何商业活动</li>
          <li>✗ 反向工程 / 破解 / 攻击本应用</li>
          <li>✗ 发布违法 / 违规 / 骚扰性内容到评价区</li>
        </ul>
      </section>

      <section class="terms-section">
        <h2>⚖️ 免责声明</h2>
        <p>
          本应用按"现状"提供，开发者不对以下情况负责：
        </p>
        <ul>
          <li>服务中断 / 数据丢失（数据只在本地浏览器）</li>
          <li>因网络问题导致的体验问题</li>
          <li>未来可能接入广告后产生的任何广告内容</li>
        </ul>
      </section>

      <section class="terms-section">
        <h2>🔄 变更</h2>
        <p>
          开发者保留随时修改本协议的权利。重大变更会在顶部 banner 公告。
          继续使用 = 接受新条款。
        </p>
      </section>

      <section class="terms-footer">
        <p>本协议由码农虾 💻 起草 · 最后更新 2026-07-23</p>
        <p>适用法律：中华人民共和国法律（开发者所在地）</p>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.terms-page {
  min-height: 100vh;
  background: #fff;
}

.terms-content {
  padding: 16px 20px 60px;
  max-width: 720px;
  margin: 0 auto;
}

.terms-update {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-bottom: 20px;
}

.terms-section {
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

  strong {
    color: #ff6b35;
  }
}

.terms-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px dashed #eee;
  text-align: center;

  p {
    font-size: 11px;
    color: #bbb;
    margin-bottom: 4px;
  }
}
</style>