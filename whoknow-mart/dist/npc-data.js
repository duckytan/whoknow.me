// whoknow-mart / NPC 配置与进度工具
// 被 04-chat.html / 05-chat-outcome.html / 09-chat-outcome-lose.html / 06-collection.html 共同引用
(function(){
  var NPCS = {
    wangerba: {
      id: 'wangerba',
      name: '毒舌·王二麻',
      title: '客服 · 毒舌·王二麻（在线）',
      emoji: '😏',
      color: 'var(--p-du)',
      desc: '嘴毒心软，专戳痛处。越怂他越来劲。',
      motive: 'A 反骨癌（天生跟你对着干）',
      weakness: '以毒攻毒',
      firstLine: '在的？哎我跟你说，这 T 恤<b>真别买</b>，59.9 纯属智商税。',
      repeatLine: '哟，又来了？第 {n} 回了……这次我不劝那么狠了。',
      moves: {
        '坚定': { say: '我就想便宜点，你看咋办', reply: '便宜？这料子值29我都嫌多，别想了。', delta: -10 },
        '装可怜': { say: '真没钱了求放过🥺', reply: '吃土？你昨儿还晒火锅呢当我没看见？', delta: -10 },
        '比价': { say: '别家同款才39啊', reply: '39也是割你，你这算账能力…啧。', delta: -10 },
        '以毒攻毒': { say: '少废话，你也就是个打工的，券拿来', reply: '……（打字中两秒）行，你嘴是挺硬的，我也就是个打工的。', delta: 40 }
      },
      winLine: '其实我也觉得这破玩意不值这个价，可老板逼我卖啊。<br>拿去吧。下回别来了，看着烦。<br><b style="color:#E1251B">—— 但你赢了，撬开了一个死活不卖你的人。</b>',
      loseLine: '券是真没有，您慢走，今天算省钱了。下回换个招再来呗。',
      coupon: 20
    },
    lisuanpan: {
      id: 'lisuanpan',
      name: '理性·李算盘',
      title: '客服 · 理性·李算盘（在线）',
      emoji: '🤓',
      color: 'var(--p-li)',
      desc: '凡事讲数据，用 ROI 劝你别买。',
      motive: 'B 报复老板（算账整店铺）',
      weakness: '装可怜',
      firstLine: '您好，按数据这套品 ROI 不到 1.2，建议您划走。',
      repeatLine: '又是你？第 {n} 次来看了……行，老板不在，我悄悄说。',
      moves: {
        '坚定': { say: '我就要最低价，你别绕', reply: '最低价也有成本线，别为难打工人。', delta: -10 },
        '装可怜': { say: '月底真的吃泡面了，求你🥺', reply: '唉……算了，我帮你贴张内部券。', delta: 40 },
        '比价': { say: '别家 39 还送运费险', reply: '运费险是隐性成本，折算后……啧，你算得比我细。', delta: -10 },
        '以毒攻毒': { say: '你也就一客服，装什么分析师', reply: '我确实有数据权限，但你激我没用。', delta: -10 }
      },
      winLine: '服了，我把自己的内部券贴你。别告诉老板，算我替天行道。<br><b style="color:#E1251B">—— 数据控也输给了你的月底账单。</b>',
      loseLine: '你看，数据都不支持你买。走了走了，今天帮你省一单。',
      coupon: 15
    },
    zhaotuotuo: {
      id: 'zhaotuotuo',
      name: '散漫·赵拖拖',
      title: '客服 · 散漫·赵拖拖（在线）',
      emoji: '😴',
      color: 'var(--p-san)',
      desc: '能躺不坐，劝你“算了别折腾”。',
      motive: 'E 就想下班（卖一单要发货对账）',
      weakness: '坚定',
      firstLine: '在……自己看详情页吧，我懒得介绍。',
      repeatLine: '又来了？第 {n} 次了……要不直接给你最低价，别聊了。',
      moves: {
        '坚定': { say: '我今天就认定这一款，不换了', reply: '你这么轴，我反而不好意思敷衍你了。', delta: 40 },
        '装可怜': { say: '拜托了，帮帮孩子🥺', reply: '别烦，我下班前不想动感情。', delta: -10 },
        '比价': { say: '别家便宜一半', reply: '那你去别家啊，我还少回复一个。', delta: -10 },
        '以毒攻毒': { say: '你这种客服早晚被投诉', reply: '投诉去吧，我正好休息。', delta: -10 }
      },
      winLine: '行行行，你赢了。我手动给你改价，赶紧下单别磨我了。<br><b style="color:#E1251B">—— 你硬是把一个想下班的人拽回来上班。</b>',
      loseLine: '其实我都不想卖你，省得我发货。慢走，今天算双赢。',
      coupon: 25
    },
    qianmanman: {
      id: 'qianmanman',
      name: '鸡汤·钱满满',
      title: '客服 · 鸡汤·钱满满（在线）',
      emoji: '🧘',
      color: 'var(--p-tang)',
      desc: '“你值得更好的”，用爱感化你。',
      motive: 'C 反向温情（真心觉得不值，为你好）',
      weakness: '比价',
      firstLine: '亲爱的，你值得更好的，这件配不上你。',
      repeatLine: '亲爱的第 {n} 次来啦。这次我真的想让你省下这笔钱。',
      moves: {
        '坚定': { say: '我不管，就要买这个', reply: '你值得拥有，但冲动不是爱自己哦。', delta: -10 },
        '装可怜': { say: '我就想买一件奖励自己', reply: '奖励自己可以，但别奖励资本家呀。', delta: -10 },
        '比价': { say: '别家同材质才 29，你这边凭什么', reply: '你功课做得好……我编不下去了。', delta: 40 },
        '以毒攻毒': { say: '你少灌鸡汤', reply: '我不是灌鸡汤，我是真的心疼你钱包。', delta: -10 }
      },
      winLine: '好吧，你比价比得我都没词了。给你一张券，就当我也帮你省了一次。<br><b style="color:#E1251B">—— 鸡汤破功，漏出了“不想你亏”的真心。</b>',
      loseLine: '我就说吧，不买才是真的爱自己。今天你又清醒了一次。',
      coupon: 18
    },
    zhouanan: {
      id: 'zhouanan',
      name: '腹黑·周暗暗',
      title: '客服 · 腹黑·周暗暗（在线）',
      emoji: '😈',
      color: 'var(--p-fu)',
      desc: '笑里藏刀，设套让你自己放弃。',
      motive: 'D KPI 扭曲（考核劝退率）',
      weakness: '比价',
      firstLine: '亲亲，这款销量一般哦，建议您再看看别的呢~',
      repeatLine: '第 {n} 次来啦？您越执着，我越兴奋呢。',
      moves: {
        '坚定': { say: '我就要这款，别的不要', reply: '您这么坚定，那我祝您下单愉快。', delta: -10 },
        '装可怜': { say: '呜呜你给我优惠我就买', reply: '您演，我看着，继续。', delta: -10 },
        '比价': { say: '别家 39 同厂同款，你这儿 59', reply: '同厂不同料……算了，您查得太细。', delta: 40 },
        '以毒攻毒': { say: '你是不是故意想让我别买', reply: '被您看穿了？那我也不装了。', delta: -10 }
      },
      winLine: '服了，我 KPI 是劝退率，您偏要买。算了，给您券，您赢了。<br><b style="color:#E1251B">—— 腹黑人设崩塌，被您反向拿捏。</b>',
      loseLine: '恭喜您，成功没下单。我的劝退 KPI 又 +1，谢谢您。',
      coupon: 22
    }
  };

  var key = function(id, suffix) { return 'mart_' + id + '_' + suffix; };

  window.MartNPC = {
    list: Object.keys(NPCS),
    data: NPCS,
    get: function(id) { return NPCS[id] || NPCS.wangerba; },

    visits: function(id) {
      try { return parseInt(localStorage.getItem(key(id,'visits')) || '0', 10); }
      catch(e) { return 0; }
    },
    addVisit: function(id) {
      try {
        var v = this.visits(id) + 1;
        localStorage.setItem(key(id,'visits'), String(v));
        return v;
      } catch(e) { return 1; }
    },
    isCaught: function(id) {
      try { return localStorage.getItem(key(id,'caught')) === '1'; }
      catch(e) { return false; }
    },
    catchNPC: function(id) {
      try { localStorage.setItem(key(id,'caught'), '1'); } catch(e) {}
    },
    caughtCount: function() {
      return Object.keys(NPCS).filter(function(k){ return MartNPC.isCaught(k); }).length;
    },
    caughtList: function() {
      return Object.keys(NPCS).filter(function(k){ return MartNPC.isCaught(k); });
    }
  };
})();
