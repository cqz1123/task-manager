/**
 * 密码加密工具模块
 * 提供密码的哈希加密和验证功能
 * 使用 bcrypt 算法实现安全的密码存储
 */

// 引入 bcryptjs 库，用于密码哈希和验证
const bcrypt = require('bcryptjs');

// 密码哈希的盐轮数，数值越高越安全但越慢（10 是安全性和性能的平衡值）
const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  // 使用 bcrypt 的 hash 方法对密码进行哈希
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码是否匹配
 */
async function comparePassword(password: string, hash: string): Promise<boolean> {
  // 使用 bcrypt 的 compare 方法比较明文密码和哈希值
  return bcrypt.compare(password, hash);
}

// 导出模块
module.exports = {
  hashPassword,    // 密码加密函数
  comparePassword, // 密码验证函数
  SALT_ROUNDS     // 盐轮数常量
};
