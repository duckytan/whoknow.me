// 戏精评价生成器

export interface ReviewContext {
  shopName: string
  dishName: string
  riderName: string
  riderAvatar: string
  bossPersonality: string
  totalPrice: number
  deliveryMinutes: number
}

// 评价模板（4 类各 5 条）
const REVIEW_TEMPLATES = {
  funny: [
    '我以为等不到了，结果{riderName}居然找来了，我感动得差点报警',
    '老板接单那一下让我觉得他要把我的单退了，幸好没有，{dishName}味道绝了',
    '从下单到送达，我的心情经历了「期待→怀疑→绝望→感动」四个阶段，值回票价',
    '这家的送餐速度……我喝了两杯水，发了三条朋友圈，{riderName}还没来，但最终到了',
    '{shopName}的老板脾气很大但是饭很香，我决定以后每天都来挑衅他',
  ],
  exaggerated: [
    '我觉得{riderName}是骑着风来的，但也可能是骑着蜗牛，无从判断',
    '吃了一口{dishName}，感觉人生苦短，但是这顿饭让我觉得活着是值得的',
    '强烈建议{shopName}老板去参加脱口秀，比外卖更有前途',
    '送达的那一刻，我以为自己已经死去，{riderName}是给我最后的馈赠',
    '这一单花了{totalPrice}元，买到了美食、剧情、和人生感悟，不亏',
  ],
  philosophical: [
    '饮食男女，一箪食一瓢饮，此刻{dishName}在手，人生无憾',
    '从厨房到餐桌，食物的旅程比我的人生路还曲折，感谢{riderName}',
    '吃着{shopName}的{dishName}，我想到了远方和时间，以及冰箱里吃剩的昨日饭',
    '外卖这件事，等待的过程才是精华，{dishName}只是一个结局',
    '人生有时候就像外卖，你不知道什么时候到，但知道终究会到',
  ],
  complaint: [
    '老板接单迟了一点，但{dishName}热乎乎的，我原谅了他',
    '{riderName}绕了一大圈，我怀疑他在游览城市风光，但最终送到了，给过',
    '等了一会儿，但看了{shopName}老板的表演之后觉得值了，续费追剧那种感觉',
    '包装稍微歪了一下，不过{dishName}没洒，骑手的驾驶技术还是在线的',
    '老板的脾气需要修炼，但厨艺已经成道，下次还会来',
  ],
}

const BOSS_REPLY_TEMPLATES: Record<string, string[]> = {
  angry: [
    '好评？我不稀罕！但是……谢谢。（别告诉别人我说谢谢了）',
    '你还知道给好评，我以为你只会催单！',
    '好吧好吧，下次再来我……我还是会不高兴，但是还是会做好',
  ],
  gentle: [
    '谢谢你的好评，下次来记得提前告诉我，我给你多放一颗葱~',
    '看到你的评价我好开心，下次来我请你喝汤！',
    '谢谢！你是今天让我最开心的顾客~',
  ],
  weird: [
    '收到你的评价，今天的星象说这是吉兆，明天的菜会更好！',
    '有缘再见！我梦里说不定还会做你点过的菜！',
    '评价收到！我把它贴在灶台上，接受食物的灵气加持！',
  ],
  lazy: [
    '哦，好评，收到了。',
    '谢……谢。（继续躺着）',
    '嗯，知道了，欢迎下次，不用太早来。',
  ],
  philosophical: [
    '此评价如一粒尘埃，落入时间之河，我心已收，感恩。',
    '你吃了我做的食物，我们已是因果相连，感谢。',
    '饮食者，人之大欲也。你满足了，我也满足了，宇宙平衡。',
  ],
}

// 随机选择并填充变量
function fillTemplate(template: string, ctx: ReviewContext & { orderNum?: number; eventCount?: number }): string {
  return template
    .replace(/\{shopName\}/g, ctx.shopName)
    .replace(/\{dishName\}/g, ctx.dishName)
    .replace(/\{riderName\}/g, ctx.riderName)
    .replace(/\{totalPrice\}/g, ctx.totalPrice.toFixed(2))
    .replace(/\{deliveryMinutes\}/g, String(ctx.deliveryMinutes))
    .replace(/\{orderNum\}/g, String(ctx.orderNum || Math.floor(Math.random() * 20) + 3))
    .replace(/\{eventCount\}/g, String(ctx.eventCount || 5))
}

// 生成一条随机评价文本
export function generateReviewText(ctx: ReviewContext): string {
  const categories = Object.keys(REVIEW_TEMPLATES) as (keyof typeof REVIEW_TEMPLATES)[]
  const category = categories[Math.floor(Math.random() * categories.length)]
  const templates = REVIEW_TEMPLATES[category]
  const template = templates[Math.floor(Math.random() * templates.length)]
  return fillTemplate(template, ctx)
}

// 生成老板回复
export function generateBossReply(personality: string): string {
  const replies = BOSS_REPLY_TEMPLATES[personality] || BOSS_REPLY_TEMPLATES.angry
  return replies[Math.floor(Math.random() * replies.length)]
}

// 预设评价标签
export const REVIEW_TAGS = [
  { label: '老板脾气好大', emoji: '😤' },
  { label: '骑手像在飞', emoji: '⚡' },
  { label: '差点没吃到', emoji: '😰' },
  { label: '菜名很有戏', emoji: '🎭' },
  { label: '性价比很高', emoji: '💰' },
  { label: '等待是享受', emoji: '⏰' },
  { label: '剧情很精彩', emoji: '🎬' },
  { label: '下次还来', emoji: '❤️' },
]
