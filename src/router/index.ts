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