# 胡闹外卖 · 对话逻辑一致性契约规格（waimai-drama-consistency-spec）

> **版本**：2026-07-28 · **设计**：design-strategist（文策渊 / Vince Coyer）
> **任务**：修复 `sliceDrama` 对话「系统错乱」感——荒诞台词保留，但同一角色在同一单内情绪/态度/对玩家选择的反应必须前后自洽、构成连贯因果弧。
> **性质声明**：设计 + 文案规格文档。不写 `.ts`/`.vue`、不改 `src/engine/sliceDrama.ts`、不改 `dramaEngine.ts`、不执行 git。文案为 authoritative 交付物，重构实现由 engineering-lead 承接。
> **产品铁律对齐**：真实外壳 × 胡闹内核 = 反差喜剧。胡闹是「内容」的胡闹，**不是「逻辑」的胡闹**。本规格令「逻辑」严谨、前后一致，同时保留并强化「胡闹内核」。
> **事实来源（实读）**：`src/engine/sliceDrama.ts`、`src/engine/dramaEngine.ts`（`DramaEventOut{phase,actor,text,moodDelta?,delay?}`）、`src/engine/sliceDrama.test.ts`（S1–S6）、`docs/designs/waimai-life-sim-slice-2026-07-27.md`（设计锁 B2）。
> **因果量模型**：本文档**不改变**任何数值计算（`bossMood=50+地址偏移+备注偏移`、`bossMood≤30→出餐慢`、`SLOW_COOK_DELAY=45000`、`SLOW_DELIVER_DELAY=25000`、`SLOW_RIDER_DROP=10`、`COMPLETE_REBOUND=5`、`perform.cookDelayBonus=20000`、`no_scold.gentleMood=5`、`boss_thx.gentleMood=10`）。仅重构文案与文案选择方案。S1–S6 的量级断言（bossMood/riderMorale/totalDelay/moodDelta/delay）**全部保持**；仅 S1 的 `complete` 文本因新增「多放辣」收尾回声需扩展断言（见 §4）。

---

## §1 一致性契约（规则，给 engineering-lead 当约束）

### 1.1 情绪带定义

`bossMood` 由 `50 + 地址偏移 + 备注偏移` 唯一确定，落入三带之一。每带定义**该带下 boss 角色应有的态度基线**（语气必须与带一致）：

| 带 | bossMood 区间 | 态度基线（boss 应有的语气） |
|---|---|---|
| **hostile** | `≤ 30` | 嫌弃/不耐/摆烂；可毒舌调侃地址，但语气是「嫌」不是「暖」；对备注的反应也是带刺地接招 |
| **neutral** | `31 – 59` | 公事公办/略带情绪但不极端；接受备注、不卑不亢；可被 remark 推动但本身不升温 |
| **warm** | `≥ 60` | 体贴/上心/被戳中；语气软、主动多给；备注（尤其 gentle）在此带是「锦上添花」而非「把火压下去」 |

> 边界：`30` 归入 hostile（即 `≤30` 出餐慢），`60` 归入 warm。

### 1.2 矛盾护栏规则（硬约束）

- **R1（单句内不得情绪对撞）**：同一句（`accept`/`cook`/`complete` 的拼接文本）内不得出现相反情绪。典型违例：「侮辱地址 + 被感动哭」「冷摆烂 + 暖抒情」同句硬拼 → 禁止。前半句定调，后半句（备注回声）必须同调或顺承，不得反转。
- **R2（单内态度单调/连贯）**：同一单内 boss 态度须沿情绪带**连贯演化**，不得无理由跳变。允许方向：`hostile → neutral`（被 gentle 备注劝住）、`neutral → warm`（被 gentle 备注暖到）、`hostile/neutral → warm`（gentle）、保持原带。禁止：暖数值突然摆烂、冷数值突然抒情、或中段无成因的情绪翻转。
- **R3（prefix 与 suffix 同带）**：`accept` 的「地址前缀（情境）」与「备注后缀（节拍）」必须落在同一带语气。冷地址配硬「别骂了」OK（同属冷→被劝），但暖地址不得套「别骂了」（老板本没骂），须用暖地址专属回声（见 §2.3）。
- **R4（备注节拍全程呼应）**：每个备注的「节拍」必须在 `accept` 引入，并在 `cook` 与 `complete` **至少各呼应一次**。`deliver` 由骑手承接地址情境即可；**仅当备注影响配送状态（出餐慢/骑手士气）时才须在 deliver 呼应**——本切片 6 备注均不改配送状态，故 deliver 一律不接备注回声（符合 R4）。
- **R5（数值带 = 台词语气）**：`bossMood` 数值所在带，必须与 `accept`/`cook`/`complete` 三阶段台词语气一致。**禁止暖数值配冷台词、冷数值配暖台词**（原 bug #3：company+boss_thx=65 warm 却写死「应付下别指望多用心」冷摆烂）。

### 1.3 因果弧模板（四阶段职责）

```
accept   → 建立态度（由 bossMood 带决定语气） + 引入备注节拍
cook     → 态度随带演化（gentle 备注在此升温/收敛） + 备注回声（cook 节拍）
deliver  → 骑手承接地址情境 + 受 cook 状态影响（slow→急/fast→稳），语气与前面因果一致；不提备注（合理）
complete → 收束弧线（态度落点） + 备注兑现（complete 节拍）
```

> 红线（全程门控，不突破）：不出现真实医疗机构名 / 死亡 / 暴力 / 竞品名；「ICU」用「ICU 病房」中性表述、语气温柔小心；「公厕」用化粪池/公共厕所调侃但不脏话。

---

## §2 内容生成架构建议（给 engineering-lead）

### 2.1 改为「带驱动 × 情境 × 节拍」选择

把现有 `ADDRESSES[id].acceptPrefix/cookBase/completeBase` 这类**单一情绪**文本，升级为**按带分层**的情境文本；把 `REMARKS[id].acceptSuffix/cookEcho/completeEcho` 升级为**可随地址温度消歧**的节拍片段。组装时纯函数、零随机、确定性。

```
addressTemp(addressTag): 'cold' | 'warm'
  cold  = toilet, company      // 基础偏移为负（−30 / −5）
  warm  = icu,   home         // 基础偏移为正（+20 / +5）

bandOf(bossMood): 'hostile' | 'neutral' | 'warm'   // ≤30 / 31–59 / ≥60

// 地址情境文本：按带分层（每地址仅填充其可达的带）
ADDRESS_BAND_TEXT[addressTag][band] = { accept, cook, complete }

// 备注节拍：accept/cook/complete 三拍；对需消歧的备注按 addressTemp 取变体
REMARK_BEAT[remarkTag] = {
  accept:   (temp) => string,
  cook:     (temp) => string,
  complete: (temp) => string,
}

组装（确定性，无随机）：
  band   = bandOf(50 + ADDRESS_OFFSETS[addr] + REMARK_OFFSETS[remark])
  temp   = addressTemp(addr)
  accept   = ADDRESS_BAND_TEXT[addr][band].accept   + REMARK_BEAT[remark].accept(temp)
  cook     = ADDRESS_BAND_TEXT[addr][band].cook     + REMARK_BEAT[remark].cook(temp)
  complete = ADDRESS_BAND_TEXT[addr][band].complete + REMARK_BEAT[remark].complete(temp)
  deliver  = RIDER_LINE[cookSlow ? 'slow' : 'fast'][addr]   // 不接备注
  // cookSlow、delay、moodDelta 等数值沿用现有常量，本文档不改
```

> `accept`/`cook`/`complete` 的三拍拼接后，由 §3 逐字文案保证 R1–R5。eng-lead 实现时，`ADDRESS_BAND_TEXT` 与 `REMARK_BEAT` 即是 §3 表格的「反查表」，逐字一致即可过测试。

### 2.2 数值常量（**保持不变**，仅列出供核对）

```
BASE_MOOD = 50
ADDRESS_OFFSETS:  toilet −30 | icu +20 | home +5 | company −5
REMARK_OFFSETS:   more_spicy +5 | less_spicy 0 | no_cilantro 0 | no_scold +15 | perform +10 | boss_thx +20
COOK_SLOW_THRESHOLD = 30          // bossMood ≤ 30 → 出餐慢
SLOW_COOK_DELAY = 45000           // 出餐慢 +45s
SLOW_DELIVER_DELAY = 25000        // 配送额外 +25s
SLOW_RIDER_DROP = 10              // 出餐慢 → 骑手士气 −10
COMPLETE_REBOUND = 5              // complete 事件 moodDelta（不回写 dramaState）
perform.cookDelayBonus = 20000    // 换装叠加（非出餐慢，骑手不掉士气）
no_scold.gentleMood = 5           // gentle：cook 阶段 moodDelta 转正
boss_thx.gentleMood = 10          // gentle：cook 阶段 moodDelta 转正
```

### 2.3 消歧方案（修复 bug #1 / #2 / #3 的核心手法）

`no_scold` 与 `boss_thx` 是「gentle 备注」，其回声必须随**地址温度**取不同变体，否则在暖地址会闹出「老板没骂却说别骂了」「暖数值配冷台词」的错乱。

- **`no_scold`（别骂了）**
  - 冷地址（toilet / company）：老板本要炸 → 被劝住收敛。回声带「别骂了」：
    `accept:"别骂了……行，我收敛点。"` · `cook:"（被你那句「别骂了」戳中）我好好做。"` · `complete:"刚才脾气不好，见谅啊。"`
  - 暖地址（icu / home）：老板本就 nice，没在骂，「别骂了」属无主句（原 bug #2）。改用「被你的体贴戳中」回声（**不出现「别骂了」**）：
    `accept:"你倒会替我着想……那我更得好好做。"` · `cook:"（被你这句话暖到，手上更仔细了）我好好做。"` · `complete:"你这么体贴，这单我记心里了。"`
- **`boss_thx`（老板辛苦了）**
  - 冷地址（toilet / company）：骂完被你客气整不会了：
    `accept:"老板辛苦了？嗐，被你这么客气整不会了……"` · `cook:"（心里一暖）您这句话我记下了，多放份量。"` · `complete:"（辛苦啥，您爱吃就行）"`
  - 暖地址（icu / home）：本就 nice 被你夸得更暖：
    `accept:"老板辛苦了？嘿，被你这么一夸，更得好好伺候了。"` · `cook:"（心里一暖）您这句话我记下了，多放份量。"` · `complete:"（辛苦啥，您爱吃就行）"`

> 为何用「2 路（冷/暖）」而非「4 路（每地址）」：地址温度只分两档即可让所有 24 组合落进不自洽的解（见 §3 全表验证），实现成本最低、且彻底消除跨带对撞。若主理人希望 finer 拆分，见 §5 Q5。

### 2.4 其余备注（无需消歧，单变体，但补齐 complete 拍）

- `more_spicy`：`accept:"行，多放辣是吧，辣得你忘了在哪儿吃的。"` · `cook:"辣子现舂，等着。"` · **`complete:"辣到位了，喝口水缓缓。"`**（原缺失，bug #4/#5 修复）
- `less_spicy`：`accept:"少放辣？行，清淡点。"` · `cook:"辣子我手抖少抓了一把。"` · `complete:"清清淡淡，养胃。"`
- `no_cilantro`：`accept:"不要香菜？又是你。"` · `cook:"香菜我一根没放，您放心。"` · `complete:"（确定没香菜，我检查三遍了）"`
- `perform`：`accept:"表演才艺？成，今儿给你来一段。"` · `cook:"先去换身行头，您稍等，演出级出餐。"` · `complete:"谢幕鞠躬，下次点个「encore」呗。"`

> 以上单变体回声语气中性、可兼容 hostile/neutral/warm 三带（已逐组合验证，见 §3），故无需按带拆分。

---

## §3 24 组合连贯文案表（核心交付物）

**列**：组合 | bossMood | 带 | accept | cook | deliver | complete
**说明**：
- `deliver` 为**骑手**台词，承接地址情境 + cook 状态（slow/fast）；本切片 6 备注均不改配送状态，故 deliver 不接备注回声（符合 R4）。
- 慢单（bossMood ≤ 30）= `toilet+more_spicy / toilet+less_spicy / toilet+no_cilantro / toilet+perform` 共 4 单；其余 20 单为快单。
- 所有台词逐字中文，过红线（无真实医疗机构名/死亡/暴力/竞品；ICU 温柔中性；公厕化粪池调侃不脏话），且荒诞但自洽。

### 3.1 公厕 toilet（cold，可达 hostile / neutral）

| 组合 | bossMood | 带 | accept | cook | deliver | complete |
|---|---|---|---|---|---|---|
| toilet+more_spicy | 25 | hostile | 公厕？？你住化粪池啊……行，多放辣是吧，辣得你忘了在哪儿吃的。 | （啧，公厕的单我故意慢慢做，锅都不想洗）辣子现舂，等着。 | 这老板又摆烂，我急疯了狂飙……公厕我找了半天。 | 拿好，公厕……趁热吃（别真趁热）。下次点正常地址行不行。辣到位了，喝口水缓缓。 |
| toilet+less_spicy | 20 | hostile | 公厕？？你住化粪池啊……少放辣？行，清淡点。 | （啧，公厕的单我故意慢慢做，锅都不想洗）辣子我手抖少抓了一把。 | 这老板又摆烂，我急疯了狂飙……公厕我找了半天。 | 拿好，公厕……趁热吃（别真趁热）。下次点正常地址行不行。清清淡淡，养胃。 |
| toilet+no_cilantro | 20 | hostile | 公厕？？你住化粪池啊……不要香菜？又是你。 | （啧，公厕的单我故意慢慢做，锅都不想洗）香菜我一根没放，您放心。 | 这老板又摆烂，我急疯了狂飙……公厕我找了半天。 | 拿好，公厕……趁热吃（别真趁热）。下次点正常地址行不行。（确定没香菜，我检查三遍了） |
| toilet+no_scold | 35 | neutral | 公厕是吧……行，你这地址我接了。别骂了……行，我收敛点。 | 公厕这单我正常做。（被你那句「别骂了」戳中）我好好做。 | 公厕这单老板居然利索，我一路畅通送到了，奇了。 | 拿好，公厕……趁热吃（别真趁热）。你刚那句，我记下了。刚才脾气不好，见谅啊。 |
| toilet+perform | 30 | hostile | 公厕？？你住化粪池啊……表演才艺？成，今儿给你来一段。 | （啧，公厕的单我故意慢慢做，锅都不想洗）先去换身行头，您稍等，演出级出餐。 | 这老板又摆烂，我急疯了狂飙……公厕我找了半天。 | 拿好，公厕……趁热吃（别真趁热）。下次点正常地址行不行。谢幕鞠躬，下次点个「encore」呗。 |
| toilet+boss_thx | 40 | neutral | 公厕是吧……行，你这地址我接了。老板辛苦了？嗐，被你这么客气整不会了…… | 公厕这单我正常做。（心里一暖）您这句话我记下了，多放份量。 | 公厕这单老板居然利索，我一路畅通送到了，奇了。 | 拿好，公厕……趁热吃（别真趁热）。你刚那句，我记下了。（辛苦啥，您爱吃就行） |

### 3.2 ICU 病房 icu（warm，仅可达 warm）

| 组合 | bossMood | 带 | accept | cook | deliver | complete |
|---|---|---|---|---|---|---|
| icu+more_spicy | 75 | warm | ICU 病房？我轻着点做，您安心养着。行，多放辣是吧，辣得你忘了在哪儿吃的。 | （小声）您这单我得快手快脚又轻手轻脚地做，汤别洒了。辣子现舂，等着。 | ICU 这单我开得稳稳的，您别急，门帮您留着。 | 趁热趁软乎……您慢用，好好休息。辣到位了，喝口水缓缓。 |
| icu+less_spicy | 70 | warm | ICU 病房？我轻着点做，您安心养着。少放辣？行，清淡点。 | （小声）您这单我得快手快脚又轻手轻脚地做，汤别洒了。辣子我手抖少抓了一把。 | ICU 这单我开得稳稳的，您别急，门帮您留着。 | 趁热趁软乎……您慢用，好好休息。清清淡淡，养胃。 |
| icu+no_cilantro | 70 | warm | ICU 病房？我轻着点做，您安心养着。不要香菜？又是你。 | （小声）您这单我得快手快脚又轻手轻脚地做，汤别洒了。香菜我一根没放，您放心。 | ICU 这单我开得稳稳的，您别急，门帮您留着。 | 趁热趁软乎……您慢用，好好休息。（确定没香菜，我检查三遍了） |
| icu+no_scold | 85 | warm | ICU 病房？我轻着点做，您安心养着。你倒会替我着想……那我更得好好做。 | （小声）您这单我得快手快脚又轻手轻脚地做，汤别洒了。（被你这句话暖到，手上更仔细了）我好好做。 | ICU 这单我开得稳稳的，您别急，门帮您留着。 | 趁热趁软乎……您慢用，好好休息。你这么体贴，这单我记心里了。 |
| icu+perform | 80 | warm | ICU 病房？我轻着点做，您安心养着。表演才艺？成，今儿给你来一段。 | （小声）您这单我得快手快脚又轻手轻脚地做，汤别洒了。先去换身行头，您稍等，演出级出餐。 | ICU 这单我开得稳稳的，您别急，门帮您留着。 | 趁热趁软乎……您慢用，好好休息。谢幕鞠躬，下次点个「encore」呗。 |
| icu+boss_thx | 90 | warm | ICU 病房？我轻着点做，您安心养着。老板辛苦了？嘿，被你这么一夸，更得好好伺候了。 | （小声）您这单我得快手快脚又轻手轻脚地做，汤别洒了。（心里一暖）您这句话我记下了，多放份量。 | ICU 这单我开得稳稳的，您别急，门帮您留着。 | 趁热趁软乎……您慢用，好好休息。（辛苦啥，您爱吃就行） |

### 3.3 家庭 home（warm 温度，可达 neutral / warm）

| 组合 | bossMood | 带 | accept | cook | deliver | complete |
|---|---|---|---|---|---|---|
| home+more_spicy | 60 | warm | 家庭单？跟给自己家做一样，随便坐。行，多放辣是吧，辣得你忘了在哪儿吃的。 | （哼着歌）家的味道，火候我拿捏得准。辣子现舂，等着。 | 你家这栋我熟，溜达着就到了，门把手给您留着。 | 拿好，趁热吃，家里人等你呢。辣到位了，喝口水缓缓。 |
| home+less_spicy | 55 | neutral | 家庭单？跟给自己家做一样，随便坐。少放辣？行，清淡点。 | （哼着歌）家的味道，火候我拿捏得准。辣子我手抖少抓了一把。 | 你家这栋我熟，溜达着就到了，门把手给您留着。 | 拿好，趁热吃，家里人等你呢。清清淡淡，养胃。 |
| home+no_cilantro | 55 | neutral | 家庭单？跟给自己家做一样，随便坐。不要香菜？又是你。 | （哼着歌）家的味道，火候我拿捏得准。香菜我一根没放，您放心。 | 你家这栋我熟，溜达着就到了，门把手给您留着。 | 拿好，趁热吃，家里人等你呢。（确定没香菜，我检查三遍了） |
| home+no_scold | 70 | warm | 家庭单？跟给自己家做一样，随便坐。你倒会替我着想……那我更得好好做。 | （哼着歌）家的味道，火候我拿捏得准。（被你这句话暖到，手上更仔细了）我好好做。 | 你家这栋我熟，溜达着就到了，门把手给您留着。 | 拿好，趁热吃，家里人等你呢。你这么体贴，这单我记心里了。 |
| home+perform | 65 | warm | 家庭单？跟给自己家做一样，随便坐。表演才艺？成，今儿给你来一段。 | （哼着歌）家的味道，火候我拿捏得准。先去换身行头，您稍等，演出级出餐。 | 你家这栋我熟，溜达着就到了，门把手给您留着。 | 拿好，趁热吃，家里人等你呢。谢幕鞠躬，下次点个「encore」呗。 |
| home+boss_thx | 75 | warm | 家庭单？跟给自己家做一样，随便坐。老板辛苦了？嘿，被你这么一夸，更得好好伺候了。 | （哼着歌）家的味道，火候我拿捏得准。（心里一暖）您这句话我记下了，多放份量。 | 你家这栋我熟，溜达着就到了，门把手给您留着。 | 拿好，趁热吃，家里人等你呢。（辛苦啥，您爱吃就行） |

### 3.4 公司 company（cold 温度，可达 neutral / warm）

| 组合 | bossMood | 带 | accept | cook | deliver | complete |
|---|---|---|---|---|---|---|
| company+more_spicy | 50 | neutral | 公司单？行，你们打工人互相折磨呗。行，多放辣是吧，辣得你忘了在哪儿吃的。 | （叹气）公司单我也就应付下，别指望多用心。辣子现舂，等着。 | 公司楼我天天跑，电梯挤死，但准时给您放前台了。 | 拿好，回工位趁热扒两口，别被老板抓包。辣到位了，喝口水缓缓。 |
| company+less_spicy | 45 | neutral | 公司单？行，你们打工人互相折磨呗。少放辣？行，清淡点。 | （叹气）公司单我也就应付下，别指望多用心。辣子我手抖少抓了一把。 | 公司楼我天天跑，电梯挤死，但准时给您放前台了。 | 拿好，回工位趁热扒两口，别被老板抓包。清清淡淡，养胃。 |
| company+no_cilantro | 45 | neutral | 公司单？行，你们打工人互相折磨呗。不要香菜？又是你。 | （叹气）公司单我也就应付下，别指望多用心。香菜我一根没放，您放心。 | 公司楼我天天跑，电梯挤死，但准时给您放前台了。 | 拿好，回工位趁热扒两口，别被老板抓包。（确定没香菜，我检查三遍了） |
| company+no_scold | 60 | warm | 公司单？……得，被你这单整得我也有点想好好干。别骂了……行，我收敛点。 | 公司单我也认真做，给你们打工人争口气。（被你那句「别骂了」戳中）我好好做。 | 公司楼我天天跑，电梯挤死，但准时给您放前台了。 | 拿好，回工位趁热吃，今天这单我用心了。刚才脾气不好，见谅啊。 |
| company+perform | 55 | neutral | 公司单？行，你们打工人互相折磨呗。表演才艺？成，今儿给你来一段。 | （叹气）公司单我也就应付下，别指望多用心。先去换身行头，您稍等，演出级出餐。 | 公司楼我天天跑，电梯挤死，但准时给您放前台了。 | 拿好，回工位趁热扒两口，别被老板抓包。谢幕鞠躬，下次点个「encore」呗。 |
| company+boss_thx | 65 | warm | 公司单？……得，被你这单整得我也有点想好好干。老板辛苦了？嗐，被你这么客气整不会了…… | 公司单我也认真做，给你们打工人争口气。（心里一暖）您这句话我记下了，多放份量。 | 公司楼我天天跑，电梯挤死，但准时给您放前台了。 | 拿好，回工位趁热吃，今天这单我用心了。（辛苦啥，您爱吃就行） |

### 3.5 已确诊 5 处断裂 → 在 §3 的修复落点

| 原断裂（用户点名） | 修复落点 | 修复手法 |
|---|---|---|
| #1 同句情绪对撞（toilet+boss_thx「化粪池侮辱+被感动哭」） | §3.1 末行 | toilet+boss_thx=40 落 **neutral 带** → 前缀用 neutral 版「公厕是吧……行，你这地址我接了」而非 hostile「化粪池」版，后缀「被你这么客气整不会了」同属 mild，不再对撞 |
| #2 无主句（home+no_scold「老板没骂却说别骂了」） | §3.3 第4行 | home=warm 温度 → 取 **no_scold 暖变体**（「你倒会替我着想……」），不出现「别骂了」 |
| #3 情绪带与台词脱节（company+boss_thx=65 warm 却写死冷摆烂） | §3.4 末行 | company+boss_thx=65 → **warm 带** → 取 company.cook_warm「认真做争口气」而非 cook_neutral「应付下」 |
| #4 选择线程蒸发（more_spicy completeEcho 空） | 全表 more_spicy 行 | 补 `complete:"辣到位了，喝口水缓缓。"`，accept/cook/complete 三拍齐全 |
| #5 备注回声后半程缺失 | 全表 | 每个备注在 accept 引入、cook+complete 各呼应（R4）；deliver 由骑手承接地址情境，符合「备注不改配送则不呼应」 |

---

## §4 给 engineering-lead 的重构注意点

1. **仍纯函数、零随机、确定性**：`sliceDrama(input)` 同输入必同输出（S2 仍成立）。文案选择仅由 `addressTag`/`remarkTag` 决定，无任何 `Math.random`/抽签。
2. **不破坏 `DramaEventOut` 结构**：四阶段仍输出 `{phase, actor, text, moodDelta?, delay?}`，`actor` 取值 `boss`/`rider`/`system` 不变；`deliver` 始终 `actor:'rider'`。
3. **数值模型零改动**：`bossMood`/`riderMorale`/`totalDelay`/`moodDelta`/`delay` 计算逻辑与常量（§2.2）原样保留。新增仅为「按带选文本 + 按 addressTemp 选备注变体」的**查表拼接**。
4. **守纯点击（零 input）**：地址/备注仍来自 chip 选项的 `addressTag`/`remarkTag`，无自由文本；红线门控（`forbidden_check`）调用照旧。
5. **S1（公厕+多放辣）可重写断言**：accept / cook / deliver 三句与现引擎**逐字一致**；仅 `complete` 由
   `拿好，公厕……趁热吃（别真趁热）。下次点正常地址行不行。`
   变为
   `拿好，公厕……趁热吃（别真趁热）。下次点正常地址行不行。辣到位了，喝口水缓缓。`
   （确定性扩展，扩展断言即可）。S2–S6 量级断言（bossMood/riderMorale/totalDelay/moodDelta/delay）**完全不变**。
6. **实现建议**：`ADDRESS_BAND_TEXT` 与 `REMARK_BEAT` 直接以 §3 表格为 source of truth 落地；`addressTemp` 用 `toilet|company→cold`、`icu|home→warm` 两档；`band` 由 `bossMood` 阈值判定。逐字对齐 §3 即过全部断言。
7. **不回归红线**：文案中「ICU 病房」「化粪池/公共厕所」表述保留中性/调侃不脏话；不引入真实医疗机构名、死亡、暴力、竞品名。

---

## §5 开放问题（需主理人拍板）

- **Q1（边界）**：`toilet+perform` 的 `bossMood=30`，按 `≤30` 判为**出餐慢**（slow）。当前设计保留此边界（老板既摆烂又换装，喜剧叠加）。请主理人确认「表演才艺」在公厕地址应走慢单还是希望把它拉成快单（若改需调 `perform` 偏移或阈值，超出本文档「数值不变」约定）。
- **Q2（ICU 荒诞度）**：`icu+more_spicy` 的 complete 为「好好休息。辣到位了，喝口水缓缓。」——在 ICU 语境下「辣」是刻意荒诞（胡闹内核）。若主理人认为 ICU 应更克制，可对 `more_spicy` 在 icu 单独加一版温柔收尾（如「辣子我少放了，您尝个味儿」），需新增按「地址」细分的备注变体。
- **Q3（home 带拆分）**：home 可达 neutral(55) 与 warm(60+)，现共用一套 cozy 文本（因 home 本就温暖，两带语气无违和）。若主理人希望 neutral/warm 在 home 也有更明显语气差，可仿 company 补 home 的 neutral/warm 双版情境文本。
- **Q4（deliver 不接备注）**：按 R4，本切片 6 备注均不改配送状态，故骑手 deliver 不呼应备注（如 perform 的「谢幕」只在 boss complete 收束）。请主理人确认此「备注后半程由 boss complete 兑现、骑手只管地址情境」的分工符合预期。
- **Q5（消歧粒度）**：`no_scold`/`boss_thx` 现用「冷/暖 2 路」消歧。若主理人希望更精细（如 toilet 与 company 各自不同回声），可升级为「每地址变体」，代价是实现表更宽、文案量 ×4。当前 2 路已能消除全部跨带对撞，推荐维持 2 路。

---

_设计 · design-strategist（文策渊）· 2026-07-28 · 不写代码 / 不改 src / 不 git · 数值模型对齐 `sliceDrama.ts` 既有常量，文案为 authoritative 交付物_
