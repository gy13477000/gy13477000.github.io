import type { ToolMeta } from './registry'

export const tools: ToolMeta[] = [
  {
    id: 'rsa-cipher',
    name: 'RSA 加解密',
    description: '在线生成 RSA 密钥对（支持 PKCS#1 私钥导出），分段加解密与 hutool RSA.encrypt/decryptStr 完全互通。',
    icon: 'KeyRound',
    path: '/tools/rsa-cipher',
    tags: ['加密', '安全'],
    featured: true
  },
  {
    id: 'rsa-sign',
    name: 'RSA 签名验签',
    description: '支持 MD5/SHA1/SHA256/SHA384/SHA512 with RSA 签名与验签，与 hutool Sign 互通。',
    icon: 'FileSignature',
    path: '/tools/rsa-sign',
    tags: ['签名', '安全'],
    featured: true
  }
]

export function getToolById(id: string): ToolMeta | undefined {
  return tools.find((t) => t.id === id)
}