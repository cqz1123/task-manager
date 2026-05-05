/**
 * 认证控制器模块
 * 处理用户注册、登录和获取当前用户信息的请求
 * 提供完整的用户认证功能
 */

const { register: registerService, login: loginService, getCurrentUser: getCurrentUserService } = require('../services/authService');

/**
 * 用户注册处理函数
 */
async function register(req: any, res: any): Promise<void> {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: '请提供完整的注册信息（用户名、邮箱、密码）' });
      return;
    }

    const result = await registerService(username, email, password);

    res.status(201).json({
      message: '注册成功',
      token: result.token,
      user: {
        id: result.userId,
        username: result.username,
        email: result.email
      }
    });
  } catch (error: any) {
    console.error('注册错误:', error);
    if (error.message === '用户名或邮箱已存在') {
      res.status(409).json({ error: error.message });
    } else if (error.message === '密码长度至少为 6 个字符') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
}

/**
 * 用户登录处理函数
 */
async function login(req: any, res: any): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: '请提供邮箱和密码' });
      return;
    }

    const result = await loginService(email, password);

    res.status(200).json({
      message: '登录成功',
      token: result.token,
      user: {
        id: result.userId,
        username: result.username,
        email: result.email
      }
    });
  } catch (error: any) {
    console.error('登录错误:', error);
    if (error.message === '邮箱或密码错误') {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
}

/**
 * 获取当前登录用户信息处理函数
 */
async function getCurrentUser(req: any, res: any): Promise<void> {
  try {
    const userId = req.userId;
    const user = await getCurrentUserService(userId);
    res.status(200).json({ user });
  } catch (error: any) {
    console.error('获取用户信息错误:', error);
    if (error.message === '用户不存在') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
}

module.exports = {
  register,
  login,
  getCurrentUser
};