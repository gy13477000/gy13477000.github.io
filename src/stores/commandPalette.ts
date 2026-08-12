import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const VISIT_KEY = 'tool-visit-history'
const MAX_HISTORY = 5

export interface VisitRecord {
  id: string
  lastVisit: number
  count: number
}

function loadHistory(): VisitRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(VISIT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveHistory(records: VisitRecord[]) {
  localStorage.setItem(VISIT_KEY, JSON.stringify(records))
}

export const useCommandPaletteStore = defineStore('commandPalette', () => {
  const isOpen = ref(false)
  const history = ref<VisitRecord[]>(loadHistory())

  watch(history, (val) => saveHistory(val), { deep: true })

  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  function recordVisit(id: string) {
    if (!id) return
    const existing = history.value.find((r) => r.id === id)
    if (existing) {
      existing.lastVisit = Date.now()
      existing.count += 1
      // 上浮到第一位
      history.value = [
        existing,
        ...history.value.filter((r) => r.id !== id)
      ].slice(0, MAX_HISTORY)
    } else {
      history.value = [{ id, lastVisit: Date.now(), count: 1 }, ...history.value].slice(0, MAX_HISTORY)
    }
  }

  function clearHistory() {
    history.value = []
  }

  return {
    isOpen,
    history,
    open,
    close,
    toggle,
    recordVisit,
    clearHistory
  }
})