import axios from './axios';
import type { Board } from '../types/Board';

// 获取当前用户的所有看板
export async function getBoards(): Promise<{ data: Board[] }> {
  const response = await axios.get('/boards');
  return response;
}

// 创建一个新的看板
export async function createBoard(boardData: { name: string; color?: string }): Promise<{  data: Board }> {
  const response = await axios.post('/boards', boardData);
  return response;
}

// 删除一个看板
export async function deleteBoard(boardId: number): Promise<void> {
  await axios.delete(`/boards/${boardId}`);
}