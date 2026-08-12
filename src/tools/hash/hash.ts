import forge from 'node-forge'
// @ts-expect-error - 子路径无类型声明
import forgeMd5 from 'node-forge/lib/md5'

export type HashAlgo = 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512'

export interface HashAlgoMeta {
  id: HashAlgo
  label: string
  bits: number
}

export const HASH_ALGOS: HashAlgoMeta[] = [
  { id: 'md5', label: 'MD5', bits: 128 },
  { id: 'sha1', label: 'SHA-1', bits: 160 },
  { id: 'sha256', label: 'SHA-256', bits: 256 },
  { id: 'sha384', label: 'SHA-384', bits: 384 },
  { id: 'sha512', label: 'SHA-512', bits: 512 }
]

// 字符串 → 哈希
export function hashText(text: string, algo: HashAlgo): string {
  const md = createMd(algo)
  md.update(text, 'utf8')
  return md.digest().toHex()
}

// Uint8Array → 哈希
export function hashBytes(bytes: Uint8Array, algo: HashAlgo): string {
  const md = createMd(algo)
  // forge 的 update 接受 string; 这里转 binary string
  const chunks: string[] = []
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize))))
  }
  md.update(chunks.join(''))
  return md.digest().toHex()
}

// 流式哈希文件，避免一次性读入大文件占内存
export async function hashFile(
  file: File,
  algo: HashAlgo,
  onProgress?: (loaded: number, total: number) => void
): Promise<string> {
  const md = createMd(algo)
  const chunkSize = 1024 * 1024 // 1MB
  let offset = 0
  const total = file.size

  while (offset < total) {
    const end = Math.min(offset + chunkSize, total)
    const slice = file.slice(offset, end)
    const buf = new Uint8Array(await slice.arrayBuffer())
    const binary = String.fromCharCode.apply(null, Array.from(buf))
    md.update(binary)
    offset = end
    onProgress?.(offset, total)
    // 让出主线程，避免 UI 卡顿
    await new Promise<void>((r) => setTimeout(r, 0))
  }

  return md.digest().toHex()
}

function createMd(algo: HashAlgo): forge.md.MessageDigest {
  switch (algo) {
    case 'md5':
      return forge.md.md5.create()
    case 'sha1':
      return forge.md.sha1.create()
    case 'sha256':
      return forge.md.sha256.create()
    case 'sha384':
      return forge.md.sha384.create()
    case 'sha512':
      return forge.md.sha512.create()
    default:
      throw new Error(`不支持的算法: ${algo}`)
  }
}

void forgeMd5