// JSON 格式化 / 压缩 / 校验 / 转义

export interface JsonFormatOptions {
  indent: number // 缩进空格数, 0 表示用 Tab
}

export type JsonFormatResult =
  | { ok: true; text: string }
  | { ok: false; message: string; line?: number; column?: number }

export function formatJson(input: string, options: JsonFormatOptions): JsonFormatResult {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, message: '输入为空' }
  try {
    const parsed = JSON.parse(trimmed)
    const indent = options.indent === 0 ? '\t' : options.indent
    return { ok: true, text: JSON.stringify(parsed, null, indent) }
  } catch (e) {
    const err = normalizeError(e, trimmed)
    return { ok: false, ...err }
  }
}

export function minifyJson(input: string): JsonFormatResult {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, message: '输入为空' }
  try {
    const parsed = JSON.parse(trimmed)
    return { ok: true, text: JSON.stringify(parsed) }
  } catch (e) {
    const err = normalizeError(e, trimmed)
    return { ok: false, ...err }
  }
}

export interface ValidateResult {
  valid: boolean
  message: string
  line?: number
  column?: number
}

export function validateJson(input: string): ValidateResult {
  const trimmed = input.trim()
  if (!trimmed) return { valid: false, message: '输入为空' }
  try {
    JSON.parse(trimmed)
    return { valid: true, message: 'JSON 格式有效' }
  } catch (e) {
    const err = normalizeError(e, trimmed)
    return { valid: false, ...err }
  }
}

interface NormalizedError {
  message: string
  line?: number
  column?: number
}

function normalizeError(e: unknown, source: string): NormalizedError {
  const message = e instanceof Error ? e.message : String(e)
  const posMatch = message.match(/position\s+(\d+)/i)
  let line: number | undefined
  let column: number | undefined
  if (posMatch) {
    const pos = Number(posMatch[1])
    const upto = source.slice(0, pos)
    const lines = upto.split('\n')
    line = lines.length
    column = lines[lines.length - 1].length + 1
  }
  let cleanMessage = message
  if (posMatch) {
    cleanMessage = message.replace(/in JSON at position \d+.*/i, '').trim() || message
  }
  return { message: cleanMessage, line, column }
}

// 转义: 普通文本 → JSON 字符串字面量内容（含引号）
export function escapeToJsonString(text: string): string {
  return JSON.stringify(text)
}

// 反转义: JSON 字符串字面量 → 普通文本
export function unescapeJsonString(text: string): string {
  const trimmed = text.trim()
  // 如果带引号直接解析
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      // 继续走 fallback
    }
  }
  // 兼容: 不带引号的转义串
  try {
    return JSON.parse('"' + trimmed + '"')
  } catch (e) {
    throw new Error('反转义失败: ' + (e instanceof Error ? e.message : String(e)))
  }
}

export const SAMPLE_JSON = `{
  "name": "示例用户",
  "age": 28,
  "active": true,
  "balance": 1234.56,
  "tags": ["vip", "developer"],
  "address": {
    "city": "杭州",
    "zip": "310000",
    "geo": { "lat": 30.27, "lng": 120.15 }
  },
  "orders": [
    { "id": "A001", "amount": 99.9, "paid": true },
    { "id": "A002", "amount": 0, "paid": false }
  ],
  "remark": null
}`