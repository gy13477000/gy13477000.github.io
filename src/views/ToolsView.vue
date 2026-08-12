<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import { tools } from '@/tools/tools'

const router = useRouter()
</script>

<template>
  <div class="container">
    <header class="page-head">
      <h1 class="page-title">工具集合</h1>
      <p class="page-desc">这里放一些我在工作和生活中常用的小工具。持续更新中。</p>
    </header>

    <div class="tool-grid">
      <article
        v-for="tool in tools"
        :key="tool.id"
        class="tool card"
        @click="router.push(tool.path)"
      >
        <div class="tool-head">
          <div class="tool-icon">{{ tool.name.charAt(0) }}</div>
          <div class="tool-tags" v-if="tool.tags">
            <span v-for="tag in tool.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
        <h3 class="tool-title">{{ tool.name }}</h3>
        <p class="tool-desc">{{ tool.description }}</p>
        <div class="tool-footer">
          <span class="tool-cta">
            打开
            <ArrowRight :size="14" />
          </span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.page-head {
  margin-bottom: var(--space-8);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: var(--space-2);
}

.page-desc {
  color: var(--color-text-muted);
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.tool {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all var(--transition-fast);
}

.tool:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.tool-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.tool-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  font-weight: 700;
  font-size: 20px;
}

.tool-tags {
  display: flex;
  gap: var(--space-2);
}

.tool-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: var(--space-2);
}

.tool-desc {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: var(--space-4);
  flex: 1;
}

.tool-footer {
  display: flex;
  justify-content: flex-end;
}

.tool-cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 500;
}
</style>