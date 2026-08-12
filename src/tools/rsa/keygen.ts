import forge from 'node-forge'

export type RsaKeySize = 2048 | 3072 | 4096

export interface KeyPairPem {
  publicKey: string
  privateKey: string // PKCS#8 (-----BEGIN PRIVATE KEY-----)
  privateKeyPkcs1: string // PKCS#1 (-----BEGIN RSA PRIVATE KEY-----)
  size: RsaKeySize
}

function wrapPem(label: string, b64: string): string {
  const lines = b64.match(/.{1,64}/g) || [b64]
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`
}

export function pemLabel(pem: string): string {
  const m = pem.match(/-----BEGIN ([^-]+)-----/)
  return m ? m[1].trim() : ''
}

export interface GenerateOptions {
  size?: RsaKeySize
}

// 用 forge 生成密钥对（纯 JS, 浏览器可用）
// 比 WebCrypto 慢一些（2048 位约 200-800ms），但能直接导出 PKCS#1
export async function generateKeyPair(options: GenerateOptions = {}): Promise<KeyPairPem> {
  const size = options.size ?? 2048

  // 让出生成让 UI 不卡顿
  await new Promise<void>((resolve) => setTimeout(resolve, 0))

  const pair = forge.pki.rsa.generateKeyPair({ bits: size, e: 0x10001 })

  const publicKey = forge.pki.publicKeyToPem(pair.publicKey)
  const privateKeyPkcs8 = forge.pki.privateKeyToPem(pair.privateKey)

  // 用 forge ASN.1 编码 RSAPrivateKey (PKCS#1)
  const rsaPrivateKeyAsn1 = (forge.pki as any).privateKeyToAsn1
    ? (forge.pki as any).privateKeyToAsn1(pair.privateKey)
    : forge.pki.wrapRsaPrivateKey(forge.pki.privateKeyToAsn1(pair.privateKey))
  // 注意: privateKeyToAsn1 返回 RSAPrivateKey (PKCS#1), wrapRsaPrivateKey 会包成 PKCS#8
  // 我们要 PKCS#1, 所以直接用 privateKeyToAsn1 的输出
  const pkcs1Asn1 = (forge.pki as any).privateKeyToAsn1(pair.privateKey)
  const pkcs1Bytes = forge.asn1.toDer(pkcs1Asn1).getBytes()
  const pkcs1B64 = btoa(pkcs1Bytes)
  const pkcs1Pem = wrapPem('RSA PRIVATE KEY', pkcs1B64)
  void rsaPrivateKeyAsn1

  return {
    publicKey,
    privateKey: privateKeyPkcs8,
    privateKeyPkcs1: pkcs1Pem,
    size
  }
}