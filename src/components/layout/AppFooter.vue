<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="container footer-inner">
      <p class="copyright">© {{ year }} gy13477000. Built with Vue 3 + Vite.</p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  border-top: 1px solid var(--color-border);
  padding: var(--space-6) 0;
  margin-top: auto;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.copyright {
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>