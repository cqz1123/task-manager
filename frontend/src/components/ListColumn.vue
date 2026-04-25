<script setup lang="ts">
import { ref } from 'vue';
import type { ListWithCards } from '../types/List';
import type { CardCreateData } from '../types/Card';
import { useBoardStore } from '../stores/board';
import CardItem from './CardItem.vue';
import { ElButton, ElDialog, ElInput, ElPopconfirm, ElMessage, ElDatePicker } from 'element-plus';
import { ElInput as ElTextarea } from 'element-plus';


const props = defineProps<{
  list: ListWithCards;
}>();

const boardStore = useBoardStore();

// 添加卡片弹窗
const showAddCardDialog = ref(false);
const newCardTitle = ref('');
const newCardDescription = ref('');
const newCardDueDate = ref('');
const newCardAssigneeId = ref<number | undefined>(undefined);

const handleAddCard = async () => {
  if (!newCardTitle.value.trim()) {
    ElMessage.warning('卡片标题不能为空');
    return;
  }

  try {
    const cardData: CardCreateData = {
      listId: props.list.id,
      title: newCardTitle.value.trim(),
      description: newCardDescription.value.trim() || undefined,
      dueDate: newCardDueDate.value || undefined,
      assigneeId: newCardAssigneeId.value
    };
    
    await boardStore.createCard(cardData);
    ElMessage.success('卡片创建成功');
    
    // Reset form
    newCardTitle.value = '';
    newCardDescription.value = '';
    newCardDueDate.value = '';
    newCardAssigneeId.value = undefined;
    showAddCardDialog.value = false;
  } catch (error) {
    ElMessage.error('创建卡片失败');
  }
};

const handleDeleteList = async () => {
  try {
    await boardStore.deleteList(props.list.id);
    ElMessage.success('列表删除成功');
  } catch (error) {
    ElMessage.error('删除列表失败');
  }
};
</script>

<template>
  <div class="list-column">
    <div class="list-header">
      <h3>{{ list.title }}</h3>
      <div class="list-actions">
        <ElPopconfirm
          title="确定要删除这个列表吗？"
          @confirm="handleDeleteList"
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
    
    <div class="list-cards">
      <CardItem
        v-for="card in list.cards"
        :key="card.id"
        :card="card"
      />
    </div>
    
    <div class="list-footer">
      <ElButton
        type="primary"
        plain
        size="small"
        @click="showAddCardDialog = true"
        class="add-card-button"
      >
        + 添加卡片
      </ElButton>
    </div>
    
    <!-- Add Card Dialog -->
    <ElDialog
      v-model="showAddCardDialog"
      title="添加新卡片"
      width="400px"
    >
      <div class="dialog-form">
        <div class="form-item">
          <label>标题 *</label>
          <ElInput
            v-model="newCardTitle"
            placeholder="请输入卡片标题"
          />
        </div>
        <div class="form-item">
          <label>描述</label>
          <ElTextarea
            v-model="newCardDescription"
            placeholder="请输入卡片描述"
            :rows="3"
          />
        </div>
        <div class="form-item">
          <label>截止日期</label>
          <ElDatePicker
            v-model="newCardDueDate"
            type="date"
            placeholder="选择截止日期"
            style="width: 100%"
          />
        </div>
        <div class="form-item">
          <label>指派人</label>
          <ElInput
            v-model="newCardAssigneeId"
            type="number"
            placeholder="请输入用户ID"
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="showAddCardDialog = false">取消</ElButton>
          <ElButton type="primary" @click="handleAddCard">确定</ElButton>
        </span>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.list-column {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  margin-right: 16px;
  min-width: 280px;
  max-width: 280px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.list-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  flex: 1;
  margin-right: 8px;
}

.list-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.list-column:hover .list-actions {
  opacity: 1;
}

.delete-button {
  font-size: 12px;
  padding: 4px;
}

.list-cards {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 12px;
  max-height: 400px;
}

.list-footer {
  margin-top: auto;
}

.add-card-button {
  width: 100%;
  font-size: 12px;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-item label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Custom scrollbar for list cards */
.list-cards::-webkit-scrollbar {
  width: 4px;
}

.list-cards::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.list-cards::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.list-cards::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>