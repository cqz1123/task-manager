/**
 * 看板存储模块
 * 使用 Pinia 管理看板列表状态，包括获取、添加、删除看板等操作
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as boardApi from '../api/board';
import * as listApi from '../api/list';
import * as cardApi from '../api/card';
import * as memberApi from '../api/member';
import type { Board, BoardWithLists, BoardMember } from '../types/Board';
import type { List, ListWithCards } from '../types/List';
import type { Card, CardCreateData } from '../types/Card';

export const useBoardStore = defineStore('board', () => {
  // 状态
  const boards = ref<Board[]>([]);
  const currentBoard = ref<Board | null>(null);
  const currentBoardRole = ref<'owner' | 'editor' | 'viewer' | null>(null);
  const lists = ref<ListWithCards[]>([]);
  const members = ref<BoardMember[]>([]);
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
      // 创建者默认是所有者
      const newBoard = { ...response.data, myRole: 'owner' as const };
      boards.value.unshift(newBoard); // 将新看板添加到列表开头
      return newBoard;
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
      // 设置当前用户的角色
      if (response.board && response.board.myRole) {
        currentBoardRole.value = response.board.myRole as 'owner' | 'editor' | 'viewer';
      } else {
        currentBoardRole.value = null;
      }
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
   * 获取看板成员列表
   */
  const fetchMembers = async (boardId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await memberApi.getBoardMembers(boardId);
      // 合并 owner 和 members
      const allMembers: BoardMember[] = [];
      if (response.owner) {
        allMembers.push(response.owner);
      }
      allMembers.push(...response.members);
      members.value = allMembers;
      return allMembers;
    } catch (err: any) {
      error.value = err.response?.data?.error || '获取成员列表失败';
      console.error('获取成员列表失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 修改成员角色
   */
  const updateMemberRole = async (boardId: number, userId: number, role: 'editor' | 'viewer') => {
    loading.value = true;
    error.value = null;
    
    try {
      await memberApi.updateMemberRole(boardId, userId, role);
      // 更新本地成员列表
      const memberIndex = members.value.findIndex(member => member.userId === userId);
      if (memberIndex !== -1) {
        members.value[memberIndex]!.role = role;
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || '修改成员角色失败';
      console.error('修改成员角色失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 移除成员
   */
  const removeMember = async (boardId: number, userId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      await memberApi.removeMember(boardId, userId);
      // 从本地成员列表移除
      members.value = members.value.filter(member => member.userId !== userId);
    } catch (err: any) {
      error.value = err.response?.data?.error || '移除成员失败';
      console.error('移除成员失败:', err);
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
      // 更新看板列表
      await fetchBoards();
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || '加入看板失败';
      console.error('加入看板失败:', err);
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
  const deleteList = async (boardId: number, listId: number) => {
    loading.value = true;
    error.value = null;

    try {
      await listApi.deleteList(boardId, listId);
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
  const updateList = async (boardId: number, listId: number, title: string) => {
    loading.value = true;
    error.value = null;

    try {
      const updatedList = await listApi.updateList(boardId, listId, title);
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
      const boardId = currentBoard.value?.id || 0;
      const newCard = await cardApi.createCard(boardId, cardData);
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
      const boardId = currentBoard.value?.id || 0;
      await cardApi.deleteCard(boardId, cardId);
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
      const boardId = currentBoard.value?.id || 0;
      const updatedCard = await cardApi.updateCard(boardId, cardId, cardData);
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
        const boardId = currentBoard.value?.id || 0;
        await cardApi.updateCardPosition(boardId, cardId, {
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
    currentBoardRole.value = null;
    lists.value = [];
    members.value = [];
    error.value = null;
  };

  return {
    boards,
    currentBoard,
    currentBoardRole,
    lists,
    members,
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
    addCardByBroadcast,
    updateCardByBroadcast,
    deleteCardByBroadcast,
    moveCardByBroadcast,
    addListByBroadcast,
    updateListByBroadcast,
    deleteListByBroadcast,
    fetchMembers,
    updateMemberRole,
    removeMember,
    joinBoardByCode,
    resetState
  };
});