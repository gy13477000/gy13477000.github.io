import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { tools as allTools } from '@/tools/tools'

const STORAGE_KEY = 'tools-preferences'

interface Preferences {
  order: string[]
  hidden: string[]
}

function loadPreferences(): Preferences {
  if (typeof window === 'undefined') return { order: [], hidden: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { order: [], hidden: [] }
    const parsed = JSON.parse(raw) as Preferences
    if (!Array.isArray(parsed.order) || !Array.isArray(parsed.hidden)) {
      return { order: [], hidden: [] }
    }
    return parsed
  } catch {
    return { order: [], hidden: [] }
  }
}

function savePreferences(p: Preferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export const useToolsPrefsStore = defineStore('toolsPrefs', () => {
  const initial = loadPreferences()

  // 用户排序的 id 列表
  const order = ref<string[]>(initial.order)
  // 用户隐藏的 id 列表
  const hidden = ref<string[]>(initial.hidden)

  // 持久化
  watch(
    [order, hidden],
    ([o, h]) => savePreferences({ order: [...o], hidden: [...h] }),
    { deep: true }
  )

  // 所有已知 id（用于校验 / 初始化）
  const allIds = computed(() => allTools.map((t) => t.id))

  // 排序后的可见工具列表
  const visibleTools = computed(() => {
    // 合并 order：先按用户顺序，再加新工具（未在 order 里的）
    const ordered = order.value.filter((id) => allIds.value.includes(id))
    const missing = allIds.value.filter((id) => !ordered.includes(id))
    const finalOrder = [...ordered, ...missing]
    return finalOrder
      .filter((id) => !hidden.value.includes(id))
      .map((id) => allTools.find((t) => t.id === id)!)
      .filter(Boolean)
  })

  // 隐藏的工具列表（用于编辑模式展示）
  const hiddenTools = computed(() =>
    hidden.value.map((id) => allTools.find((t) => t.id === id)).filter(Boolean)
  )

  // 所有工具（按用户排序，含隐藏）— 编辑模式用
  const allSortedTools = computed(() => {
    const ordered = order.value.filter((id) => allIds.value.includes(id))
    const missing = allIds.value.filter((id) => !ordered.includes(id))
    const finalOrder = [...ordered, ...missing]
    return finalOrder.map((id) => ({
      tool: allTools.find((t) => t.id === id)!,
      hidden: hidden.value.includes(id)
    }))
  })

  // 精选工具（按用户排序优先，取前 N 个未隐藏的）
  const featuredTools = computed(() => {
    const visible = visibleTools.value
    // 优先用户排序的前 4 个；如果都没 featured 标记，取可见的前 4 个
    const userTop = visible.slice(0, 4)
    if (userTop.length >= 4) return userTop
    // 不足 4 个时补充 featured 标记的
    const featured = visible.filter((t) => t.featured)
    const merged = [...new Set([...userTop, ...featured])]
    return merged.slice(0, 4)
  })

  function moveUp(id: string) {
    const idx = order.value.indexOf(id)
    if (idx <= 0) return
    const arr = [...order.value]
    ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
    order.value = arr
  }

  function moveDown(id: string) {
    const idx = order.value.indexOf(id)
    if (idx < 0 || idx >= order.value.length - 1) return
    const arr = [...order.value]
    ;[arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]]
    order.value = arr
  }

  // 拖拽：把 fromId 移动到 toId 之前
  function moveTo(fromId: string, toId: string) {
    if (fromId === toId) return
    const arr = order.value.filter((id) => id !== fromId)
    const toIdx = arr.indexOf(toId)
    if (toIdx < 0) {
      arr.push(fromId)
    } else {
      arr.splice(toIdx, 0, fromId)
    }
    order.value = arr
  }

  function toggleHidden(id: string) {
    if (hidden.value.includes(id)) {
      hidden.value = hidden.value.filter((x) => x !== id)
    } else {
      hidden.value = [...hidden.value, id]
    }
  }

  function showAll() {
    hidden.value = []
  }

  function reset() {
    order.value = []
    hidden.value = []
  }

  return {
    order,
    hidden,
    visibleTools,
    hiddenTools,
    allSortedTools,
    featuredTools,
    moveUp,
    moveDown,
    moveTo,
    toggleHidden,
    showAll,
    reset
  }
})