/**
 * 用户控制器模块
 * 处理用户个人信息相关的请求
 * 包括修改用户名、修改密码等功能
 */

// 引入数据库连接池
const pool = require('../config/database');

// 引入密码加密工具函数
const { hashPassword, comparePassword } = require('../utils/bcrypt');

/**
 * 修改用户名请求体接口
 */
interface UpdateProfileBody {
  username: string;
}

/**
 * 修改密码请求体接口
 */
interface UpdatePasswordBody {
  oldPassword: string;
  newPassword: string;
}

/**
 * 修改用户名处理函数
 * 流程：验证输入 -> 检查用户名是否已被使用 -> 更新用户名 -> 返回更新后的用户信息
 */
async function updateProfile(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取当前用户 ID
    const userId = req.userId;
    
    // 从请求体中解构获取新用户名
    const { username }: UpdateProfileBody = req.body;

    // 验证用户名是否为空
    if (!username || username.trim().length === 0) {
      res.status(400).json({ success: false, error: '用户名不能为空' });
      return;
    }

    // 验证用户名长度
    if (username.length < 2 || username.length > 30) {
      res.status(400).json({ success: false, error: '用户名长度必须在 2-30 个字符之间' });
      return;
    }

    // 查询数据库，检查新用户名是否已被其他用户使用（排除当前用户）
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, userId]
    );

    const existingUsersArray = existingUsers as any[];

    // 如果找到已存在的用户名，返回409冲突错误
    if (existingUsersArray.length > 0) {
      res.status(409).json({ success: false, error: '用户名已被使用' });
      return;
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

    // 返回成功响应，包含更新后的用户信息
    res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email
      }
    });
  } catch (error: any) {
    // 捕获并记录服务器错误
    console.error('修改用户名错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}

/**
 * 修改密码处理函数
 * 流程：验证输入 -> 查询用户 -> 验证旧密码 -> 哈希新密码 -> 更新密码 -> 返回成功消息
 */
async function updatePassword(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取当前用户 ID
    const userId = req.userId;
    
    // 从请求体中解构获取旧密码和新密码
    const { oldPassword, newPassword }: UpdatePasswordBody = req.body;

    // 验证必填字段是否完整
    if (!oldPassword || !newPassword) {
      res.status(400).json({ success: false, error: '请提供旧密码和新密码' });
      return;
    }

    // 验证新密码长度（至少6个字符）
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: '新密码长度至少为 6 个字符' });
      return;
    }

    // 查询用户当前的密码哈希值
    const [users] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    const userArray = users as any[];

    // 如果未找到用户，返回404错误
    if (userArray.length === 0) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }

    const user = userArray[0];

    // 使用 bcrypt 验证旧密码是否正确
    const isOldPasswordValid = await comparePassword(oldPassword, user.password_hash);

    // 如果旧密码不正确，返回401错误
    if (!isOldPasswordValid) {
      res.status(401).json({ success: false, error: '原密码错误' });
      return;
    }

    // 使用 bcrypt 对新密码进行哈希加密
    const newPasswordHash = await hashPassword(newPassword);

    // 更新用户的密码哈希值
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, userId]
    );

    // 返回成功响应
    res.status(200).json({
      success: true,
      message: 'Password updated'
    });
  } catch (error: any) {
    // 捕获并记录服务器错误
    console.error('修改密码错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}

// 导出控制器函数
module.exports = {
  updateProfile,   // 修改用户名
  updatePassword   // 修改密码
};
