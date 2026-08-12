<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import CommandPalette from '@/components/CommandPalette.vue'
</script>

<template>
  <AppHeader />
  <main class="main">
    <RouterView />
  </main>
  <AppFooter />
  <CommandPalette />
</template>

<style scoped>
.main {
  flex: 1;
  padding: var(--space-8) 0;
}
</style>