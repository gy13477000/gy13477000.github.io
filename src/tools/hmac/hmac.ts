import forge from 'node-forge'

export type HmacAlgo = 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512'

export interface HmacAlgoMeta {
  id: HmacAlgo
  label: string
}

export const HMAC_ALGOS: HmacAlgoMeta[] = [
  { id: 'sha256', label: 'HMAC-SHA256 (推荐)' },
  { id: 'sha1', label: 'HMAC-SHA1' },
  { id: 'sha384', label: 'HMAC-SHA384' },
  { id: 'sha512', label: 'HMAC-SHA512' },
  { id: 'md5', label: 'HMAC-MD5 (兼容老系统)' }
]

export type OutputEncoding = 'hex' | 'base64'

export function hmacSign(
  message: string,
  key: string,
  algo: HmacAlgo,
  encoding: OutputEncoding = 'hex'
): string {
  const hmac = (forge.hmac as any).create()
  hmac.start(algo, key)
  hmac.update(message)
  const digest = hmac.digest()
  if (encoding === 'hex') return digest.toHex()
  // base64
  const bytes = new Uint8Array(digest.length())
  for (let i = 0; i < bytes.length; i++) bytes[i] = digest.at(i)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)))
  }
  return btoa(binary)
}