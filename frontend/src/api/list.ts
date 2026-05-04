import axios from './axios';
import type { ApiResponse } from './types';
import type { ListWithCards, List } from '../types/List';

// 获取看板详情数据
export interface BoardDetailData {
  board: any;
  boardId: number;
  lists: ListWithCards[];
}

// 获取看板的所有列表，包含卡片信息
export async function getListsWithCards(boardId: number): Promise<ApiResponse<BoardDetailData>> {
  const response = await axios.get(`/boards/${boardId}/lists-with-cards`) as ApiResponse<BoardDetailData>;
  return response;
}

// 创建一个新的列表
export async function createList(boardId: number, title: string): Promise<ApiResponse<List>> {
  const response = await axios.post(`/boards/${boardId}/lists`, { title }) as ApiResponse<List>;
  return response;
}

// 修改列表标题
export async function updateList(boardId: number, listId: number, title: string): Promise<ApiResponse<List>> {
  const response = await axios.put(`/boards/${boardId}/lists/${listId}`, { title }) as ApiResponse<List>;
  return response;
}

// 删除一个列表
export async function deleteList(boardId: number, listId: number): Promise<ApiResponse> {
  const response = await axios.delete(`/boards/${boardId}/lists/${listId}`) as ApiResponse;
  return response;
}