/**
 * 看板存储模块
 * 使用 Pinia 管理看板列表状态，包括获取、添加、删除看板等操作
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api/axios';

// 看板类型定义
export interface Board {
  id: number;
  name: string;
  color: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

// 看板创建请求类型
export interface CreateBoardRequest {
  name: string;
  color: string;
}

// 看板响应类型
interface BoardResponse {
  success: boolean;
  data: Board[];
}

export const useBoardStore = defineStore('board', () => {
  // 状态
  const boards = ref<Board[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const boardCount = computed(() => boards.value.length);

  /**
   * 获取看板列表
   */
  const fetchBoards = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.get<BoardResponse>('/boards');
      boards.value = response.data.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || '获取看板列表失败';
      console.error('获取看板列表失败:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建新看板
   */
  const createBoard = async (boardData: CreateBoardRequest) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post<{ success: boolean; data: Board }>('/boards', boardData);
      boards.value.unshift(response.data.data); // 将新看板添加到列表开头
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || '创建看板失败';
      console.error('创建看板失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除看板
   */
  const deleteBoard = async (boardId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      await api.delete(`/boards/${boardId}`);
      boards.value = boards.value.filter(board => board.id !== boardId);
    } catch (err: any) {
      error.value = err.response?.data?.error || '删除看板失败';
      console.error('删除看板失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    boards,
    loading,
    error,
    boardCount,
    fetchBoards,
    createBoard,
    deleteBoard
  };
});
