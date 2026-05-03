<template>
  <el-header class="navbar">
    <div class="navbar-container">
      <div class="navbar-left">
        <router-link v-if="!$slots.default && !$slots.left" to="/" class="navbar-logo">
          <el-icon class="logo-icon"><i-ep-grid /></el-icon>
          <span>Task Manager</span>
        </router-link>
        <template v-else>
          <slot name="left"></slot>
          <slot></slot>
        </template>
      </div>
      
      <div class="navbar-right">
        <!-- 右侧自定义内容插槽 -->
        <slot name="right"></slot>
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="navbar-user">
            <el-avatar :size="32" :src="userAvatar">{{ userName }}</el-avatar>
            <span class="user-name">{{ userStore.user?.username }}</span>
            <el-icon class="el-icon--right"><i-ep-arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="settings">
                <el-icon class="mr-2"><i-ep-user /></el-icon>个人设置
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon class="mr-2"><i-ep-switch-button /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <!-- 个人设置弹窗 -->
    <UserSettings
      v-model="showSettingsModal"
      @password-updated="handlePasswordUpdated"
    />
  </el-header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import UserSettings from './UserSettings.vue';
// 图标组件通过 unplugin-icons 自动导入，无需手动导入

const router = useRouter();
const userStore = useUserStore();

// 弹窗状态
const showSettingsModal = ref(false);

const userName = computed(() => {
  return userStore.user?.username?.charAt(0).toUpperCase() || 'U';
});

const userAvatar = computed(() => {
  // 这里可以根据需要返回用户头像，如果没有则返回空
  return userStore.user?.avatar || '';
});

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout();
    router.push('/auth');
  } else if (command === 'settings') {
    // 打开个人设置弹窗
    showSettingsModal.value = true;
  }
};

// 密码修改成功后的处理（可选：退出登录要求重新登录）
const handlePasswordUpdated = () => {
  // 可以选择让用户重新登录
  // ElMessage.info('请重新登录');
};
</script>

<style scoped>
.navbar {
  background: #42b983;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0 24px;
  height: 60px;
  line-height: 60px;
}

.navbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.navbar-left {
  display: flex;
  align-items: center;
}

.navbar-logo {
  display: flex;
  align-items: center;
  color: white;
  text-decoration: none;
  font-size: 18px;
  font-weight: 600;
}

.logo-icon {
  font-size: 24px;
  margin-right: 12px;
}

.navbar-right {
  display: flex;
  align-items: center;
}

.navbar-user {
  display: flex;
  align-items: center;
  color: white;
  cursor: pointer;
  padding: 0 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.navbar-user:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-name {
  margin: 0 8px;
  font-size: 14px;
}

.el-avatar {
  border: 2px solid rgba(255, 255, 255, 0.8);
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 16px;
  }
  
  .navbar-logo span {
    display: none;
  }
  
  .user-name {
    display: none;
  }
}
</style>
