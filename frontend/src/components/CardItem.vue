<script setup lang="ts">
import { ref } from 'vue';
import type { Card } from '../types/Card';
import { useBoardStore } from '../stores/board';
import { Delete } from '@element-plus/icons-vue';
import { ElPopconfirm, ElButton, ElMessage } from 'element-plus';

const props = defineProps<{
  card: Card;
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
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
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
      <div class="card-actions" @click.stop>
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
      <div v-if="card.due_date" class="card-due-date">
        📅 {{ formatDate(card.due_date) }}
      </div>
      <div v-if="card.assignee" class="card-assignee">
        👤 {{ card.assignee }}
      </div>
      <div v-if="!card.assignee" class="card-assignee">
        👤 未指派
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
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
  font-size: 14px;
  font-weight: 500;
  flex: 1;
  margin-right: 8px;
}

.card-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.card-item:hover .card-actions {
  opacity: 1;
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

.card-description {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.4;
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
  font-size: 11px;
  color: #999;
}
</style>