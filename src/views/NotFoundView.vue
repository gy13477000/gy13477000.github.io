<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="container">
    <div class="error">
      <div class="code">404</div>
      <h1>页面不存在</h1>
      <p>您访问的页面已被删除或不存在。</p>
      <button class="btn btn-primary" @click="router.push('/')">
        <ArrowLeft :size="16" />
        返回首页
      </button>
    </div>
  </div>
</template>

<style scoped>
.error {
  text-align: center;
  padding: var(--space-16) 0;
}

.code {
  font-size: 96px;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
}

h1 {
  font-size: 24px;
  margin: var(--space-4) 0 var(--space-2);
}

p {
  color: var(--color-text-muted);
  margin-bottom: var(--space-6);
}
</style>