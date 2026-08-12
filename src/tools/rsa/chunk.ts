// 按需引入 forge 模块，减小打包体积（仅 RSA + ASN.1 + PEM）
// @ts-expect-error - node-forge 子路径无类型声明
import forge from 'node-forge/lib/forge'
import 'node-forge/lib/rsa'
import 'node-forge/lib/asn1'
import 'node-forge/lib/pki'
import 'node-forge/lib/util'

// 兼容 hutool cn.hutool.crypto.asymmetric.RSA 的纯 RSA-PKCS1 分段加解密
//
// hutool 默认: RSA/ECB/PKCS1Padding, AsymmetricCrypto.doFinalWithBlock
//
// 加密: 按 (modulusBits/8 - 11) 字节切段, 每段 PKCS1 加密成 modulusBits/8 字节, 顺序拼接
// 解密: 反向操作
//
// 浏览器加密 → hutool 一行解:
//   new RSA(privateKey).decryptStr(cipherBase64, KeyType.PrivateKey)
//
// 为什么用 node-forge:
//   WebCrypto 标准不暴露 RSA-PKCS1-v1_5 加密算法 (只支持 OAEP)。
//   forge 是纯 JS 的 RSA 实现，支持 PKCS1 padding，可直接在浏览器跑。
const PKCS1_PAD_OVERHEAD = 11

function getModulusBytes(key: forge.pki.PublicKey | forge.pki.PrivateKey): number {
  const k = key as unknown as { n: forge.jsbn.BigInteger }
  return Math.ceil(k.n.bitLength() / 8)
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
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

function bytesToStr(b: Uint8Array): string {
  return new TextDecoder().decode(b)
}

export interface HutoolMeta {
  rsaBits: number
  totalCipherBytes: number
  estimatedSegments: number
  maxPlaintextBytes: number
}

// 加密: hutool RSA.encrypt 兼容格式
export function rsaEncryptHutool(plaintext: string, publicKeyPem: string): string {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem) as forge.pki.rsa.PublicKey
  if (!('encrypt' in publicKey)) {
    throw new Error('提供的 PEM 不是公钥')
  }
  const modulusBytes = getModulusBytes(publicKey)
  const maxChunk = modulusBytes - PKCS1_PAD_OVERHEAD

  const plain = strToBytes(plaintext)
  const out: Uint8Array[] = []
  let offset = 0
  while (offset < plain.length) {
    const slice = Array.from(plain.subarray(offset, offset + maxChunk))
    // forge 的 encrypt 接受 number[], 返回 bytes string
    const enc = publicKey.encrypt(String.fromCharCode.apply(null, slice), 'RSAES-PKCS1-V1_5')
    out.push(new Uint8Array(Array.from(enc).map((c) => (c as string).charCodeAt(0))))
    offset += maxChunk
  }

  const total = out.reduce((acc, b) => acc + b.length, 0)
  const merged = new Uint8Array(total)
  let pos = 0
  for (const b of out) {
    merged.set(b, pos)
    pos += b.length
  }
  return bytesToBase64(merged)
}

// 解密: hutool RSA.decrypt 兼容格式
export function rsaDecryptHutool(cipherBase64: string, privateKeyPem: string): string {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem) as forge.pki.rsa.PrivateKey
  const modulusBytes = getModulusBytes(privateKey)
  const cipher = base64ToBytes(cipherBase64)
  if (cipher.length === 0) throw new Error('密文为空')
  if (cipher.length % modulusBytes !== 0) {
    throw new Error(
      `密文长度 ${cipher.length} 不是 RSA 块大小 (${modulusBytes}) 的整数倍 — 可能密文损坏或密钥位数不匹配`
    )
  }

  const out: number[] = []
  let offset = 0
  while (offset < cipher.length) {
    const blockBytes = cipher.subarray(offset, offset + modulusBytes)
    const block = String.fromCharCode.apply(null, Array.from(blockBytes))
    const dec = privateKey.decrypt(block, 'RSAES-PKCS1-V1_5')
    for (let i = 0; i < dec.length; i++) out.push(dec.charCodeAt(i))
    offset += modulusBytes
  }

  return bytesToStr(new Uint8Array(out))
}

export function inspectHutoolEnvelope(cipherBase64: string): HutoolMeta {
  const bytes = base64ToBytes(cipherBase64)
  let rsaBits = 2048
  if (bytes.length % 512 === 0) rsaBits = 4096
  else if (bytes.length % 384 === 0) rsaBits = 3072
  else if (bytes.length % 256 === 0) rsaBits = 2048

  const rsaBlock = Math.ceil(rsaBits / 8)
  return {
    rsaBits,
    totalCipherBytes: bytes.length,
    estimatedSegments: Math.ceil(bytes.length / rsaBlock),
    maxPlaintextBytes: Math.ceil(bytes.length / rsaBlock) * (rsaBlock - PKCS1_PAD_OVERHEAD)
  }
}