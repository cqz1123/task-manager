<script setup lang="ts">
import type { Card } from '../types/Card';
import { useBoardStore } from '../stores/board';
import { ElPopconfirm, ElButton, ElMessage } from 'element-plus';

const props = defineProps<{
  card: Card;
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
</script>

<template>
  <div class="card-item">
    <div class="card-header">
      <h4>{{ card.title }}</h4>
      <div class="card-actions">
        <ElPopconfirm
          title="确定要删除这张卡片吗？"
          @confirm="handleDelete"
        >
          <template #reference>
            <ElButton
              type="danger"
              size="small"
              circle
              icon="Delete"
              class="delete-button"
            />
          </template>
        </ElPopconfirm>
      </div>
    </div>
    <div v-if="card.description" class="card-description">
      {{ card.description }}
    </div>
    <div v-if="card.due_date" class="card-due-date">
      截止日期: {{ new Date(card.due_date).toLocaleDateString() }}
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
}

.card-description {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.4;
}

.card-due-date {
  font-size: 11px;
  color: #999;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
}
</style>