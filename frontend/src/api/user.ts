/**
 * 用户相关 API 封装
 * 提供修改用户名、修改密码等功能
 */

import axios from './axios';

/**
 * 修改用户名
 * @param data - { username: string }
 * @returns 更新后的用户信息
 */
export const updateProfile = async (data: { username: string }) => {
  const response = await axios.put('/user/profile', data);
  return response;
};

/**
 * 修改密码
 * @param data - { oldPassword: string, newPassword: string }
 * @returns 成功消息
 */
export const updatePassword = async (data: { oldPassword: string; newPassword: string }) => {
  const response = await axios.put('/user/password', data);
  return response;
};
