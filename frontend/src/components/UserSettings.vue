<script setup lang="ts">import { ref, watch } from 'vue';
import { useUserStore } from '../stores/user';
import { updateProfile, updatePassword } from '../api/user';
import { ElDialog, ElTabs, ElTabPane, ElForm, ElFormItem, ElInput, ElButton, ElMessage } from 'element-plus';
const props = defineProps<{
 modelValue: boolean;
}>();
const emit = defineEmits<{
 (e: 'update:modelValue', value: boolean): void;
 (e: 'profile-updated'): void;
 (e: 'password-updated'): void;
}>();
const userStore = useUserStore();
// 当前激活的选项卡
const activeTab = ref('username');

// 用户名表单
const usernameForm = ref({
 username: userStore.user?.username || ''
});
// 密码表单
const passwordForm = ref({
 oldPassword: '',
 newPassword: '',
 confirmPassword: ''
});
// 表单验证规则
const validatePassword = (rule: any, value: string, callback: any) => {
 if (value.length < 6) {
 callback(new Error('密码长度至少为6个字符'));
 }
 else {
 callback();
 }
};
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
 if (value !== passwordForm.value.newPassword) {
 callback(new Error('两次输入的密码不一致'));
 }
 else {
 callback();
 }
};
const passwordRules = [
 { validator: validatePassword, trigger: 'blur' }
];
const confirmPasswordRules = [
 { validator: validateConfirmPassword, trigger: 'blur' }
];
// 监听弹窗关闭
watch(() => props.modelValue, (newVal) => {
 if (newVal) {
 // 弹窗打开时重置表单
 usernameForm.value = {
 username: userStore.user?.username || ''
 };
 passwordForm.value = {
 oldPassword: '',
 newPassword: '',
 confirmPassword: ''
 };
 }
});
// 关闭弹窗
const handleClose = () => {
 emit('update:modelValue', false);
};
// 保存用户名
const handleSaveUsername = async () => {
 if (!usernameForm.value.username.trim()) {
 ElMessage.warning('用户名不能为空');
 return;
 }
 if (usernameForm.value.username === userStore.user?.username) {
 ElMessage.warning('用户名没有变化');
 return;
 }
 try {
 const response = await updateProfile({ username: usernameForm.value.username.trim() });
 if (response.data.success) {
 // 更新 store 中的用户信息
 userStore.user = response.data.user;
 localStorage.setItem('user', JSON.stringify(response.data.user));
 ElMessage.success('用户名修改成功');
 emit('profile-updated');
 }
 }
 catch (error: any) {
 const errorMessage = error.error || '修改用户名失败';
 ElMessage.error(errorMessage);
 }
};
// 保存密码
const handleSavePassword = async () => {
 if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
 ElMessage.warning('请填写完整信息');
 return;
 }
 if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
 ElMessage.warning('两次输入的密码不一致');
 return;
 }
 try {
 const response = await updatePassword({
 oldPassword: passwordForm.value.oldPassword,
 newPassword: passwordForm.value.newPassword
 });
 if (response.data.success) {
 ElMessage.success('密码修改成功，请重新登录');
 // 清空表单
 passwordForm.value = {
 oldPassword: '',
 newPassword: '',
 confirmPassword: ''
 };
 emit('password-updated');
 // 关闭弹窗
 handleClose();
 // 提示用户重新登录（可选：自动退出）
 // userStore.logout();
 // router.push('/auth');
 }
 }
 catch (error: any) {
 const errorMessage = error.error || '修改密码失败';
 ElMessage.error(errorMessage);
 }
};
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    title="个人设置"
    width="500px"
    @close="handleClose"
  >
    <ElTabs v-model="activeTab" type="card">

      <!-- 修改用户名 -->
      <ElTabPane label="修改用户名" name="username">
        <ElForm :model="usernameForm" label-width="100px" class="settings-form">
          <ElFormItem label="用户名">
            <ElInput
              v-model="usernameForm.username"
              placeholder="请输入新用户名"
              :maxlength="30"
              show-word-limit
            />
          </ElFormItem>
        </ElForm>
        
        <div class="form-actions">
          <ElButton type="primary" @click="handleSaveUsername">保存</ElButton>
        </div>
      </ElTabPane>
      
      <!-- 修改密码 -->
      <ElTabPane label="修改密码" name="password">
        <ElForm :model="passwordForm" label-width="100px" class="settings-form">
          <ElFormItem label="旧密码">
            <ElInput
              v-model="passwordForm.oldPassword"
              type="password"
              placeholder="请输入旧密码"
            />
          </ElFormItem>
          <ElFormItem label="新密码">
            <ElInput
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="请输入新密码（至少6个字符）"
              :rules="passwordRules"
            />
          </ElFormItem>
          <ElFormItem label="确认新密码">
            <ElInput
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              :rules="confirmPasswordRules"
            />
          </ElFormItem>
        </ElForm>
        
        <div class="form-actions">
          <ElButton type="primary" @click="handleSavePassword">保存</ElButton>
        </div>
      </ElTabPane>
    </ElTabs>
    
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<style scoped>
.settings-form {
  padding: 16px 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
