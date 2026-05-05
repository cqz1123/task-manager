/**
 * 用户控制器模块
 * 处理用户个人信息相关的 HTTP 请求，调用 service 层处理业务逻辑
 */

const { updateProfile: updateProfileService, updatePassword: updatePasswordService } = require('../services/userService');

/**
 * 修改用户名处理函数
 */
async function updateProfile(req: any, res: any): Promise<void> {
  try {
    const userId = req.userId;
    const { username } = req.body;

    if (!username || username.trim().length === 0) {
      res.status(400).json({ success: false, error: '用户名不能为空' });
      return;
    }

    const updatedUser = await updateProfileService(userId, username);

    res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error: any) {
    console.error('修改用户名错误:', error);
    if (error.message === '用户名长度必须在 2-30 个字符之间') {
      res.status(400).json({ success: false, error: error.message });
    } else if (error.message === '用户名已被使用') {
      res.status(409).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: '服务器内部错误' });
    }
  }
}

/**
 * 修改密码处理函数
 */
async function updatePassword(req: any, res: any): Promise<void> {
  try {
    const userId = req.userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({ success: false, error: '请提供旧密码和新密码' });
      return;
    }

    await updatePasswordService(userId, oldPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password updated'
    });
  } catch (error: any) {
    console.error('修改密码错误:', error);
    if (error.message === '新密码长度至少为 6 个字符') {
      res.status(400).json({ success: false, error: error.message });
    } else if (error.message === '用户不存在') {
      res.status(404).json({ success: false, error: error.message });
    } else if (error.message === '原密码错误') {
      res.status(401).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: '服务器内部错误' });
    }
  }
}

module.exports = {
  updateProfile,
  updatePassword
};