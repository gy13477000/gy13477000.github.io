<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Braces,
  Copy,
  Trash2,
  Minimize2,
  Wand2,
  AlertCircle,
  CheckCircle2,
  FileText,
  ChevronsDownUp,
  ChevronsUpDown,
  Search
} from 'lucide-vue-next'
import {
  formatJson,
  minifyJson,
  validateJson,
  escapeToJsonString,
  unescapeJsonString,
  SAMPLE_JSON
} from '@/tools/json/format'
import { buildJsonTree, statsOfTree, searchTree, type JsonTreeNode } from '@/tools/json/tree'
import JsonTreeNodeComp from '@/components/JsonTreeNode.vue'
import { copyToClipboard } from '@/utils/copy'

const input = ref('')
const indent = ref<number>(2)
const status = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const copied = ref(false)
const treeSearchQuery = ref('')
const treeVersion = ref(0) // 触发树重建

// 校验结果
const validation = computed(() => validateJson(input.value))

// 树视图相关
const tree = computed<JsonTreeNode | null>(() => {
  void treeVersion.value
  if (!validation.value.valid) return null
  if (!input.value.trim()) return null
  try {
    const parsed = JSON.parse(input.value)
    return buildJsonTree(parsed)
  } catch {
    return null
  }
})

const stats = computed(() => statsOfTree(tree.value))

// 搜索: 每次输入重新标记
watch(
  [tree, treeSearchQuery],
  () => {
    if (tree.value) {
      searchTree(tree.value, treeSearchQuery.value)
      treeVersion.value++
    }
  },
  { immediate: true, flush: 'post' }
)

function notify(type: 'success' | 'error', message: string) {
  status.value = { type, message }
  setTimeout(() => {
    if (status.value?.message === message) status.value = null
  }, 4000)
}

function handleFormat() {
  const r = formatJson(input.value, { indent: indent.value })
  if (r.ok) {
    input.value = r.text
    notify('success', '格式化成功')
  } else {
    const loc = r.line ? ` (第 ${r.line} 行, 第 ${r.column} 列)` : ''
    notify('error', `${r.message}${loc}`)
  }
}

function handleMinify() {
  const r = minifyJson(input.value)
  if (r.ok) {
    input.value = r.text
    notify('success', '压缩成功')
  } else {
    notify('error', r.message)
  }
}

function handleEscape() {
  if (!input.value) return
  input.value = escapeToJsonString(input.value)
  notify('success', '已转义为 JSON 字符串')
}

function handleUnescape() {
  if (!input.value) return
  try {
    input.value = unescapeJsonString(input.value)
    notify('success', '已反转义')
  } catch (e) {
    notify('error', e instanceof Error ? e.message : String(e))
  }
}

function handleClear() {
  input.value = ''
  treeSearchQuery.value = ''
  status.value = null
}

function handleSample() {
  input.value = SAMPLE_JSON
  notify('success', '已填入示例 JSON')
}

async function handleCopyOutput() {
  if (!input.value) return
  const ok = await copyToClipboard(input.value)
  if (ok) {
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  }
}

// 全部折叠/展开 (通过 key 重渲染)
const expandAll = ref(true)
function toggleExpandAll() {
  expandAll.value = !expandAll.value
  treeVersion.value++
}

const inputMeta = computed(() => `${input.value.length} 字符 / ${new Blob([input.value]).size} 字节`)
</script>

<template>
  <div class="container">
    <header class="page-head">
      <div class="head-icon"><Braces :size="22" /></div>
      <div>
        <h1 class="page-title">JSON 格式化</h1>
        <p class="page-desc">美化、压缩、校验、树形浏览，支持节点路径复制与字段搜索。</p>
      </div>
    </header>

    <div v-if="status" class="alert" :class="`alert-${status.type}`">
      <CheckCircle2 v-if="status.type === 'success'" :size="16" />
      <AlertCircle v-else :size="16" />
      <span>{{ status.message }}</span>
    </div>

    <div class="toolbar">
      <button class="btn btn-primary btn-sm" @click="handleFormat">
        <Wand2 :size="13" />
        格式化
      </button>
      <button class="btn btn-secondary btn-sm" @click="handleMinify">
        <Minimize2 :size="13" />
        压缩
      </button>
      <button class="btn btn-secondary btn-sm" @click="handleEscape">转义</button>
      <button class="btn btn-secondary btn-sm" @click="handleUnescape">反转义</button>
      <button class="btn btn-secondary btn-sm" @click="handleSample">
        <FileText :size="13" />
        示例
      </button>
      <div class="spacer"></div>
      <label class="indent-label">
        缩进
        <select v-model.number="indent" class="select-sm">
          <option :value="2">2 空格</option>
          <option :value="4">4 空格</option>
          <option :value="0">Tab</option>
        </select>
      </label>
      <button class="btn btn-ghost btn-sm" title="清空" @click="handleClear">
        <Trash2 :size="13" />
      </button>
    </div>

    <div class="editor-grid">
      <!-- 左侧: 源码编辑 -->
      <div class="editor-pane">
        <div class="pane-head">
          <span class="pane-title">源码</span>
          <div class="pane-meta">
            <span v-if="validation.valid && input" class="badge badge-success">
              <CheckCircle2 :size="11" />
              有效
            </span>
            <span v-else-if="input" class="badge badge-danger">
              <AlertCircle :size="11" />
              无效
            </span>
            <span class="meta-text">{{ inputMeta }}</span>
          </div>
          <button class="btn btn-ghost btn-sm" :disabled="!input" @click="handleCopyOutput">
            <Copy :size="12" />
            {{ copied ? '已复制' : '复制' }}
          </button>
        </div>
        <textarea
          v-model="input"
          class="textarea mono editor-textarea"
          spellcheck="false"
          placeholder='粘贴 JSON 到这里，或点击"示例"快速尝试'
        ></textarea>
        <div v-if="!validation.valid && input" class="error-bar">
          <AlertCircle :size="12" />
          <span>{{ validation.message }}</span>
          <span v-if="validation.line" class="error-loc">
            行 {{ validation.line }} : 列 {{ validation.column }}
          </span>
        </div>
      </div>

      <!-- 右侧: 树形浏览 -->
      <div class="editor-pane">
        <div class="pane-head">
          <span class="pane-title">树形浏览</span>
          <div v-if="tree" class="tree-stats">
            <span class="tag">{{ stats.objects }} 对象</span>
            <span class="tag">{{ stats.arrays }} 数组</span>
            <span class="tag">{{ stats.primitives }} 值</span>
            <span class="tag">深度 {{ stats.depth }}</span>
          </div>
          <button
            class="btn btn-ghost btn-sm"
            :title="expandAll ? '全部折叠' : '全部展开'"
            @click="toggleExpandAll"
          >
            <ChevronsDownUp v-if="expandAll" :size="12" />
            <ChevronsUpDown v-else :size="12" />
          </button>
        </div>

        <div class="tree-search-bar" v-if="tree">
          <Search :size="13" class="search-icon" />
          <input
            v-model="treeSearchQuery"
            type="text"
            class="tree-search-input"
            placeholder="搜索字段名或值..."
            spellcheck="false"
          />
          <span v-if="treeSearchQuery" class="search-clear" @click="treeSearchQuery = ''">×</span>
        </div>

        <div class="tree-container">
          <div v-if="tree" :key="treeVersion" class="tree-body">
            <JsonTreeNodeComp
              :node="tree"
              :has-query="!!treeSearchQuery"
              :default-expanded="expandAll"
            />
          </div>
          <div v-else-if="!input" class="tree-empty">
            <Braces :size="40" />
            <p>左侧粘贴 JSON 后这里会显示树形结构</p>
          </div>
          <div v-else class="tree-empty error-empty">
            <AlertCircle :size="40" />
            <p>JSON 解析失败，无法生成树</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.head-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 2px;
}
.page-desc {
  color: var(--color-text-muted);
  font-size: 14px;
}

.alert {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: 14px;
  margin-bottom: var(--space-4);
}
.alert-success {
  background: var(--color-success-subtle);
  color: var(--color-success);
}
.alert-error {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.spacer {
  flex: 1;
}
.indent-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 12px;
  color: var(--color-text-muted);
}
.select-sm {
  padding: 2px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 12px;
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.editor-pane {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  overflow: hidden;
  min-height: 500px;
  max-height: 70vh;
}

.pane-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-subtle);
  flex-shrink: 0;
}
.pane-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.pane-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
  margin-right: var(--space-2);
}
.meta-text {
  font-size: 11px;
  color: var(--color-text-subtle);
  font-family: var(--font-mono);
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}
.badge-success {
  background: var(--color-success-subtle);
  color: var(--color-success);
}
.badge-danger {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}

.editor-textarea {
  flex: 1;
  border: none;
  border-radius: 0;
  min-height: 440px;
  resize: none;
  font-size: 13px;
  line-height: 1.5;
}
.editor-textarea:focus {
  box-shadow: none;
}

.error-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-danger-subtle);
  color: var(--color-danger);
  font-size: 12px;
  border-top: 1px solid var(--color-border);
}
.error-loc {
  margin-left: auto;
  font-family: var(--font-mono);
  font-weight: 600;
}

.mono {
  font-family: var(--font-mono);
}

.tree-stats {
  display: flex;
  gap: 4px;
  margin-left: auto;
  margin-right: var(--space-2);
  flex-wrap: wrap;
}
.tree-stats .tag {
  font-size: 10px;
  padding: 1px 6px;
}

.tree-search-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
}
.search-icon {
  color: var(--color-text-muted);
}
.tree-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 13px;
  font-family: var(--font-mono);
}
.search-clear {
  cursor: pointer;
  font-size: 18px;
  color: var(--color-text-muted);
  line-height: 1;
  padding: 0 4px;
}

.tree-container {
  flex: 1;
  overflow: auto;
  padding: var(--space-2);
}
.tree-body {
  min-width: max-content;
}

.tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-subtle);
  gap: var(--space-3);
  padding: var(--space-8);
}
.tree-empty.error-empty {
  color: var(--color-danger);
}
.tree-empty p {
  font-size: 13px;
}

@media (max-width: 900px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }
}
</style>