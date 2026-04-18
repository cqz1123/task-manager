/**
 * JWT 工具模块
 * 提供 JSON Web Token 的生成和验证功能
 * 用于用户身份认证和授权
 */

// 引入 jsonwebtoken 库，用于生成和验证 JWT
const jwt = require('jsonwebtoken');

// 引入 dotenv，加载 .env 文件中的环境变量
require('dotenv').config();

// 从环境变量获取 JWT 秘钥，如果没有则使用默认值（生产环境应使用强秘钥）
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

// 从环境变量获取 Token 过期时间，默认为 7 天
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Token 载荷接口
 * 定义 JWT 中存储的用户信息
 */
interface TokenPayload {
  userId: number;      // 用户 ID
  username: string;    // 用户名
}

/**
 * 生成 JWT 令牌
 */
function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证并解析 JWT 令牌
 * @param token - JWT 字符串
 * @returns 返回解析后的用户信息（TokenPayload）
 * @throws 如果 token 无效或已过期会抛出异常
 */
function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

// 导出模块
module.exports = {
  generateToken,   // 生成令牌函数
  verifyToken,     // 验证令牌函数
  JWT_SECRET,      // JWT 秘钥
  JWT_EXPIRES_IN  // 过期时间
};
