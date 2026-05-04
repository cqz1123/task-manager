/**
 * Axios 配置文件
 * 统一配置 HTTP 请求，处理认证令牌和错误
 */

import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // 后端 API 基础路径
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 将后端响应转换为统一的 ApiResponse 格式
function transformResponse(data: any): any {
  // 如果数据为空，返回成功但无数据
  if (data === undefined || data === null) {
    return {
      success: true,
      data: null,
      error: undefined
    };
  }
  
  // 如果已经是统一格式（有 success 字段且有 data 字段），直接返回
  if (typeof data.success === 'boolean' && data.data !== undefined) {
    return data;
  }
  
  // 如果有 success 字段但没有 data 字段（部分后端接口的格式）
  if (typeof data.success === 'boolean') {
    if (data.success) {
      // 将其他字段作为 data 内容
      const { success, error, message, ...rest } = data;
      return {
        success: true,
        data: { ...rest, message },
        error: undefined
      };
    } else {
      return {
        success: false,
        data: null,
        error: data.error || data.message || '操作失败'
      };
    }
  }
  
  // 如果有 error 字段，说明是错误响应
  if (data.error) {
    return {
      success: false,
      error: data.error,
      data: null
    };
  }
  
  // 登录/注册成功响应: { message, token, user }
  if (data.token && data.user) {
    return {
      success: true,
      data: {
        message: data.message,
        token: data.token,
        user: data.user
      },
      error: undefined
    };
  }
  
  // 获取用户信息响应: { user }
  if (data.user) {
    return {
      success: true,
      data: { user: data.user },
      error: undefined
    };
  }
  
  // 更新用户信息响应（返回用户对象）
  if (data.username || data.email) {
    return {
      success: true,
      data: data,
      error: undefined
    };
  }
  
  // 其他成功响应，直接包装
  return {
    success: true,
    data: data,
    error: undefined
  };
}

// 响应拦截器：处理错误和格式转换
api.interceptors.response.use(
  (response) => {
    return transformResponse(response.data);
  },
  (error) => {
    if (error.response?.status === 401) {
      // 认证失败，清除令牌并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // 将错误响应也转换为统一格式
    const errorData = error.response?.data || { error: error.message };
    return Promise.reject(transformResponse(errorData));
  }
);

export default api;
