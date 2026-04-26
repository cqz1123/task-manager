import axios from './axios';
import type { ListWithCards, List } from '../types/List';

// 获取看板的所有列表，包含卡片信息
export async function getListsWithCards(boardId: number): Promise<{ board: any; boardId: number; lists: ListWithCards[] }> {
  const response: { success: boolean; board: any; boardId: number; lists: ListWithCards[] } = await axios.get(`/boards/${boardId}/lists-with-cards`);
  return { board: response.board, boardId: response.boardId, lists: response.lists };
}

// 创建一个新的列表
export async function createList(boardId: number, title: string): Promise<List> {
  const response: { success: boolean; data: List } = await axios.post('/lists', { boardId, title });
  return response.data;
}

// 修改列表标题
export async function updateList(listId: number, title: string): Promise<List> {
  const response: { success: boolean; data: List } = await axios.put(`/lists/${listId}`, { title });
  return response.data;
}

// 删除一个列表
export async function deleteList(listId: number): Promise<void> {
  await axios.delete(`/lists/${listId}`);
}