import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { tools } from '@/tools/tools'
import { useCommandPaletteStore } from '@/stores/commandPalette'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/tools',
    name: 'tools',
    component: () => import('@/views/ToolsView.vue')
  },
  {
    path: '/tools/json',
    name: 'json',
    component: () => import('@/views/tools/JsonFormatterView.vue')
  },
  {
    path: '/tools/codec',
    name: 'codec',
    component: () => import('@/views/tools/CodecView.vue')
  },
  {
    path: '/tools/timestamp',
    name: 'timestamp',
    component: () => import('@/views/tools/TimestampView.vue')
  },
  {
    path: '/tools/hash',
    name: 'hash',
    component: () => import('@/views/tools/HashView.vue')
  },
  {
    path: '/tools/hmac',
    name: 'hmac',
    component: () => import('@/views/tools/HmacView.vue')
  },
  {
    path: '/tools/uuid',
    name: 'uuid',
    component: () => import('@/views/tools/UuidView.vue')
  },
  {
    path: '/tools/aes',
    name: 'aes',
    component: () => import('@/views/tools/AesView.vue')
  },
  {
    path: '/tools/rsa-cipher',
    name: 'rsa-cipher',
    component: () => import('@/views/tools/RsaCipherView.vue')
  },
  {
    path: '/tools/rsa-sign',
    name: 'rsa-sign',
    component: () => import('@/views/tools/RsaSignView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue')
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 进入工具页时记录访问历史（用于 Cmd+K 最近使用）
router.afterEach((to) => {
  if (to.path.startsWith('/tools/')) {
    const tool = tools.find((t) => t.path === to.path)
    if (tool) {
      // store 在 router 创建时可能还未初始化, 延迟到下一个 tick
      import('pinia').then(({ getActivePinia }) => {
        const pinia = getActivePinia()
        if (!pinia) return
        const palette = useCommandPaletteStore(pinia)
        palette.recordVisit(tool.id)
      })
    }
  }
})