<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Settings2,
  Check,
  RotateCcw,
  EyeOff,
  Eye,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Pin
} from 'lucide-vue-next'
import { useToolsPrefsStore } from '@/stores/toolsPrefs'
import type { ToolMeta } from '@/tools/registry'

const router = useRouter()
const prefs = useToolsPrefsStore()

const editMode = ref(false)

// 拖拽相关
const draggingId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

function onDragStart(e: DragEvent, id: string) {
  draggingId.value = id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
}

function onDragOver(e: DragEvent, id: string) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dragOverId.value = id
}

function onDrop(e: DragEvent, targetId: string) {
  e.preventDefault()
  const fromId = draggingId.value
  if (fromId && fromId !== targetId) {
    prefs.moveTo(fromId, targetId)
  }
  draggingId.value = null
  dragOverId.value = null
}

function onDragEnd() {
  draggingId.value = null
  dragOverId.value = null
}

function toggleEdit() {
  editMode.value = !editMode.value
}

function exitEdit() {
  editMode.value = false
}

function resetAll() {
  if (confirm('确定重置所有排序和显示设置？')) {
    prefs.reset()
  }
}
</script>

<template>
  <div class="container">
    <header class="page-head">
      <div class="head-text">
        <h1 class="page-title">工具集合</h1>
        <p class="page-desc">这里放一些常用的小工具，{{ prefs.order.length > 0 ? '已按你的偏好排序' : '可在编辑模式下自定义排序' }}。</p>
      </div>
      <div class="head-actions">
        <button v-if="!editMode" class="btn btn-secondary btn-sm" @click="toggleEdit">
          <Settings2 :size="14" />
          编辑布局
        </button>
        <template v-else>
          <button class="btn btn-ghost btn-sm" @click="resetAll" title="重置">
            <RotateCcw :size="14" />
            重置
          </button>
          <button class="btn btn-primary btn-sm" @click="exitEdit">
            <Check :size="14" />
            完成
          </button>
        </template>
      </div>
    </header>

    <!-- 编辑模式：隐藏的工具可恢复 -->
    <div v-if="editMode && prefs.hiddenTools.length > 0" class="hidden-section">
      <div class="hidden-head">
        <Eye :size="14" />
        <span>已隐藏 ({{ prefs.hiddenTools.length }})</span>
      </div>
      <div class="hidden-chips">
        <button
          v-for="t in prefs.hiddenTools"
          :key="t!.id"
          class="chip"
          @click="prefs.toggleHidden(t!.id)"
        >
          <Eye :size="12" />
          {{ t!.name }}
        </button>
      </div>
    </div>

    <div v-if="prefs.visibleTools.length === 0 && !editMode" class="empty-state">
      <p>所有工具都被隐藏了。点击右上角"编辑布局"恢复。</p>
    </div>

    <div class="tool-grid" :class="{ editing: editMode }">
      <article
        v-for="item in prefs.allSortedTools"
        :key="item.tool.id"
        class="tool card"
        :class="{
          'is-hidden': item.hidden,
          'is-dragging': draggingId === item.tool.id,
          'is-drag-over': dragOverId === item.tool.id
        }"
        :draggable="editMode"
        @click="!editMode && router.push(item.tool.path)"
        @dragstart="editMode && onDragStart($event, item.tool.id)"
        @dragover="editMode && onDragOver($event, item.tool.id)"
        @drop="editMode && onDrop($event, item.tool.id)"
        @dragend="onDragEnd"
      >
        <!-- 编辑模式控件层 -->
        <div v-if="editMode" class="edit-overlay">
          <button
            class="drag-handle"
            title="拖拽排序"
          >
            <GripVertical :size="16" />
          </button>
          <div class="edit-controls">
            <button class="ctrl-btn" @click.stop="prefs.moveUp(item.tool.id)" title="上移">
              <ChevronUp :size="14" />
            </button>
            <button class="ctrl-btn" @click.stop="prefs.moveDown(item.tool.id)" title="下移">
              <ChevronDown :size="14" />
            </button>
          </div>
          <button
            class="toggle-btn"
            :class="{ 'show-btn': item.hidden }"
            @click.stop="prefs.toggleHidden(item.tool.id)"
            :title="item.hidden ? '显示' : '隐藏'"
          >
            <EyeOff v-if="!item.hidden" :size="14" />
            <Eye v-else :size="14" />
          </button>
        </div>

        <div class="tool-head">
          <div class="tool-icon">{{ item.tool.name.charAt(0) }}</div>
          <div class="tool-tags" v-if="item.tool.tags">
            <span v-for="tag in item.tool.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
        <h3 class="tool-title">{{ item.tool.name }}</h3>
        <p class="tool-desc">{{ item.tool.description }}</p>
        <div class="tool-footer">
          <span v-if="!editMode" class="tool-cta">
            打开
            <ArrowRight :size="14" />
          </span>
          <span v-else-if="item.hidden" class="hidden-badge">
            <EyeOff :size="12" />
            已隐藏
          </span>
          <span v-else class="tool-cta">
            <Pin :size="12" />
            排序中
          </span>
        </div>
      </article>
    </div>

    <p v-if="editMode" class="edit-hint">
      💡 拖拽卡片排序 · 点击右上角按钮显示/隐藏 · 设置自动保存到本地浏览器
    </p>
  </div>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}
.head-text { flex: 1; }
.page-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: var(--space-2);
}
.page-desc { color: var(--color-text-muted); }
.head-actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.hidden-section {
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-5);
}
.hidden-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin-bottom: var(--space-2);
}
.hidden-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-size: 12px;
  cursor: pointer;
  border: 1px solid var(--color-border);
  transition: all var(--transition-fast);
}
.chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-4);
  color: var(--color-text-muted);
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}
.tool-grid.editing .tool {
  cursor: grab;
}
.tool-grid.editing .tool:active {
  cursor: grabbing;
}

.tool {
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all var(--transition-fast);
}
.tool:hover:not(.is-hidden) {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.tool.is-hidden {
  opacity: 0.4;
  border-style: dashed;
}
.tool.is-dragging {
  opacity: 0.3;
  transform: scale(0.98);
}
.tool.is-drag-over {
  border-color: var(--color-primary);
  border-style: solid;
  box-shadow: 0 0 0 2px var(--color-primary-subtle);
}

.edit-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-3);
  pointer-events: none;
  z-index: 2;
}
.edit-overlay > * { pointer-events: auto; }

.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  color: var(--color-text-subtle);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
}
.edit-controls {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ctrl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 22px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
}
.ctrl-btn:hover {
  color: var(--color-primary);
}
.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
}
.toggle-btn:hover { color: var(--color-danger); }
.toggle-btn.show-btn:hover { color: var(--color-success); }

.tool-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.tool-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  font-weight: 700;
  font-size: 20px;
}
.tool-tags { display: flex; gap: var(--space-2); }
.tool-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: var(--space-2);
}
.tool-desc {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: var(--space-4);
  flex: 1;
}
.tool-footer {
  display: flex;
  justify-content: flex-end;
}
.tool-cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 500;
}
.hidden-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-subtle);
}

.edit-hint {
  margin-top: var(--space-6);
  padding: var(--space-3) var(--space-4);
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  font-size: 13px;
  text-align: center;
}

@media (max-width: 640px) {
  .page-head {
    flex-direction: column;
  }
  .head-actions { align-self: flex-end; }
}
</style>