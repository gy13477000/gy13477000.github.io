<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'
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

      <ThemeToggle />
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
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-weight: 600;
  color: var(--color-text);
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

@media (max-width: 640px) {
  .brand-text {
    display: none;
  }
}
</style>