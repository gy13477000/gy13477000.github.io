import forge from 'node-forge'

// AES 加解密，与 hutool cn.hutool.crypto.symmetric.AES 互通
//
// hutool 默认:
//   - 算法: AES/CBC/PKCS5Padding (PKCS5 == PKCS7 for AES)
//   - key: byte[] (16/24/32 字节对应 AES-128/192/256)
//   - IV: byte[] (16 字节)，未设置时全零
//
// 加密后输出可以是 base64 或 hex
// WebCrypto 不支持 ECB 模式，但 forge 支持
//
// 使用方式:
//   aesEncrypt(text, 'base64-key-or-hex-key', 'cbc', iv, 'base64')
//   aesDecrypt(base64-cipher, key, 'cbc', iv, 'base64')

export type AesMode = 'CBC' | 'ECB' | 'CFB' | 'OFB' | 'CTR' | 'GCM'
export type KeyEncoding = 'utf8' | 'base64' | 'hex'
export type OutputEncoding = 'base64' | 'hex'
export type IvEncoding = 'utf8' | 'base64' | 'hex'

export interface AesParams {
  mode: AesMode
  key: string
  keyEncoding: KeyEncoding
  iv: string
  ivEncoding: IvEncoding
  output: OutputEncoding
}

function decodeKey(key: string, encoding: KeyEncoding): string {
  // forge cipher 的 key 是 binary string
  return decodeToBinary(key, encoding)
}

function decodeIv(iv: string, encoding: IvEncoding): string {
  return decodeToBinary(iv, encoding)
}

function decodeToBinary(s: string, encoding: KeyEncoding | IvEncoding): string {
  if (encoding === 'utf8') return s
  if (encoding === 'hex') {
    const bytes = hexToBytes(s)
    return bytesToBinary(bytes)
  }
  // base64
  const bytes = base64ToBytes(s)
  return bytesToBinary(bytes)
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, '').replace(/^0x/i, '')
  if (clean.length % 2 !== 0) throw new Error('Hex 长度必须是偶数')
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
  }
  return bytes
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64.trim())
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function bytesToBinary(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)))
  }
  return binary
}

function binaryToBase64(binary: string): string {
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  let out = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)))
  }
  return btoa(out)
}

function binaryToHex(binary: string): string {
  let hex = ''
  for (let i = 0; i < binary.length; i++) {
    hex += binary.charCodeAt(i).toString(16).padStart(2, '0')
  }
  return hex
}

function strToBinary(s: string): string {
  return bytesToBinary(new TextEncoder().encode(s))
}

function binaryToStr(b: string): string {
  const bytes = new Uint8Array(b.length)
  for (let i = 0; i < b.length; i++) bytes[i] = b.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

function getForgeCipherMode(mode: AesMode): string {
  // forge 的 cipher 算法名格式: AES-{128|192|256}-{MODE}
  // 但 key 长度决定 128/192/256，调用方需在 cipher.start 时指定
  return mode
}

export interface EncryptResult {
  cipher: string
  keyBits: number
}

export function aesEncrypt(plaintext: string, params: AesParams): EncryptResult {
  const keyBinary = decodeKey(params.key, params.keyEncoding)
  if (![16, 24, 32].includes(keyBinary.length)) {
    throw new Error(`密钥长度必须是 16/24/32 字节 (当前 ${keyBinary.length} 字节，对应 AES-${keyBinary.length * 8})`)
  }

  const keyBits = keyBinary.length * 8
  const mode = getForgeCipherMode(params.mode)

  if (params.mode === 'GCM') {
    return aesGcmEncrypt(plaintext, keyBinary, params)
  }

  const algo = `AES-${mode}` as forge.cipher.Algorithm
  const ivBinary = params.mode === 'ECB' ? '' : decodeIv(params.iv || '', params.ivEncoding)

  let iv: string
  if (params.mode === 'ECB') {
    iv = ''
  } else {
    iv = ivBinary.length === 0 ? '\x00'.repeat(16) : ivBinary.padEnd(16, '\x00').slice(0, 16)
  }

  const cipher = forge.cipher.createCipher(algo, keyBinary)
  cipher.start({ iv })
  cipher.update(forge.util.createBuffer(strToBinary(plaintext), 'raw'))
  cipher.finish()

  const output = cipher.output.bytes()
  return {
    cipher: params.output === 'hex' ? binaryToHex(output) : binaryToBase64(output),
    keyBits
  }
}

export function aesDecrypt(cipherText: string, params: AesParams): string {
  const keyBinary = decodeKey(params.key, params.keyEncoding)
  if (![16, 24, 32].includes(keyBinary.length)) {
    throw new Error(`密钥长度必须是 16/24/32 字节 (当前 ${keyBinary.length} 字节)`)
  }

  if (params.mode === 'GCM') {
    return aesGcmDecrypt(cipherText, keyBinary, params)
  }

  const mode = getForgeCipherMode(params.mode)
  const algo = `AES-${mode}` as forge.cipher.Algorithm

  const cipherBinary =
    params.output === 'hex'
      ? bytesToBinary(hexToBytes(cipherText))
      : bytesToBinary(base64ToBytes(cipherText))

  const ivBinary = params.mode === 'ECB' ? '' : decodeIv(params.iv || '', params.ivEncoding)
  let iv: string
  if (params.mode === 'ECB') {
    iv = ''
  } else {
    iv = ivBinary.length === 0 ? '\x00'.repeat(16) : ivBinary.padEnd(16, '\x00').slice(0, 16)
  }

  const decipher = forge.cipher.createDecipher(algo, keyBinary)
  decipher.start({ iv })
  decipher.update(forge.util.createBuffer(cipherBinary, 'raw'))
  decipher.finish()
  return binaryToStr(decipher.output.bytes())
}

// GCM 模式单独处理（forge GCM 接口略不同）
function aesGcmEncrypt(plaintext: string, keyBinary: string, params: AesParams): EncryptResult {
  const ivBinary = decodeIv(params.iv || '', params.ivEncoding)
  const iv = ivBinary.length === 0 ? generateIv(12) : ivBinary.padEnd(12, '\x00').slice(0, 12)

  const cipher = forge.cipher.createCipher('AES-GCM', keyBinary)
  cipher.start({ iv, tagLength: 128 })
  cipher.update(forge.util.createBuffer(strToBinary(plaintext), 'raw'))
  cipher.finish()

  // GCM 输出: 密文 + tag (16 字节)
  const tag = (cipher as any).tag.bytes() as string
  const output = cipher.output.bytes() + tag
  return {
    cipher: params.output === 'hex' ? binaryToHex(output) : binaryToBase64(output),
    keyBits: keyBinary.length * 8
  }
}

function aesGcmDecrypt(cipherText: string, keyBinary: string, params: AesParams): string {
  const ivBinary = decodeIv(params.iv || '', params.ivEncoding)
  const iv = ivBinary.length === 0 ? '\x00'.repeat(12) : ivBinary.padEnd(12, '\x00').slice(0, 12)

  const cipherBinary =
    params.output === 'hex'
      ? bytesToBinary(hexToBytes(cipherText))
      : bytesToBinary(base64ToBytes(cipherText))

  const tag = cipherBinary.slice(-16)
  const ct = cipherBinary.slice(0, -16)

  const decipher = forge.cipher.createDecipher('AES-GCM', keyBinary)
  decipher.start({ iv, tag: forge.util.createBuffer(tag, 'raw') })
  decipher.update(forge.util.createBuffer(ct, 'raw'))
  const ok = decipher.finish()
  if (!ok) throw new Error('GCM 验证失败 — 密文或密钥不正确')
  return binaryToStr(decipher.output.bytes())
}

function generateIv(len: number): string {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  return bytesToBinary(bytes)
}

// 生成随机密钥
export function generateAesKey(bits: 128 | 192 | 256, encoding: KeyEncoding): string {
  const bytes = new Uint8Array(bits / 8)
  crypto.getRandomValues(bytes)
  const binary = bytesToBinary(bytes)
  if (encoding === 'hex') return binaryToHex(binary)
  if (encoding === 'base64') return binaryToBase64(binary)
  return binary // utf8 — 但随机字节可能不是合法 UTF-8，建议用 hex/base64
}