import axios from './axios';
import type { Card, CardCreateData } from '../types/Card';

// 创建一个新的卡片
export async function createCard(cardData: CardCreateData): Promise<Card> {
  const response: Card = await axios.post('/cards', cardData);
  return response;
}

// 删除一个卡片
export async function deleteCard(cardId: number): Promise<void> {
  await axios.delete(`/cards/${cardId}`);
}