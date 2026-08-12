<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  KeyRound,
  RefreshCw,
  Copy,
  Upload,
  Download,
  Lock,
  Unlock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Repeat
} from 'lucide-vue-next'
import { generateKeyPair, type RsaKeySize } from '@/tools/rsa/keygen'
import { rsaEncryptHutool, rsaDecryptHutool, inspectHutoolEnvelope } from '@/tools/rsa/chunk'
import { copyToClipboard } from '@/utils/copy'

type Mode = 'encrypt' | 'decrypt'
type PrivKeyFormat = 'pkcs1' | 'pkcs8'

const pkcs1Placeholder = '-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----'
const pkcs8Placeholder = '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'

const publicKeyPem = ref('')
const privateKeyPem = ref('')
const privateKeyPkcs1 = ref('')
const privateKeyPkcs8 = ref('')
const privFormat = ref<PrivKeyFormat>('pkcs1')
const input = ref('')
const output = ref('')
const mode = ref<Mode>('encrypt')
const keySize = ref<RsaKeySize>(2048)
const generating = ref(false)
const working = ref(false)
const status = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
const copiedField = ref<string | null>(null)

const displayPrivateKey = computed(() =>
  privFormat.value === 'pkcs1' ? privateKeyPkcs1.value : privateKeyPkcs8.value
)

const inputMeta = computed(() => `${input.value.length} 字符 / ${new Blob([input.value]).size} 字节`)
const outputMeta = computed(() => {
  if (!output.value) return ''
  return `${output.value.length} 字符 (base64) / ${new Blob([output.value]).size} 字节`
})

function notify(type: 'success' | 'error' | 'info', message: string) {
  status.value = { type, message }
  setTimeout(() => {
    if (status.value?.message === message) status.value = null
  }, 5000)
}

async function handleGenerate() {
  generating.value = true
  try {
    const pair = await generateKeyPair({ size: keySize.value })
    publicKeyPem.value = pair.publicKey
    privateKeyPkcs8.value = pair.privateKey
    privateKeyPkcs1.value = pair.privateKeyPkcs1
    notify('success', `已生成 ${keySize.value} 位 RSA 密钥对（私钥已导出为 PKCS#1 格式）`)
  } catch (e) {
    notify('error', `密钥生成失败：${e instanceof Error ? e.message : String(e)}`)
  } finally {
    generating.value = false
  }
}

async function handleExecute() {
  working.value = true
  try {
    if (mode.value === 'encrypt') {
      if (!publicKeyPem.value.trim()) throw new Error('请填写公钥')
      if (!input.value) throw new Error('请输入要加密的文本')
      output.value = await rsaEncryptHutool(input.value, publicKeyPem.value)
      notify('success', `加密成功（${input.value.length} → ${output.value.length} 字符）`)
    } else {
      if (!displayPrivateKey.value.trim()) throw new Error('请填写私钥')
      if (!input.value.trim()) throw new Error('请输入要解密的密文')
      output.value = await rsaDecryptHutool(input.value.trim(), displayPrivateKey.value)
      notify('success', '解密成功')
    }
  } catch (e) {
    notify('error', e instanceof Error ? e.message : String(e))
  } finally {
    working.value = false
  }
}

function handleClear() {
  input.value = ''
  output.value = ''
  status.value = null
}

async function handleCopy(field: 'input' | 'output' | 'pub' | 'priv') {
  const map = {
    input: input.value,
    output: output.value,
    pub: publicKeyPem.value,
    priv: displayPrivateKey.value
  }
  const ok = await copyToClipboard(map[field])
  if (ok) {
    copiedField.value = field
    setTimeout(() => {
      if (copiedField.value === field) copiedField.value = null
    }, 1500)
  }
}

function handleSwapMode() {
  mode.value = mode.value === 'encrypt' ? 'decrypt' : 'encrypt'
}

function togglePrivFormat() {
  privFormat.value = privFormat.value === 'pkcs1' ? 'pkcs8' : 'pkcs1'
}

async function handleImportKey(field: 'pub' | 'priv', e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  if (field === 'pub') {
    publicKeyPem.value = text
  } else {
    // 自动识别 PKCS#1 / PKCS#8
    if (text.includes('RSA PRIVATE KEY')) {
      privateKeyPkcs1.value = text
      privFormat.value = 'pkcs1'
    } else {
      privateKeyPkcs8.value = text
      privFormat.value = 'pkcs8'
    }
  }
  notify('success', `已导入 ${file.name}`)
  ;(e.target as HTMLInputElement).value = ''
}

function handleDownloadKey(field: 'pub' | 'priv') {
  const text = field === 'pub' ? publicKeyPem.value : displayPrivateKey.value
  if (!text) return
  const ext = field === 'priv' && privFormat.value === 'pkcs1' ? '_pkcs1.pem' : '_pkcs8.pem'
  const filename = field === 'pub' ? 'rsa_public_key.pem' : `rsa_private_key${ext}`
  const blob = new Blob([text], { type: 'application/x-pem-file' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const envelopeInfo = computed(() => {
  if (mode.value !== 'decrypt' || !input.value.trim()) return null
  try {
    return inspectHutoolEnvelope(input.value.trim())
  } catch {
    return null
  }
})
</script>

<template>
  <div class="container">
    <header class="page-head">
      <div class="head-icon">
        <KeyRound :size="22" />
      </div>
      <div>
        <h1 class="page-title">RSA 加解密</h1>
        <p class="page-desc">RSA/ECB/PKCS1Padding 分段加密 — 与 hutool <code>RSA.encrypt/decryptStr</code> 完全互通。</p>
      </div>
    </header>

    <div v-if="status" class="alert" :class="`alert-${status.type}`">
      <CheckCircle2 v-if="status.type === 'success'" :size="16" />
      <AlertCircle v-else-if="status.type === 'error'" :size="16" />
      <span>{{ status.message }}</span>
    </div>

    <div class="layout">
      <!-- 左侧：密钥管理 -->
      <section class="card panel">
        <div class="panel-head">
          <h2 class="panel-title">密钥管理</h2>
          <div class="key-size">
            <label>位数</label>
            <select v-model.number="keySize" class="select">
              <option :value="2048">2048</option>
              <option :value="3072">3072</option>
              <option :value="4096">4096</option>
            </select>
          </div>
        </div>

        <button class="btn btn-primary generate-btn" :disabled="generating" @click="handleGenerate">
          <Loader2 v-if="generating" :size="14" class="spin" />
          <RefreshCw v-else :size="14" />
          {{ generating ? '生成中...' : '生成新密钥对' }}
        </button>

        <div class="key-block">
          <div class="key-head">
            <span class="label-inline">公钥 (PEM)</span>
            <div class="key-actions">
              <label class="icon-btn" title="导入">
                <Upload :size="14" />
                <input type="file" accept=".pem,.txt" @change="(e) => handleImportKey('pub', e)" hidden />
              </label>
              <button class="icon-btn" :disabled="!publicKeyPem" title="下载" @click="handleDownloadKey('pub')">
                <Download :size="14" />
              </button>
              <button class="icon-btn" :disabled="!publicKeyPem" title="复制" @click="handleCopy('pub')">
                <Copy :size="14" />
                <span v-if="copiedField === 'pub'" class="copied-tip">已复制</span>
              </button>
            </div>
          </div>
          <textarea v-model="publicKeyPem" class="textarea mono" placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----" spellcheck="false"></textarea>
        </div>

        <div class="key-block">
          <div class="key-head">
            <span class="label-inline">
              私钥 ({{ privFormat === 'pkcs1' ? 'PKCS#1' : 'PKCS#8' }})
              <button class="format-toggle" :title="privFormat === 'pkcs1' ? '切换到 PKCS#8' : '切换到 PKCS#1'" @click="togglePrivFormat">
                <Repeat :size="12" />
              </button>
            </span>
            <div class="key-actions">
              <label class="icon-btn" title="导入">
                <Upload :size="14" />
                <input type="file" accept=".pem,.txt" @change="(e) => handleImportKey('priv', e)" hidden />
              </label>
              <button class="icon-btn" :disabled="!displayPrivateKey" title="下载" @click="handleDownloadKey('priv')">
                <Download :size="14" />
              </button>
              <button class="icon-btn" :disabled="!displayPrivateKey" title="复制" @click="handleCopy('priv')">
                <Copy :size="14" />
                <span v-if="copiedField === 'priv'" class="copied-tip">已复制</span>
              </button>
            </div>
          </div>
          <textarea
            :value="displayPrivateKey"
            @input="(e) => (privFormat === 'pkcs1' ? (privateKeyPkcs1 = (e.target as HTMLTextAreaElement).value) : (privateKeyPkcs8 = (e.target as HTMLTextAreaElement).value))"
            class="textarea mono"
            :placeholder="privFormat === 'pkcs1' ? pkcs1Placeholder : pkcs8Placeholder"
            spellcheck="false"
          ></textarea>
        </div>

        <p class="warn">
          ⚠️ 所有操作均在浏览器本地完成，密钥与文本不会上传到服务器。
        </p>
      </section>

      <!-- 右侧：加解密操作 -->
      <section class="card panel">
        <div class="panel-head">
          <div class="mode-tabs">
            <button class="mode-tab" :class="{ active: mode === 'encrypt' }" @click="mode = 'encrypt'">
              <Lock :size="14" />
              加密
            </button>
            <button class="mode-tab" :class="{ active: mode === 'decrypt' }" @click="mode = 'decrypt'">
              <Unlock :size="14" />
              解密
            </button>
          </div>
          <button class="btn btn-ghost btn-sm" @click="handleSwapMode" title="切换">
            <RefreshCw :size="14" />
          </button>
        </div>

        <div class="op-block">
          <div class="op-head">
            <span class="label-inline">{{ mode === 'encrypt' ? '明文' : '密文 (base64)' }}</span>
            <span class="meta">{{ inputMeta }}</span>
          </div>
          <textarea v-model="input" class="textarea mono op-input" :placeholder="mode === 'encrypt' ? '输入要加密的文本...' : '粘贴 base64 密文...'" spellcheck="false"></textarea>
          <div v-if="envelopeInfo" class="envelope-info">
            <span class="tag">RSA {{ envelopeInfo.rsaBits }} 位</span>
            <span class="tag">{{ envelopeInfo.estimatedSegments }} 段</span>
            <span class="tag">{{ envelopeInfo.totalCipherBytes }} 字节密文</span>
            <span class="tag">最多 {{ envelopeInfo.maxPlaintextBytes }} 字节明文</span>
          </div>
        </div>

        <div class="op-actions">
          <button class="btn btn-primary" :disabled="working" @click="handleExecute">
            <Loader2 v-if="working" :size="14" class="spin" />
            {{ working ? '处理中...' : mode === 'encrypt' ? '执行加密' : '执行解密' }}
          </button>
          <button class="btn btn-secondary" @click="handleClear">
            <Trash2 :size="14" />
            清空
          </button>
          <div class="spacer"></div>
          <button class="btn btn-secondary" :disabled="!output" @click="handleCopy('output')">
            <Copy :size="14" />
            {{ copiedField === 'output' ? '已复制' : '复制结果' }}
          </button>
        </div>

        <div class="op-block">
          <div class="op-head">
            <span class="label-inline">{{ mode === 'encrypt' ? '密文 (base64)' : '明文' }}</span>
            <span class="meta">{{ outputMeta }}</span>
          </div>
          <textarea v-model="output" class="textarea mono op-output" readonly placeholder="结果将显示在这里..." spellcheck="false"></textarea>
        </div>
      </section>
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
.alert-info {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.layout {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: var(--space-4);
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
}

.key-size {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 13px;
  color: var(--color-text-muted);
}

.select {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 13px;
}

.generate-btn {
  align-self: flex-start;
}

.key-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.key-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label-inline {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.format-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  color: var(--color-text-subtle);
  background: var(--color-bg-subtle);
  transition: all var(--transition-fast);
}

.format-toggle:hover {
  color: var(--color-primary);
  background: var(--color-primary-subtle);
}

.key-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.icon-btn:hover:not(:disabled) {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.copied-tip {
  position: absolute;
  top: -28px;
  right: 0;
  padding: 2px var(--space-2);
  background: var(--color-text);
  color: var(--color-bg);
  font-size: 11px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.mono {
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  min-height: 140px;
}

.warn {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-warning);
}

.mode-tabs {
  display: flex;
  gap: var(--space-1);
  background: var(--color-bg-subtle);
  padding: 2px;
  border-radius: var(--radius-md);
}

.mode-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
}

.mode-tab:hover {
  color: var(--color-text);
}

.mode-tab.active {
  background: var(--color-bg);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.op-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.op-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meta {
  font-size: 12px;
  color: var(--color-text-subtle);
}

.op-input,
.op-output {
  min-height: 160px;
}

.envelope-info {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.op-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.spacer {
  flex: 1;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>