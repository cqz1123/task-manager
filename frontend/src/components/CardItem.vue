<script setup lang="ts">
import { ref } from 'vue';
import type { Card } from '../types/Card';
import { useBoardStore } from '../stores/board';
import { Delete } from '@element-plus/icons-vue';
import { ElPopconfirm, ElButton, ElMessage } from 'element-plus';

const props = defineProps<{
  card: Card;
  canEdit?: boolean;
}>();

const emit = defineEmits<{
  (e: 'card-click', card: Card): void;
}>();

const boardStore = useBoardStore();

const handleDelete = async () => {
  try {
    await boardStore.deleteCard(props.card.id);
    ElMessage.success('卡片删除成功');
  } catch (error) {
    ElMessage.error('删除卡片失败');
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
  <div class="card-item" @click="handleCardClick" :data-card-id="card.id">
    <div class="card-header">
      <h4>{{ card.title }}</h4>
      <div v-if="canEdit" class="card-actions" @click.stop>
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