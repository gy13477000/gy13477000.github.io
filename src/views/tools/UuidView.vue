<script setup lang="ts">
import { ref, computed } from 'vue'
import { Fingerprint, Copy, RefreshCw } from 'lucide-vue-next'
import { generateUuids, type UuidVersion, type UuidFormat } from '@/tools/uuid/uuid'
import { copyToClipboard } from '@/utils/copy'

const version = ref<UuidVersion>('v4')
const format = ref<UuidFormat>('standard')
const count = ref(10)
const seed = ref(0)

const uuids = computed(() => {
  void seed.value
  return generateUuids({ version: version.value, format: format.value, count: count.value })
})

const copiedIdx = ref<number | null>(null)
const copiedAll = ref(false)

function regenerate() {
  seed.value++
}

async function copyOne(idx: number) {
  const ok = await copyToClipboard(uuids.value[idx])
  if (ok) {
    copiedIdx.value = idx
    setTimeout(() => {
      if (copiedIdx.value === idx) copiedIdx.value = null
    }, 1500)
  }
}

async function copyAll() {
  const ok = await copyToClipboard(uuids.value.join('\n'))
  if (ok) {
    copiedAll.value = true
    setTimeout(() => (copiedAll.value = false), 1500)
  }
}
</script>

<template>
  <div class="container">
    <header class="page-head">
      <div class="head-icon"><Fingerprint :size="22" /></div>
      <div>
        <h1 class="page-title">UUID 生成器</h1>
        <p class="page-desc">UUID v4 (随机) / v7 (时间有序)，批量生成。</p>
      </div>
    </header>

    <section class="card section">
      <div class="options">
        <div class="opt-group">
          <label class="opt-label">版本</label>
          <div class="radio-tabs">
            <button :class="{ active: version === 'v4' }" @click="version = 'v4'">UUID v4</button>
            <button :class="{ active: version === 'v7' }" @click="version = 'v7'">UUID v7</button>
          </div>
        </div>
        <div class="opt-group">
          <label class="opt-label">格式</label>
          <select v-model="format" class="select">
            <option value="standard">标准 (小写带连字符)</option>
            <option value="uppercase">大写带连字符</option>
            <option value="noHyphen">无连字符</option>
            <option value="braces">带花括号</option>
          </select>
        </div>
        <div class="opt-group">
          <label class="opt-label">数量</label>
          <input v-model.number="count" type="number" min="1" max="1000" class="input count-input" />
        </div>
        <div class="spacer"></div>
        <button class="btn btn-primary" @click="regenerate">
          <RefreshCw :size="14" />
          重新生成
        </button>
      </div>

      <div class="result-section">
        <div class="result-head">
          <span class="result-count">{{ uuids.length }} 个</span>
          <button class="btn btn-ghost btn-sm" @click="copyAll">
            <Copy :size="14" />
            {{ copiedAll ? '已复制全部' : '复制全部' }}
          </button>
        </div>
        <div class="uuid-list">
          <div v-for="(u, i) in uuids" :key="i" class="uuid-row">
            <span class="uuid-idx">{{ i + 1 }}</span>
            <code class="uuid-value">{{ u }}</code>
            <button class="icon-btn" title="复制" @click="copyOne(i)">
              <Copy :size="13" />
              <span v-if="copiedIdx === i" class="tip">已复制</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <p class="hint">
      UUID v7 是 RFC 9562 标准，前 48 位为毫秒时间戳，方便按字典序排序即为按时间排序。
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
.options {
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-5);
}
.spacer { flex: 1; }
.opt-group { display: flex; flex-direction: column; gap: var(--space-1); }
.opt-label { font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.radio-tabs {
  display: flex;
  background: var(--color-bg-subtle);
  padding: 2px;
  border-radius: var(--radius-md);
}
.radio-tabs button {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--color-text-muted);
}
.radio-tabs button.active {
  background: var(--color-bg);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}
.select, .count-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 13px;
}
.count-input { width: 80px; }

.result-section { margin-top: var(--space-4); }
.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}
.result-count { font-size: 13px; color: var(--color-text-muted); }

.uuid-list { max-height: 480px; overflow-y: auto; }
.uuid-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}
.uuid-row:hover { background: var(--color-bg-subtle); }
.uuid-idx {
  font-size: 11px;
  color: var(--color-text-subtle);
  text-align: right;
}
.uuid-value {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
}
.icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.uuid-row:hover .icon-btn { opacity: 1; }
.icon-btn:hover { background: var(--color-bg); color: var(--color-text); }
.tip {
  position: absolute;
  top: -22px;
  right: 0;
  padding: 1px var(--space-2);
  background: var(--color-text);
  color: var(--color-bg);
  font-size: 10px;
  border-radius: var(--radius-sm);
}

.hint {
  margin-top: var(--space-4);
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>