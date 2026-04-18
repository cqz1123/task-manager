/**
 * Express 类型扩展模块
 * 为 Express Request 对象添加自定义属性
 * 使其支持 userId 和 username 等认证相关属性
 */

// 引入 express 模块，确保类型扩展有效
import 'express';

/**
 * 扩展 Express Request 接口
 * 添加认证相关的可选属性
 * 这些属性会在 JWT 认证中间件中被赋值
 */
declare module 'express' {
  export interface Request {
    userId?: number;     // 当前登录用户的 ID（由认证中间件设置）
    username?: string;  // 当前登录用户的用户名（由认证中间件设置）
  }
}
