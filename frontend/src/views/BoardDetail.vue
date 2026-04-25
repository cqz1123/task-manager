<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBoardStore } from '../stores/board';
import NavBar from '../components/NavBar.vue';
import ListColumn from '../components/ListColumn.vue';
import { ElButton, ElDialog, ElInput, ElMessage, ElLoading } from 'element-plus';

const route = useRoute();
const router = useRouter();
const boardStore = useBoardStore();

const boardId = ref<number>(0);
const loading = ref(false);
const showAddListDialog = ref(false);
const newListTitle = ref('');

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
</script>

<template>
  <div class="board-detail">
    <!-- Navigation Bar -->
    <NavBar>
      <template #left>
        <ElButton
          type="primary"
          plain
          size="small"
          @click="goBack"
          class="back-button"
        >
          ← 我的看板
        </ElButton>
        <h2 class="board-title">
          {{ boardStore.currentBoard?.name || '看板详情' }}
        </h2>
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
  </div>
</template>

<style scoped>
.board-detail {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
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