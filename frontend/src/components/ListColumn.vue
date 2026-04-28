<script setup lang="ts">
import { ref } from 'vue';
import type { ListWithCards } from '../types/List';
import type { Card, CardCreateData } from '../types/Card';
import { Delete } from '@element-plus/icons-vue';
import { useBoardStore } from '../stores/board';
import CardItem from './CardItem.vue';
import { ElButton, ElDialog, ElInput, ElPopconfirm, ElMessage, ElDatePicker } from 'element-plus';
import { ElInput as ElTextarea } from 'element-plus';
import draggable from 'vuedraggable';


const props = defineProps<{
  list: ListWithCards;
}>();

const emit = defineEmits<{
  (e: 'card-click', card: Card): void;
  (e: 'drag-end', event: any): void;
}>();

const boardStore = useBoardStore();

// 列表标题编辑状态
const isEditingTitle = ref(false);
const editingTitle = ref('');
const originalTitle = ref('');

// 添加卡片弹窗
const showAddCardDialog = ref(false);
const newCardTitle = ref('');
const newCardDescription = ref('');
const newCardDueDate = ref('');
const newCardAssignee = ref<string>('');

// 开始编辑标题
const startEditTitle = () => {
  originalTitle.value = props.list.title;
  editingTitle.value = props.list.title;
  isEditingTitle.value = true;
};

// 保存标题
const saveTitle = async () => {
  if (!editingTitle.value.trim()) {
    ElMessage.warning('列表标题不能为空');
    return;
  }

  if (editingTitle.value.trim() === originalTitle.value) {
    isEditingTitle.value = false;
    return;
  }

  try {
    await boardStore.updateList(props.list.id, editingTitle.value.trim());
    ElMessage.success('列表标题修改成功');
    isEditingTitle.value = false;
  } catch (error) {
    editingTitle.value = originalTitle.value;
    ElMessage.error('修改列表标题失败');
  }
};

// 取消编辑
const cancelEditTitle = () => {
  editingTitle.value = originalTitle.value;
  isEditingTitle.value = false;
};

// 处理回车键
const handleTitleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    saveTitle();
  } else if (event.key === 'Escape') {
    cancelEditTitle();
  }
};

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
      assignee: newCardAssignee.value.trim() || undefined
    };

    await boardStore.createCard(cardData);
    ElMessage.success('卡片创建成功');

    // Reset form
    newCardTitle.value = '';
    newCardDescription.value = '';
    newCardDueDate.value = '';
    newCardAssignee.value = '';
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
  <div class="list-column" :data-list-id="list.id">
    <div class="list-header">
      <div class="list-title-wrapper">
        <h3
          v-if="!isEditingTitle"
          class="list-title"
          @click="startEditTitle"
          title="点击修改标题"
        >
          {{ list.title }}
        </h3>
        <ElInput
          v-else
          v-model="editingTitle"
          size="small"
          class="title-input"
          @keydown="handleTitleKeydown as any"
          @blur="saveTitle"
          ref="titleInputRef"
          autofocus
        />
      </div>
      <div class="list-actions">
        <ElPopconfirm
          title="确定要删除这个列表吗？"
          @confirm="handleDeleteList"
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

    <div class="list-cards">
      <draggable
        v-model="list.cards"
        group="cards"
        item-key="id"
        :sort="true"
        class="drag-area"
        ghost-class="ghost-card"
        chosen-class="chosen-card"
        @end="$emit('drag-end', $event)"
      >
        <template #item="{ element: card }">
          <CardItem
            :card="card"
            @card-click="(card) => emit('card-click', card)"
          />
        </template>
      </draggable>
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
            v-model="newCardAssignee"
            placeholder="请输入指派人姓名"
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

.list-title-wrapper {
  flex: 1;
  margin-right: 8px;
}

.list-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.list-title:hover {
  background-color: #e0e0e0;
}

.title-input {
  width: 100%;
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
  color: #f56c6c !important;
  border-color: #f56c6c !important;
  background-color: transparent !important;
}

.delete-button:hover {
  color: #fff !important;
  background-color: #f56c6c !important;
}

.list-header:hover .delete-button {
  opacity: 1;
}

.list-cards {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 12px;
  max-height: 400px;
  padding: 8px;
  transition: all 0.2s ease;
}

.list-cards:hover {
  background-color: rgba(0, 0, 0, 0.01);
}

.drag-area {
  min-height: 50px;
  width: 100%;
  transition: all 0.2s ease;
}

.drag-area:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* 拖拽时的样式 */
.ghost-card {
  opacity: 0.5;
  background: #c8ebfb;
  border: 1px dashed #409eff;
}

.chosen-card {
  opacity: 0.8;
  transform: scale(1.02);
  transition: all 0.2s ease;
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