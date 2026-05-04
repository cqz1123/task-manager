<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useBoardStore } from '../stores/board';
import { useMemberStore } from '../stores/member';
import { Delete, CopyDocument, Refresh } from '@element-plus/icons-vue';
import { ElDialog, ElTable, ElTableColumn, ElButton, ElPopconfirm, ElMessage, ElTag, ElInput } from 'element-plus';

const props = defineProps<{
  modelValue: boolean;
  boardId: number;
  boardName: string;
  inviteCode: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'invite-code-updated', newCode: string): void;
}>();

const boardStore = useBoardStore();
const memberStore = useMemberStore();

// 复制状态
const copied = ref(false);

// 邀请码显示状态
const showInviteCode = ref(false);

// 获取成员列表
const members = computed(() => memberStore.members);

// 获取角色标签类型
const getRoleTagType = (role: string) => {
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
const getRoleLabel = (role: string) => {
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

// 修改成员角色
const handleUpdateRole = async (member: any, newRole: 'editor' | 'viewer') => {
  if (member.role === 'owner') {
    ElMessage.warning('无法修改所有者的角色');
    return;
  }

  try {
    await memberStore.updateMemberRole(props.boardId, member.userId, newRole);
    ElMessage.success('角色修改成功');
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '修改角色失败');
  }
};

// 移除成员
const handleRemoveMember = async (member: any) => {
  if (member.role === 'owner') {
    ElMessage.warning('无法移除所有者');
    return;
  }

  try {
    await memberStore.removeMember(props.boardId, member.userId);
    ElMessage.success('成员移除成功');
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '移除成员失败');
  }
};

// 复制邀请码
const copyInviteCode = async () => {
  if (!props.inviteCode) {
    ElMessage.warning('暂无邀请码');
    return;
  }

  try {
    await navigator.clipboard.writeText(props.inviteCode);
    copied.value = true;
    ElMessage.success('邀请码已复制到剪贴板');
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    ElMessage.error('复制失败，请手动复制');
  }
};

// 刷新成员列表
const refreshMembers = async () => {
  try {
    await memberStore.fetchMembers(props.boardId);
    ElMessage.success('成员列表已刷新');
  } catch (error) {
    ElMessage.error('刷新成员列表失败');
  }
};

// 重新生成邀请码
const regenerateInviteCode = async () => {
  try {
    const response = await boardStore.regenerateInviteCode(props.boardId);
    emit('invite-code-updated', response.inviteCode);
    showInviteCode.value = true;
    ElMessage.success('邀请码已重新生成');
  } catch (error: any) {
    ElMessage.error(error.error || '重新生成邀请码失败');
  }
};

// 关闭弹窗
const handleClose = () => {
  emit('update:modelValue', false);
};

// 监听弹窗打开
watch(() => props.modelValue, (val) => {
  if (val) {
    showInviteCode.value = false;
  }
});
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    :title="`成员管理 - ${boardName}`"
    width="600px"
    @close="handleClose"
  >
    <!-- 邀请码区域 -->
    <div class="invite-code-section">
      <div class="section-title">
        <span>邀请码</span>
        <ElButton
          type="text"
          icon="RefreshCw"
          size="small"
          @click="regenerateInviteCode"
          title="重新生成邀请码"
        />
      </div>
      <div class="invite-code-content">
        <ElInput
          :value="showInviteCode ? inviteCode : '******'"
          disabled
          class="invite-code-input"
          placeholder="暂无邀请码"
        />
        <div class="invite-code-actions">
          <ElButton
            v-if="!showInviteCode"
            type="text"
            size="small"
            @click="showInviteCode = true"
          >
            显示邀请码
          </ElButton>
          <ElButton
            v-else
            type="text"
            size="small"
            @click="showInviteCode = false"
          >
            隐藏邀请码
          </ElButton>
          <ElButton
            type="text"
            size="small"
            :icon="copied ? 'Check' : 'CopyDocument'"
            :class="{ 'copied': copied }"
            @click="copyInviteCode"
          >
            {{ copied ? '已复制' : '复制' }}
          </ElButton>
        </div>
      </div>
      <p class="invite-hint">分享此邀请码给其他用户，他们可以使用邀请码加入此看板</p>
    </div>

    <!-- 成员列表区域 -->
    <div class="members-section">
      <div class="section-title">
        <span>成员列表</span>
        <span class="member-count">共 {{ members.length }} 人</span>
      </div>
      <ElTable
        :data="members"
        border
        class="members-table"
      >
        <ElTableColumn
          prop="userName"
          label="成员名称"
          min-width="150"
        />
        <ElTableColumn
          prop="email"
          label="邮箱"
          min-width="200"
        />
        <ElTableColumn
          label="角色"
          width="120"
        >
          <template #default="scope">
            <div v-if="scope.row.role === 'owner'" class="role-cell">
              <ElTag type="danger">所有者</ElTag>
            </div>
            <div v-else class="role-cell">
              <ElSelect
                :model-value="scope.row.role"
                size="small"
                class="role-select"
                @change="(val: 'editor' | 'viewer') => handleUpdateRole(scope.row, val)"
              >
                <ElOption label="编辑者" value="editor" />
                <ElOption label="查看者" value="viewer" />
              </ElSelect>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn
          label="操作"
          width="80"
        >
          <template #default="scope">
            <ElPopconfirm
              v-if="scope.row.role !== 'owner'"
              title="确定要移除该成员吗？"
              @confirm="handleRemoveMember(scope.row)"
            >
              <template #reference>
                <ElButton
                  type="danger"
                  text
                  size="small"
                  icon="Delete"
                >
                  移除
                </ElButton>
              </template>
            </ElPopconfirm>
            <span v-else class="owner-tag">所有者</span>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="handleClose">关闭</ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<style scoped>
.invite-code-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.member-count {
  font-weight: normal;
  color: #999;
  font-size: 12px;
}

.invite-code-content {
  display: flex;
  gap: 12px;
  align-items: center;
}

.invite-code-input {
  flex: 1;
  font-family: monospace;
  font-size: 14px;
}

.invite-code-actions {
  display: flex;
  gap: 8px;
}

.invite-hint {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #999;
}

.members-section {
  margin-top: 16px;
}

.members-table {
  margin-top: 8px;
}

.role-cell {
  display: flex;
  align-items: center;
}

.role-select {
  width: 100px;
}

.owner-tag {
  font-size: 12px;
  color: #999;
}

.copied {
  color: #67c23a !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
