/**
 * 用户存储模块
 * 使用 Pinia 管理用户状态，包括登录状态、用户信息和认证令牌
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../api/auth';
import { login, register, getCurrentUser } from '../api/auth';

// 定义用户存储
export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const isAuthenticated = computed(() => !!token.value);

  // 动作

  /**
   * 登录动作
   */
  const loginUser = async (email: string, password: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await login({ email, password });
      token.value = response.token;
      user.value = response.user;
      // 存储到本地存储
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      return response;
    } catch (err: any) {
      error.value = err.error || '登录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 注册动作
   */
  const registerUser = async (username: string, email: string, password: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await register({ username, email, password });
      token.value = response.token;
      user.value = response.user;
      // 存储到本地存储
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      return response;
    } catch (err: any) {
      error.value = err.error || '注册失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 登出动作
   */
  const logout = () => {
    token.value = null;
    user.value = null;
    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  /**
   * 初始化用户信息
   * 从本地存储加载用户信息
   */
  const initUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
      } catch (e) {
        // 解析失败，清除存储
        logout();
      }
    }
  };

  /**
   * 刷新用户信息
   * 从服务器获取最新的用户信息
   */
  const refreshUser = async () => {
    if (!token.value) return;
    loading.value = true;
    try {
      const response = await getCurrentUser();
      user.value = response.user;
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (err) {
      // 如果获取失败，可能是令牌过期，执行登出
      logout();
    } finally {
      loading.value = false;
    }
  };

  // 初始化
  initUser();

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    loginUser,
    registerUser,
    logout,
    refreshUser
  };
});
