<script setup lang="ts">
import { ref } from 'vue';
import type { Card } from '../types/Card';
import { useBoardStore } from '../stores/board';
import * as cardApi from '../api/card';
import { Delete, Check, RefreshLeft } from '@element-plus/icons-vue';
import { ElPopconfirm, ElButton, ElMessage } from 'element-plus';

const props = defineProps<{
  card: Card;
  canEdit?: boolean;
  isCompletedList?: boolean;
  boardId?: number;
}>();

const emit = defineEmits<{
  (e: 'card-click', card: Card): void;
  (e: 'card-completed', cardId: number): void;
  (e: 'card-uncompleted', cardId: number): void;
}>();

const boardStore = useBoardStore();
const loading = ref(false);

const handleDelete = async () => {
  try {
    await boardStore.deleteCard(props.card.id);
    ElMessage.success('卡片删除成功');
  } catch (error) {
    ElMessage.error('删除卡片失败');
  }
};

const handleComplete = async () => {
  if (!props.boardId || loading.value) return;
  
  loading.value = true;
  try {
    await cardApi.completeCard(props.boardId, props.card.id);
    ElMessage.success('卡片已完成');
    emit('card-completed', props.card.id);
  } catch (error) {
    ElMessage.error('完成卡片失败');
  } finally {
    loading.value = false;
  }
};

const handleUncomplete = async () => {
  if (!props.boardId || loading.value) return;
  
  loading.value = true;
  try {
    await cardApi.uncompleteCard(props.boardId, props.card.id);
    ElMessage.success('已撤销完成');
    emit('card-uncompleted', props.card.id);
  } catch (error) {
    ElMessage.error('撤销完成失败');
  } finally {
    loading.value = false;
  }
};

const handleCardClick = () => {
  emit('card-click', props.card);
};

const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return '无截止日期';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
};

const truncateText = (text: string | undefined | null, maxLength: number = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
</script>

<template>
  <div class="card-item" :class="{ 'completed-card': isCompletedList }" @click="handleCardClick" :data-card-id="card.id">
    <div class="card-header">
      <h4>{{ card.title }}</h4>
      <div v-if="canEdit" class="card-actions" @click.stop>
        <!-- 完成按钮 -->
        <ElButton
          v-if="!isCompletedList"
          type="success"
          :icon="Check"
          circle
          plain
          class="complete-button"
          :loading="loading"
          @click="handleComplete"
          title="完成卡片"
        />
        
        <!-- 撤销完成按钮 -->
        <ElButton
          v-if="isCompletedList"
          type="primary"
          :icon="RefreshLeft"
          circle
          plain
          class="uncomplete-button"
          :loading="loading"
          @click="handleUncomplete"
          title="撤销完成"
        />
        
        <ElPopconfirm
          title="确定要删除这张卡片吗？"
          @confirm="handleDelete"
        >
          <template #reference>
            <ElButton
              type="danger"
              :icon="Delete"
              circle
              plain
              class="delete-button"
            />
          </template>
        </ElPopconfirm>
      </div>
    </div>

    <div v-if="card.description" class="card-description">
      {{ truncateText(card.description, 50) }}
    </div>

    <div class="card-meta">
      <div class="card-due-date">
        📅 截止日期：{{ formatDate(card.due_date) }}
      </div>
      <div class="card-assignee">
        👤 执行人：{{ card.assignee || '未指派' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-item {
  background: white;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.card-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  flex: 1;
  margin-right: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
}

.card-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.card-item:hover .card-actions {
  opacity: 1;
}

.complete-button {
  font-size: 14px;
  padding: 6px;
  color: #67c23a !important;
  border-color: #67c23a !important;
  background-color: transparent !important;
}

.complete-button:hover {
  color: #fff !important;
  background-color: #67c23a !important;
}

.uncomplete-button {
  font-size: 14px;
  padding: 6px;
  color: #409eff !important;
  border-color: #409eff !important;
  background-color: transparent !important;
}

.uncomplete-button:hover {
  color: #fff !important;
  background-color: #409eff !important;
}

.delete-button {
  font-size: 14px;
  padding: 6px;
  color: #f56c6c !important;
  border-color: #f56c6c !important;
  background-color: transparent !important;
}

.delete-button:hover {
  color: #fff !important;
  background-color: #f56c6c !important;
}

.completed-card {
  background: #f0f9ff !important;
  border: 1px solid #b3d9e8 !important;
  opacity: 0.85;
}

.completed-card h4 {
  text-decoration: line-through;
  color: #888;
}

.completed-card .card-description {
  color: #888;
}

.card-description {
  font-size: 13px;
  color: #555;
  margin-bottom: 10px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
}

.card-due-date,
.card-assignee {
  font-size: 12px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style>