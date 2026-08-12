<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Github, Mail, Twitter, Globe, Sparkles, Quote } from 'lucide-vue-next'
import { useToolsPrefsStore } from '@/stores/toolsPrefs'
import { tools as allTools } from '@/tools/tools'
import { profile, quickTags, quotes, type SocialLink } from '@/tools/homeData'

const router = useRouter()
const prefs = useToolsPrefsStore()

const featuredTools = computed(() => prefs.featuredTools)

// 数据统计
const stats = computed(() => {
  const visible = prefs.visibleTools
  const tags = new Set<string>()
  visible.forEach((t) => t.tags?.forEach((tag) => tags.add(tag)))
  return [
    { label: '在线工具', value: visible.length, unit: '个' },
    { label: '分类标签', value: tags.size, unit: '类' },
    { label: '全部免费', value: '0', unit: '元' },
    { label: '本地处理', value: '100', unit: '%' }
  ]
})

// 随机一句格言（基于日期，同一天看到的是同一句）
const todayQuote = computed(() => {
  const day = Math.floor(Date.now() / 86400000)
  return quotes[day % quotes.length]
})

// 今天日期
const today = computed(() => {
  const d = new Date()
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${week}`
})

// 标签筛选
const activeTag = ref<string | null>(null)
const filteredFeatured = computed(() => {
  if (!activeTag.value) return featuredTools.value
  return prefs.visibleTools.filter((t) => t.tags?.some((tag) => tag.includes(activeTag.value!)))
})

function selectTag(label: string) {
  const tag = label.replace('#', '')
  activeTag.value = activeTag.value === tag ? null : tag
}

const socialIcons: Record<SocialLink['icon'], any> = {
  github: Github,
  email: Mail,
  twitter: Twitter,
  blog: Globe
}
</script>

<template>
  <div class="container">
    <!-- Hero 区 -->
    <section class="hero">
      <div class="hero-left">
        <img :src="profile.avatar" :alt="profile.name" class="avatar" loading="lazy" />
      </div>
      <div class="hero-text">
        <div class="hero-greeting">{{ today }} · 你好</div>
        <h1 class="hero-title">
          我是 <span class="accent">{{ profile.name }}</span>
        </h1>
        <p class="hero-subtitle">{{ profile.title }}</p>
        <p class="hero-tagline">
          <Sparkles :size="14" />
          {{ profile.taglines[new Date().getDate() % profile.taglines.length] }}
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary" @click="router.push('/tools')">
            浏览工具
            <ArrowRight :size="16" />
          </button>
          <a
            v-for="s in profile.socials"
            :key="s.name"
            :href="s.url"
            target="_blank"
            rel="noopener"
            class="btn btn-secondary"
          >
            <component :is="socialIcons[s.icon]" :size="16" />
            {{ s.name }}
          </a>
        </div>
      </div>
    </section>

    <!-- 数据统计 -->
    <section class="stats-bar">
      <div v-for="s in stats" :key="s.label" class="stat-item">
        <div class="stat-value">
          {{ s.value }}<span class="stat-unit">{{ s.unit }}</span>
        </div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </section>

    <!-- 快速跳转标签 -->
    <section class="section">
      <div class="section-head">
        <h2 class="section-title">按分类快速跳转</h2>
      </div>
      <div class="quick-tags">
        <button
          v-for="t in quickTags"
          :key="t.label"
          class="quick-tag"
          :class="{ active: activeTag === t.label.replace('#', '') }"
          :style="{ '--tag-color': t.color }"
          @click="selectTag(t.label)"
        >
          {{ t.label }}
        </button>
      </div>
    </section>

    <!-- 精选工具 -->
    <section class="section">
      <div class="section-head">
        <h2 class="section-title">
          {{ activeTag ? `分类: #${activeTag}` : '精选工具' }}
        </h2>
        <button class="btn btn-ghost btn-sm" @click="router.push('/tools')">
          查看全部
          <ArrowRight :size="14" />
        </button>
      </div>
      <div v-if="filteredFeatured.length" class="grid">
        <div
          v-for="(tool, idx) in filteredFeatured"
          :key="tool.id"
          class="tool-card card"
          :style="{ '--card-delay': idx * 50 + 'ms' }"
          @click="router.push(tool.path)"
        >
          <div class="tool-card-head">
            <div class="tool-card-icon">{{ tool.name.charAt(0) }}</div>
            <div v-if="tool.tags?.length" class="tool-card-tags">
              <span
                v-for="tag in tool.tags.slice(0, 2)"
                :key="tag"
                class="mini-tag"
              >{{ tag }}</span>
            </div>
          </div>
          <h3 class="tool-card-title">{{ tool.name }}</h3>
          <p class="tool-card-desc">{{ tool.description }}</p>
          <div class="tool-card-footer">
            <span class="tool-card-cta">
              打开
              <ArrowRight :size="14" />
            </span>
          </div>
        </div>
      </div>
      <div v-else class="empty-filter">
        <p>该分类下暂无工具</p>
        <button class="btn btn-ghost btn-sm" @click="activeTag = null">清除筛选</button>
      </div>
    </section>

    <!-- 技术格言 -->
    <section class="quote-card">
      <Quote :size="20" class="quote-mark" />
      <p class="quote-text">{{ todayQuote.text }}</p>
      <p v-if="todayQuote.author" class="quote-author">— {{ todayQuote.author }}</p>
    </section>
  </div>
</template>

<style scoped>
/* Hero */
.hero {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-12) 0 var(--space-10);
  flex-wrap: wrap;
}
.hero-left { flex-shrink: 0; }
.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--color-bg-elevated);
  box-shadow: var(--shadow-lg);
  background: var(--color-bg-subtle);
}
.hero-greeting {
  font-size: 13px;
  color: var(--color-text-subtle);
  margin-bottom: var(--space-2);
  font-family: var(--font-mono);
}
.hero-title {
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: var(--space-2);
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
  margin-bottom: var(--space-3);
}
.hero-tagline {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 14px;
  color: var(--color-primary);
  margin-bottom: var(--space-5);
  padding: var(--space-2) var(--space-3);
  background: var(--color-primary-subtle);
  border-radius: var(--radius-md);
}
.hero-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

/* 统计条 */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-10);
}
.stat-item {
  text-align: center;
  position: relative;
}
.stat-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: calc(var(--space-4) * -0.5);
  top: 20%;
  bottom: 20%;
  width: 1px;
  background: var(--color-border);
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  font-family: var(--font-mono);
  line-height: 1;
  margin-bottom: var(--space-2);
}
.stat-unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-left: 2px;
}
.stat-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* Section */
.section {
  margin-top: var(--space-10);
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

/* 标签云 */
.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.quick-tag {
  padding: var(--space-2) var(--space-4);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: var(--tag-color, var(--color-text-muted));
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.quick-tag:hover {
  border-color: var(--tag-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--tag-color) 30%, transparent);
}
.quick-tag.active {
  background: var(--tag-color);
  color: #fff;
  border-color: var(--tag-color);
}

/* 工具卡 */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}
.tool-card {
  cursor: pointer;
  transition: all var(--transition-fast);
  animation: card-in 400ms var(--card-delay, 0ms) both;
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.tool-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.tool-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}
.tool-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary-subtle), color-mix(in srgb, var(--color-primary) 20%, transparent));
  color: var(--color-primary);
  font-weight: 700;
  font-size: 20px;
}
.tool-card-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.mini-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
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
  margin-bottom: var(--space-3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.tool-card-footer {
  display: flex;
  justify-content: flex-end;
}
.tool-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 500;
}

.empty-filter {
  padding: var(--space-10);
  text-align: center;
  color: var(--color-text-muted);
}
.empty-filter p { margin-bottom: var(--space-3); }

/* 格言卡 */
.quote-card {
  margin-top: var(--space-12);
  padding: var(--space-8) var(--space-6);
  background: linear-gradient(135deg, var(--color-bg-elevated), var(--color-bg-subtle));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
  position: relative;
  overflow: hidden;
}
.quote-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 60%);
  pointer-events: none;
}
.quote-mark {
  color: var(--color-primary);
  opacity: 0.4;
  margin-bottom: var(--space-3);
}
.quote-text {
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-text);
  margin-bottom: var(--space-2);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
.quote-author {
  font-size: 13px;
  color: var(--color-text-muted);
  font-style: italic;
}

@media (max-width: 720px) {
  .hero {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }
  .hero-text { text-align: center; }
  .hero-tagline, .hero-actions { justify-content: center; }
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat-item:nth-child(2)::after { display: none; }
}
</style>