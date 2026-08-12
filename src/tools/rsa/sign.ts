import forge from 'node-forge'

// RSA 签名/验签 — 与 Java/hutool 互通
//
// 算法字符串映射:
//   SHA1withRSA   -> forge scheme 'RSASSA-PKCS1-V1_5' + md SHA1
//   SHA256withRSA -> forge scheme 'RSASSA-PKCS1-V1_5' + md SHA256
//   SHA384withRSA -> 同上 SHA384
//   SHA512withRSA -> 同上 SHA512
//   MD5withRSA    -> 同上 MD5 (老系统兼容, 不推荐)
//
// 输出/输入签名值用 base64 编码，与 hutool SecureUtil.sign 默认行为一致。
// hutool Sign.signBase64() / Sign.verify() 直接互通。
export type SignAlgo = 'MD5withRSA' | 'SHA1withRSA' | 'SHA256withRSA' | 'SHA384withRSA' | 'SHA512withRSA'

export interface SignAlgoMeta {
  javaName: SignAlgo
  hashName: 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512'
  label: string
}

export const SIGN_ALGOS: SignAlgoMeta[] = [
  { javaName: 'SHA256withRSA', hashName: 'sha256', label: 'SHA256withRSA (推荐)' },
  { javaName: 'SHA1withRSA', hashName: 'sha1', label: 'SHA1withRSA' },
  { javaName: 'SHA384withRSA', hashName: 'sha384', label: 'SHA384withRSA' },
  { javaName: 'SHA512withRSA', hashName: 'sha512', label: 'SHA512withRSA' },
  { javaName: 'MD5withRSA', hashName: 'md5', label: 'MD5withRSA (兼容老系统)' }
]

function getAlgoMeta(name: SignAlgo): SignAlgoMeta {
  const meta = SIGN_ALGOS.find((a) => a.javaName === name)
  if (!meta) throw new Error(`不支持的签名算法: ${name}`)
  return meta
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

function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

// 用私钥对文本签名，输出 base64
export function signText(
  plaintext: string,
  privateKeyPem: string,
  algo: SignAlgo = 'SHA256withRSA'
): string {
  const meta = getAlgoMeta(algo)
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem) as forge.pki.rsa.PrivateKey

  // forge 的 sign 接受 string (会按 UTF-8 处理) 或 bytes
  // 为了与 Java new String(bytes, UTF_8) 行为一致, 直接传 UTF-8 编码后的字符串
  const md = forge.md[meta.hashName].create()
  md.update(plaintext, 'utf8')

  const signatureBytes = privateKey.sign(md, 'RSASSA-PKCS1-V1_5')
  // signatureBytes 是 binary string, 转 Uint8Array 再 base64
  const bytes = new Uint8Array(signatureBytes.length)
  for (let i = 0; i < signatureBytes.length; i++) bytes[i] = signatureBytes.charCodeAt(i)
  return bytesToBase64(bytes)
}

// 用公钥验签。签名值为 base64
export function verifyText(
  plaintext: string,
  signatureBase64: string,
  publicKeyPem: string,
  algo: SignAlgo = 'SHA256withRSA'
): boolean {
  const meta = getAlgoMeta(algo)
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem) as forge.pki.rsa.PublicKey
  if (!('verify' in publicKey)) {
    throw new Error('提供的 PEM 不是公钥')
  }

  const md = forge.md[meta.hashName].create()
  md.update(plaintext, 'utf8')

  const sigBytes = base64ToBytes(signatureBase64)
  let sigBinary = ''
  const chunk = 0x8000
  for (let i = 0; i < sigBytes.length; i += chunk) {
    sigBinary += String.fromCharCode.apply(null, Array.from(sigBytes.subarray(i, i + chunk)))
  }

  return publicKey.verify(md.digest().bytes(), sigBinary, 'RSASSA-PKCS1-V1_5')
}