/**
 * 看板存储模块
 * 管理看板基础信息，包括看板列表、当前看板等
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as boardApi from '../api/board';
import type { Board } from '../types/Board';

export const useBoardStore = defineStore('board', () => {
  // 状态
  const boards = ref<Board[]>([]);
  const currentBoard = ref<Board | null>(null);
  const currentBoardRole = ref<'owner' | 'editor' | 'viewer' | null>(null);
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
      const response = await boardApi.getBoards();
      if (response.success && response.data) {
        boards.value = response.data;
      }
    } catch (err: any) {
      error.value = err.error || '获取看板列表失败';
      console.error('获取看板列表失败:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建新看板
   */
  const createBoard = async (boardData: { name: string; color?: string }) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await boardApi.createBoard(boardData);
      if (response.success && response.data) {
        // 创建者默认是所有者
        const newBoard = { ...response.data, myRole: 'owner' as const };
        boards.value.unshift(newBoard); // 将新看板添加到列表开头
        return newBoard;
      }
      throw new Error('创建看板失败');
    } catch (err: any) {
      error.value = err.error || '创建看板失败';
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
      const response = await boardApi.deleteBoard(boardId);
      if (response.success) {
        boards.value = boards.value.filter(board => board.id !== boardId);
      } else {
        throw new Error(response.error || '删除看板失败');
      }
    } catch (err: any) {
      error.value = err.error || '删除看板失败';
      console.error('删除看板失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 修改看板名称
   */
  const updateBoard = async (boardId: number, boardData: { name: string; color?: string }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await boardApi.updateBoard(boardId, boardData);
      if (response.success && response.data) {
        // 更新看板列表中的看板
        const boardIndex = boards.value.findIndex(board => board.id === boardId);
        if (boardIndex !== -1) {
          boards.value[boardIndex] = response.data;
        }
        // 更新当前看板
        if (currentBoard.value?.id === boardId) {
          currentBoard.value = response.data;
        }
        return response.data;
      }
      throw new Error(response.error || '修改看板失败');
    } catch (err: any) {
      error.value = err.error || '修改看板失败';
      console.error('修改看板失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 通过邀请码加入看板
   */
  const joinBoardByCode = async (inviteCode: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await boardApi.joinBoardByCode(inviteCode);
      if (response.success && response.data) {
        // 更新看板列表
        await fetchBoards();
        return response.data;
      }
      throw new Error(response.error || '加入看板失败');
    } catch (err: any) {
      error.value = err.error || '加入看板失败';
      console.error('加入看板失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 重新生成邀请码
   */
  const regenerateInviteCode = async (boardId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await boardApi.regenerateInviteCode(boardId);
      if (response.success && response.data) {
        // 更新当前看板的邀请码
        if (currentBoard.value?.id === boardId) {
          currentBoard.value.invite_code = response.data.inviteCode;
        }
        // 更新看板列表中的邀请码
        const boardIndex = boards.value.findIndex(board => board.id === boardId);
        if (boardIndex !== -1) {
          boards.value[boardIndex]!.invite_code = response.data.inviteCode;
        }
        return response.data;
      }
      throw new Error(response.error || '重新生成邀请码失败');
    } catch (err: any) {
      error.value = err.error || '重新生成邀请码失败';
      console.error('重新生成邀请码失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 设置当前看板信息（由其他 store 调用）
   */
  const setCurrentBoard = (board: Board | null) => {
    currentBoard.value = board;
  };

  /**
   * 设置当前用户角色
   */
  const setCurrentBoardRole = (role: 'owner' | 'editor' | 'viewer' | null) => {
    currentBoardRole.value = role;
  };

  /**
   * 重置状态
   */
  const resetState = () => {
    currentBoard.value = null;
    currentBoardRole.value = null;
    error.value = null;
  };

  return {
    boards,
    currentBoard,
    currentBoardRole,
    loading,
    error,
    boardCount,
    fetchBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    joinBoardByCode,
    regenerateInviteCode,
    setCurrentBoard,
    setCurrentBoardRole,
    resetState
  };
});