// JSON → 树形结构

export type JsonNodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'

export interface JsonTreeNode {
  key: string // 字段名（数组则为索引字符串）
  path: string // JSON Pointer 风格路径: .a.b[0].c
  type: JsonNodeType
  value: unknown // 原始值（仅 primitive 节点有效）
  children?: JsonTreeNode[]
  depth: number
  // 搜索相关
  matched: boolean
  hasMatchedDescendant: boolean
}

export function buildJsonTree(json: unknown): JsonTreeNode | null {
  const root = buildNode('', '$root', json, 0)
  return root
}

function buildNode(key: string, path: string, value: unknown, depth: number): JsonTreeNode {
  const type = getType(value)
  const node: JsonTreeNode = {
    key,
    path,
    type,
    value,
    depth,
    matched: false,
    hasMatchedDescendant: false
  }

  if (type === 'object' && value !== null) {
    node.children = Object.keys(value as object).map((k) => {
      const v = (value as Record<string, unknown>)[k]
      const childPath = `${path}.${k}`
      return buildNode(k, childPath, v, depth + 1)
    })
  } else if (type === 'array') {
    node.children = (value as unknown[]).map((v, i) => {
      const childPath = `${path}[${i}]`
      return buildNode(String(i), childPath, v, depth + 1)
    })
  }

  return node
}

function getType(v: unknown): JsonNodeType {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  const t = typeof v
  if (t === 'object') return 'object'
  if (t === 'string') return 'string'
  if (t === 'number') return 'number'
  if (t === 'boolean') return 'boolean'
  return 'null'
}

// 树节点统计
export interface TreeStats {
  objects: number
  arrays: number
  primitives: number
  depth: number
  keys: number
}

export function statsOfTree(node: JsonTreeNode | null): TreeStats {
  const stats: TreeStats = { objects: 0, arrays: 0, primitives: 0, depth: 0, keys: 0 }
  if (!node) return stats
  walk(node, stats)
  return stats
}

function walk(node: JsonTreeNode, stats: TreeStats) {
  stats.depth = Math.max(stats.depth, node.depth)
  if (node.type === 'object') {
    stats.objects++
    stats.keys += node.children?.length || 0
  } else if (node.type === 'array') {
    stats.arrays++
  } else {
    stats.primitives++
  }
  node.children?.forEach((c) => walk(c, stats))
}

// 搜索: 标记匹配的节点和其所有祖先
export function searchTree(node: JsonTreeNode | null, query: string): void {
  if (!node) return
  const q = query.trim().toLowerCase()
  markSearch(node, q)
}

function markSearch(node: JsonTreeNode, q: string): boolean {
  let selfMatched = false
  if (q) {
    // 匹配 key 或 primitive value
    if (node.key.toLowerCase().includes(q)) selfMatched = true
    if (node.type !== 'object' && node.type !== 'array') {
      const v = node.type === 'null' ? 'null' : String(node.value)
      if (v.toLowerCase().includes(q)) selfMatched = true
    }
  } else {
    // 空搜索: 全部不标记
    selfMatched = false
  }
  node.matched = selfMatched

  let descendantMatched = false
  if (node.children) {
    for (const c of node.children) {
      if (markSearch(c, q)) descendantMatched = true
    }
  }
  node.hasMatchedDescendant = descendantMatched
  return selfMatched || descendantMatched
}

// 类型对应的颜色（与 view 中一致）
export const TYPE_COLORS: Record<JsonNodeType, string> = {
  object: 'var(--color-text)',
  array: 'var(--color-text)',
  string: 'var(--color-success)',
  number: 'var(--color-primary)',
  boolean: 'var(--color-warning)',
  null: 'var(--color-text-subtle)'
}

// 格式化 primitive 值的展示
export function formatValue(node: JsonTreeNode): string {
  switch (node.type) {
    case 'string':
      return `"${node.value}"`
    case 'null':
      return 'null'
    case 'boolean':
    case 'number':
      return String(node.value)
    default:
      return ''
  }
}

// 节点子项数量描述
export function childCountLabel(node: JsonTreeNode): string {
  if (node.type === 'object') {
    const n = node.children?.length || 0
    return n === 1 ? '1 项' : `${n} 项`
  }
  if (node.type === 'array') {
    const n = node.children?.length || 0
    return n === 1 ? '1 元素' : `${n} 元素`
  }
  return ''
}