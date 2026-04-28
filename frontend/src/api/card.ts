import axios from './axios';
import type { Card, CardCreateData } from '../types/Card';

// 创建一个新的卡片
export async function createCard(cardData: CardCreateData): Promise<Card> {
  const response: { success: boolean; data: Card } = await axios.post('/cards', cardData);
  return response.data;
}

// 修改卡片的所有字段（支持部分更新）
export async function updateCard(cardId: number, cardData: Partial<{
  title: string;
  description: string | null;
  dueDate: string | null;
  assignee: string | null;
}>): Promise<Card> {
  const response: { success: boolean; data: Card } = await axios.put(`/cards/${cardId}`, cardData);
  return response.data;
}

// 删除一个卡片
export async function deleteCard(cardId: number): Promise<void> {
  await axios.delete(`/cards/${cardId}`);
}

// 修改卡片位置（支持拖拽排序和跨列表移动）
export async function updateCardPosition(
  cardId: number,
  data: {
    sourceListId?: number;
    targetListId: number;
    newOrder: number;
  }
): Promise<Card> {
  const response: { success: boolean; data: Card } = await axios.patch(`/cards/${cardId}/position`, data);
  return response.data;
}