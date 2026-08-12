<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<template>
  <button class="theme-toggle" :title="themeStore.theme === 'dark' ? '切换到亮色' : '切换到暗色'" @click="themeStore.toggle()">
    <Sun v-if="themeStore.theme === 'dark'" :size="18" />
    <Moon v-else :size="18" />
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
}

.theme-toggle:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}
</style>