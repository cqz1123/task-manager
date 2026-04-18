<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useUserStore } from './stores/user';

// 用户存储
const userStore = useUserStore();

// 登出处理
const handleLogout = () => {
  userStore.logout();
};
</script>

<template>
  <div class="app">
    <!-- 导航栏 -->
    <nav v-if="userStore.isAuthenticated" class="navbar">
      <div class="navbar-container">
        <h1 class="navbar-title">Task Manager</h1>
        <div class="navbar-actions">
          <span class="navbar-user">Hello, {{ userStore.user?.username }}</span>
          <button @click="handleLogout" class="logout-button">登出</button>
        </div>
      </div>
    </nav>
    
    <!-- 路由视图 -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
  color: #333;
}

/* 应用容器 */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 导航栏 */
.navbar {
  background-color: #42b983;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-title {
  font-size: 1.5rem;
  font-weight: 600;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.navbar-user {
  font-size: 1rem;
}

.logout-button {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

/* 主内容 */
.main-content {
  flex: 1;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar-container {
    flex-direction: column;
    gap: 10px;
  }
  
  .navbar-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
