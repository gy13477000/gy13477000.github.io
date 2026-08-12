// UUID 生成工具

export type UuidVersion = 'v4' | 'v7'
export type UuidFormat = 'standard' | 'uppercase' | 'noHyphen' | 'braces'

export interface UuidOptions {
  version: UuidVersion
  format: UuidFormat
  count: number
}

// UUID v4 — 完全随机
export function uuidV4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // 兼容回退
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// UUID v7 — 时间有序（RFC 9562）
// 格式: 48 位 unix 毫秒 + 4 位版本(7) + 12 位随机 + 2 位变体 + 62 位随机
export function uuidV7(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  const ms = Date.now()
  const view = new DataView(bytes.buffer)
  // 高 48 位写入毫秒时间戳
  view.setUint32(0, Math.floor(ms / 0x1000000))
  view.setUint16(4, ms & 0xffff)

  // 版本 7
  bytes[6] = (bytes[6] & 0x0f) | 0x70
  // 变体 10xx
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function formatUuid(uuid: string, format: UuidFormat): string {
  const raw = uuid.replace(/[^0-9a-fA-F]/g, '')
  switch (format) {
    case 'uppercase':
      return uuid.toUpperCase()
    case 'noHyphen':
      return raw
    case 'braces':
      return `{${uuid}}`
    case 'standard':
    default:
      return uuid
  }
}

export function generateUuids(options: UuidOptions): string[] {
  const out: string[] = []
  for (let i = 0; i < options.count; i++) {
    const uuid = options.version === 'v4' ? uuidV4() : uuidV7()
    out.push(formatUuid(uuid, options.format))
  }
  return out
}