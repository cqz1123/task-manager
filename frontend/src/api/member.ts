import axios from './axios';
import type { MemberListResponse } from '../types/Board';

// 获取看板成员列表
export async function getBoardMembers(boardId: number): Promise<MemberListResponse> {
  const response: { success: boolean; data: MemberListResponse } = await axios.get(`/boards/${boardId}/members`);
  return response.data;
}

// 修改成员角色
export async function updateMemberRole(boardId: number, userId: number, role: 'editor' | 'viewer'): Promise<{ data: any }> {
  const response: { success: boolean; data: any } = await axios.patch(`/boards/${boardId}/members/${userId}`, { role });
  return response;
}

// 移除成员
export async function removeMember(boardId: number, userId: number): Promise<void> {
  await axios.delete(`/boards/${boardId}/members/${userId}`);
}