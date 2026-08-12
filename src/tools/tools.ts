import type { ToolMeta } from './registry'

export const tools: ToolMeta[] = [
  {
    id: 'json',
    name: 'JSON 格式化',
    description: '美化、压缩、校验 JSON，支持树形浏览、字段搜索、节点路径复制。',
    icon: 'Braces',
    path: '/tools/json',
    tags: ['常用', '开发者'],
    featured: true
  },
  {
    id: 'codec',
    name: '编解码',
    description: 'Base64 / Hex / URL 编解码，Query String 解析与重构。',
    icon: 'Binary',
    path: '/tools/codec',
    tags: ['常用', '开发者'],
    featured: true
  },
  {
    id: 'timestamp',
    name: '时间戳转换',
    description: 'Unix 时间戳 ↔ 日期，秒/毫秒，相对时间显示。',
    icon: 'Clock',
    path: '/tools/timestamp',
    tags: ['常用'],
    featured: true
  },
  {
    id: 'hash',
    name: '哈希计算',
    description: 'MD5 / SHA1 / SHA256 / SHA384 / SHA512，支持文本和文件流式哈希。',
    icon: 'Fingerprint',
    path: '/tools/hash',
    tags: ['常用', '安全'],
    featured: true
  },
  {
    id: 'hmac',
    name: 'HMAC 签名',
    description: 'HMAC-MD5/SHA1/SHA256 等密钥哈希，输出 Hex 或 Base64。',
    icon: 'KeyRound',
    path: '/tools/hmac',
    tags: ['签名', '安全']
  },
  {
    id: 'uuid',
    name: 'UUID 生成器',
    description: '批量生成 UUID v4 (随机) 或 v7 (时间有序)。',
    icon: 'Fingerprint',
    path: '/tools/uuid',
    tags: ['常用']
  },
  {
    id: 'aes',
    name: 'AES 加解密',
    description: 'AES-128/192/256，CBC/ECB/CFB/OFB/CTR/GCM 模式，与 hutool AES 完全互通。',
    icon: 'Lock',
    path: '/tools/aes',
    tags: ['加密', '安全'],
    featured: true
  },
  {
    id: 'rsa-cipher',
    name: 'RSA 加解密',
    description: '在线生成 RSA 密钥对（PKCS#1 / PKCS#8），分段加解密与 hutool RSA 互通。',
    icon: 'KeyRound',
    path: '/tools/rsa-cipher',
    tags: ['加密', '安全'],
    featured: true
  },
  {
    id: 'rsa-sign',
    name: 'RSA 签名验签',
    description: 'MD5/SHA1/SHA256/SHA384/SHA512 with RSA 签名与验签，与 hutool Sign 互通。',
    icon: 'FileSignature',
    path: '/tools/rsa-sign',
    tags: ['签名', '安全']
  }
]

export function getToolById(id: string): ToolMeta | undefined {
  return tools.find((t) => t.id === id)
}