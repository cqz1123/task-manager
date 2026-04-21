<template>
  <div class="auth-container">
    <div class="auth-box">
      <el-card class="auth-card">
        <template #header>
          <div class="card-header">
            <h2>{{ isLogin ? '登录' : '注册' }}</h2>
          </div>
        </template>

        <!-- 错误信息 -->
        <el-alert
          v-if="error"
          :title="error"
          type="error"
          :closable="true"
          @close="error = null"
          show-icon
          class="error-alert"
        />

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <!-- 用户名输入框（仅注册时显示） -->
          <el-form-item v-if="!isLogin" label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              prefix-icon="User"
              size="large"
            />
          </el-form-item>

          <!-- 邮箱输入框 -->
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="form.email"
              type="email"
              placeholder="请输入邮箱"
              prefix-icon="Message"
              size="large"
            />
          </el-form-item>

          <!-- 密码输入框 -->
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>

          <!-- 提交按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              native-type="submit"
              :loading="loading"
              size="large"
              class="submit-button"
            >
              {{ isLogin ? '登录' : '注册' }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 切换登录/注册 -->
        <div class="switch-auth">
          <span>{{ isLogin ? '还没有账号？' : '已有账号？' }}</span>
          <el-link type="primary" @click="toggleMode">
            {{ isLogin ? '立即注册' : '立即登录' }}
          </el-link>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import type { FormInstance, FormRules } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();

const isLogin = ref(true);
const loading = ref(false);
const error = ref<string | null>(null);
const formRef = ref<FormInstance>();

const form = reactive({
  username: '',
  email: '',
  password: ''
});

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
  ]
};

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  error.value = null;
  formRef.value?.clearValidate();
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    error.value = null;

    try {
      if (isLogin.value) {
        await userStore.loginUser(form.email, form.password);
      } else {
        await userStore.registerUser(form.username, form.email, form.password);
      }

      router.push('/');
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || (isLogin.value ? '登录失败' : '注册失败');
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-box {
  width: 100%;
  max-width: 450px;
  padding: 20px;
}

.auth-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.error-alert {
  margin-bottom: 20px;
}

.submit-button {
  width: 100%;
  margin-top: 10px;
}

.switch-auth {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.switch-auth span {
  margin-right: 5px;
}

@media (max-width: 480px) {
  .auth-box {
    padding: 10px;
  }
}
</style>
