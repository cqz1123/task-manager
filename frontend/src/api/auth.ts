/**
 * 认证 API 模块
 * 处理登录、注册和用户信息相关的 API 请求
 */

import api from './axios';
import type { ApiResponse } from './types';

// 用户接口定义
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  created_at?: string;
}

// 登录请求接口
export interface LoginRequest {
  email: string;
  password: string;
}

// 注册请求接口
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// 认证响应数据接口
export interface AuthData {
  message: string;
  token: string;
  user: User;
}

/**
 * 登录函数
 */
export const login = async (data: LoginRequest): Promise<ApiResponse<AuthData>> => {
  const response = await api.post('/auth/login', data) as ApiResponse<AuthData>;
  return response;
};

/**
 * 注册函数
 */
export const register = async (data: RegisterRequest): Promise<ApiResponse<AuthData>> => {
  const response = await api.post('/auth/register', data) as ApiResponse<AuthData>;
  return response;
};

/**
 * 获取当前用户信息
 * @returns 用户信息
 */
export const getCurrentUser = async (): Promise<ApiResponse<{ user: User }>> => {
  const response = await api.get('/auth/me') as ApiResponse<{ user: User }>;
  return response;
};
