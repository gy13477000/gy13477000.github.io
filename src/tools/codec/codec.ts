// Base64 / URL 编解码工具
// 注意:
//   - atob/btoa 处理 latin1，对中文/emoji 需要先 UTF-8 编码
//   - URL encode 默认对中文/特殊字符全部转义

function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

function bytesToStr(b: Uint8Array): string {
  return new TextDecoder().decode(b)
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)))
  }
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64.trim())
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function utf8ToBase64(text: string): string {
  return bytesToBase64(strToBytes(text))
}

export function base64ToUtf8(b64: string): string {
  return bytesToStr(base64ToBytes(b64))
}

// hex 编码（顺便提供）
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, '').replace(/^0x/i, '')
  if (clean.length % 2 !== 0) throw new Error('Hex 字符串长度必须是偶数')
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
  }
  return bytes
}

export function utf8ToHex(text: string): string {
  return bytesToHex(strToBytes(text))
}

export function hexToUtf8(hex: string): string {
  return bytesToStr(hexToBytes(hex))
}

// URL 编解码
export function urlEncode(text: string): string {
  return encodeURIComponent(text)
}

export function urlDecode(text: string): string {
  return decodeURIComponent(text.replace(/\+/g, ' '))
}

// URL Component vs Full URL
export function urlEncodeComponent(text: string): string {
  return encodeURIComponent(text)
}

export function urlDecodeComponent(text: string): string {
  return decodeURIComponent(text)
}

// Query String 解析
export interface QueryParam {
  key: string
  value: string
}

export function parseQueryString(qs: string): QueryParam[] {
  const clean = qs.trim().replace(/^[?]/, '')
  if (!clean) return []
  return clean.split('&').map((pair) => {
    const idx = pair.indexOf('=')
    if (idx === -1) return { key: decodeURIComponent(pair), value: '' }
    return {
      key: decodeURIComponent(pair.slice(0, idx)),
      value: decodeURIComponent(pair.slice(idx + 1).replace(/\+/g, ' '))
    }
  })
}

export function buildQueryString(params: QueryParam[]): string {
  return params
    .filter((p) => p.key !== '')
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join('&')
}