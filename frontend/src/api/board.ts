import axios from './axios';
import type { Board } from '../types/Board';

// 获取当前用户的所有看板
export async function getBoards(): Promise<{ data: Board[] }> {
  const response: { success: boolean; data: Board[] } = await axios.get('/boards');
  return { data: response.data };
}

// 创建一个新的看板
export async function createBoard(boardData: { name: string; color?: string }): Promise<{ data: Board }> {
  const response: { success: boolean; data: Board } = await axios.post('/boards', boardData);
  return { data: response.data };
}

// 修改看板名称
export async function updateBoard(boardId: number, boardData: { name: string; color?: string }): Promise<{ data: Board }> {
  const response: { success: boolean; data: Board } = await axios.put(`/boards/${boardId}`, boardData);
  return { data: response.data };
}

// 删除一个看板
export async function deleteBoard(boardId: number): Promise<void> {
  await axios.delete(`/boards/${boardId}`);
}