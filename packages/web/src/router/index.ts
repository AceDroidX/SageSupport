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
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/admin/AdminView.vue'),
      children: [
        {
          path: '',
          name: 'admin-documents',
          component: () => import('../views/admin/AdminDocumentsView.vue')
        },
        {
          path: '/admin/documents',
          component: () => import('../views/admin/AdminDocumentsView.vue')
        },
        {
          path: '/admin/users',
          component: () => import('../views/admin/AdminUserView.vue')
        }
      ]
    },
  ]
})

export default router
