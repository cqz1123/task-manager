/**
 * 成员存储模块
 * 管理看板中的成员数据，包括成员的CRUD操作
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as memberApi from '../api/member';
import type { BoardMember } from '../types/Board';

export const useMemberStore = defineStore('member', () => {
  // 状态
  const members = ref<BoardMember[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 获取看板成员列表
   */
  const fetchMembers = async (boardId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await memberApi.getBoardMembers(boardId);
      if (response.success && response.data) {
        // 合并 owner 和 members
        const allMembers: BoardMember[] = [];
        if (response.data.owner) {
          allMembers.push(response.data.owner);
        }
        allMembers.push(...response.data.members);
        members.value = allMembers;
        return allMembers;
      }
    } catch (err: any) {
      error.value = err.error || '获取成员列表失败';
      console.error('获取成员列表失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 修改成员角色
   */
  const updateMemberRole = async (boardId: number, userId: number, role: 'editor' | 'viewer') => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await memberApi.updateMemberRole(boardId, userId, role);
      if (response.success) {
        // 更新本地成员列表
        const memberIndex = members.value.findIndex(member => member.userId === userId);
        if (memberIndex !== -1) {
          members.value[memberIndex]!.role = role;
        }
      } else {
        throw new Error(response.error || '修改成员角色失败');
      }
    } catch (err: any) {
      error.value = err.error || '修改成员角色失败';
      console.error('修改成员角色失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 移除成员
   */
  const removeMember = async (boardId: number, userId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await memberApi.removeMember(boardId, userId);
      if (response.success) {
        // 从本地成员列表移除
        members.value = members.value.filter(member => member.userId !== userId);
      } else {
        throw new Error(response.error || '移除成员失败');
      }
    } catch (err: any) {
      error.value = err.error || '移除成员失败';
      console.error('移除成员失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 重置状态
   */
  const resetState = () => {
    members.value = [];
    error.value = null;
  };

  return {
    members,
    loading,
    error,
    fetchMembers,
    updateMemberRole,
    removeMember,
    resetState
  };
});