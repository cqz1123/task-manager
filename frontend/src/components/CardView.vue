<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Card } from '../types/Card';
import { ElDialog, ElButton, ElMessage } from 'element-plus';
import { CopyDocument, Check } from '@element-plus/icons-vue';

const props = defineProps<{
  modelValue: boolean;
  card: Card | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const copiedFields = ref<Record<string, boolean>>({});

watch(() => props.card, () => {
  copiedFields.value = {};
});

const handleClose = () => {
  emit('update:modelValue', false);
};

const copyToClipboard = async (field: string, value: string) => {
  if (!value) {
    ElMessage.warning('没有可复制的内容');
    return;
  }
  
  try {
    await navigator.clipboard.writeText(value);
    copiedFields.value[field] = true;
    ElMessage.success('复制成功');
    
    setTimeout(() => {
      copiedFields.value[field] = false;
    }, 2000);
  } catch (error) {
    ElMessage.error('复制失败');
  }
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '未设置';
  return dateStr.split('T')[0];
};
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    title="卡片详情"
    width="480px"
    @close="handleClose"
  >
    <div class="card-detail">
      <!-- 标题区域 -->
      <div class="detail-section">
        <div class="detail-label">标题</div>
        <div class="detail-content">
          <span class="content-text">{{ card?.title || '无标题' }}</span>
          <ElButton
            type="text"
            size="small"
            class="copy-btn"
            @click="copyToClipboard('title', card?.title || '')"
          >
            <Check v-if="copiedFields.title" class="copied-icon" />
            <CopyDocument v-else class="copy-icon" />
          </ElButton>
        </div>
      </div>

      <!-- 描述区域 -->
      <div class="detail-section">
        <div class="detail-label">描述</div>
        <div class="detail-content">
          <span class="content-text">{{ card?.description || '无描述' }}</span>
          <ElButton
            type="text"
            size="small"
            class="copy-btn"
            @click="copyToClipboard('description', card?.description || '')"
          >
            <Check v-if="copiedFields.description" class="copied-icon" />
            <CopyDocument v-else class="copy-icon" />
          </ElButton>
        </div>
      </div>

      <!-- 截止日期区域 -->
      <div class="detail-section">
        <div class="detail-label">截止日期</div>
        <div class="detail-content">
          <span class="content-text">{{ formatDate(card?.due_date) }}</span>
          <ElButton
            type="text"
            size="small"
            class="copy-btn"
            @click="copyToClipboard('dueDate', card?.due_date || '')"
          >
            <Check v-if="copiedFields.dueDate" class="copied-icon" />
            <CopyDocument v-else class="copy-icon" />
          </ElButton>
        </div>
      </div>

      <!-- 执行人区域 -->
      <div class="detail-section">
        <div class="detail-label">执行人</div>
        <div class="detail-content">
          <span class="content-text">{{ card?.assignee || '未指派' }}</span>
          <ElButton
            type="text"
            size="small"
            class="copy-btn"
            @click="copyToClipboard('assignee', card?.assignee || '')"
          >
            <Check v-if="copiedFields.assignee" class="copied-icon" />
            <CopyDocument v-else class="copy-icon" />
          </ElButton>
        </div>
      </div>

    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton type="primary" @click="handleClose">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<style scoped>
.card-detail {
  padding: 16px 0;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-label {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.detail-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  min-height: 44px;
}

.content-text {
  flex: 1;
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
  word-break: break-all;
}

.copy-btn {
  padding: 6px;
  color: #409eff;
  transition: all 0.2s;
}

.copy-btn:hover {
  color: #66b1ff;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
}

.copy-icon,
.copied-icon {
  font-size: 16px;
}

.copied-icon {
  color: #67c23a;
}

.extra-info {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 13px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #909399;
  min-width: 60px;
}

.info-value {
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:deep(.el-dialog__title) {
  color: #ffffff;
  font-weight: 600;
}

:deep(.el-dialog__close) {
  color: rgba(255, 255, 255, 0.8);
}

:deep(.el-dialog__close:hover) {
  color: #ffffff;
}

:deep(.el-button--primary) {
  background: #409eff;
  border: none;
}

:deep(.el-button--primary:hover) {
  background: #66b1ff;
}
</style>
