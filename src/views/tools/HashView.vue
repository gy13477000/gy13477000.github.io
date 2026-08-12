<script setup lang="ts">
import { ref, computed, shallowRef } from 'vue'
import { Fingerprint, Copy, FileUp, Loader2, Hash } from 'lucide-vue-next'
import { hashText, hashFile, HASH_ALGOS, type HashAlgo } from '@/tools/hash/hash'
import { copyToClipboard } from '@/utils/copy'

const input = ref('')
const results = computed(() => {
  if (!input.value) return []
  return HASH_ALGOS.map((a) => ({
    algo: a,
    hash: hashText(input.value, a.id)
  }))
})

// 文件哈希
const file = shallowRef<File | null>(null)
const fileResults = ref<{ algo: HashAlgoMeta; hash: string }[] | null>(null)
const fileProgress = ref(0)
const fileWorking = ref(false)
const dragOver = ref(false)

import type { HashAlgoMeta } from '@/tools/hash/hash'
import type { Component } from 'vue'
const HashIcon: Component = Hash

const copiedHash = ref<string | null>(null)

function triggerFileInput() {
  const el = document.getElementById('file-input') as HTMLInputElement | null
  el?.click()
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) setFile(f)
}

function onPick(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) setFile(f)
}

async function setFile(f: File) {
  file.value = f
  fileResults.value = null
  fileProgress.value = 0
}

async function hashSelectedFile() {
  if (!file.value) return
  fileWorking.value = true
  fileResults.value = null
  try {
    const out: { algo: HashAlgoMeta; hash: string }[] = []
    for (const a of HASH_ALGOS) {
      const hash = await hashFile(file.value, a.id, (loaded, total) => {
        fileProgress.value = Math.round((loaded / total) * 100)
      })
      out.push({ algo: a, hash })
    }
    fileResults.value = out
  } finally {
    fileWorking.value = false
  }
}

async function copy(text: string) {
  const ok = await copyToClipboard(text)
  if (ok) {
    copiedHash.value = text
    setTimeout(() => {
      if (copiedHash.value === text) copiedHash.value = null
    }, 1500)
  }
}
</script>

<template>
  <div class="container">
    <header class="page-head">
      <div class="head-icon"><Fingerprint :size="22" /></div>
      <div>
        <h1 class="page-title">哈希计算</h1>
        <p class="page-desc">MD5 / SHA1 / SHA256 / SHA384 / SHA512，支持文本和文件。</p>
      </div>
    </header>

    <!-- 文本哈希 -->
    <section class="card section">
      <h2 class="section-title">文本哈希</h2>
      <textarea
        v-model="input"
        class="textarea mono"
        rows="6"
        spellcheck="false"
        placeholder="输入文本，自动计算所有哈希..."
      ></textarea>

      <div v-if="input" class="hash-list">
        <div v-for="r in results" :key="r.algo.id" class="hash-row">
          <span class="hash-algo">
            <HashIcon :size="12" />
            {{ r.algo.label }}
          </span>
          <code class="hash-value">{{ r.hash }}</code>
          <button class="icon-btn" title="复制" @click="copy(r.hash)">
            <Copy :size="13" />
            <span v-if="copiedHash === r.hash" class="tip">已复制</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 文件哈希 -->
    <section class="card section">
      <h2 class="section-title">文件哈希</h2>
      <div
        class="drop-zone"
        :class="{ active: dragOver, has: !!file }"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="onDrop"
        @click="triggerFileInput"
      >
        <input id="file-input" type="file" class="hidden-input" @change="onPick" />
        <FileUp :size="32" />
        <p v-if="!file" class="drop-text">点击选择文件 或拖拽到此处</p>
        <p v-else class="drop-text">{{ file.name }} ({{ file.size }} bytes)</p>
      </div>

      <div v-if="file" class="file-actions">
        <button class="btn btn-primary btn-sm" :disabled="fileWorking" @click="hashSelectedFile">
          <Loader2 v-if="fileWorking" :size="14" class="spin" />
          计算文件哈希
        </button>
        <span v-if="fileWorking" class="progress-text">{{ fileProgress }}%</span>
      </div>
      <div v-if="fileWorking" class="progress-bar"><div :style="{ width: fileProgress + '%' }"></div></div>

      <div v-if="fileResults" class="hash-list">
        <div v-for="r in fileResults" :key="r.algo.id" class="hash-row">
          <span class="hash-algo">{{ r.algo.label }}</span>
          <code class="hash-value">{{ r.hash }}</code>
          <button class="icon-btn" @click="copy(r.hash)">
            <Copy :size="13" />
            <span v-if="copiedHash === r.hash" class="tip">已复制</span>
          </button>
        </div>
      </div>
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

.section { margin-bottom: var(--space-4); }
.section-title { font-size: 16px; font-weight: 600; margin-bottom: var(--space-3); }

.hash-list { margin-top: var(--space-4); }
.hash-row {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}
.hash-algo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
}
.hash-value {
  font-family: var(--font-mono);
  font-size: 12px;
  word-break: break-all;
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
}
.icon-btn:hover { background: var(--color-bg-subtle); color: var(--color-text); }
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

.drop-zone {
  border: 2px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  padding: var(--space-8) var(--space-4);
  text-align: center;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}
.drop-zone:hover, .drop-zone.active { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-subtle); }
.drop-zone.has { border-style: solid; }
.drop-text { font-size: 14px; }
.hidden-input { display: none; }

.file-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
.progress-text { font-size: 13px; color: var(--color-text-muted); }
.progress-bar {
  height: 4px;
  background: var(--color-bg-subtle);
  border-radius: 2px;
  margin-top: var(--space-2);
  overflow: hidden;
}
.progress-bar div {
  height: 100%;
  background: var(--color-primary);
  transition: width var(--transition-fast);
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>