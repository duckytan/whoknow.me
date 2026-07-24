// 戏精评价生成器

import { sanitizeQuote } from './npcEngine'

export interface ReviewContext {
  shopName: string
  dishName: string
  riderName: string
  riderAvatar: string
  bossPersonality: string
  totalPrice: number
  deliveryMinutes: number
}

// 评价模板（4 大类 × 12 小类 × 5-10 条 ≈ 200 条）
const REVIEW_TEMPLATES = {
  // ===== 搞笑类 =====
  funny: [
    '我以为等不到了，结果{riderName}居然找来了，我感动得差点报警',
    '老板接单那一下让我觉得他要把我的单退了，幸好没有，{dishName}味道绝了',
    '从下单到送达，我的心情经历了「期待→怀疑→绝望→感动」四个阶段，值回票价',
    '这家的送餐速度……我喝了两杯水，发了三条朋友圈，{riderName}还没来，但最终到了',
    '{shopName}的老板脾气很大但是饭很香，我决定以后每天都来挑衅他',
    '我觉得{riderName}是开地铁来的，只是从他家到我家这趟跑了俩小时',
    '老板看了我的备注笑了一分钟，然后做了个比备注还好笑的菜',
    '取餐时老板说「你运气好，今天我只骂了你三句」，我觉得他在夸我',
    '{riderName}打电话说到了，我找了十分钟没看到人，他说「我在你隔壁小区」',
    '下单的时候是午饭，吃到的时候是晚饭，赚了一顿下午茶的时间',
    '老板问我加不加辣，我说微辣，他可能听成了「喂，啦」——然后端上来一碗唢呐',
    '骑手到楼下发消息说：「你下来吧，我想看看是谁这么有品位」',
    '{shopName}的菜单写着「本店招牌——老板的暴脾气」，我已经尝过了，很正宗',
    '打开外卖盒的瞬间，发现{dishName}摆成了笑脸，老板嘴硬心软实锤',
    '备注写了「不要香菜」，老板在袋子里塞了张纸条：「就不，气不气？」',
    '骑手说他是新手，结果导航进了死胡同，他在胡同口给我直播了十五分钟',
    '我打开门的时候{riderName}说「久等了」，然后从怀里掏出{dishName}——还是热的',
    '{shopName}老板把外卖递给我时哭了，说我是今天第一个没取消订单的人',
    '扫码下单→等待→后悔→等待→后悔→等待→送到了→全忘了，真香',
  ],
  // ===== 夸张类 =====
  exaggerated: [
    '我觉得{riderName}是骑着风来的，但也可能是骑着蜗牛，无从判断',
    '吃了一口{dishName}，感觉人生苦短，但是这顿饭让我觉得活着是值得的',
    '强烈建议{shopName}老板去参加脱口秀，比外卖更有前途',
    '送达的那一刻，我以为自己已经死去，{riderName}是给我最后的馈赠',
    '这一单花了{totalPrice}元，买到了美食、剧情、和人生感悟，不亏',
    '吃{dishName}的第一口，我的灵魂升华了，第二口，我哭了——太好吃',
    '{riderName}骑着一匹发光的独角兽来的，至少在我饿晕的幻觉里是这样的',
    '{shopName}的老板是穿越来的厨神，这道{dishName}我在任何古籍上都没见过',
    '这一单的配送距离可能绕了地球两圈，因为{riderName}来的时候带着异国他乡的气息',
    '老板把{dishName}端出来的时候，金光闪闪，BGM自动响起',
    '这{dishName}吃了之后，我感觉自己可以跑马拉松，但更想躺着回味',
    '我觉得{riderName}是特种兵退役的，把外卖送出了军事行动的感觉',
    '吃完{dishName}，我决定把{shopName}列入我的名人堂，和米其林并列',
    '{shopName}的老板绝对是艺术家，看他把{dishName}摆盘的样子，我以为是国宴',
    '这一单的等待时间让我以为老板在现种菜、现养猪、现学做饭',
    '我严重怀疑{riderName}是冒充骑手的赛车手，他送外卖的样子像在漂移入库',
    '老板送了我一份赠品——一段关于人生和{dishName}的即兴演讲',
    '吃完这顿饭，我感觉我不是在吃外卖，是在参与一场美食革命',
  ],
  // ===== 哲学类 =====
  philosophical: [
    '饮食男女，一箪食一瓢饮，此刻{dishName}在手，人生无憾',
    '从厨房到餐桌，食物的旅程比我的人生路还曲折，感谢{riderName}',
    '吃着{shopName}的{dishName}，我想到了远方和时间，以及冰箱里吃剩的昨日饭',
    '外卖这件事，等待的过程才是精华，{dishName}只是一个结局',
    '人生有时候就像外卖，你不知道什么时候到，但知道终究会到',
    '{riderName}说「慢一点，才能看到路上的风景」，我觉得他在说我',
    '吃饭不是为了活着，而是为了记住——我记住了{shopName}的{dishName}',
    '在等待{dishName}的{deliveryMinutes}分钟里，我思考了宇宙、生命和一切',
    '每一份外卖都是一段旅程，{shopName}是起点，我的胃是终点',
    '最深的满足往往来自最简单的{dishName}，少即是多，饿了什么都好吃',
    '{shopName}老板的话让我思考：到底是我们在吃食物，还是食物在吃我们',
    '等待美食的过程，就像等待生活转机——你知道会来，只是不知道什么时候',
    '吃饭是人类最诚实的时刻，{dishName}好不好吃，表情不会骗人',
    '我花了{totalPrice}元买到的不是一顿饭，是{shopName}老板半小时的人生',
    '{riderName}把外卖递给我的时候，我在想：这世上有没有一份永远送不到的外卖',
    '吃完了{dishName}，饱了，但心里还有点空——因为太好吃了，吃太快',
    '坐下来吃{shopName}的{dishName}的时候，我终于——什么都不想了',
  ],
  // ===== 吐槽类 =====
  complaint: [
    '老板接单迟了一点，但{dishName}热乎乎的，我原谅了他',
    '{riderName}绕了一大圈，我怀疑他在游览城市风光，但最终送到了，给过',
    '等了一会儿，但看了{shopName}老板的表演之后觉得值了，续费追剧那种感觉',
    '包装稍微歪了一下，不过{dishName}没洒，骑手的驾驶技术还是在线的',
    '老板的脾气需要修炼，但厨艺已经成道，下次还会来',
    '{shopName}老板的脾气比我的苦瓜汤还苦，但{dishName}真香',
    '等餐的时候把{shopName}的菜单从头读到尾，像在读一本小说——还挺好看',
    '老板做菜的时候哼了一首我听不懂的歌，但{dishName}的味道让我懂了',
    '{riderName}说导航坏了，但他靠自己找到了我——虽然迟了十分钟',
    '我备注说多放点醋，老板放了整整一瓶，我喝了一碗——味道还行',
    '老板回答我问题的时候像在写代码，一个字都不想多说——效率很高',
    '骑手把外卖挂在门把手上就走了，我开门的时候差点和{dishName}撞个满怀',
    '老板忘了放筷子，但{dishName}好吃到我决定用手抓',
    '等餐的时间够我写了篇短篇小说，但吃到{dishName}的时候觉得值了',
    '我备注说少油，老板可能理解成了「少有的油」——油香四溢',
  ],
  // ===== 订单剧情类 =====
  drama: [
    '今天我见证了{shopName}老板和{riderName}在门口的即兴相声，附赠{dishName}一份',
    '下单后老板打电话来骂了我一顿，理由是「你点得太少了」，然后送了双份',
    '{riderName}到了楼下才发现没带手机，他凭记忆找到了我家——快递员的职业素养',
    '外卖送到的时候，盒子上贴了一张纸条：「今天第{orderNum}单，你运气不错」',
    '老板把外卖递给我的时候说：「这菜我做了{eventCount}次才成功」——能吃就行',
    '骑手在配送途中救了一只猫，所以花了{deliveryMinutes}分钟——我原谅他了',
    '备注写「求好运」，收到{dishName}时发现米饭上画了一个笑脸——真的走运了',
    '我点的是{dishName}，老板送的是{dishName}加一段人生建议——赚了',
    '今天是{shopName}老板第{orderNum}次被人投诉脾气差，但菜真的一如既往地好',
    '骑手到了先拍了张自拍发给我，说「看，我到了」——有偶像包袱的骑手',
    '老板在餐盒里放了一封信，写着「今天的菜里有我的灵魂」——我选择相信他',
    '订单状态停在「骑手迷路了」长达10分钟后，骑手敲门说「我决定相信直觉」',
    '我和{shopName}老板已经成了网友，他每次都会在餐盒里留一句话给我',
    '这一单的{totalPrice}元里，有3块钱是骑手的段子费',
  ],
  // ===== 老板戏精类 =====
  boss_drama: [
    '我在{shopName}点了{dishName}，老板骂了我{orderNum}句，但我还想再来',
    '{shopName}老板说我的{dishName}是他今天做的最认真的一单，因为骂我骂的最狠',
    '老板一边做{dishName}一边和隔壁摊吵架，但{dishName}的锅气一点没少',
    '取餐时老板说「你瘦了」，我说「我上次没来这家」，他说「我记住你了」',
    '老板在菜单上写了个免责声明：「本店不提供微笑服务，只提供好吃的菜」',
    '我第一次见到{shopName}老板笑，是因为他看见我辣到流眼泪',
    '老板对我的{dishName}说了一句「你走吧」，然后就转头抽烟去了——有态度的菜',
    '我问老板为什么不做外卖平台推广，他说「我的菜自己会说话」',
    '老板研究我的备注研究了五分钟，然后抬头说「你是认真的？」——我认真点头',
    '老板的坏脾气是一种营销策略，因为每道{dishName}都好吃到让我忘了他的态度',
  ],
  // ===== 骑手戏精类 =====
  rider_drama: [
    '{riderName}到的时候说「不好意思路上扶了三个老奶奶过马路」，我不信但算了',
    '骑手{riderName}不仅送来了{dishName}，还送了一首他写的诗——水平还可以',
    '{riderName}到了楼下给我打电话：「猜猜我在哪」——我猜他在我家楼下',
    '骑手说他的电动车今天第{orderNum}次没电，他是推着车给我送来的',
    '{riderName}到了之后问我「你相信缘分吗」，我说「你先把{dishName}给我」',
    '骑手送完我的单后说「今天最后一单了，回家吃饭了」——打工人的浪漫',
    '我开门的时候{riderName}在跳广场舞，他说「等单的时候学的」',
    '骑手把{dishName}递给我的时候手是冰的——他的电动车没有挡风被',
    '{riderName}说路上遇到了{eventCount}个红灯，我都数了，是{eventCount}个，他诚实的',
  ],
  // ===== 菜品评价类 =====
  dish_focus: [
    '{dishName}这个菜名就很有故事，吃了之后果然有故事',
    '我宣布{dishName}是我本月最佳发现，可以在朋友面前炫耀了',
    '这一份{dishName}的分量，我以为我点的是两人份——老板太实在了',
    '{dishName}的味道让我想起了小时候外婆做的饭，就是那种被爱过的味道',
    '吃{dishName}的第一口我皱了眉头，第二口我舒展了，第三口我加了一份',
    '这{dishName}的配料比例很绝，多一分则多，少一分则少——老板是化学家',
    '我点了{dishName}但送错了，不过新菜也挺好吃的——错误的美味',
    '{dishName}的颜值和味道不成正比，看起来一般但好吃到哭',
    '这道{dishName}让我重新定义了「辣」，原来我以前的辣都是小打小闹',
  ],
  // ===== 简短有力类 =====
  short: [
    '到了就好',
    '{dishName}好吃，下次再点',
    '老板好脾气，菜好味道',
    '骑手轻功了得',
    '值！{totalPrice}元花得值',
    '我就是想来说一句：{dishName}真不错',
    '老板和骑手都是人才',
    '吃到了，满意了，好评！',
    '等得久，但好吃认了',
    '{shopName}已收藏',
    '好吃到说不出话',
    '还会再来的，一定',
  ],
  // ===== 商家人设类 =====
  shop_personality: [
    '老板是个有故事的人，从他做{dishName}的方式就能看出来',
    '这家店的气氛很诡异，但{dishName}出奇地好吃',
    '在{shopName}点餐就像在玩一场人生游戏，永远不知道老板会说什么',
    '老板是个哲学家，他的{dishName}里能吃出人生道理',
    '我喜欢{shopName}老板的态度——不做作，不讨好，只做好菜',
    '这店的环境和{dishName}形成了强烈的反差，但都很有味道',
    '老板是一个隐藏在餐饮界的脱口秀演员，{dishName}只是他的副业',
    '我的第{orderNum}次在{shopName}点{dishName}了，老板终于对我笑了',
    '老板的冷嘲热讽和他的{dishName}一样，都是越品越有味',
    '每次来{shopName}都像在探险，今天的主题是{dishName}',
    '老板的情绪管理能力和他的厨艺成反比——菜越好吃脾气越差',
    '我怀疑老板是某个隐藏美食世家的传人，因为{dishName}太地道了',
    '这家店最大的特点就是老板不爱说话，但每道菜都在说话',
    '老板说我点{dishName}的方式不对，他给我重新搭配了一份——没收费',
    '在{shopName}吃饭需要勇气，因为你永远不知道老板下一刻会骂你还是夸你',
  ],
  // ===== 配送剧情类 =====
  delivery_story: [
    '配送过程可以拍一集纪录片了，标题是《{riderName}的{dishName}传》',
    '骑手迷路了一小会儿，但最终正义（外卖）还是到达了',
    '我想给{riderName}的小费不只是钱，还有精神上的支持',
    '从下单到送达经历了{deliveryMinutes}分钟，期间我和{riderName}建立了深厚的革命友谊',
    '看到{riderName}的那一刻，仿佛看到了一名战士凯旋归来',
    '配送轨迹就像过山车——忽快忽慢，但终点是美好的',
    '我通过订单追踪学会了{riderName}日常活动的路线',
    '订单状态里的每个更新都是一个小惊喜，比追剧还精彩',
    '骑手带着{dishName}在城市里穿行，每一公里都是对我的承诺',
    '如果不是{riderName}，我可能永远吃不到这么好吃的{dishName}',
    '今天的配送路线很迷幻，可能{riderName}在帮我测试城市道路系统',
    '骑手打电话说到了的时候，我激动得像个孩子——因为{dishName}快凉了',
  ],
  // ===== 天马行空类 =====
  wild: [
    '我以为{riderName}是骑着恐龙来的，好吧，其实是电动车',
    '老板用{dishName}给我传递了一个加密信息——我解码了，内容是好吃的',
    '吃完这顿{shopName}的{dishName}，我决定改行当美食博主',
    '我在梦里梦到过{dishName}，没想到真的吃到了——预知梦成真了',
    '这{dishName}是老板用爱（和愤怒）做的，吃得出双重的味道',
    '我怀疑这单配送过程中{riderName}穿越到了异世界，但成功传送回来了',
    '{shopName}的{dishName}好吃到我想给它立个碑',
    '我觉得{shopName}不是一家店，是一个艺术实验室，菜是他们的展品',
    '吃完{dishName}后我对着镜子看了自己一眼——还是我，但更幸福了',
    '我点的{dishName}和{riderName}的配送风格出奇地搭——都是大片级别的',
  ],
}

const BOSS_REPLY_TEMPLATES: Record<string, string[]> = {
  angry: [
    '好评？我不稀罕！但是……谢谢。（别告诉别人我说谢谢了）',
    '你还知道给好评，我以为你只会催单！',
    '好吧好吧，下次再来我……我还是会不高兴，但是还是会做好',
    '今天心情好，不骂人了。但下次不一定！',
    '我收下了你的好评，不代表我原谅你等那么久',
    '评分5星？哼，算你识相。下次别太晚来，菜凉了不怪我',
  ],
  gentle: [
    '谢谢你的好评，下次来记得提前告诉我，我给你多放一颗葱~',
    '看到你的评价我好开心，下次来我请你喝汤！',
    '谢谢！你是今天让我最开心的顾客~',
    '你真是个善良的人，我做菜的时候都感觉到你的温暖了',
    '感谢您的好评，记得按时吃饭！',
  ],
  weird: [
    '收到你的评价，今天的星象说这是吉兆，明天的菜会更好！',
    '有缘再见！我梦里说不定还会做你点过的菜！',
    '评价收到！我把它贴在灶台上，接受食物的灵气加持！',
    '你的好评我已经烧成符文，刻在了厨房的墙上，保佑明天也是好评',
    '刚才占卜过了，你明天还会再点的，我等你的单',
  ],
  lazy: [
    '哦，好评，收到了。',
    '谢……谢。（继续躺着）',
    '嗯，知道了，欢迎下次，不用太早来。',
    '好评已阅，建议下次晚点来，我需要充电',
    '好的。如果没别的事我继续躺了。',
  ],
  philosophical: [
    '此评价如一粒尘埃，落入时间之河，我心已收，感恩。',
    '你吃了我做的食物，我们已是因果相连，感谢。',
    '饮食者，人之大欲也。你满足了，我也满足了，宇宙平衡。',
    '你的好评是一面镜子，照见了我的初心，感谢相遇。',
    '美食是桥梁，好评是回响，愿我们的缘分如{dishName}一样绵长',
  ],
}

// 随机选择并填充变量
function fillTemplate(template: string, ctx: ReviewContext & { orderNum?: number; eventCount?: number }): string {
  const filled = template
    .replace(/\{shopName\}/g, ctx.shopName)
    .replace(/\{dishName\}/g, ctx.dishName)
    .replace(/\{riderName\}/g, ctx.riderName)
    .replace(/\{totalPrice\}/g, ctx.totalPrice.toFixed(2))
    .replace(/\{deliveryMinutes\}/g, String(ctx.deliveryMinutes))
    .replace(/\{orderNum\}/g, String(ctx.orderNum || Math.floor(Math.random() * 20) + 3))
    .replace(/\{eventCount\}/g, String(ctx.eventCount || 5))
  // v11 防御性兜底：sanitize 处理 typo 和未知占位符（v10 体系扩展）
  return sanitizeQuote(filled)
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
  { label: '老板是个戏精', emoji: '🎪' },
  { label: '骑手是哲学家', emoji: '🧠' },
  { label: '外卖穿越了', emoji: '🌀' },
  { label: '老板有隐藏技能', emoji: '🎯' },
  { label: '这单有惊喜', emoji: '🎁' },
  { label: '吃出了人生感悟', emoji: '📖' },
  { label: '还想再来一单', emoji: '🔥' },
  { label: '配送太魔幻了', emoji: '✨' },
  { label: '骑手比我淡定', emoji: '😎' },
  { label: '老板人狠话不多', emoji: '🗿' },
  { label: '这是艺术品', emoji: '🖼️' },
  { label: '我把菜吃光了', emoji: '🍽️' },
  { label: '我还会回来的', emoji: '🔄' },
  { label: '这单像坐过山车', emoji: '🎢' },
  { label: '老板嘴硬心软', emoji: '🫶' },
  { label: '骑手速度很快', emoji: '🏃' },
  { label: '吃出了幸福感', emoji: '😊' },
  { label: '等餐也是一种享受', emoji: '🧘' },
  { label: '老板明天还会记得我吗', emoji: '🤔' },
  { label: '骑手是个段子手', emoji: '🎤' },
  { label: '非常胡闹的一单', emoji: '🤪' },
]
