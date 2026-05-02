<template>
  <div class="boards-container">
    <!-- 导航栏 -->
    <NavBar>
      <template #left>
        <h1 class="page-title">看板管理</h1>
      </template>
    </NavBar>

    <!-- 主内容 -->
    <main class="main-content">
      <div class="boards-header">
        <h1>我的看板</h1>
        <div class="header-actions">
          <el-button type="success" @click="joinDialogVisible = true" :loading="boardStore.loading">
            <el-icon><i-ep-user-plus /></el-icon>加入看板
          </el-button>
          <el-button type="primary" @click="dialogVisible = true" :loading="boardStore.loading">
            <el-icon><i-ep-plus /></el-icon>创建新看板
          </el-button>
        </div>
      </div>

      <!-- 错误信息 -->
      <el-alert
        v-if="boardStore.error"
        :title="boardStore.error"
        type="error"
        :closable="true"
        @close="boardStore.error = null"
        show-icon
        class="error-alert"
      />

      <!-- 加载状态 -->
      <div v-if="boardStore.loading" class="loading-container">
        <el-skeleton :rows="4" animated />
      </div>

      <!-- 看板列表 -->
      <div v-else class="boards-grid">
        <div v-if="boardStore.boards.length === 0" class="empty-boards">
          <el-empty description="还没有看板" />
          <div class="empty-actions">
            <el-button type="primary" @click="dialogVisible = true">
              创建第一个看板
            </el-button>
            <el-button type="success" @click="joinDialogVisible = true">
              加入已有看板
            </el-button>
          </div>
        </div>

        <el-card
          v-for="board in boardStore.boards"
          :key="board.id"
          :body-style="{ padding: '20px' }"
          class="board-card"
          @click="navigateToBoard(board.id)"
          :style="{ borderLeft: `4px solid ${board.color}` }"
        >
          <div class="board-content">
            <div class="board-header">
              <h3 class="board-name">{{ board.name }}</h3>
              <el-tag :type="getRoleTagType(board.myRole)" class="role-tag">
                {{ getRoleLabel(board.myRole) }}
              </el-tag>
            </div>
            <div class="board-meta">
              <span class="board-date">{{ formatDate(board.created_at) }}</span>
            </div>
          </div>
          <div class="board-actions">
            <!-- 复制邀请码按钮（仅 owner 可见） -->
            <el-button
              v-if="board.myRole === 'owner' && board.invite_code"
              type="text"
              :icon="CopyDocument"
              circle
              class="copy-code-btn"
              @click.stop="copyInviteCode(board.invite_code)"
              title="复制邀请码"
            />
            <ElPopconfirm
              title="确定要删除这个看板吗？"
              @confirm="handleDeleteBoard(board.id)"
            >
              <template #reference>
                <ElButton
                  type="danger"
                  :icon="Delete"
                  circle
                  plain
                  class="delete-button"
                  @click.stop
                />
              </template>
            </ElPopconfirm>
          </div>
        </el-card>
      </div>
    </main>

    <!-- 创建看板对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="创建新看板"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="看板名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入看板名称（最多25个字）"
            maxlength="25"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="看板颜色" prop="color">
          <div class="color-picker">
            <el-radio-group v-model="form.color">
              <el-radio-button
                v-for="color in colorOptions"
                :key="color.value"
                :label="color.value"
              >
                <div class="color-dot" :style="{ backgroundColor: color.value }"></div>
              </el-radio-button>
            </el-radio-group>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleCreate"
            :loading="boardStore.loading"
          >
            创建
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 加入看板对话框 -->
    <el-dialog
      v-model="joinDialogVisible"
      title="加入看板"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="joinFormRef"
        :model="joinForm"
        :rules="joinRules"
        label-position="top"
      >
        <el-form-item label="邀请码" prop="inviteCode">
          <el-input
            v-model="joinForm.inviteCode"
            placeholder="请输入看板邀请码"
            maxlength="6"
            @input="joinForm.inviteCode = joinForm.inviteCode.toUpperCase()"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="joinDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleJoinBoard"
            :loading="boardStore.loading"
          >
            加入
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBoardStore } from '@/stores/board';
import NavBar from '@/components/NavBar.vue';
import { Delete, CopyDocument } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

const router = useRouter();
const boardStore = useBoardStore();
const dialogVisible = ref(false);
const joinDialogVisible = ref(false);
const formRef = ref<FormInstance>();
const joinFormRef = ref<FormInstance>();

// 表单数据
const form = ref({
  name: '',
  color: '#0079BF'
});

// 加入看板表单
const joinForm = ref({
  inviteCode: ''
});

// 颜色选项
const colorOptions = [
  { value: '#0079BF', label: '蓝色' },
  { value: '#61BD4F', label: '绿色' },
  { value: '#F2D600', label: '黄色' },
  { value: '#FF9F1A', label: '橙色' },
  { value: '#EB5A46', label: '红色' },
  { value: '#C377E0', label: '紫色' },
  { value: '#00C2E0', label: '青色' },
  { value: '#50E3C2', label: '薄荷绿' }
];

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入看板名称', trigger: 'blur' },
    { min: 1, max: 25, message: '看板名称长度在 1 到 25 个字符', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请选择看板颜色', trigger: 'change' }
  ]
};

// 加入看板表单验证规则
const joinRules = {
  inviteCode: [
    { required: true, message: '请输入邀请码', trigger: 'blur' },
    { min: 6, max: 6, message: '邀请码为6位字符', trigger: 'blur' }
  ]
};

// 获取角色标签类型
const getRoleTagType = (role?: string) => {
  switch (role) {
    case 'owner':
      return 'danger';
    case 'editor':
      return 'primary';
    case 'viewer':
      return 'info';
    default:
      return 'default';
  }
};

// 获取角色标签文本
const getRoleLabel = (role?: string) => {
  switch (role) {
    case 'owner':
      return '所有者';
    case 'editor':
      return '编辑者';
    case 'viewer':
      return '查看者';
    default:
      return '未知';
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// 导航到看板详情
const navigateToBoard = (boardId: number) => {
  router.push(`/board/${boardId}`);
};

// 处理删除看板
const handleDeleteBoard = async (boardId: number) => {
  try {
    await boardStore.deleteBoard(boardId);
    ElMessage.success('看板删除成功');
  } catch (error) {
    ElMessage.error('删除看板失败');
  }
};

// 处理创建看板
const handleCreate = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      await boardStore.createBoard({
        name: form.value.name,
        color: form.value.color
      });
      dialogVisible.value = false;
      form.value = {
        name: '',
        color: '#0079BF'
      };
      formRef.value?.resetFields();
      ElMessage.success('看板创建成功');
    } catch (error) {
      ElMessage.error('创建看板失败');
    }
  });
};

// 处理加入看板
const handleJoinBoard = async () => {
  if (!joinFormRef.value) return;

  await joinFormRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      // 自动转换邀请码为大写并去除空格
      const formattedInviteCode = joinForm.value.inviteCode.trim().toUpperCase();
      await boardStore.joinBoardByCode(formattedInviteCode);
      joinDialogVisible.value = false;
      joinForm.value = {
        inviteCode: ''
      };
      joinFormRef.value?.resetFields();
      ElMessage.success('加入看板成功');
    } catch (error: any) {
      ElMessage.error(error.response?.data?.error || '加入看板失败');
    }
  });
};

// 复制邀请码
const copyInviteCode = async (inviteCode: string) => {
  try {
    await navigator.clipboard.writeText(inviteCode);
    ElMessage.success('邀请码已复制到剪贴板');
  } catch (error) {
    ElMessage.error('复制失败，请手动复制');
  }
};

// 页面加载时获取看板列表
onMounted(() => {
  boardStore.fetchBoards();
});
</script>

<style scoped>
.boards-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.main-content {
  flex: 1;
  padding: 30px 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.boards-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.boards-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.error-alert {
  margin-bottom: 20px;
}

.loading-container {
  margin: 40px 0;
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.empty-boards {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.empty-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.board-card {
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  max-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.board-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.board-content {
  flex: 1;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.board-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #333;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  line-height: 1.4;
  flex: 1;
}

.role-tag {
  flex-shrink: 0;
}

.board-meta {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.board-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.copy-code-btn {
  font-size: 12px;
  padding: 4px;
  color: #67c23a !important;
}

.copy-code-btn:hover {
  background-color: #f0f9eb !important;
}

.delete-button {
  font-size: 12px;
  padding: 4px;
  color: #f56c6c !important;
  border-color: #f56c6c !important;
  background-color: transparent !important;
}

.delete-button:hover {
  color: #fff !important;
  background-color: #f56c6c !important;
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-block;
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px 16px;
  }
  
  .boards-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .boards-grid {
    grid-template-columns: 1fr;
  }
  
  .empty-actions {
    flex-direction: column;
  }
}
</style>
