// sliceDrama.test.ts — 切片确定性推演验收（node --test --experimental-strip-types）
//
// 设计锁定：docs/designs/waimai-life-sim-slice-2026-07-27.md §B2
// 一致性契约：docs/designs/waimai-drama-consistency-spec.md §3（24 组合逐字文案，authoritative）
// 核心断言：
//   - 公厕+多放辣 与文档示例逐字一致（确定性）
//   - 同一输入连跑 2 次深相等（无随机）
//   - S7 契约锁：遍历全部 24 组合（4 地址 × 6 备注），逐字对齐 §3 表格，防止回归
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sliceDrama, ADDRESS_OFFSETS, REMARK_OFFSETS } from './sliceDrama.ts'
import type { AddressTag, RemarkTag } from './sliceDrama.ts'

test('S1 公厕+多放辣：与文档 B2 / §3.1 示例逐字一致（确定性）', () => {
  const r = sliceDrama({ addressTag: 'toilet', remarkTag: 'more_spicy' })

  // 4 阶段顺序固定
  assert.equal(r.events.length, 4)
  assert.deepEqual(
    r.events.map((e) => e.phase),
    ['accept', 'cook', 'deliver', 'complete']
  )

  // 逐字台词（对齐 §3.1 首行）
  assert.equal(
    r.events[0].text,
    '公厕？？你住化粪池啊……行，多放辣是吧，辣得你忘了在哪儿吃的。'
  )
  assert.equal(r.events[1].text, '（啧，公厕的单我故意慢慢做，锅都不想洗）辣子现舂，等着。')
  assert.equal(r.events[2].text, '这老板又摆烂，我急疯了狂飙……公厕我找了半天。')
  assert.equal(
    r.events[3].text,
    '拿好，公厕……趁热吃（别真趁热）。下次点正常地址行不行。辣到位了，喝口水缓缓。'
  )

  // 因果量（B2：50 - 30 + 5 = 25 带；出餐慢 45s；骑手 -10；配送 25s）
  assert.equal(r.dramaState.bossMood, 25)
  assert.equal(r.dramaState.riderMorale, 50)
  assert.equal(r.dramaState.totalDelay, 70_000)
  assert.equal(r.events[0].moodDelta, -25)
  assert.equal(r.events[1].delay, 45_000) // 出餐慢 45s
  assert.equal(r.events[2].delay, 25_000) // 配送 25s
  assert.equal(r.events[3].moodDelta, 5) // 送达叙事微回弹
})

test('S2 无随机：同一输入连跑 2 次结果深相等', () => {
  const a = sliceDrama({ addressTag: 'toilet', remarkTag: 'more_spicy' })
  const b = sliceDrama({ addressTag: 'toilet', remarkTag: 'more_spicy' })
  assert.deepEqual(a, b)
})

test('S3 复合可解释：公厕+别骂了 → 出餐转快、老板收敛（符号变化）', () => {
  const slow = sliceDrama({ addressTag: 'toilet', remarkTag: 'more_spicy' }) // 25 → 出餐慢
  const gentle = sliceDrama({ addressTag: 'toilet', remarkTag: 'no_scold' }) // 35 → 出餐快

  assert.equal(slow.dramaState.totalDelay, 70_000) // 公厕+多放辣：出餐慢
  assert.equal(gentle.dramaState.totalDelay, 0) // 别骂了把情绪带到 35 → 出餐快
  assert.equal(gentle.dramaState.bossMood, 35)

  // 第2阶段（出餐）gentle 备注把 moodDelta 转正（被戳中收敛）→ 符号变化
  assert.equal(gentle.events[1].moodDelta, 5)
  assert.equal(slow.events[1].moodDelta, undefined)
})

test('S4 开场即分：4 地址 base（无备注）接单台词一眼可分', () => {
  const lines = (['toilet', 'icu', 'home', 'company'] as const).map(
    (a) => sliceDrama({ addressTag: a, remarkTag: 'less_spicy' }).events[0].text
  )
  assert.ok(lines[0].includes('公厕'))
  assert.ok(lines[1].includes('ICU 病房'))
  assert.ok(lines[2].includes('家庭'))
  assert.ok(lines[3].includes('公司'))
  assert.equal(new Set(lines).size, 4) // 四句互不相同
})

test('S5 高带地址（ICU+别骂了）：出餐快、骑手平稳、无出餐慢 delay', () => {
  const r = sliceDrama({ addressTag: 'icu', remarkTag: 'no_scold' })
  assert.equal(r.dramaState.bossMood, 85)
  assert.equal(r.dramaState.riderMorale, 60)
  assert.equal(r.dramaState.totalDelay, 0)
  assert.equal(r.events[1].delay, 0)
})

test('S6 表演才艺：出餐额外 delay（换装）叠加，但骑手不因此掉士气', () => {
  const r = sliceDrama({ addressTag: 'home', remarkTag: 'perform' })
  // home(+5)+perform(+10)=65 → 出餐快；但 perform 换装 +20s
  assert.equal(r.dramaState.bossMood, 65)
  assert.equal(r.dramaState.totalDelay, 20_000)
  assert.equal(r.dramaState.riderMorale, 60) // 非「出餐慢」(情绪带>30)，骑手不掉
})

test('S7 契约锁：24 组合逐字对齐 §3 表格（防回归）', () => {
  const ADDRESSES: AddressTag[] = ['toilet', 'icu', 'home', 'company']
  const REMARKS: RemarkTag[] = [
    'more_spicy',
    'less_spicy',
    'no_cilantro',
    'no_scold',
    'perform',
    'boss_thx',
  ]

  // [addr, remark, accept, cook, deliver, complete] —— 逐字来自 §3（含标点/括号/emoji）
  const EXPECT: Array<[AddressTag, RemarkTag, string, string, string, string]> = [
    // §3.1 公厕 toilet（cold，可达 hostile / neutral）
    ['toilet', 'more_spicy', '公厕？？你住化粪池啊……行，多放辣是吧，辣得你忘了在哪儿吃的。', '（啧，公厕的单我故意慢慢做，锅都不想洗）辣子现舂，等着。', '这老板又摆烂，我急疯了狂飙……公厕我找了半天。', '拿好，公厕……趁热吃（别真趁热）。下次点正常地址行不行。辣到位了，喝口水缓缓。'],
    ['toilet', 'less_spicy', '公厕？？你住化粪池啊……少放辣？行，清淡点。', '（啧，公厕的单我故意慢慢做，锅都不想洗）辣子我手抖少抓了一把。', '这老板又摆烂，我急疯了狂飙……公厕我找了半天。', '拿好，公厕……趁热吃（别真趁热）。下次点正常地址行不行。清清淡淡，养胃。'],
    ['toilet', 'no_cilantro', '公厕？？你住化粪池啊……不要香菜？又是你。', '（啧，公厕的单我故意慢慢做，锅都不想洗）香菜我一根没放，您放心。', '这老板又摆烂，我急疯了狂飙……公厕我找了半天。', '拿好，公厕……趁热吃（别真趁热）。下次点正常地址行不行。（确定没香菜，我检查三遍了）'],
    ['toilet', 'no_scold', '公厕是吧……行，你这地址我接了。别骂了……行，我收敛点。', '公厕这单我正常做。（被你那句「别骂了」戳中）我好好做。', '公厕这单老板居然利索，我一路畅通送到了，奇了。', '拿好，公厕……趁热吃（别真趁热）。你刚那句，我记下了。刚才脾气不好，见谅啊。'],
    ['toilet', 'perform', '公厕？？你住化粪池啊……表演才艺？成，今儿给你来一段。', '（啧，公厕的单我故意慢慢做，锅都不想洗）先去换身行头，您稍等，演出级出餐。', '这老板又摆烂，我急疯了狂飙……公厕我找了半天。', '拿好，公厕……趁热吃（别真趁热）。下次点正常地址行不行。谢幕鞠躬，下次点个「encore」呗。'],
    ['toilet', 'boss_thx', '公厕是吧……行，你这地址我接了。老板辛苦了？嗐，被你这么客气整不会了……', '公厕这单我正常做。（心里一暖）您这句话我记下了，多放份量。', '公厕这单老板居然利索，我一路畅通送到了，奇了。', '拿好，公厕……趁热吃（别真趁热）。你刚那句，我记下了。（辛苦啥，您爱吃就行）'],

    // §3.2 ICU 病房 icu（warm，仅可达 warm）
    ['icu', 'more_spicy', 'ICU 病房？我轻着点做，您安心养着。行，多放辣是吧，辣得你忘了在哪儿吃的。', '（小声）您这单我得快手快脚又轻手轻脚地做，汤别洒了。辣子现舂，等着。', 'ICU 这单我开得稳稳的，您别急，门帮您留着。', '趁热趁软乎……您慢用，好好休息。辣到位了，喝口水缓缓。'],
    ['icu', 'less_spicy', 'ICU 病房？我轻着点做，您安心养着。少放辣？行，清淡点。', '（小声）您这单我得快手快脚又轻手轻脚地做，汤别洒了。辣子我手抖少抓了一把。', 'ICU 这单我开得稳稳的，您别急，门帮您留着。', '趁热趁软乎……您慢用，好好休息。清清淡淡，养胃。'],
    ['icu', 'no_cilantro', 'ICU 病房？我轻着点做，您安心养着。不要香菜？又是你。', '（小声）您这单我得快手快脚又轻手轻脚地做，汤别洒了。香菜我一根没放，您放心。', 'ICU 这单我开得稳稳的，您别急，门帮您留着。', '趁热趁软乎……您慢用，好好休息。（确定没香菜，我检查三遍了）'],
    ['icu', 'no_scold', 'ICU 病房？我轻着点做，您安心养着。你倒会替我着想……那我更得好好做。', '（小声）您这单我得快手快脚又轻手轻脚地做，汤别洒了。（被你这句话暖到，手上更仔细了）我好好做。', 'ICU 这单我开得稳稳的，您别急，门帮您留着。', '趁热趁软乎……您慢用，好好休息。你这么体贴，这单我记心里了。'],
    ['icu', 'perform', 'ICU 病房？我轻着点做，您安心养着。表演才艺？成，今儿给你来一段。', '（小声）您这单我得快手快脚又轻手轻脚地做，汤别洒了。先去换身行头，您稍等，演出级出餐。', 'ICU 这单我开得稳稳的，您别急，门帮您留着。', '趁热趁软乎……您慢用，好好休息。谢幕鞠躬，下次点个「encore」呗。'],
    ['icu', 'boss_thx', 'ICU 病房？我轻着点做，您安心养着。老板辛苦了？嘿，被你这么一夸，更得好好伺候了。', '（小声）您这单我得快手快脚又轻手轻脚地做，汤别洒了。（心里一暖）您这句话我记下了，多放份量。', 'ICU 这单我开得稳稳的，您别急，门帮您留着。', '趁热趁软乎……您慢用，好好休息。（辛苦啥，您爱吃就行）'],

    // §3.3 家庭 home（warm 温度，可达 neutral / warm）
    ['home', 'more_spicy', '家庭单？跟给自己家做一样，随便坐。行，多放辣是吧，辣得你忘了在哪儿吃的。', '（哼着歌）家的味道，火候我拿捏得准。辣子现舂，等着。', '你家这栋我熟，溜达着就到了，门把手给您留着。', '拿好，趁热吃，家里人等你呢。辣到位了，喝口水缓缓。'],
    ['home', 'less_spicy', '家庭单？跟给自己家做一样，随便坐。少放辣？行，清淡点。', '（哼着歌）家的味道，火候我拿捏得准。辣子我手抖少抓了一把。', '你家这栋我熟，溜达着就到了，门把手给您留着。', '拿好，趁热吃，家里人等你呢。清清淡淡，养胃。'],
    ['home', 'no_cilantro', '家庭单？跟给自己家做一样，随便坐。不要香菜？又是你。', '（哼着歌）家的味道，火候我拿捏得准。香菜我一根没放，您放心。', '你家这栋我熟，溜达着就到了，门把手给您留着。', '拿好，趁热吃，家里人等你呢。（确定没香菜，我检查三遍了）'],
    ['home', 'no_scold', '家庭单？跟给自己家做一样，随便坐。你倒会替我着想……那我更得好好做。', '（哼着歌）家的味道，火候我拿捏得准。（被你这句话暖到，手上更仔细了）我好好做。', '你家这栋我熟，溜达着就到了，门把手给您留着。', '拿好，趁热吃，家里人等你呢。你这么体贴，这单我记心里了。'],
    ['home', 'perform', '家庭单？跟给自己家做一样，随便坐。表演才艺？成，今儿给你来一段。', '（哼着歌）家的味道，火候我拿捏得准。先去换身行头，您稍等，演出级出餐。', '你家这栋我熟，溜达着就到了，门把手给您留着。', '拿好，趁热吃，家里人等你呢。谢幕鞠躬，下次点个「encore」呗。'],
    ['home', 'boss_thx', '家庭单？跟给自己家做一样，随便坐。老板辛苦了？嘿，被你这么一夸，更得好好伺候了。', '（哼着歌）家的味道，火候我拿捏得准。（心里一暖）您这句话我记下了，多放份量。', '你家这栋我熟，溜达着就到了，门把手给您留着。', '拿好，趁热吃，家里人等你呢。（辛苦啥，您爱吃就行）'],

    // §3.4 公司 company（cold 温度，可达 neutral / warm）
    ['company', 'more_spicy', '公司单？行，你们打工人互相折磨呗。行，多放辣是吧，辣得你忘了在哪儿吃的。', '（叹气）公司单我也就应付下，别指望多用心。辣子现舂，等着。', '公司楼我天天跑，电梯挤死，但准时给您放前台了。', '拿好，回工位趁热扒两口，别被老板抓包。辣到位了，喝口水缓缓。'],
    ['company', 'less_spicy', '公司单？行，你们打工人互相折磨呗。少放辣？行，清淡点。', '（叹气）公司单我也就应付下，别指望多用心。辣子我手抖少抓了一把。', '公司楼我天天跑，电梯挤死，但准时给您放前台了。', '拿好，回工位趁热扒两口，别被老板抓包。清清淡淡，养胃。'],
    ['company', 'no_cilantro', '公司单？行，你们打工人互相折磨呗。不要香菜？又是你。', '（叹气）公司单我也就应付下，别指望多用心。香菜我一根没放，您放心。', '公司楼我天天跑，电梯挤死，但准时给您放前台了。', '拿好，回工位趁热扒两口，别被老板抓包。（确定没香菜，我检查三遍了）'],
    ['company', 'no_scold', '公司单？……得，被你这单整得我也有点想好好干。别骂了……行，我收敛点。', '公司单我也认真做，给你们打工人争口气。（被你那句「别骂了」戳中）我好好做。', '公司楼我天天跑，电梯挤死，但准时给您放前台了。', '拿好，回工位趁热吃，今天这单我用心了。刚才脾气不好，见谅啊。'],
    ['company', 'perform', '公司单？行，你们打工人互相折磨呗。表演才艺？成，今儿给你来一段。', '（叹气）公司单我也就应付下，别指望多用心。先去换身行头，您稍等，演出级出餐。', '公司楼我天天跑，电梯挤死，但准时给您放前台了。', '拿好，回工位趁热扒两口，别被老板抓包。谢幕鞠躬，下次点个「encore」呗。'],
    ['company', 'boss_thx', '公司单？……得，被你这单整得我也有点想好好干。老板辛苦了？嗐，被你这么客气整不会了……', '公司单我也认真做，给你们打工人争口气。（心里一暖）您这句话我记下了，多放份量。', '公司楼我天天跑，电梯挤死，但准时给您放前台了。', '拿好，回工位趁热吃，今天这单我用心了。（辛苦啥，您爱吃就行）'],
  ]

  assert.equal(EXPECT.length, 24, '§3 必须为 4×6=24 组合')

  for (const [addr, remark, expAccept, expCook, expDeliver, expComplete] of EXPECT) {
    const r = sliceDrama({ addressTag: addr, remarkTag: remark })
    const label = `${addr}+${remark}`

    // 结构：四阶段齐备
    assert.equal(r.events.length, 4, `${label} 应有 4 阶段`)
    assert.deepEqual(
      r.events.map((e) => e.phase),
      ['accept', 'cook', 'deliver', 'complete'],
      `${label} 阶段顺序`
    )

    // 四阶段文本非空
    for (const e of r.events) {
      assert.ok(typeof e.text === 'string' && e.text.length > 0, `${label} ${e.phase} 文本非空`)
    }

    // 数值不变：bossMood 必须等于 50 + 地址偏移 + 备注偏移
    const expectedMood = 50 + ADDRESS_OFFSETS[addr] + REMARK_OFFSETS[remark]
    assert.equal(r.dramaState.bossMood, expectedMood, `${label} bossMood 数值模型`)

    // 逐字对齐 §3（authoritative）
    assert.equal(r.events[0].text, expAccept, `${label} accept 逐字`)
    assert.equal(r.events[1].text, expCook, `${label} cook 逐字`)
    assert.equal(r.events[2].text, expDeliver, `${label} deliver 逐字`)
    assert.equal(r.events[3].text, expComplete, `${label} complete 逐字`)

    // actor 不变：deliver 始终 rider，其余 boss
    assert.equal(r.events[2].actor, 'rider', `${label} deliver actor`)
    assert.equal(r.events[0].actor, 'boss', `${label} accept actor`)
    assert.equal(r.events[1].actor, 'boss', `${label} cook actor`)
    assert.equal(r.events[3].actor, 'boss', `${label} complete actor`)
  }

  // 综上：24 组合全覆盖（4 地址 × 6 备注）
  const covered = new Set(
    EXPECT.map(([a, rm]) => `${a}+${rm}`)
  )
  assert.equal(covered.size, 24)
  for (const a of ADDRESSES) {
    for (const rm of REMARKS) {
      assert.ok(covered.has(`${a}+${rm}`), `组合 ${a}+${rm} 已锁`)
    }
  }
})
