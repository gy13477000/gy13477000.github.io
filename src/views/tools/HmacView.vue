<script setup lang="ts">
import { ref, computed } from 'vue'
import { KeyRound, Copy } from 'lucide-vue-next'
import { hmacSign, HMAC_ALGOS, type HmacAlgo, type OutputEncoding } from '@/tools/hmac/hmac'
import { utf8ToHex } from '@/tools/codec/codec'

const message = ref('')
const key = ref('')
const algo = ref<HmacAlgo>('sha256')
const encoding = ref<OutputEncoding>('hex')

const signature = computed(() => {
  if (!message.value || !key.value) return ''
  try {
    return hmacSign(message.value, key.value, algo.value, encoding.value)
  } catch {
    return ''
  }
})

const copied = ref(false)

async function copy() {
  if (!signature.value) return
  const ok = await (await import('@/utils/copy')).copyToClipboard(signature.value)
  if (ok) {
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  }
}
</script>

<template>
  <div class="container">
    <header class="page-head">
      <div class="head-icon"><KeyRound :size="22" /></div>
      <div>
        <h1 class="page-title">HMAC 签名</h1>
        <p class="page-desc">密钥哈希消息认证码，用于 API 签名（阿里云 / AWS 风格）。</p>
      </div>
    </header>

    <section class="card section">
      <div class="form-row">
        <div class="form-item">
          <label class="label">消息内容</label>
          <textarea v-model="message" class="textarea mono" rows="4" spellcheck="false" placeholder="要签名的原始内容"></textarea>
        </div>
        <div class="form-item">
          <label class="label">密钥 (Secret)</label>
          <input v-model="key" class="input mono" type="text" placeholder="HMAC secret key" />
        </div>
        <div class="form-row-inline">
          <div class="form-item">
            <label class="label">算法</label>
            <select v-model="algo" class="select">
              <option v-for="a in HMAC_ALGOS" :key="a.id" :value="a.id">{{ a.label }}</option>
            </select>
          </div>
          <div class="form-item">
            <label class="label">输出</label>
            <select v-model="encoding" class="select">
              <option value="hex">Hex 小写</option>
              <option value="base64">Base64</option>
            </select>
          </div>
        </div>
      </div>

      <div class="result-section">
        <div class="result-head">
          <span class="label">签名值</span>
          <button class="btn btn-ghost btn-sm" :disabled="!signature" @click="copy">
            <Copy :size="14" />
            {{ copied ? '已复制' : '复制' }}
          </button>
        </div>
        <pre class="result-output"><code>{{ signature || '请输入消息和密钥...' }}</code></pre>
      </div>
    </section>

    <p class="hint">
      提示: hutool 调用方式 <code>SecureUtil.hmacSha256(key.getBytes()).digestHex(message)</code> 输出与本工具 hex 模式一致。
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

.section { padding: var(--space-5) var(--space-6); }
.form-row { display: flex; flex-direction: column; gap: var(--space-3); }
.form-row-inline { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
.form-item { display: flex; flex-direction: column; gap: var(--space-1); }
.label { font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 13px;
}

.result-section { margin-top: var(--space-5); }
.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}
.result-output {
  margin: 0;
  padding: var(--space-4);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 14px;
  word-break: break-all;
  min-height: 60px;
  color: var(--color-text);
}
.mono { font-family: var(--font-mono); }

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
</style>