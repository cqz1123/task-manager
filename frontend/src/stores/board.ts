/**
 * 看板存储模块
 * 使用 Pinia 管理看板列表状态，包括获取、添加、删除看板等操作
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as boardApi from '../api/board';
import * as listApi from '../api/list';
import * as cardApi from '../api/card';
import type { Board, BoardWithLists } from '../types/Board';
import type { List, ListWithCards } from '../types/List';
import type { Card, CardCreateData } from '../types/Card';

export const useBoardStore = defineStore('board', () => {
  // 状态
  const boards = ref<Board[]>([]);
  const currentBoard = ref<Board | null>(null);
  const lists = ref<ListWithCards[]>([]);
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
      boards.value = response.data;
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
  const createBoard = async (boardData: { name: string; color?: string }) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await boardApi.createBoard(boardData);
      boards.value.unshift(response.data); // 将新看板添加到列表开头
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
      await boardApi.deleteBoard(boardId);
      boards.value = boards.value.filter(board => board.id !== boardId);
    } catch (err: any) {
      error.value = err.response?.data?.error || '删除看板失败';
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
    } catch (err: any) {
      error.value = err.response?.data?.error || '修改看板失败';
      console.error('修改看板失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取看板详情（包含列表和卡片）
   */
  const fetchBoardDetail = async (boardId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await listApi.getListsWithCards(boardId);
      // 使用返回的看板信息
      currentBoard.value = response.board;
      lists.value = response.lists;
    } catch (err: any) {
      error.value = err.response?.data?.error || '获取看板详情失败';
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
      const newList = await listApi.createList(boardId, title);
      // 添加到列表中
      lists.value.push({
        ...newList,
        cards: []
      });
      return newList;
    } catch (err: any) {
      error.value = err.response?.data?.error || '创建列表失败';
      console.error('创建列表失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除列表
   */
  const deleteList = async (listId: number) => {
    loading.value = true;
    error.value = null;

    try {
      await listApi.deleteList(listId);
      // 从列表中移除
      lists.value = lists.value.filter(list => list.id !== listId);
    } catch (err: any) {
      error.value = err.response?.data?.error || '删除列表失败';
      console.error('删除列表失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 修改列表标题
   */
  const updateList = async (listId: number, title: string) => {
    loading.value = true;
    error.value = null;

    try {
      const updatedList = await listApi.updateList(listId, title);
      // 更新列表
      const listIndex = lists.value.findIndex(list => list.id === listId);
      if (listIndex !== -1) {
        lists.value[listIndex]!.title = updatedList.title;
      }
      return updatedList;
    } catch (err: any) {
      error.value = err.response?.data?.error || '修改列表失败';
      console.error('修改列表失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建新卡片
   */
  const createCard = async (cardData: CardCreateData) => {
    loading.value = true;
    error.value = null;
    
    try {
      const newCard = await cardApi.createCard(cardData);
      // 找到对应的列表并添加卡片
      const listIndex = lists.value.findIndex(list => list.id === cardData.listId);
      if (listIndex !== -1) {
        if (lists.value[listIndex]?.cards) {
          lists.value[listIndex].cards.push(newCard);
        } else {
          lists.value[listIndex]!.cards = [newCard];
        }
      }
      return newCard;
    } catch (err: any) {
      error.value = err.response?.data?.error || '创建卡片失败';
      console.error('创建卡片失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除卡片
   */
  const deleteCard = async (cardId: number) => {
    loading.value = true;
    error.value = null;

    try {
      await cardApi.deleteCard(cardId);
      // 找到对应的列表并移除卡片
      lists.value.forEach(list => {
        list.cards = list.cards.filter((card: Card) => card.id !== cardId);
      });
    } catch (err: any) {
      error.value = err.response?.data?.error || '删除卡片失败';
      console.error('删除卡片失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 修改卡片
   */
  const updateCard = async (cardId: number, cardData: Partial<{
    title: string;
    description: string | null;
    dueDate: string | null;
    assignee: string | null;
  }>) => {
    loading.value = true;
    error.value = null;

    try {
      const updatedCard = await cardApi.updateCard(cardId, cardData);
      // 找到对应的列表并更新卡片
      lists.value.forEach(list => {
        const cardIndex = list.cards.findIndex((card: Card) => card.id === cardId);
        if (cardIndex !== -1) {
          list.cards[cardIndex] = updatedCard;
        }
      });
      return updatedCard;
    } catch (err: any) {
      error.value = err.response?.data?.error || '修改卡片失败';
      console.error('修改卡片失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 重置状态
   */
  const resetState = () => {
    currentBoard.value = null;
    lists.value = [];
    error.value = null;
  };

  return {
    boards,
    currentBoard,
    lists,
    loading,
    error,
    boardCount,
    fetchBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    fetchBoardDetail,
    createList,
    updateList,
    deleteList,
    createCard,
    updateCard,
    deleteCard,
    resetState
  };
});