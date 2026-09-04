<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { memory } from '../store/memoryStore'
import { getShop } from '../data/shops'
import { showToast } from '../lib/toast'

const history = memory.getOrderHistory()
// 取最近一次订单作为展示，或用默认
const lastOrder = history[0] || null
const shop = lastOrder ? getShop(lastOrder.shopId) : undefined

// 聊天消息
interface Msg {
  id: number
  role: 'merchant' | 'user'
  text: string
  time: string
  read?: boolean
}
let msgId = 0
// 商家自动回复的延迟定时器句柄：组件卸载时必须清掉，否则长会话里会留下孤儿回调（N3）
let replyTimer: ReturnType<typeof setTimeout> | null = null
const now = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const messages = ref<Msg[]>([
  { id: ++msgId, role: 'merchant', text: shop ? `您好，请问有什么可以帮您的？这里是${shop.name}。` : '您好，请问有什么可以帮您的？', time: now(), read: true },
])

// 快捷回复 → 戏精商家自动回复
const replyMap: Record<string, string> = {
  '少送/错送': '非常抱歉！骑手说「路上太饿偷吃了一口」🍗 我们马上补发（或者您就当减肥了）',
  '口味不佳': '老板亲自试吃了，觉得味道很棒啊？您是不是味觉出问题了？🤔 不过我们接受批评……才怪！',
  '菜品与描述不符': '图片仅供参考，以实物为准——这是外卖界的宪法！⚖️ 但如果您觉得差距太大，老板可以给您表演一段杂技作为补偿 🤹',
  '开发票': '本单戏票不支持报销哦～锡哥说了：「看戏还要发票？你当这是电影院啊？」🎭',
}

function sendQuickReply(label: string) {
  // 用户气泡
  messages.value.push({ id: ++msgId, role: 'user', text: label, time: now() })
  // 商家自动回复（延迟感）；同一会话内多次点击只保留最后一个定时器
  if (replyTimer) clearTimeout(replyTimer)
  replyTimer = setTimeout(() => {
    const reply = replyMap[label] || '收到您的消息，老板正在思考怎么怼回去……请稍候 😏'
    messages.value.push({ id: ++msgId, role: 'merchant', text: reply, time: now(), read: true })
  }, 600)
}

// 清理未触发的自动回复定时器，避免组件卸载后回调打到已销毁的 ref（N3）
onUnmounted(() => {
  if (replyTimer) {
    clearTimeout(replyTimer)
    replyTimer = null
  }
})

// 复制电话：app 内拟真 toast，不用原生 alert（真美团复制成功也是浮层提示）
function onCopyPhone() {
  const phone = '400-618-XXXX（胡闹客服热线）'
  navigator.clipboard?.writeText(phone).catch(() => {})
  showToast(`已复制：${phone}`)
}
</script>

<template>
  <div style="background:var(--mt-bg);min-height:100vh;display:flex;flex-direction:column;">
    <!-- 顶部导航 -->
    <div class="im-nav">
      <span class="imn-btn" @click="$router.back()">‹</span>
      <span class="imn-shop">{{ shop ? `${shop.name}(${shop.distance})` : '胡闹客服' }}</span>
      <div class="imn-actions">
        <span class="imn-btn" @click="onCopyPhone">📞</span>
        <span class="imn-btn" @click="onCopyPhone">📋</span>
        <span class="imn-btn">⋯</span>
      </div>
    </div>

    <!-- 订单信息卡 -->
    <div class="im-order-card" v-if="lastOrder">
      <div class="ioc-title">我要咨询以下订单</div>
      <div class="ioc-row">
        <div class="ioc-img">{{ shop?.emoji || '📦' }}</div>
        <div class="ioc-info">
          <div class="ioc-name">{{ lastOrder.shopName }} · 共1件</div>
          <div class="ioc-meta">合计共 ¥{{ lastOrder.total?.toFixed(2) || '--' }} · 已完成</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--mt-text-3);margin-top:8px;padding-top:8px;border-top:1px solid var(--mt-line)">
        订单编号：{{ String(lastOrder.ts || Date.now()).slice(-10) }}<br />
        下单时间：{{ new Date(lastOrder.ts || Date.now()).toLocaleString('zh-CN') }}
      </div>
    </div>

    <!-- 无订单时的占位 -->
    <div class="im-order-card" v-else>
      <div class="ioc-title">暂无订单记录</div>
      <div style="font-size:13px;color:var(--mt-text-3)">去首页下单后，这里会显示订单信息</div>
    </div>

    <!-- 聊天气泡区 -->
    <div class="im-chat">
      <template v-for="m in messages" :key="m.id">
        <!-- 商家气泡（左） -->
        <div v-if="m.role === 'merchant'" class="bubble-l">
          <div class="bubble-avatar">{{ shop?.emoji || '🏪' }}</div>
          <div>
            <div class="bubble-name">{{ shop?.name || '胡闹客服' }}</div>
            <div class="bubble-body">
              <div class="bubble-text">{{ m.text }}</div>
              <div class="bubble-time">{{ m.time }}{{ m.read ? ' 已读' : '' }}</div>
            </div>
          </div>
        </div>
        <!-- 用户气泡（右） -->
        <div v-else class="bubble-r">
          <div>
            <div class="bubble-body">
              <div class="bubble-text">{{ m.text }}</div>
              <div class="bubble-time">{{ m.time }}{{ m.read ? ' 已读' : '' }}</div>
            </div>
          </div>
          <div class="bubble-avatar">😊</div>
        </div>
      </template>
    </div>

    <!-- 快捷回复 chip 条 -->
    <div class="quick-replies">
      <button v-for="label in ['少送/错送', '口味不佳', '菜品与描述不符', '开发票']" :key="label" class="qr-chip" @click="sendQuickReply(label)">{{ label }}</button>
    </div>

    <!-- 底部输入栏（装饰性） -->
    <div class="im-input">
      <span class="ii-btn">🎤</span>
      <div class="ii-box">输入消息…</div>
      <span class="ii-btn">😊</span>
      <span class="ii-btn">⊕</span>
      <span class="ii-btn">⋯</span>
    </div>
  </div>
</template>
