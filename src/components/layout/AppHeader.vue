<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Search } from 'lucide-vue-next'
import ThemeToggle from './ThemeToggle.vue'
import { useCommandPaletteStore } from '@/stores/commandPalette'

const palette = useCommandPaletteStore()
</script>

<template>
  <header class="app-header">
    <div class="container header-inner">
      <RouterLink to="/" class="brand">
        <span class="brand-mark">P</span>
        <span class="brand-text">个人主页</span>
      </RouterLink>

      <nav class="nav">
        <RouterLink to="/" class="nav-link">首页</RouterLink>
        <RouterLink to="/tools" class="nav-link">工具</RouterLink>
      </nav>

      <div class="header-actions">
        <button class="search-trigger" @click="palette.open()">
          <Search :size="14" />
          <span class="search-text">搜索工具</span>
          <kbd class="search-kbd">⌘K</kbd>
        </button>
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(8px);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  gap: var(--space-4);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-weight: 600;
  color: var(--color-text);
  flex-shrink: 0;
}

.brand:hover {
  color: var(--color-text);
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  font-size: 16px;
}

.brand-text {
  font-size: 15px;
}

.nav {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
}

.nav-link {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
}

.nav-link:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  background: var(--color-primary-subtle);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.search-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2) var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  font-size: 13px;
  transition: all var(--transition-fast);
}
.search-trigger:hover {
  border-color: var(--color-primary);
  color: var(--color-text);
  background: var(--color-primary-subtle);
}
.search-text { font-size: 13px; }
.search-kbd {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
}

@media (max-width: 720px) {
  .brand-text { display: none; }
  .search-text { display: none; }
  .search-trigger { padding: var(--space-2); }
}
@media (max-width: 480px) {
  .search-kbd { display: none; }
}
</style>