import axios from './axios';
import type { ApiResponse } from './types';
import type { Board } from '../types/Board';

// 获取当前用户的所有看板
export async function getBoards(): Promise<ApiResponse<Board[]>> {
  const response = await axios.get('/boards') as ApiResponse<Board[]>;
  return response;
}

// 创建一个新的看板
export async function createBoard(boardData: { name: string; color?: string }): Promise<ApiResponse<Board>> {
  const response = await axios.post('/boards', boardData) as ApiResponse<Board>;
  return response;
}

// 修改看板名称
export async function updateBoard(boardId: number, boardData: { name: string; color?: string }): Promise<ApiResponse<Board>> {
  const response = await axios.put(`/boards/${boardId}`, boardData) as ApiResponse<Board>;
  return response;
}

// 删除一个看板
export async function deleteBoard(boardId: number): Promise<ApiResponse> {
  const response = await axios.delete(`/boards/${boardId}`) as ApiResponse;
  return response;
}

// 通过邀请码加入看板
export interface JoinBoardData {
  board: Board;
  myRole: string;
}
export async function joinBoardByCode(inviteCode: string): Promise<ApiResponse<JoinBoardData>> {
  const response = await axios.post('/boards/join-by-code', { inviteCode }) as ApiResponse<JoinBoardData>;
  return response;
}

// 重新生成邀请码
export interface RegenerateInviteCodeData {
  inviteCode: string;
  message: string;
}
export async function regenerateInviteCode(boardId: number): Promise<ApiResponse<RegenerateInviteCodeData>> {
  const response = await axios.post(`/boards/${boardId}/invite-code`) as ApiResponse<RegenerateInviteCodeData>;
  return response;
}