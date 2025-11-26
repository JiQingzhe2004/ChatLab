import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  routes: [
    {
      path: '/',
      name: 'index',
      component: () => import('@/pages/index.vue'),
    },
    {
      path: '/ui',
      name: 'ui',
      component: () => import('@/pages/ui.vue'),
    },
  ],
  history: createWebHashHistory(),
})

router.beforeEach((to, from, next) => {
  next()
})

router.afterEach((to) => {
  document.body.id = `page-${to.name as string}`
})
