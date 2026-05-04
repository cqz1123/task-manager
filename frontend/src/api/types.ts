/**
 * 统一的 API 响应类型定义
 * 所有后端 API 都应返回此格式
 */

/**
 * 基础响应类型
 * @template T - 响应数据类型
 */
export interface ApiResponse<T = null> {
  /**
   * 请求是否成功
   */
  success: boolean;

  /**
   * 响应数据（成功时返回）
   */
  data?: T;

  /**
   * 错误信息（失败时返回）
   */
  error?: string;

  /**
   * 提示信息（可选）
   */
  message?: string;
}

/**
 * 分页响应类型
 * @template T - 列表项类型
 */
export interface PaginatedResponse<T> {
  /**
   * 数据列表
   */
  list: T[];

  /**
   * 总条数
   */
  total: number;

  /**
   * 当前页码
   */
  page: number;

  /**
   * 每页条数
   */
  pageSize: number;
}

/**
 * API 错误类型
 */
export interface ApiError {
  success: false;
  error: string;
  message?: string;
}

/**
 * 成功响应类型
 * @template T - 响应数据类型
 */
export interface SuccessResponse<T = null> {
  success: true;
  data: T;
  message?: string;
}