<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import { tools } from '@/tools/tools'

const router = useRouter()

const featuredTools = computed(() => tools.filter((t) => t.featured))
</script>

<template>
  <div class="container">
    <section class="hero">
      <div class="hero-text">
        <h1 class="hero-title">Hi，我是 <span class="accent">gy13477000</span></h1>
        <p class="hero-subtitle">这里是我的数字小窝：一些常用工具、个人项目与随手记录。</p>
        <div class="hero-actions">
          <button class="btn btn-primary" @click="router.push('/tools')">
            浏览工具
            <ArrowRight :size="16" />
          </button>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">精选工具</h2>
        <button class="btn btn-ghost btn-sm" @click="router.push('/tools')">
          查看全部
          <ArrowRight :size="14" />
        </button>
      </div>
      <div class="grid">
        <div
          v-for="tool in featuredTools"
          :key="tool.id"
          class="tool-card card"
          @click="router.push(tool.path)"
        >
          <div class="tool-card-icon">{{ tool.name.charAt(0) }}</div>
          <h3 class="tool-card-title">{{ tool.name }}</h3>
          <p class="tool-card-desc">{{ tool.description }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding: var(--space-16) 0 var(--space-12);
}

.hero-title {
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: var(--space-4);
}

.accent {
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 16px;
  color: var(--color-text-muted);
  max-width: 560px;
  margin-bottom: var(--space-6);
}

.hero-actions {
  display: flex;
  gap: var(--space-3);
}

.section {
  margin-top: var(--space-8);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.tool-card {
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tool-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.tool-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  font-weight: 700;
  font-size: 18px;
  margin-bottom: var(--space-3);
}

.tool-card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: var(--space-2);
}

.tool-card-desc {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.5;
}
</style>