import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import shopsData from '@/data/shops.json'
import dishesData from '@/data/dishes.json'
import type { Shop, Dish } from '@/types'

export const useShopStore = defineStore('shop', () => {
  const shops = ref<Shop[]>(shopsData as Shop[])
  const dishes = ref<Dish[]>(dishesData as Dish[])
  const currentShopId = ref<string | null>(null)

  const currentShop = computed(() =>
    shops.value.find(s => s.id === currentShopId.value) || null
  )

  const getShopById = (id: string) =>
    shops.value.find(s => s.id === id) || null

  const getDishesByShop = (shopId: string) =>
    dishes.value.filter(d => d.shopId === shopId)

  function setCurrentShop(id: string) {
    currentShopId.value = id
  }

  return { shops, dishes, currentShop, currentShopId, getShopById, getDishesByShop, setCurrentShop }
})
