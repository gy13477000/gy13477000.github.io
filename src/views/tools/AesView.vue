<script setup lang="ts">
import { ref, computed } from 'vue'
import { Lock, Unlock, Copy, RefreshCw, Trash2, Loader2 } from 'lucide-vue-next'
import {
  aesEncrypt,
  aesDecrypt,
  generateAesKey,
  type AesMode,
  type KeyEncoding,
  type OutputEncoding,
  type IvEncoding,
  type AesParams
} from '@/tools/aes/aes'

type Mode = 'encrypt' | 'decrypt'

const mode = ref<Mode>('encrypt')
const input = ref('')
const output = ref('')
const key = ref('')
const keyEncoding = ref<KeyEncoding>('base64')
const iv = ref('')
const ivEncoding = ref<IvEncoding>('base64')
const aesMode = ref<AesMode>('CBC')
const outputEncoding = ref<OutputEncoding>('base64')
const keyBits = ref<128 | 192 | 256>(128)
const working = ref(false)
const status = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const copied = ref(false)

const inputMeta = computed(() => `${input.value.length} 字符 / ${new Blob([input.value]).size} 字节`)
const outputMeta = computed(() =>
  output.value ? `${output.value.length} 字符 / ${new Blob([output.value]).size} 字节` : ''
)

const modes: AesMode[] = ['CBC', 'ECB', 'CFB', 'OFB', 'CTR', 'GCM']

function notify(type: 'success' | 'error', message: string) {
  status.value = { type, message }
  setTimeout(() => {
    if (status.value?.message === message) status.value = null
  }, 4000)
}

function buildParams(): AesParams {
  return {
    mode: aesMode.value,
    key: key.value,
    keyEncoding: keyEncoding.value,
    iv: iv.value,
    ivEncoding: ivEncoding.value,
    output: outputEncoding.value
  }
}

async function handleExecute() {
  if (!key.value) {
    notify('error', '请填写密钥')
    return
  }
  if (!input.value) {
    notify('error', mode.value === 'encrypt' ? '请输入明文' : '请输入密文')
    return
  }
  working.value = true
  await new Promise((r) => setTimeout(r, 0)) // 让 UI 更新
  try {
    if (mode.value === 'encrypt') {
      const r = aesEncrypt(input.value, buildParams())
      output.value = r.cipher
      notify('success', `加密成功（AES-${r.keyBits}-${aesMode.value}）`)
    } else {
      output.value = aesDecrypt(input.value.trim(), buildParams())
      notify('success', '解密成功')
    }
  } catch (e) {
    notify('error', e instanceof Error ? e.message : String(e))
  } finally {
    working.value = false
  }
}

function handleSwap() {
  mode.value = mode.value === 'encrypt' ? 'decrypt' : 'encrypt'
  const tmp = input.value
  input.value = output.value
  output.value = tmp
}

function handleClear() {
  input.value = ''
  output.value = ''
  status.value = null
}

async function handleGenKey() {
  key.value = generateAesKey(keyBits.value, keyEncoding.value)
}

async function copyOutput() {
  if (!output.value) return
  const ok = await (await import('@/utils/copy')).copyToClipboard(output.value)
  if (ok) {
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  }
}
</script>

<template>
  <div class="container">
    <header class="page-head">
      <div class="head-icon"><Lock :size="22" /></div>
      <div>
        <h1 class="page-title">AES 加解密</h1>
        <p class="page-desc">AES-128/192/256，CBC/ECB/CFB/OFB/CTR/GCM，与 hutool AES 完全互通。</p>
      </div>
    </header>

    <div v-if="status" class="alert" :class="`alert-${status.type}`">
      <span>{{ status.message }}</span>
    </div>

    <section class="card section">
      <div class="params-grid">
        <div class="param-item">
          <label class="param-label">模式</label>
          <select v-model="aesMode" class="select">
            <option v-for="m in modes" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <div class="param-item">
          <label class="param-label">输出</label>
          <select v-model="outputEncoding" class="select">
            <option value="base64">Base64</option>
            <option value="hex">Hex</option>
          </select>
        </div>
        <div class="param-item" v-if="aesMode !== 'ECB'">
          <label class="param-label">IV 编码</label>
          <select v-model="ivEncoding" class="select">
            <option value="base64">Base64</option>
            <option value="hex">Hex</option>
            <option value="utf8">UTF-8</option>
          </select>
        </div>
      </div>

      <div class="key-section">
        <label class="param-label">
          密钥
          <span class="key-enc">编码:
            <select v-model="keyEncoding" class="select-sm">
              <option value="base64">Base64</option>
              <option value="hex">Hex</option>
              <option value="utf8">UTF-8</option>
            </select>
          </span>
        </label>
        <div class="key-input-row">
          <input v-model="key" class="input mono" placeholder="AES 密钥（16/24/32 字节）" />
          <select v-model.number="keyBits" class="select">
            <option :value="128">128</option>
            <option :value="192">192</option>
            <option :value="256">256</option>
          </select>
          <button class="btn btn-secondary btn-sm" @click="handleGenKey">
            <RefreshCw :size="13" />
            生成
          </button>
        </div>
      </div>

      <div class="key-section" v-if="aesMode !== 'ECB'">
        <label class="param-label">
          IV（CBC 模式留空则使用全零，GCM 留空则随机生成）
        </label>
        <input v-model="iv" class="input mono" placeholder="初始向量（可选）" />
      </div>
    </section>

    <section class="card section">
      <div class="op-head">
        <div class="mode-tabs">
          <button :class="{ active: mode === 'encrypt' }" @click="mode = 'encrypt'">
            <Lock :size="13" />
            加密
          </button>
          <button :class="{ active: mode === 'decrypt' }" @click="mode = 'decrypt'">
            <Unlock :size="13" />
            解密
          </button>
        </div>
        <div class="op-actions">
          <button class="btn btn-ghost btn-sm" title="输入输出交换" @click="handleSwap">
            <RefreshCw :size="13" />
          </button>
          <button class="btn btn-ghost btn-sm" @click="handleClear">
            <Trash2 :size="13" />
          </button>
        </div>
      </div>

      <div class="editor-grid">
        <div class="pane">
          <div class="pane-head">
            <span class="pane-title">{{ mode === 'encrypt' ? '明文' : '密文' }}</span>
            <span class="meta">{{ inputMeta }}</span>
          </div>
          <textarea v-model="input" class="textarea mono" spellcheck="false" :placeholder="mode === 'encrypt' ? '输入明文...' : '粘贴密文...'"></textarea>
        </div>
        <div class="pane">
          <div class="pane-head">
            <span class="pane-title">{{ mode === 'encrypt' ? '密文' : '明文' }}</span>
            <span class="meta">{{ outputMeta }}</span>
            <button class="btn btn-ghost btn-sm" :disabled="!output" @click="copyOutput">
              <Copy :size="13" />
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>
          <textarea v-model="output" class="textarea mono" spellcheck="false" readonly placeholder="结果将显示在这里..."></textarea>
        </div>
      </div>

      <div class="execute-bar">
        <button class="btn btn-primary" :disabled="working" @click="handleExecute">
          <Loader2 v-if="working" :size="14" class="spin" />
          {{ working ? '处理中...' : mode === 'encrypt' ? '执行加密' : '执行解密' }}
        </button>
      </div>
    </section>

    <p class="hint">
      💡 与 hutool 互通：Java 端 <code>new AES(keyBytes).setIv(ivBytes).encryptHex(text)</code>，其中 keyBytes/ivBytes 用 base64 解码本工具的 key/iv 即可。
    </p>
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

.section { margin-bottom: var(--space-4); padding: var(--space-5) var(--space-6); }

.params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.param-item { display: flex; flex-direction: column; gap: var(--space-1); }
.param-label { font-size: 13px; font-weight: 500; color: var(--color-text-muted); display: flex; align-items: center; justify-content: space-between; }
.key-enc { font-size: 11px; font-weight: 400; }
.select, .select-sm {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 13px;
}
.select-sm { padding: 1px var(--space-2); font-size: 11px; }

.key-section { margin-bottom: var(--space-3); display: flex; flex-direction: column; gap: var(--space-1); }
.key-input-row { display: grid; grid-template-columns: 1fr auto auto; gap: var(--space-2); }

.op-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.mode-tabs {
  display: flex;
  gap: 2px;
  background: var(--color-bg-subtle);
  padding: 2px;
  border-radius: var(--radius-md);
}
.mode-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--color-text-muted);
}
.mode-tabs button.active {
  background: var(--color-bg);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}
.op-actions { display: flex; gap: var(--space-1); }

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
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
.pane-title { font-size: 12px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; }
.meta { font-size: 12px; color: var(--color-text-subtle); margin-left: auto; }
.mono { font-family: var(--font-mono); font-size: 13px; }
.editor-grid .textarea {
  min-height: 180px;
  border: none;
  border-radius: 0;
  resize: vertical;
}
.editor-grid .textarea:focus { box-shadow: none; }

.execute-bar { margin-top: var(--space-4); display: flex; justify-content: flex-end; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.hint {
  margin-top: var(--space-4);
  font-size: 13px;
  color: var(--color-text-muted);
}
.hint code {
  background: var(--color-bg-subtle);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 12px;
}

@media (max-width: 768px) {
  .editor-grid { grid-template-columns: 1fr; }
}
</style>