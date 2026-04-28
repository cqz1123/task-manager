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
   * 移动卡片（支持同列表排序和跨列表移动）
   * 使用乐观更新，先更新本地数据，再调用后端 API
   */
  const moveCard = async (params: {
    cardId: number;
    sourceListId: number;
    targetListId: number;
    newIndex: number;
  }) => {
    const { cardId, sourceListId, targetListId, newIndex } = params;
    error.value = null;

    // 备份原始数据，用于失败时回滚
    const originalLists = JSON.parse(JSON.stringify(lists.value));

    try {
      console.log('开始移动卡片:', { cardId, sourceListId, targetListId, newIndex });
      
      // 检查lists.value是否存在
      if (!lists.value || lists.value.length === 0) {
        console.error('列表数据不存在');
        throw new Error('列表数据不存在');
      }
      
      // 打印当前所有列表及其卡片
      console.log('当前所有列表:', lists.value.map(list => ({
        id: list.id,
        title: list.title,
        cardCount: list.cards ? list.cards.length : 0,
        cardIds: list.cards ? list.cards.map(card => card.id) : []
      })));
      
      // 找到目标列表
      const targetListIndex = lists.value.findIndex(list => list.id === targetListId);
      console.log('目标列表索引:', targetListIndex);
      
      if (targetListIndex === -1) {
        console.error('目标列表不存在:', targetListId);
        throw new Error('目标列表不存在');
      }

      const targetList = lists.value[targetListIndex];
      if (!targetList) {
        console.error('目标列表不存在:', targetListId);
        throw new Error('目标列表不存在');
      }
      console.log('目标列表:', { id: targetList.id, title: targetList.title, cardCount: targetList.cards ? targetList.cards.length : 0 });
      
      // 确保目标列表和卡片数组存在
      if (!targetList.cards) {
        console.error('目标列表卡片数组不存在:', targetList);
        throw new Error('目标列表卡片数据不存在');
      }

      // 找到被移动的卡片 - 在所有列表中查找
      let movedCard: Card | undefined;
      let cardFound = false;
      let foundListIndex = -1;
      
      console.log('在所有列表中查找卡片:', cardId);
      for (let i = 0; i < lists.value.length; i++) {
        const list = lists.value[i];
        if (list && list.cards) {
          const index = list.cards.findIndex((card: Card) => card.id === cardId);
          if (index !== -1) {
            [movedCard] = list.cards.splice(index, 1);
            cardFound = true;
            foundListIndex = i;
            if (movedCard) {
              console.log('找到并移除卡片:', { cardId: movedCard.id, listId: list.id, listIndex: i });
            }
            break;
          }
        }
      }
      
      if (!cardFound || !movedCard) {
        console.error('卡片不存在:', { cardId, sourceListId, targetListId });
        // 检查是否卡片已经在目标列表中
        const cardInTarget = targetList.cards.find((card: Card) => card.id === cardId);
        if (cardInTarget) {
          console.log('卡片已经在目标列表中:', { cardId, targetListId });
          // 如果卡片已经在目标列表中，检查位置是否需要调整
          const currentIndex = targetList.cards.findIndex((card: Card) => card.id === cardId);
          if (currentIndex !== newIndex) {
            // 调整位置
            targetList.cards.splice(currentIndex, 1);
            targetList.cards.splice(newIndex, 0, cardInTarget);
            console.log('调整卡片在目标列表中的位置:', { cardId, oldIndex: currentIndex, newIndex });
          } else {
            console.log('卡片已经在目标列表的正确位置:', { cardId, targetListId, index: currentIndex });
            return; // 不需要进一步处理
          }
        } else {
          throw new Error('卡片不存在');
        }
      } else {
        // 插入到目标列表
        targetList.cards.splice(newIndex, 0, movedCard);
        // 更新卡片的 list_id 为新列表的 ID
        movedCard.list_id = targetListId;
        console.log('卡片移动成功:', { cardId, sourceListId: lists.value[foundListIndex]?.id, targetListId, newIndex });
      }

      // 调用后端 API
      console.log('调用后端 API 更新卡片位置');
      try {
        await cardApi.updateCardPosition(cardId, {
          sourceListId,
          targetListId,
          newOrder: newIndex
        });
        console.log('后端 API 调用成功');
      } catch (apiError) {
        console.error('后端 API 调用失败:', apiError);
        throw apiError;
      }
      
      console.log('卡片移动成功');
    } catch (err: any) {
      // 失败时回滚到原始状态
      console.error('移动卡片失败，回滚到原始状态:', err);
      lists.value = originalLists;
      error.value = err.response?.data?.error || '移动卡片失败';
      console.error('移动卡片失败:', err);
      throw err;
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
    moveCard,
    resetState
  };
});