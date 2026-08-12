<script setup lang="ts">
import { ref, computed } from 'vue'
import { Binary, Copy, Trash2, ArrowDownUp } from 'lucide-vue-next'
import {
  utf8ToBase64,
  base64ToUtf8,
  utf8ToHex,
  hexToUtf8,
  urlEncode,
  urlDecode,
  parseQueryString,
  buildQueryString,
  type QueryParam
} from '@/tools/codec/codec'
import { copyToClipboard } from '@/utils/copy'

type Mode = 'base64' | 'hex' | 'url'

const mode = ref<Mode>('base64')
const input = ref('')
const output = ref('')
const copied = ref(false)
const status = ref<{ type: 'success' | 'error'; message: string } | null>(null)

// query string 单独一栏
const queryInput = ref('')
const queryParams = ref<QueryParam[]>([])

const inputMeta = computed(() => `${input.value.length} 字符 / ${new Blob([input.value]).size} 字节`)
const outputMeta = computed(() =>
  output.value ? `${output.value.length} 字符 / ${new Blob([output.value]).size} 字节` : ''
)

function notify(type: 'success' | 'error', message: string) {
  status.value = { type, message }
  setTimeout(() => {
    if (status.value?.message === message) status.value = null
  }, 3000)
}

function encode() {
  try {
    if (mode.value === 'base64') output.value = utf8ToBase64(input.value)
    else if (mode.value === 'hex') output.value = utf8ToHex(input.value)
    else output.value = urlEncode(input.value)
    notify('success', '编码成功')
  } catch (e) {
    notify('error', e instanceof Error ? e.message : String(e))
  }
}

function decode() {
  try {
    if (mode.value === 'base64') output.value = base64ToUtf8(input.value)
    else if (mode.value === 'hex') output.value = hexToUtf8(input.value)
    else output.value = urlDecode(input.value)
    notify('success', '解码成功')
  } catch (e) {
    notify('error', e instanceof Error ? e.message : String(e))
  }
}

function swap() {
  const tmp = input.value
  input.value = output.value
  output.value = tmp
}

function clearAll() {
  input.value = ''
  output.value = ''
  status.value = null
}

async function copyOutput() {
  if (!output.value) return
  const ok = await copyToClipboard(output.value)
  if (ok) {
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  }
}

function parseQuery() {
  try {
    queryParams.value = parseQueryString(queryInput.value)
    if (queryParams.value.length === 0) notify('error', '未解析到参数')
    else notify('success', `解析到 ${queryParams.value.length} 个参数`)
  } catch (e) {
    notify('error', e instanceof Error ? e.message : String(e))
  }
}

function addParam() {
  queryParams.value.push({ key: '', value: '' })
}

function removeParam(idx: number) {
  queryParams.value.splice(idx, 1)
}

function rebuildQuery() {
  queryInput.value = buildQueryString(queryParams.value)
}
</script>

<template>
  <div class="container">
    <header class="page-head">
      <div class="head-icon"><Binary :size="22" /></div>
      <div>
        <h1 class="page-title">编解码工具</h1>
        <p class="page-desc">Base64 / Hex / URL 编解码，Query String 解析。</p>
      </div>
    </header>

    <div v-if="status" class="alert" :class="`alert-${status.type}`">
      <span>{{ status.message }}</span>
    </div>

    <section class="card">
      <div class="toolbar">
        <div class="mode-tabs">
          <button :class="{ active: mode === 'base64' }" @click="mode = 'base64'">Base64</button>
          <button :class="{ active: mode === 'hex' }" @click="mode = 'hex'">Hex</button>
          <button :class="{ active: mode === 'url' }" @click="mode = 'url'">URL</button>
        </div>
        <div class="spacer"></div>
        <button class="btn btn-primary btn-sm" @click="encode">编码 ↓</button>
        <button class="btn btn-secondary btn-sm" @click="decode">解码 ↑</button>
        <button class="btn btn-ghost btn-sm" title="输入输出交换" @click="swap">
          <ArrowDownUp :size="14" />
        </button>
        <button class="btn btn-ghost btn-sm" @click="clearAll">
          <Trash2 :size="14" />
        </button>
      </div>

      <div class="editor-grid">
        <div class="pane">
          <div class="pane-head">
            <span class="pane-title">输入</span>
            <span class="meta">{{ inputMeta }}</span>
          </div>
          <textarea v-model="input" class="textarea mono" spellcheck="false" placeholder="输入要编码/解码的文本..."></textarea>
        </div>
        <div class="pane">
          <div class="pane-head">
            <span class="pane-title">输出</span>
            <span class="meta">{{ outputMeta }}</span>
            <button class="btn btn-ghost btn-sm" :disabled="!output" @click="copyOutput">
              <Copy :size="14" />
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>
          <textarea v-model="output" class="textarea mono" spellcheck="false" placeholder="结果将显示在这里..."></textarea>
        </div>
      </div>
    </section>

    <section class="card query-section">
      <div class="section-head">
        <h2 class="section-title">Query String 解析</h2>
        <div class="actions">
          <button class="btn btn-secondary btn-sm" @click="parseQuery">解析</button>
          <button class="btn btn-secondary btn-sm" @click="rebuildQuery">重新构建</button>
        </div>
      </div>
      <textarea v-model="queryInput" class="textarea mono query-input" spellcheck="false" placeholder="例: name=hello&lang=zh-CN"></textarea>

      <div v-if="queryParams.length > 0" class="params-table">
        <div class="param-row param-head-row">
          <span>Key</span>
          <span>Value</span>
          <span></span>
        </div>
        <div v-for="(p, i) in queryParams" :key="i" class="param-row">
          <input v-model="p.key" class="input" placeholder="key" />
          <input v-model="p.value" class="input" placeholder="value" />
          <button class="btn btn-ghost btn-sm" @click="removeParam(i)">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm add-param-btn" @click="addParam">+ 添加参数</button>
    </section>
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
.page-title { font-size: 24px; font-weight: 700; margin-bottom: 2px; }
.page-desc { color: var(--color-text-muted); font-size: 14px; }

.alert {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: 14px;
  margin-bottom: var(--space-4);
}
.alert-success { background: var(--color-success-subtle); color: var(--color-success); }
.alert-error { background: var(--color-danger-subtle); color: var(--color-danger); }

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.spacer { flex: 1; }
.mode-tabs {
  display: flex;
  gap: 2px;
  background: var(--color-bg-subtle);
  padding: 2px;
  border-radius: var(--radius-md);
}
.mode-tabs button {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
}
.mode-tabs button:hover { color: var(--color-text); }
.mode-tabs button.active {
  background: var(--color-bg);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.pane {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.pane-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-subtle);
  border-bottom: 1px solid var(--color-border);
}
.pane-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
}
.meta { font-size: 12px; color: var(--color-text-subtle); margin-left: auto; }
.mono { font-family: var(--font-mono); font-size: 13px; line-height: 1.5; }
.editor-grid .textarea {
  min-height: 240px;
  border: none;
  border-radius: 0;
  resize: vertical;
}
.editor-grid .textarea:focus { box-shadow: none; }

.query-section { margin-top: var(--space-5); }
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}
.section-title { font-size: 16px; font-weight: 600; }
.actions { display: flex; gap: var(--space-2); }
.query-input { min-height: 70px; }

.params-table { margin-top: var(--space-3); }
.param-row {
  display: grid;
  grid-template-columns: 1fr 1.4fr auto;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.param-head-row {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  padding: 0 var(--space-2);
}
.add-param-btn { margin-top: var(--space-2); }

@media (max-width: 768px) {
  .editor-grid { grid-template-columns: 1fr; }
}
</style>