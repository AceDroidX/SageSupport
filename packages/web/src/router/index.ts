import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'user',
      component: () => import('../views/UserView.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue')
        },
        {
          path: '/conversation/:id',
          component: () => import('../views/ConversationView.vue'),
          props: true
        }
      ]
    },
    {
      path: '/support',
      name: 'support',
      component: () => import('../views/SupportView.vue'),
      children: [
        {
          path: '',
          name: 'support-home',
          component: () => import('../views/SupportHomeView.vue')
        },
        {
          path: '/support/conversation/:id',
          component: () => import('../views/SupportConversationView.vue'),
          props: true
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue')
    },
  ]
})

export default router
