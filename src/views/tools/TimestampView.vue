<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Clock, ArrowRight, Copy } from 'lucide-vue-next'
import {
  nowUnix,
  parseTimestamp,
  describe,
  parseLocalDateTime,
  toUnix,
  type TimestampUnit,
  type TimeConversion
} from '@/tools/time/time'
import { copyToClipboard } from '@/utils/copy'

const liveNow = ref<number>(0)
const liveUnit = ref<TimestampUnit>('s')
let timer: number | null = null

const tsInput = ref<string>(String(nowUnix('s')))
const tsUnit = ref<TimestampUnit>('s')
const dateInput = ref<string>('')

const tsResult = computed<TimeConversion | null>(() => {
  const n = Number(tsInput.value)
  if (!tsInput.value || Number.isNaN(n)) return null
  try {
    return describe(parseTimestamp(n, tsUnit.value), tsUnit.value)
  } catch {
    return null
  }
})

const dateResult = computed<{ date: Date; unixS: number; unixMs: number } | null>(() => {
  if (!dateInput.value) return null
  const d = parseLocalDateTime(dateInput.value)
  if (!d) return null
  return { date: d, unixS: toUnix(d, 's'), unixMs: toUnix(d, 'ms') }
})

const liveConv = computed<TimeConversion | null>(() => {
  if (!liveNow.value) return null
  return describe(parseTimestamp(liveNow.value, liveUnit.value), liveUnit.value)
})

function tick() {
  liveNow.value = nowUnix(liveUnit.value)
}

function setNowToInput() {
  tsInput.value = String(nowUnix(tsUnit.value))
}

function setNowToDate() {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  dateInput.value =
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

async function copy(text: string) {
  await copyToClipboard(text)
}

onMounted(() => {
  tick()
  timer = window.setInterval(tick, 1000)
})
onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <div class="container">
    <header class="page-head">
      <div class="head-icon"><Clock :size="22" /></div>
      <div>
        <h1 class="page-title">时间戳转换</h1>
        <p class="page-desc">Unix 时间戳 ↔ 本地时间，秒/毫秒，相对时间。</p>
      </div>
    </header>

    <!-- 当前时间 -->
    <section class="card live">
      <div class="live-row">
        <span class="label">当前时间</span>
        <div class="live-tabs">
          <button :class="{ active: liveUnit === 's' }" @click="liveUnit = 's'; tick()">秒</button>
          <button :class="{ active: liveUnit === 'ms' }" @click="liveUnit = 'ms'; tick()">毫秒</button>
        </div>
      </div>
      <div v-if="liveConv" class="live-time">
        <code class="ts">{{ liveConv.unix }}</code>
        <span class="weekday">{{ liveConv.weekday }}</span>
        <span class="iso">{{ liveConv.localISO }}</span>
        <span class="relative">{{ liveConv.relative }}</span>
      </div>
    </section>

    <!-- 时间戳 → 日期 -->
    <section class="card section">
      <div class="section-head">
        <h2 class="section-title">时间戳 → 日期</h2>
        <div class="actions">
          <div class="unit-tabs">
            <button :class="{ active: tsUnit === 's' }" @click="tsUnit = 's'">秒</button>
            <button :class="{ active: tsUnit === 'ms' }" @click="tsUnit = 'ms'">毫秒</button>
          </div>
          <button class="btn btn-ghost btn-sm" @click="setNowToInput">现在</button>
        </div>
      </div>
      <input v-model="tsInput" class="input mono big" placeholder="输入 Unix 时间戳" />
      <div v-if="tsResult" class="result-grid">
        <div class="result-row">
          <span class="result-label">本地时间</span>
          <code>{{ tsResult.localISO }}</code>
          <button class="icon-btn" @click="copy(tsResult.localISO)"><Copy :size="13" /></button>
        </div>
        <div class="result-row">
          <span class="result-label">UTC 时间</span>
          <code>{{ tsResult.utcISO }}</code>
          <button class="icon-btn" @click="copy(tsResult.utcISO)"><Copy :size="13" /></button>
        </div>
        <div class="result-row">
          <span class="result-label">GMT 字符串</span>
          <code>{{ tsResult.gmtString }}</code>
          <button class="icon-btn" @click="copy(tsResult.gmtString)"><Copy :size="13" /></button>
        </div>
        <div class="result-row">
          <span class="result-label">相对</span>
          <code>{{ tsResult.relative }} ({{ tsResult.weekday }})</code>
        </div>
      </div>
    </section>

    <!-- 日期 → 时间戳 -->
    <section class="card section">
      <div class="section-head">
        <h2 class="section-title">日期 → 时间戳</h2>
        <div class="actions">
          <button class="btn btn-ghost btn-sm" @click="setNowToDate">现在</button>
        </div>
      </div>
      <input v-model="dateInput" class="input mono big" placeholder="例: 2026-01-15 14:30:00" />
      <div v-if="dateResult" class="result-grid">
        <div class="result-row">
          <span class="result-label">秒级</span>
          <code>{{ dateResult.unixS }}</code>
          <button class="icon-btn" @click="copy(String(dateResult.unixS))"><Copy :size="13" /></button>
        </div>
        <div class="result-row">
          <span class="result-label">毫秒级</span>
          <code>{{ dateResult.unixMs }}</code>
          <button class="icon-btn" @click="copy(String(dateResult.unixMs))"><Copy :size="13" /></button>
        </div>
        <div class="result-row">
          <span class="result-label">本地格式</span>
          <code>{{ dateResult.date.toLocaleString('zh-CN') }}</code>
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

.live { padding: var(--space-5) var(--space-6); }
.live-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}
.label { font-size: 13px; color: var(--color-text-muted); font-weight: 500; }
.live-tabs, .unit-tabs {
  display: flex;
  gap: 2px;
  background: var(--color-bg-subtle);
  padding: 2px;
  border-radius: var(--radius-sm);
}
.live-tabs button, .unit-tabs button {
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-text-muted);
}
.live-tabs button.active, .unit-tabs button.active {
  background: var(--color-bg);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}
.live-time {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.live-time .ts { font-size: 22px; font-weight: 700; color: var(--color-text); font-family: var(--font-mono); }
.weekday { font-size: 14px; color: var(--color-text-muted); }
.iso { font-family: var(--font-mono); font-size: 14px; }
.relative { font-size: 13px; color: var(--color-primary); margin-left: auto; }

.section { margin-top: var(--space-4); }
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}
.section-title { font-size: 16px; font-weight: 600; }
.actions { display: flex; align-items: center; gap: var(--space-2); }

.input.big { font-size: 16px; padding: var(--space-3) var(--space-4); }

.result-grid { margin-top: var(--space-4); }
.result-row {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}
.result-row:last-child { border-bottom: none; }
.result-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
}
.result-row code {
  font-family: var(--font-mono);
  font-size: 13px;
  word-break: break-all;
}
.icon-btn {
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
</style>