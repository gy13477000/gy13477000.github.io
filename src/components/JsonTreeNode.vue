<script lang="ts">
// 自引用允许递归
export default { name: 'JsonTreeNode' }
</script>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-vue-next'
import {
  type JsonTreeNode as TJsonTreeNode,
  TYPE_COLORS,
  formatValue,
  childCountLabel
} from '@/tools/json/tree'
import { copyToClipboard } from '@/utils/copy'

const props = defineProps<{
  node: TJsonTreeNode
  hasQuery: boolean
  defaultExpanded: boolean
}>()

const collapsed = ref(!props.defaultExpanded)

watch(
  () => props.hasQuery,
  (q) => {
    if (q && (props.node.matched || props.node.hasMatchedDescendant)) {
      collapsed.value = false
    }
  }
)

const isContainer = computed(
  () => props.node.type === 'object' || props.node.type === 'array'
)

const visible = computed(() => {
  if (!props.hasQuery) return true
  return props.node.matched || props.node.hasMatchedDescendant
})

const isHighlighted = computed(() => props.hasQuery && props.node.matched)

const copied = ref(false)

async function copyPath() {
  const path = props.node.path.replace(/^\$root\.?/, '') || '(root)'
  await copyToClipboard(path)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

const collapsedPreview = computed(() => {
  if (!props.node.children || props.node.children.length === 0) {
    return props.node.type === 'array' ? '[]' : '{}'
  }
  const n = props.node.children.length
  if (props.node.type === 'array') {
    return `Array(${n})]`
  }
  return `Object(${n})}`
})
</script>

<template>
  <div v-if="visible">
    <div
      class="tree-row"
      :class="{ highlighted: isHighlighted, clickable: isContainer }"
      :style="{ paddingLeft: node.depth * 16 + 'px' }"
      @click="isContainer && (collapsed = !collapsed)"
    >
      <span class="chevron">
        <ChevronDown v-if="isContainer && !collapsed" :size="12" />
        <ChevronRight v-else-if="isContainer && collapsed" :size="12" />
        <span v-else class="chevron-placeholder"></span>
      </span>

      <span v-if="node.depth > 0" class="tree-key">{{ node.key }}</span>
      <span v-if="node.depth > 0 && node.type !== 'array'" class="colon">:</span>

      <template v-if="isContainer">
        <span class="bracket">{{ node.type === 'array' ? '[' : '{' }}</span>
        <span v-if="collapsed" class="collapsed-summary">{{ collapsedPreview }}</span>
        <span v-else-if="node.children?.length === 0" class="empty-summary">{{
          node.type === 'array' ? ']' : '}'
        }}</span>
        <template v-else>
          <span class="count-badge">{{ childCountLabel(node) }}</span>
        </template>
      </template>

      <span v-else class="tree-value" :style="{ color: TYPE_COLORS[node.type] }">
        {{ formatValue(node) }}
      </span>

      <button class="copy-path-btn" title="复制路径" @click.stop="copyPath">
        <Check v-if="copied" :size="11" />
        <Copy v-else :size="11" />
        <span v-if="copied" class="copied-tip">已复制</span>
      </button>
    </div>

    <template v-if="isContainer && !collapsed && node.children?.length">
      <JsonTreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :has-query="hasQuery"
        :default-expanded="defaultExpanded"
      />
      <div
        class="tree-row closing-bracket"
        :style="{ paddingLeft: node.depth * 16 + 'px' }"
      >
        <span class="chevron"><span class="chevron-placeholder"></span></span>
        <span class="bracket">{{ node.type === 'array' ? ']' : '}' }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.tree-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px 2px 0;
  border-radius: var(--radius-sm);
  cursor: default;
  position: relative;
  font-size: 13px;
  line-height: 1.5;
  font-family: var(--font-mono);
}
.tree-row.clickable {
  cursor: pointer;
}
.tree-row:hover {
  background: var(--color-bg-subtle);
}
.tree-row:hover .copy-path-btn {
  opacity: 1;
}

.chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}
.chevron-placeholder {
  width: 12px;
  height: 12px;
}

.tree-key {
  color: var(--color-text);
  font-weight: 500;
}
.colon {
  color: var(--color-text-muted);
  margin-right: 4px;
}

.bracket {
  color: var(--color-text);
  font-weight: 600;
}

.count-badge {
  font-size: 11px;
  color: var(--color-text-subtle);
  background: var(--color-bg-subtle);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  margin-left: 4px;
}

.collapsed-summary {
  color: var(--color-text-subtle);
  font-style: italic;
}

.empty-summary {
  color: var(--color-text-subtle);
}

.tree-value {
  word-break: break-all;
}

.highlighted {
  background: rgba(245, 158, 11, 0.15) !important;
  box-shadow: inset 2px 0 0 var(--color-warning);
}

.copy-path-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  color: var(--color-text-subtle);
  font-size: 10px;
  opacity: 0;
  transition: opacity var(--transition-fast);
  position: relative;
}
.copy-path-btn:hover {
  color: var(--color-primary);
  background: var(--color-primary-subtle);
}
.copied-tip {
  position: absolute;
  top: -22px;
  right: 0;
  padding: 1px 6px;
  background: var(--color-text);
  color: var(--color-bg);
  font-size: 10px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.closing-bracket {
  color: var(--color-text);
}
</style>