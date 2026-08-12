<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, CornerDownLeft, ArrowUp, ArrowDown, Clock, Trash2, X } from 'lucide-vue-next'
import { useCommandPaletteStore } from '@/stores/commandPalette'
import { useToolsPrefsStore } from '@/stores/toolsPrefs'
import type { ToolMeta } from '@/tools/registry'

const router = useRouter()
const palette = useCommandPaletteStore()
const prefs = useToolsPrefsStore()

const query = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

interface ResultItem {
  tool: ToolMeta
  matchedField: 'name' | 'description' | 'tags' | 'path'
  isRecent?: boolean
}

// 全部可搜索工具 = 用户可见工具
const allTools = computed(() => prefs.visibleTools)

// 搜索结果
const results = computed<ResultItem[]>((): ResultItem[] => {
  const q = query.value.trim().toLowerCase()
  if (!q) {
    // 无搜索词：展示最近使用 + 全部工具
    const recentIds = palette.history.map((h) => h.id)
    const recentTools = recentIds
      .map((id) => allTools.value.find((t) => t.id === id))
      .filter(Boolean) as ToolMeta[]
    return [
      ...recentTools.map((t) => ({ tool: t, matchedField: 'name' as const, isRecent: true })),
      ...allTools.value.filter((t) => !recentIds.includes(t.id))
        .map((t) => ({ tool: t, matchedField: 'name' as const }))
    ]
  }

  const matched: ResultItem[] = []
  for (const tool of allTools.value) {
    if (tool.name.toLowerCase().includes(q)) {
      matched.push({ tool, matchedField: 'name' })
    } else if (tool.description.toLowerCase().includes(q)) {
      matched.push({ tool, matchedField: 'description' })
    } else if (tool.tags?.some((tag) => tag.toLowerCase().includes(q))) {
      matched.push({ tool, matchedField: 'tags' })
    } else if (tool.path.toLowerCase().includes(q)) {
      matched.push({ tool, matchedField: 'path' })
    }
  }
  return matched
})

// 分组：最近使用 / 搜索结果
const groupedResults = computed(() => {
  const recent = results.value.filter((r) => r.isRecent)
  const rest = results.value.filter((r) => !r.isRecent)
  const groups: { title: string; items: ResultItem[] }[] = []
  if (recent.length > 0) {
    groups.push({ title: '最近使用', items: recent })
  }
  if (rest.length > 0) {
    groups.push({ title: query.value.trim() ? '搜索结果' : '全部工具', items: rest })
  }
  return groups
})

// 扁平化用于键盘上下选择
const flatResults = computed(() => results.value)

watch(query, () => {
  selectedIndex.value = 0
})

watch(() => palette.isOpen, async (open) => {
  if (open) {
    query.value = ''
    selectedIndex.value = 0
    await nextTick()
    inputRef.value?.focus()
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

function highlight(text: string, q: string): string {
  if (!q) return escapeHtml(text)
  const lowerText = text.toLowerCase()
  const idx = lowerText.indexOf(q.toLowerCase())
  if (idx < 0) return escapeHtml(text)
  return (
    escapeHtml(text.slice(0, idx)) +
    '<mark>' +
    escapeHtml(text.slice(idx, idx + q.length)) +
    '</mark>' +
    escapeHtml(text.slice(idx + q.length))
  )
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function selectItem(idx: number) {
  if (idx >= 0 && idx < flatResults.value.length) {
    selectedIndex.value = idx
    // 滚动到可视
    nextTick(() => {
      const el = document.querySelector(`[data-idx="${idx}"]`)
      el?.scrollIntoView({ block: 'nearest' })
    })
  }
}

function openTool(item: ResultItem) {
  palette.recordVisit(item.tool.id)
  router.push(item.tool.path)
  palette.close()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectItem(Math.min(selectedIndex.value + 1, flatResults.value.length - 1))
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectItem(Math.max(selectedIndex.value - 1, 0))
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = flatResults.value[selectedIndex.value]
    if (item) openTool(item)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    palette.close()
  }
}

// 全局快捷键
function globalKeydown(e: KeyboardEvent) {
  const isMac = navigator.platform.toUpperCase().includes('MAC')
  const modKey = isMac ? e.metaKey : e.ctrlKey
  if (modKey && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    palette.toggle()
  } else if (e.key === 'Escape' && palette.isOpen) {
    palette.close()
  }
}

function clearRecent() {
  palette.clearHistory()
}

onMounted(() => {
  window.addEventListener('keydown', globalKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', globalKeydown)
  document.body.style.overflow = ''
})

// 计算每个 item 的全局 idx（用于高亮）
function flatIdx(groupIdx: number, itemIdx: number): number {
  let count = 0
  for (let i = 0; i < groupIdx; i++) {
    count += groupedResults.value[i].items.length
  }
  return count + itemIdx
}

const isMac = ref(false)
onMounted(() => {
  isMac.value = navigator.platform.toUpperCase().includes('MAC')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="palette">
      <div v-if="palette.isOpen" class="palette-overlay" @click="palette.close()">
        <div class="palette" @click.stop>
          <!-- 搜索框 -->
          <div class="palette-input-wrap">
            <Search :size="18" class="input-icon" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="palette-input"
              placeholder="搜索工具名称、描述或标签..."
              spellcheck="false"
              autocomplete="off"
              @keydown="handleKeydown"
            />
            <button class="close-btn" @click="palette.close()">
              <X :size="16" />
            </button>
          </div>

          <!-- 结果列表 -->
          <div v-if="flatResults.length > 0" class="palette-results">
            <div v-for="(group, gIdx) in groupedResults" :key="group.title" class="result-group">
              <div class="group-head">
                <span>{{ group.title }}</span>
                <button
                  v-if="group.title === '最近使用' && group.items.length > 0"
                  class="clear-btn"
                  @click="clearRecent"
                >
                  <Trash2 :size="11" />
                  清空
                </button>
              </div>
              <button
                v-for="(item, iIdx) in group.items"
                :key="item.tool.id"
                :data-idx="flatIdx(gIdx, iIdx)"
                class="result-item"
                :class="{ active: flatIdx(gIdx, iIdx) === selectedIndex }"
                @click="openTool(item)"
                @mouseenter="selectItem(flatIdx(gIdx, iIdx))"
              >
                <div class="item-icon">{{ item.tool.name.charAt(0) }}</div>
                <div class="item-body">
                  <div class="item-title" v-html="highlight(item.tool.name, query)"></div>
                  <div
                    v-if="item.matchedField === 'description'"
                    class="item-desc"
                    v-html="highlight(item.tool.description, query)"
                  ></div>
                  <div v-else class="item-desc">{{ item.tool.description }}</div>
                </div>
                <div class="item-meta">
                  <Clock v-if="item.isRecent" :size="12" class="recent-icon" />
                  <span class="item-path">{{ item.tool.path }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="palette-empty">
            <Search :size="32" />
            <p>没有找到匹配 "{{ query }}" 的工具</p>
          </div>

          <!-- 底部快捷键提示 -->
          <div class="palette-footer">
            <div class="footer-hint">
              <kbd><ArrowUp :size="10" /></kbd>
              <kbd><ArrowDown :size="10" /></kbd>
              <span>选择</span>
            </div>
            <div class="footer-hint">
              <kbd><CornerDownLeft :size="10" /></kbd>
              <span>打开</span>
            </div>
            <div class="footer-hint">
              <kbd>esc</kbd>
              <span>关闭</span>
            </div>
            <div class="spacer"></div>
            <div class="footer-brand">{{ flatResults.length }} 个工具</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
}

.palette {
  width: 90%;
  max-width: 600px;
  max-height: 70vh;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg), 0 20px 50px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.palette-input-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.input-icon { color: var(--color-text-muted); flex-shrink: 0; }
.palette-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 16px;
}
.palette-input::placeholder { color: var(--color-text-subtle); }
.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
}
.close-btn:hover { background: var(--color-bg-subtle); color: var(--color-text); }

.palette-results {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.result-group { margin-bottom: var(--space-2); }
.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
}
.clear-btn:hover { color: var(--color-danger); }

.result-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);
}
.result-item:hover, .result-item.active {
  background: var(--color-primary-subtle);
}
.item-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}
.result-item.active .item-icon {
  background: var(--color-primary);
  color: #fff;
}
.item-body { flex: 1; min-width: 0; }
.item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 2px;
}
.item-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-desc :deep(mark) {
  background: transparent;
  color: var(--color-primary);
  font-weight: 600;
}
.item-title :deep(mark) {
  background: transparent;
  color: var(--color-primary);
  font-weight: 700;
}
.item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-subtle);
  font-family: var(--font-mono);
  flex-shrink: 0;
}
.recent-icon { color: var(--color-warning); }

.palette-empty {
  padding: var(--space-12);
  text-align: center;
  color: var(--color-text-subtle);
}
.palette-empty p {
  margin-top: var(--space-3);
  font-size: 14px;
}

.palette-footer {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-subtle);
}
.footer-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.footer-hint kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--color-text);
}
.spacer { flex: 1; }
.footer-brand {
  font-size: 11px;
  color: var(--color-text-subtle);
}

/* 过渡动画 */
.palette-enter-active, .palette-leave-active {
  transition: opacity 200ms ease;
}
.palette-enter-active .palette, .palette-leave-active .palette {
  transition: transform 200ms ease, opacity 200ms ease;
}
.palette-enter-from, .palette-leave-to {
  opacity: 0;
}
.palette-enter-from .palette, .palette-leave-to .palette {
  transform: scale(0.96) translateY(-10px);
  opacity: 0;
}

@media (max-width: 640px) {
  .palette-overlay { padding-top: 5vh; }
  .palette { max-height: 85vh; }
  .palette-footer { flex-wrap: wrap; gap: var(--space-2); }
}
</style>