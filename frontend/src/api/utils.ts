/**
 * API 工具函数
 * 提供统一的响应处理和类型转换
 */

import type { ApiResponse } from './types';

/**
 * 处理 API 响应，确保返回统一的 ApiResponse 格式
 * @param response - 原始响应数据
 * @returns 统一格式的响应
 */
export function handleApiResponse<T = null>(response: any): ApiResponse<T> {
  // 如果响应已经是标准格式，直接返回
  if (response && typeof response.success === 'boolean') {
    return response as ApiResponse<T>;
  }
  
  // 如果响应只有 data 字段（某些后端直接返回数据）
  if (response && response.data !== undefined) {
    return {
      success: true,
      data: response.data as T
    };
  }
  
  // 默认返回成功，数据为响应本身
  return {
    success: true,
    data: response as T
  };
}

/**
 * 创建成功响应
 * @param data - 响应数据
 * @param message - 提示信息（可选）
 * @returns 成功响应对象
 */
export function createSuccessResponse<T = null>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

/**
 * 创建错误响应
 * @param error - 错误信息
 * @param message - 提示信息（可选）
 * @returns 错误响应对象
 */
export function createErrorResponse(error: string, message?: string): ApiResponse {
  return {
    success: false,
    error,
    message
  };
}

/**
 * 检查响应是否成功
 * @param response - API 响应
 * @returns 是否成功
 */
export function isResponseSuccess(response: ApiResponse): boolean {
  return response.success === true;
}

/**
 * 提取响应数据
 * @param response - API 响应
 * @returns 数据（如果成功）或抛出错误
 */
export function extractResponseData<T = null>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error || '请求失败');
  }
  return response.data as T;
}