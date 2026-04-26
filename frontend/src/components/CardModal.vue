<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Card } from '../types/Card';
import { useBoardStore } from '../stores/board';
import { ElDialog, ElForm, ElFormItem, ElInput, ElDatePicker, ElButton, ElMessage } from 'element-plus';

const props = defineProps<{
  modelValue: boolean;
  card: Card | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'card-updated'): void;
}>();

const boardStore = useBoardStore();

const formData = ref({
  title: '',
  description: '',
  dueDate: null as string | null | undefined,
  assignee: ''
});

watch(() => props.card, (card) => {
  if (card) {
    formData.value = {
      title: card.title || '',
      description: card.description || '',
      dueDate: card.due_date ? card.due_date.split('T')[0] : null,
      assignee: card.assignee || ''
    };
  }
}, { immediate: true });

const handleClose = () => {
  emit('update:modelValue', false);
};

const handleSubmit = async () => {
  if (!formData.value.title.trim()) {
    ElMessage.warning('卡片标题不能为空');
    return;
  }

  if (!props.card) {
    return;
  }

  try {
    await boardStore.updateCard(props.card.id, {
      title: formData.value.title.trim(),
      description: formData.value.description.trim() || null,
      dueDate: formData.value.dueDate || null,
      assignee: formData.value.assignee.trim() || null
    });
    ElMessage.success('卡片修改成功');
    emit('card-updated');
    handleClose();
  } catch (error) {
    ElMessage.error('修改卡片失败');
  }
};
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    title="编辑卡片"
    width="500px"
    @close="handleClose"
  >
    <ElForm :model="formData" label-width="80px">
      <ElFormItem label="标题">
        <ElInput
          v-model="formData.title"
          placeholder="请输入卡片标题"
        />
      </ElFormItem>

      <ElFormItem label="描述">
        <ElInput
          v-model="formData.description"
          type="textarea"
          placeholder="请输入卡片描述"
          :rows="4"
        />
      </ElFormItem>

      <ElFormItem label="截止日期">
        <ElDatePicker
          v-model="formData.dueDate"
          type="date"
          placeholder="选择截止日期"
          style="width: 100%"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </ElFormItem>

      <ElFormItem label="执行人">
        <ElInput
          v-model="formData.assignee"
          placeholder="请输入执行人姓名"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">确定</ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
