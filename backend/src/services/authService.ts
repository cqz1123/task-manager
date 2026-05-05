/**
 * 认证服务模块
 * 封装用户注册、登录等认证相关业务逻辑
 */

const pool = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/bcrypt');

/**
 * 用户注册
 * @param username 用户名
 * @param email 邮箱
 * @param password 密码
 * @returns 注册成功的用户信息和令牌
 */
export async function register(username: string, email: string, password: string) {
  // 验证密码长度
  if (password.length < 6) {
    throw new Error('密码长度至少为 6 个字符');
  }

  // 查询数据库，检查用户名或邮箱是否已被注册
  const [existingUsers] = await pool.query(
    'SELECT id FROM users WHERE email = ? OR username = ?',
    [email, username]
  );

  if (Array.isArray(existingUsers) && existingUsers.length > 0) {
    throw new Error('用户名或邮箱已存在');
  }

  // 使用 bcrypt 对密码进行哈希加密
  const passwordHash = await hashPassword(password);

  // 将新用户信息插入数据库
  const [result] = await pool.query(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, passwordHash]
  );

  const insertResult = result as any;
  const userId = insertResult.insertId;

  // 为新用户生成 JWT 令牌
  const token = generateToken({ userId, username });

  return {
    userId,
    username,
    email,
    token
  };
}

/**
 * 用户登录
 * @param email 邮箱
 * @param password 密码
 * @returns 用户信息和令牌
 */
export async function login(email: string, password: string) {
  // 从数据库查询用户信息（包含密码哈希值）
  const [users] = await pool.query(
    'SELECT id, username, email, password_hash FROM users WHERE email = ?',
    [email]
  );

  const userArray = users as any[];

  if (userArray.length === 0) {
    throw new Error('邮箱或密码错误');
  }

  const user = userArray[0];

  // 使用 bcrypt 验证输入的密码是否与数据库中的哈希值匹配
  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('邮箱或密码错误');
  }

  // 密码验证成功后，生成 JWT 令牌
  const token = generateToken({ userId: user.id, username: user.username });

  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    token
  };
}

/**
 * 获取当前登录用户信息
 * @param userId 用户ID
 * @returns 用户信息
 */
export async function getCurrentUser(userId: number) {
  // 从数据库查询用户的完整信息（不包含密码）
  const [users] = await pool.query(
    'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?',
    [userId]
  );

  const userArray = users as any[];

  if (userArray.length === 0) {
    throw new Error('用户不存在');
  }

  return userArray[0];
}