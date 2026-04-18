<template>
  <div class="register-container">
    <div class="register-box">
      <h1 class="register-title">注册</h1>
      
      <!-- 错误信息 -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <!-- 用户名输入框 -->
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            type="text"
            id="username"
            v-model="form.username"
            placeholder="请输入用户名"
            required
            :disabled="loading"
          />
        </div>
        
        <!-- 邮箱输入框 -->
        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            placeholder="请输入邮箱"
            required
            :disabled="loading"
          />
        </div>
        
        <!-- 密码输入框 -->
        <div class="form-group">
          <label for="password">密码</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            placeholder="请输入密码（至少6个字符）"
            required
            minlength="6"
            :disabled="loading"
          />
        </div>
        
        <!-- 注册按钮 -->
        <button
          type="submit"
          class="register-button"
          :disabled="loading"
        >
          {{ loading ? '注册中...' : '注册' }}
        </button>
        
        <!-- 登录链接 -->
        <div class="login-link">
          已有账号？
          <router-link to="/login">立即登录</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

// 路由实例
const router = useRouter();

// 用户存储
const userStore = useUserStore();

// 表单数据
const form = reactive({
  username: '',
  email: '',
  password: ''
});

// 状态
const loading = ref(false);
const error = ref<string | null>(null);

// 注册处理
const handleRegister = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    await userStore.registerUser(form.username, form.email, form.password);
    // 注册成功后跳转到首页
    router.push('/');
  } catch (err: any) {
    error.value = userStore.error || '注册失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.register-box {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
  width: 100%;
  max-width: 400px;
}

.register-title {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 600;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.form-group input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.register-button {
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.register-button:hover {
  background-color: #35495e;
}

.register-button:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #42b983;
  text-decoration: none;
  font-weight: 500;
  margin-left: 5px;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
