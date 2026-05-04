/**
 * 列表存储模块
 * 管理看板中的列表数据，包括列表的CRUD操作和广播事件处理
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as listApi from '../api/list';
import { useBoardStore } from './board';
import type { List, ListWithCards } from '../types/List';
import type { Card } from '../types/Card';

export const useListStore = defineStore('list', () => {
  // 状态
  const lists = ref<ListWithCards[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 获取看板详情（包含列表和卡片）
   */
  const fetchBoardDetail = async (boardId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await listApi.getListsWithCards(boardId);
      if (response.success && response.data) {
        // 使用返回的看板信息
        const boardStore = useBoardStore();
        boardStore.setCurrentBoard(response.data.board);
        // 设置当前用户的角色
        if (response.data.board && response.data.board.myRole) {
          boardStore.setCurrentBoardRole(response.data.board.myRole as 'owner' | 'editor' | 'viewer');
        } else {
          boardStore.setCurrentBoardRole(null);
        }
        lists.value = response.data.lists;
      }
    } catch (err: any) {
      error.value = err.error || '获取看板详情失败';
      console.error('获取看板详情失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建新列表
   */
  const createList = async (boardId: number, title: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await listApi.createList(boardId, title);
      if (response.success && response.data) {
        // 不直接添加到本地列表，等待广播事件更新（避免重复）
        return response.data;
      }
      throw new Error(response.error || '创建列表失败');
    } catch (err: any) {
      error.value = err.error || '创建列表失败';
      console.error('创建列表失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除列表
   */
  const deleteList = async (boardId: number, listId: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await listApi.deleteList(boardId, listId);
      if (response.success) {
        // 从列表中移除
        lists.value = lists.value.filter(list => list.id !== listId);
      } else {
        throw new Error(response.error || '删除列表失败');
      }
    } catch (err: any) {
      error.value = err.error || '删除列表失败';
      console.error('删除列表失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 修改列表标题
   */
  const updateList = async (boardId: number, listId: number, title: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await listApi.updateList(boardId, listId, title);
      if (response.success && response.data) {
        // 更新列表
        const listIndex = lists.value.findIndex(list => list.id === listId);
        if (listIndex !== -1) {
          lists.value[listIndex]!.title = response.data.title;
        }
        return response.data;
      }
      throw new Error(response.error || '修改列表失败');
    } catch (err: any) {
      error.value = err.error || '修改列表失败';
      console.error('修改列表失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 广播添加列表（直接更新本地数据，不调用 API）
   */
  const addListByBroadcast = (list: ListWithCards): void => {
    // 检查是否已存在相同 ID 的列表（避免重复）
    const exists = lists.value.some(l => l.id === list.id);
    if (exists) {
      console.log('列表已存在，跳过广播更新:', list.id);
      return;
    }
    
    // 确保 cards 数组存在
    if (!list.cards) {
      list.cards = [];
    }
    
    // 根据 order_index 插入到正确位置
    const insertIndex = lists.value.findIndex(l => l.order_index > list.order_index);
    if (insertIndex === -1) {
      lists.value.push(list);
    } else {
      lists.value.splice(insertIndex, 0, list);
    }
  };

  /**
   * 广播更新列表（直接更新本地数据，不调用 API）
   */
  const updateListByBroadcast = (updatedList: List): void => {
    const listIndex = lists.value.findIndex(l => l.id === updatedList.id);
    if (listIndex !== -1) {
      lists.value[listIndex] = {
        ...lists.value[listIndex],
        ...updatedList,
        cards: lists.value[listIndex]!.cards || []
      };
    }
  };

  /**
   * 广播删除列表（直接更新本地数据，不调用 API）
   */
  const deleteListByBroadcast = (listId: number): void => {
    const listIndex = lists.value.findIndex(l => l.id === listId);
    if (listIndex !== -1) {
      lists.value.splice(listIndex, 1);
    }
  };

  /**
   * 重置状态
   */
  const resetState = () => {
    lists.value = [];
    error.value = null;
  };

  return {
    lists,
    loading,
    error,
    fetchBoardDetail,
    createList,
    updateList,
    deleteList,
    addListByBroadcast,
    updateListByBroadcast,
    deleteListByBroadcast,
    resetState
  };
});