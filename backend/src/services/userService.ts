/**
 * 用户服务模块
 * 封装用户个人信息相关的业务逻辑
 */

const pool = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/bcrypt');

/**
 * 修改用户名
 * @param userId 用户ID
 * @param username 新用户名
 * @returns 更新后的用户信息
 */
export async function updateProfile(userId: number, username: string) {
  // 验证用户名是否为空
  if (!username || username.trim().length === 0) {
    throw new Error('用户名不能为空');
  }

  // 验证用户名长度
  if (username.length < 2 || username.length > 30) {
    throw new Error('用户名长度必须在 2-30 个字符之间');
  }

  // 查询数据库，检查新用户名是否已被其他用户使用（排除当前用户）
  const [existingUsers] = await pool.query(
    'SELECT id FROM users WHERE username = ? AND id != ?',
    [username, userId]
  );

  const existingUsersArray = existingUsers as any[];

  if (existingUsersArray.length > 0) {
    throw new Error('用户名已被使用');
  }

  // 更新用户的用户名
  await pool.query(
    'UPDATE users SET username = ? WHERE id = ?',
    [username, userId]
  );

  // 查询更新后的用户信息（不包含密码）
  const [users] = await pool.query(
    'SELECT id, username, email FROM users WHERE id = ?',
    [userId]
  );

  const userArray = users as any[];
  const updatedUser = userArray[0];

  return {
    id: updatedUser.id,
    username: updatedUser.username,
    email: updatedUser.email
  };
}

/**
 * 修改密码
 * @param userId 用户ID
 * @param oldPassword 旧密码
 * @param newPassword 新密码
 */
export async function updatePassword(userId: number, oldPassword: string, newPassword: string) {
  // 验证新密码长度（至少6个字符）
  if (newPassword.length < 6) {
    throw new Error('新密码长度至少为 6 个字符');
  }

  // 查询用户当前的密码哈希值
  const [users] = await pool.query(
    'SELECT password_hash FROM users WHERE id = ?',
    [userId]
  );

  const userArray = users as any[];

  if (userArray.length === 0) {
    throw new Error('用户不存在');
  }

  const user = userArray[0];

  // 使用 bcrypt 验证旧密码是否正确
  const isOldPasswordValid = await comparePassword(oldPassword, user.password_hash);

  if (!isOldPasswordValid) {
    throw new Error('原密码错误');
  }

  // 使用 bcrypt 对新密码进行哈希加密
  const newPasswordHash = await hashPassword(newPassword);

  // 更新用户的密码哈希值
  await pool.query(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [newPasswordHash, userId]
  );
}