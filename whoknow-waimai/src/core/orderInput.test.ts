// orderInput.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildOrderInput, classifyRemark, classifyAddress } from './orderInput.ts'

test('O1 备注分类：别骂 → no_scold，辣 → more_spicy，其他 → undefined', () => {
  assert.equal(classifyRemark('老板别骂了'), 'no_scold')
  assert.equal(classifyRemark('多放辣谢谢'), 'more_spicy')
  assert.equal(classifyRemark('尽快送达'), undefined)
  assert.equal(classifyRemark(''), undefined)
})

test('O2 地址分类：奇葩/地球/迷路 → weird，其他 → undefined', () => {
  assert.equal(classifyAddress('这个地址有点奇葩'), 'weird')
  assert.equal(classifyAddress('你确定在地球？'), 'weird')
  assert.equal(classifyAddress('阳光小区3栋'), undefined)
})

test('O3 buildOrderInput：表单 → OrderInput 映射正确', () => {
  const oi = buildOrderInput({
    shopId: 's01',
    riderId: 'r001',
    orderTotal: 15,
    avgDishPrice: 5,
    dishCount: 3,
    deliveryFee: 4,
    remark: '别骂了求你',
    address: '这地方导航都找不到',
  })
  assert.equal(oi.shopId, 's01')
  assert.equal(oi.riderId, 'r001')
  assert.equal(oi.orderTotal, 15)
  assert.equal(oi.deliveryFee, 4)
  assert.equal(oi.remarkTag, 'no_scold')
  assert.equal(oi.addressTag, 'weird')
})

test('O4 无备注/地址 → tag 为 undefined（不污染）', () => {
  const oi = buildOrderInput({ orderTotal: 50, avgDishPrice: 20 })
  assert.equal(oi.remarkTag, undefined)
  assert.equal(oi.addressTag, undefined)
  assert.equal(oi.orderTotal, 50)
})
