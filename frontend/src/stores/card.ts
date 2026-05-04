/**
 * 卡片存储模块
 * 管理列表中的卡片数据，包括卡片的CRUD操作、移动和广播事件处理
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as cardApi from '../api/card';
import { useBoardStore } from './board';
import type { Card, CardCreateData } from '../types/Card';
import type { ListWithCards } from '../types/List';

export const useCardStore = defineStore('card', () => {
  // 状态
  const lists = ref<ListWithCards[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 设置列表数据（由 list store 同步）
   */
  const setLists = (newLists: ListWithCards[]) => {
    lists.value = newLists;
  };

  /**
   * 获取当前列表数据
   */
  const getLists = (): ListWithCards[] => {
    return lists.value;
  };

  /**
   * 创建新卡片
   */
  const createCard = async (cardData: CardCreateData) => {
    loading.value = true;
    error.value = null;
    
    try {
      const boardStore = useBoardStore();
      const boardId = boardStore.currentBoard?.id || 0;
      const response = await cardApi.createCard(boardId, cardData);
      if (response.success && response.data) {
        // 不直接添加到本地列表，等待广播事件更新（避免重复）
        return response.data;
      }
      throw new Error(response.error || '创建卡片失败');
    } catch (err: any) {
      error.value = err.error || '创建卡片失败';
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
      const boardStore = useBoardStore();
      const boardId = boardStore.currentBoard?.id || 0;
      const response = await cardApi.deleteCard(boardId, cardId);
      if (response.success) {
        // 找到对应的列表并移除卡片
        lists.value.forEach(list => {
          list.cards = list.cards.filter((card: Card) => card.id !== cardId);
        });
      } else {
        throw new Error(response.error || '删除卡片失败');
      }
    } catch (err: any) {
      error.value = err.error || '删除卡片失败';
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
      const boardStore = useBoardStore();
      const boardId = boardStore.currentBoard?.id || 0;
      const response = await cardApi.updateCard(boardId, cardId, cardData);
      if (response.success && response.data) {
        // 找到对应的列表并更新卡片
        lists.value.forEach(list => {
          const cardIndex = list.cards.findIndex((card: Card) => card.id === cardId);
          if (cardIndex !== -1) {
            list.cards[cardIndex] = response.data;
          }
        });
        return response.data;
      }
      throw new Error(response.error || '修改卡片失败');
    } catch (err: any) {
      error.value = err.error || '修改卡片失败';
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
      // 检查lists.value是否存在
      if (!lists.value || lists.value.length === 0) {
        throw new Error('列表数据不存在');
      }

      // 找到目标列表
      const targetListIndex = lists.value.findIndex(list => list.id === targetListId);
      
      if (targetListIndex === -1) {
        throw new Error('目标列表不存在');
      }

      const targetList = lists.value[targetListIndex];
      if (!targetList) {
        throw new Error('目标列表不存在');
      }

      // 确保目标列表和卡片数组存在
      if (!targetList.cards) {
        throw new Error('目标列表卡片数据不存在');
      }

      // 找到被移动的卡片 - 在所有列表中查找
      let movedCard: Card | undefined;
      let cardFound = false;
      
      for (let i = 0; i < lists.value.length; i++) {
        const list = lists.value[i];
        if (list && list.cards) {
          const index = list.cards.findIndex((card: Card) => card.id === cardId);
          if (index !== -1) {
            [movedCard] = list.cards.splice(index, 1);
            cardFound = true;
            break;
          }
        }
      }
      
      if (!cardFound || !movedCard) {
        // 检查是否卡片已经在目标列表中
        const cardInTarget = targetList.cards.find((card: Card) => card.id === cardId);
        if (cardInTarget) {
          // 如果卡片已经在目标列表中，检查位置是否需要调整
          const currentIndex = targetList.cards.findIndex((card: Card) => card.id === cardId);
          if (currentIndex !== newIndex) {
            // 调整位置
            targetList.cards.splice(currentIndex, 1);
            targetList.cards.splice(newIndex, 0, cardInTarget);
          } else {
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
      }

      // 调用后端 API
      const boardStore = useBoardStore();
      const boardId = boardStore.currentBoard?.id || 0;
      const response = await cardApi.updateCardPosition(boardId, cardId, {
        sourceListId,
        targetListId,
        newOrder: newIndex
      });
      if (!response.success) {
        throw new Error(response.error || '移动卡片失败');
      }
    } catch (err: any) {
      // 失败时回滚到原始状态
      lists.value = originalLists;
      error.value = err.error || '移动卡片失败';
      throw err;
    }
  };

  /**
   * 广播添加卡片（直接更新本地数据，不调用 API）
   */
  const addCardByBroadcast = (listId: number, card: Card): void => {
    const list = lists.value.find(list => list.id === listId);
    if (!list) {
      return;
    }
    
    // 确保 cards 数组存在
    if (!list.cards) {
      list.cards = [];
    }
    
    // 检查是否已存在相同 ID 的卡片（避免重复）
    const exists = list.cards.some((c: Card) => c.id === card.id);
    if (exists) {
      console.log('卡片已存在，跳过广播更新:', card.id);
      return;
    }
    
    // 根据 order_index 插入到正确位置
    const insertIndex = list.cards.findIndex(
      (c: Card) => c.order_index > card.order_index
    );
    
    if (insertIndex === -1) {
      list.cards.push(card);
    } else {
      list.cards.splice(insertIndex, 0, card);
    }
  };

  /**
   * 广播更新卡片（直接更新本地数据，不调用 API）
   */
  const updateCardByBroadcast = (updatedCard: Card): void => {
    lists.value.forEach(list => {
      const cardIndex = list.cards.findIndex((card: Card) => card.id === updatedCard.id);
      if (cardIndex !== -1) {
        list.cards[cardIndex] = updatedCard;
      }
    });
  };

  /**
   * 广播删除卡片（直接更新本地数据，不调用 API）
   */
  const deleteCardByBroadcast = (cardId: number): void => {
    lists.value.forEach(list => {
      list.cards = list.cards.filter((card: Card) => card.id !== cardId);
    });
  };

  /**
   * 广播移动卡片（直接更新本地数据，不调用 API）
   */
  const moveCardByBroadcast = (movedCard: Card): void => {
    // 先从原列表中移除卡片
    let removedCard: Card | null = null;
    let originalList: ListWithCards | null = null;

    for (const list of lists.value) {
      if (!list || !list.cards) continue;
      
      const cardIndex = list.cards.findIndex((card: Card) => card.id === movedCard.id);
      if (cardIndex !== -1) {
        [removedCard] = list.cards.splice(cardIndex, 1);
        originalList = list;
        break;
      }
    }

    // 如果没找到卡片，直接返回
    if (!removedCard) {
      return;
    }

    // 找到目标列表
    const targetList = lists.value.find(list => list.id === movedCard.list_id);
    if (!targetList) {
      // 如果目标列表不存在，把卡片放回原列表
      if (originalList && originalList.cards) {
        originalList.cards.push(removedCard);
      }
      return;
    }

    // 确保目标列表的 cards 数组存在
    if (!targetList.cards) {
      targetList.cards = [];
    }

    // 根据 order_index 插入到正确位置
    const insertIndex = targetList.cards.findIndex(
      (card: Card) => card.order_index > movedCard.order_index
    );

    if (insertIndex === -1) {
      targetList.cards.push(movedCard);
    } else {
      targetList.cards.splice(insertIndex, 0, movedCard);
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
    setLists,
    getLists,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    addCardByBroadcast,
    updateCardByBroadcast,
    deleteCardByBroadcast,
    moveCardByBroadcast,
    resetState
  };
});