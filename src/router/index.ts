import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

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