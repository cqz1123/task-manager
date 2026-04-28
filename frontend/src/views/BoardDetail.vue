<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBoardStore } from '../stores/board';
import type { Card } from '../types/Card';
import NavBar from '../components/NavBar.vue';
import ListColumn from '../components/ListColumn.vue';
import CardModal from '../components/CardModal.vue';
import { ElButton, ElDialog, ElInput, ElMessage, ElLoading } from 'element-plus';

const route = useRoute();
const router = useRouter();
const boardStore = useBoardStore();

const boardId = ref<number>(0);
const loading = ref(false);
const showAddListDialog = ref(false);
const newListTitle = ref('');

// 看板名称编辑状态
const isEditingBoardName = ref(false);
const editingBoardName = ref('');
const originalBoardName = ref('');

// 卡片编辑状态
const showCardModal = ref(false);
const selectedCard = ref<Card | null>(null);

onMounted(async () => {
  const id = route.params.id;
  if (typeof id === 'string') {
    boardId.value = parseInt(id);
    await fetchBoardData();
  }
});

onBeforeUnmount(() => {
  boardStore.resetState();
});

const fetchBoardData = async () => {
  loading.value = true;
  try {
    await boardStore.fetchBoardDetail(boardId.value);
  } catch (error) {
    ElMessage.error('获取看板详情失败');
    router.push('/boards');
  } finally {
    loading.value = false;
  }
};

// 开始编辑看板名称
const startEditBoardName = () => {
  if (!boardStore.currentBoard) return;
  originalBoardName.value = boardStore.currentBoard.name;
  editingBoardName.value = boardStore.currentBoard.name;
  isEditingBoardName.value = true;
};

// 保存看板名称
const saveBoardName = async () => {
  if (!editingBoardName.value.trim()) {
    ElMessage.warning('看板名称不能为空');
    return;
  }

  if (editingBoardName.value.trim() === originalBoardName.value) {
    isEditingBoardName.value = false;
    return;
  }

  try {
    await boardStore.updateBoard(boardId.value, { name: editingBoardName.value.trim() });
    ElMessage.success('看板名称修改成功');
    isEditingBoardName.value = false;
  } catch (error) {
    editingBoardName.value = originalBoardName.value;
    ElMessage.error('修改看板名称失败');
  }
};

// 取消编辑
const cancelEditBoardName = () => {
  editingBoardName.value = originalBoardName.value;
  isEditingBoardName.value = false;
};

// 处理回车键
const handleBoardNameKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    saveBoardName();
  } else if (event.key === 'Escape') {
    cancelEditBoardName();
  }
};

const handleAddList = async () => {
  if (!newListTitle.value.trim()) {
    ElMessage.warning('列表标题不能为空');
    return;
  }

  try {
    await boardStore.createList(boardId.value, newListTitle.value.trim());
    ElMessage.success('列表创建成功');
    newListTitle.value = '';
    showAddListDialog.value = false;
  } catch (error) {
    ElMessage.error('创建列表失败');
  }
};

const goBack = () => {
  router.push('/boards');
};

// 处理卡片点击
const handleCardClick = (card: Card) => {
  selectedCard.value = card;
  showCardModal.value = true;
};

// 处理卡片更新
const handleCardUpdated = () => {
  // 卡片更新成功后可以做一些操作
};

// 关闭卡片弹窗
const handleCardModalClose = () => {
  showCardModal.value = false;
  selectedCard.value = null;
};

// 处理拖拽结束事件
  const handleDragEnd = async (evt: any) => {
    console.log('开始处理拖拽结束事件:', evt);
    
    // 从事件对象中获取拖拽信息
    const fromElement = evt.from as HTMLElement;
    const toElement = evt.to as HTMLElement;
    const oldIndex = evt.oldIndex as number;
    const newIndex = evt.newIndex as number;
    const item = evt.item as HTMLElement;

    console.log('拖拽元素信息:', {
      fromElement: fromElement ? fromElement.outerHTML : 'null',
      toElement: toElement ? toElement.outerHTML : 'null',
      oldIndex,
      newIndex,
      item: item ? item.outerHTML : 'null'
    });

    // 获取源列表和目标列表的 ID（使用 closest 查找包含 data-list-id 的元素）
    const fromListElement = fromElement ? fromElement.closest('[data-list-id]') as HTMLElement : null;
    const toListElement = toElement ? toElement.closest('[data-list-id]') as HTMLElement : null;
    const sourceListId = fromListElement ? parseInt(fromListElement.dataset.listId!) : null;
    const targetListId = toListElement ? parseInt(toListElement.dataset.listId!) : null;

    console.log('列表信息:', {
      fromListElement: fromListElement ? fromListElement.outerHTML : 'null',
      toListElement: toListElement ? toListElement.outerHTML : 'null',
      sourceListId,
      targetListId
    });

    // 获取被拖拽的卡片 ID
    const cardId = item ? (item.dataset.cardId ? parseInt(item.dataset.cardId) : null) : null;

    console.log('卡片信息:', {
      cardId,
      itemDataset: item ? item.dataset : 'null'
    });

    // 验证数据有效性
    if (!sourceListId || !targetListId || !cardId) {
      console.error('拖拽事件数据不完整:', { sourceListId, targetListId, cardId });
      ElMessage.error('拖拽数据不完整，请重试');
      return;
    }

    // 如果位置没有变化，不需要处理
    if (sourceListId === targetListId && oldIndex === newIndex) {
      console.log('位置没有变化，不需要处理');
      return;
    }

    try {
      console.log('调用 store 中的 moveCard 方法:', { cardId, sourceListId, targetListId, newIndex });
      // 调用 store 中的 moveCard 方法
      await boardStore.moveCard({
        cardId,
        sourceListId,
        targetListId,
        newIndex
      });
      console.log('移动卡片成功');
    } catch (error: any) {
      // 失败时会自动回滚，store 中已有错误处理
      console.error('移动卡片失败:', error);
      ElMessage.error('移动卡片失败，已恢复原位置');
    }
  };
</script>

<template>
  <div class="board-detail">
    <!-- Navigation Bar -->
    <NavBar>
      <template #left>
        <div class="navbar-content">
          <ElButton
            type="primary"
            plain
            size="small"
            @click="goBack"
            class="back-button"
          >
            ← 我的看板
          </ElButton>
          <div class="board-title-wrapper">
            <h2
              v-if="!isEditingBoardName"
              class="board-title"
              @click="startEditBoardName"
              title="点击修改看板名称"
            >
              {{ boardStore.currentBoard?.name || '看板详情' }}
            </h2>
            <ElInput
              v-else
              v-model="editingBoardName"
              size="default"
              class="board-name-input"
              @keydown="(evt: Event | KeyboardEvent) => handleBoardNameKeydown(evt as KeyboardEvent)"
              @blur="saveBoardName"
              autofocus
            />
          </div>
        </div>
      </template>
    </NavBar>

    <!-- Main Content -->
    <div class="main-content">
      <div v-if="loading" class="loading-overlay">
        <ElLoading
          v-model="loading"
          text="加载中..."
          fullscreen
        />
      </div>

      <div v-else class="lists-container">
        <!-- Existing Lists -->
        <ListColumn
          v-for="list in boardStore.lists"
          :key="list.id"
          :list="list"
          @card-click="handleCardClick"
          @drag-end="handleDragEnd"
        />

        <!-- Add List Button -->
        <div class="add-list-column">
          <ElButton
            type="primary"
            @click="showAddListDialog = true"
            class="add-list-button"
          >
            + 添加列表
          </ElButton>
        </div>
      </div>
    </div>

    <!-- Add List Dialog -->
    <ElDialog
      v-model="showAddListDialog"
      title="添加新列表"
      width="400px"
    >
      <div class="dialog-form">
        <div class="form-item">
          <label>列表名称 *</label>
          <ElInput
            v-model="newListTitle"
            placeholder="请输入列表名称"
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="showAddListDialog = false">取消</ElButton>
          <ElButton type="primary" @click="handleAddList">确定</ElButton>
        </span>
      </template>
    </ElDialog>

    <!-- Card Edit Modal -->
    <CardModal
      v-model="showCardModal"
      :card="selectedCard"
      @card-updated="handleCardUpdated"
      @close="handleCardModalClose"
    />
  </div>
</template>

<style scoped>
.board-detail {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
}

/* Navigation bar styles */
.navbar-content {
  display: flex;
  align-items: center;
  height: 60px;
  line-height: 60px;
}

.back-button {
  background-color: #0079BF !important;
  border-color: #0079BF !important;
  color: white !important;
}

.back-button:hover {
  background-color: #006ba6 !important;
  border-color: #006ba6 !important;
}

.board-title-wrapper {
  margin-left: 16px;
}

.board-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.board-title:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.board-name-input {
  width: 200px;
}

.board-name-input :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.2);
  box-shadow: none;
  border: none;
}

.board-name-input :deep(.el-input__inner) {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow: hidden;
}

.lists-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
  height: 100%;
  min-height: 600px;
}

.add-list-column {
  min-width: 280px;
  display: flex;
  align-items: flex-start;
  padding-top: 12px;
}

.add-list-button {
  width: 100%;
  font-size: 14px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
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

/* Custom scrollbar for lists container */
.lists-container::-webkit-scrollbar {
  height: 8px;
}

.lists-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.lists-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.lists-container::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }

  .lists-container {
    gap: 12px;
  }

  .add-list-column {
    min-width: 240px;
  }
}
</style>