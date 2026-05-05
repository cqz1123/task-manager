<template>
  <el-card
    :body-style="{ padding: '20px' }"
    class="board-card"
    @click="navigateToBoard"
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
        @confirm="handleDeleteBoard"
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
</template>

<script setup lang="ts">
import { Delete, CopyDocument } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { useBoardStore } from '@/stores/board';
import type { Board } from '@/types/Board';

const props = defineProps<{
  board: Board;
}>();

const router = useRouter();
const boardStore = useBoardStore();

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const navigateToBoard = () => {
  router.push(`/board/${props.board.id}`);
};

const handleDeleteBoard = async () => {
  try {
    await boardStore.deleteBoard(props.board.id);
    ElMessage.success('看板删除成功');
  } catch (error) {
    ElMessage.error('删除看板失败');
  }
};

const copyInviteCode = async (inviteCode: string) => {
  try {
    await navigator.clipboard.writeText(inviteCode);
    ElMessage.success('邀请码已复制到剪贴板');
  } catch (error) {
    ElMessage.error('复制失败，请手动复制');
  }
};
</script>

<style scoped>
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
</style>