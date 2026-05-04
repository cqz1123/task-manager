import axios from './axios';
import type { ApiResponse } from './types';
import type { MemberListResponse } from '../types/Board';

// 获取看板成员列表
export async function getBoardMembers(boardId: number): Promise<ApiResponse<MemberListResponse>> {
  const response = await axios.get(`/boards/${boardId}/members`) as ApiResponse<MemberListResponse>;
  return response;
}

// 修改成员角色
export async function updateMemberRole(boardId: number, userId: number, role: 'editor' | 'viewer'): Promise<ApiResponse> {
  const response = await axios.patch(`/boards/${boardId}/members/${userId}`, { role }) as ApiResponse;
  return response;
}

// 移除成员
export async function removeMember(boardId: number, userId: number): Promise<ApiResponse> {
  const response = await axios.delete(`/boards/${boardId}/members/${userId}`) as ApiResponse;
  return response;
}