import { createRouter, createWebHashHistory } from 'vue-router'
import TodoView from '../views/TodoView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'all',
      component: TodoView,
    },
    {
      path: '/active',
      name: 'active',
      component: TodoView,
    },
    {
      path: '/completed',
      name: 'completed',
      component: TodoView,
    },
  ],
})

export default router
