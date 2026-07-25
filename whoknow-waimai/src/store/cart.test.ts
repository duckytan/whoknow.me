import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addItem, decItem, dishCount, cartTotal, clearShop, cart } from './cart.ts'

test('购物车：加菜/减菜/合计/清空', () => {
  clearShop('s01')
  assert.equal(dishCount('s01'), 0)

  addItem('s01', 's01_d1') // 羊肉串 ¥6
  addItem('s01', 's01_d1')
  addItem('s01', 's01_d5') // 冰啤酒 ¥5
  assert.equal(dishCount('s01'), 3)
  assert.equal(cartTotal('s01'), 6 * 2 + 5) // 17

  decItem('s01', 's01_d1')
  assert.equal(dishCount('s01'), 2)
  assert.equal(cartTotal('s01'), 6 + 5) // 11

  // 减到 0 自动移除该菜
  decItem('s01', 's01_d1')
  decItem('s01', 's01_d5')
  assert.equal(dishCount('s01'), 0)
  assert.equal(cart['s01'], undefined)

  clearShop('s01')
})
