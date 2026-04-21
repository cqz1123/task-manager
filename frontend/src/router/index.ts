/**
 * 路由配置文件
 * 定义应用的路由结构，包括登录、注册和受保护的路由
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/stores/user';

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/BoardsView.vue'),
    meta: { requiresAuth: true } // 需要认证
  },
  {
    path: '/auth',
    name: 'auth',
    component: () => import('@/views/AuthView.vue'),
    meta: { requiresAuth: false } // 不需要认证
  },
  {
    path: '/board/:id',
    name: 'boardDetail',
    component: () => import('@/views/BoardDetail.vue'),
    meta: { requiresAuth: true } // 需要认证
  },
  // 404 路由
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const requiresAuth = to.meta.requiresAuth !== false;
  
  // 如果路由需要认证，但用户未登录
  if (requiresAuth && !userStore.isAuthenticated) {
    next('/auth');
  }
  // 如果用户已登录，但访问认证页
  else if (!requiresAuth && userStore.isAuthenticated && to.name === 'auth') {
    next('/');
  }
  // 其他情况，正常导航
  else {
    next();
  }
});

export default router;
