/**
 * 用户相关 API 封装
 * 提供修改用户名、修改密码等功能
 */

import axios from './axios';
import type { ApiResponse } from './types';

// 用户信息类型
export interface UserProfile {
  id: number;
  username: string;
  email: string;
}

/**
 * 修改用户名
 * @param data - { username: string }
 * @returns 更新后的用户信息
 */
export const updateProfile = async (data: { username: string }): Promise<ApiResponse<UserProfile>> => {
  const response = await axios.put('/user/profile', data) as ApiResponse<UserProfile>;
  return response;
};

/**
 * 修改密码
 * @param data - { oldPassword: string, newPassword: string }
 * @returns 成功消息
 */
export const updatePassword = async (data: { oldPassword: string; newPassword: string }): Promise<ApiResponse> => {
  const response = await axios.put('/user/password', data) as ApiResponse;
  return response;
};
