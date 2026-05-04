import axios from './axios';
import type { ApiResponse } from './types';
import type { Card, CardCreateData } from '../types/Card';

// 创建一个新的卡片
export async function createCard(boardId: number, cardData: CardCreateData): Promise<ApiResponse<Card>> {
  const response = await axios.post(`/boards/${boardId}/cards`, cardData) as ApiResponse<Card>;
  return response;
}

// 修改卡片的所有字段（支持部分更新）
export async function updateCard(boardId: number, cardId: number, cardData: Partial<{
  title: string;
  description: string | null;
  dueDate: string | null;
  assignee: string | null;
}>): Promise<ApiResponse<Card>> {
  const response = await axios.put(`/boards/${boardId}/cards/${cardId}`, cardData) as ApiResponse<Card>;
  return response;
}

// 删除一个卡片
export async function deleteCard(boardId: number, cardId: number): Promise<ApiResponse> {
  const response = await axios.delete(`/boards/${boardId}/cards/${cardId}`) as ApiResponse;
  return response;
}

// 修改卡片位置（支持拖拽排序和跨列表移动）
export async function updateCardPosition(
  boardId: number,
  cardId: number,
  data: {
    sourceListId?: number;
    targetListId: number;
    newOrder: number;
  }
): Promise<ApiResponse<Card>> {
  const response = await axios.patch(`/boards/${boardId}/cards/${cardId}/position`, data) as ApiResponse<Card>;
  return response;
}

// 完成卡片（移动到"已完成"列表）
export async function completeCard(boardId: number, cardId: number): Promise<ApiResponse<Card>> {
  const response = await axios.post(`/boards/${boardId}/cards/${cardId}/complete`) as ApiResponse<Card>;
  return response;
}

// 撤销完成卡片（移回原列表）
export async function uncompleteCard(boardId: number, cardId: number): Promise<ApiResponse<Card>> {
  const response = await axios.post(`/boards/${boardId}/cards/${cardId}/uncomplete`) as ApiResponse<Card>;
  return response;
}
