import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNpcStore = defineStore('npc', () => {
  const bossMessage = ref<string>('')
  const riderMessage = ref<string>('')
  const isRunning = ref(false)

  function setBossMessage(msg: string) {
    bossMessage.value = msg
  }

  function setRiderMessage(msg: string) {
    riderMessage.value = msg
  }

  function setRunning(val: boolean) {
    isRunning.value = val
  }

  function reset() {
    bossMessage.value = ''
    riderMessage.value = ''
    isRunning.value = false
  }

  return { bossMessage, riderMessage, isRunning, setBossMessage, setRiderMessage, setRunning, reset }
})
