// dishLabel.test.ts — Tier 1（正常值 / 边界 / 脏输入 / 真实数据回归）
// 对应缺陷：P1 审计 D1（折扣角标错 10 倍）、D2（月售逻辑反了）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { discountLabel, monthlyLabel, reviewLabel } from './dishLabel.ts'
import { DISHES } from '../data/dishes.ts'

// ---------- discountLabel · 正常值 ----------

test('DL1 折扣按真美团口径算：现价/原价×10，一位小数（6/9 → 低至6.7折，不是 67折）', () => {
  assert.equal(discountLabel(6, 9), '低至6.7折')
  assert.equal(discountLabel(8, 12), '低至6.7折')
  assert.equal(discountLabel(12, 16), '低至7.5折')
  assert.equal(discountLabel(28, 38), '低至7.4折')
})

test('DL2 整折不带小数点：5/10 → 低至5折（真美团写 5折 而非 5.0折）', () => {
  assert.equal(discountLabel(5, 10), '低至5折')
  assert.equal(discountLabel(3, 10), '低至3折')
})

// ---------- discountLabel · 边界 ----------

test('DL3 阈值边界：原价必须 > 现价×1.3 才挂角标，等于阈值不挂', () => {
  assert.equal(discountLabel(10, 13), '') // 恰好 1.3 倍 → 不挂
  assert.equal(discountLabel(10, 13.1), '低至7.6折') // 越过阈值 → 挂
  assert.equal(discountLabel(20, 26), '') // 真实数据 s05_d1，边界上不挂
})

test('DL4 无折扣 / 反向定价一律不挂角标', () => {
  assert.equal(discountLabel(10, 10), '')
  assert.equal(discountLabel(10, 8), '')
  assert.equal(discountLabel(10, undefined), '')
})

test('DL5 极限折扣仍是一位小数，不溢出成两位整数', () => {
  assert.equal(discountLabel(1, 100), '低至0.1折')
  assert.equal(discountLabel(1, 1000), '') // 四舍五入到 0.0 折 → 无意义，不渲染
})

// ---------- discountLabel · 脏输入 ----------

test('DL6 脏输入（NaN / 0 / 负数 / 字符串 / null）一律返回空串，不抛不渲染', () => {
  const dirty: unknown[] = [NaN, 0, -5, '9', null, undefined, Infinity, {}, []]
  for (const v of dirty) {
    assert.equal(discountLabel(v as number, 100), '', `price=${String(v)} 应降级为空串`)
    assert.equal(discountLabel(10, v as number), '', `originalPrice=${String(v)} 应降级为空串`)
  }
})

// ---------- discountLabel · 真实数据回归（D1 守门） ----------

test('DL7 回归：全量菜品渲染出的折扣文案，「折」前只允许 1 位整数（杜绝 67折 复发）', () => {
  const labels = DISHES.map((d) => discountLabel(d.price, d.originalPrice)).filter(Boolean)
  assert.ok(labels.length > 0, '真实数据里应至少有一道菜挂折扣角标')
  for (const label of labels) {
    assert.match(label, /^低至\d(\.\d)?折$/, `非法折扣文案：${label}`)
  }
})

// ---------- monthlyLabel · 正常值 / 边界 / 脏输入 ----------

test('ML1 有真实月售数据就原样显示（子串匹配，不是数组元素精确匹配）', () => {
  assert.equal(monthlyLabel(['招牌', '月售28']), '月售28')
  assert.equal(monthlyLabel(['招牌', '月售100+']), '月售100+')
  assert.equal(monthlyLabel(['月售50+']), '月售50+')
})

test('ML2 没有月售数据就留白，绝不编造', () => {
  assert.equal(monthlyLabel(['买贵必赔']), '')
  assert.equal(monthlyLabel([]), '')
  assert.equal(monthlyLabel(undefined), '')
})

test('ML3 脏输入（非数组 / 含 null / 含数字元素）不抛，跳过脏元素取真值', () => {
  assert.equal(monthlyLabel('月售28' as unknown as string[]), '')
  assert.equal(monthlyLabel(null as unknown as string[]), '')
  assert.equal(monthlyLabel([null, 42, '月售30+'] as unknown as string[]), '月售30+')
})

test('ML4 回归：真实数据里带月售标签的菜必须全部显示真值，其余全部留白', () => {
  const withData = DISHES.filter((d) => d.tags?.some((t) => t.includes('月售')))
  assert.ok(withData.length > 0, '真实数据里应有带月售标签的菜')
  for (const d of withData) {
    assert.ok(monthlyLabel(d.tags).startsWith('月售'), `${d.id} 有月售数据却没显示`)
  }
  for (const d of DISHES.filter((x) => !withData.includes(x))) {
    assert.equal(monthlyLabel(d.tags), '', `${d.id} 无月售数据却编造了文案`)
  }
})

// ---------- reviewLabel ----------

test('RL1 好评标签同口径：有则原样显示，无则留白，脏输入不抛', () => {
  assert.equal(reviewLabel(['96%人觉得好吃']), '96%人觉得好吃')
  assert.equal(reviewLabel(['招牌', '月售28']), '')
  assert.equal(reviewLabel(undefined), '')
  assert.equal(reviewLabel([undefined, '80人觉得不错'] as unknown as string[]), '80人觉得不错')
})
