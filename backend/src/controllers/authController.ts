/**
 * 认证控制器模块
 * 处理用户注册、登录和获取当前用户信息的请求
 * 提供完整的用户认证功能
 */

// 引入数据库连接池
const pool = require('../config/database');

// 引入 JWT 工具函数，用于生成令牌
const { generateToken } = require('../utils/jwt');

// 引入密码加密工具函数
const { hashPassword, comparePassword } = require('../utils/bcrypt');

/**
 * 注册请求体接口
 * 定义用户注册时需要提交的数据结构
 */
interface RegisterBody {
  username: string;  // 用户名
  email: string;     // 邮箱
  password: string;   // 密码
}

/**
 * 登录请求体接口
 * 定义用户登录时需要提交的数据结构
 */
interface LoginBody {
  email: string;    // 邮箱
  password: string;  // 密码
}

/**
 * 用户注册处理函数
 * 流程：验证输入 -> 检查用户是否存在 -> 加密密码 -> 创建用户 -> 生成 Token
 */
async function register(req: any, res: any): Promise<void> {
  try {
    // 从请求体中解构获取用户注册信息
    const { username, email, password }: RegisterBody = req.body;

    // 验证必填字段是否完整
    if (!username || !email || !password) {
      res.status(400).json({ error: '请提供完整的注册信息（用户名、邮箱、密码）' });
      return;
    }

    // 验证密码长度（至少6个字符）
    if (password.length < 6) {
      res.status(400).json({ error: '密码长度至少为 6 个字符' });
      return;
    }

    // 查询数据库，检查用户名或邮箱是否已被注册
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    // 如果找到已存在的用户，返回409冲突错误
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      res.status(409).json({ error: '用户名或邮箱已存在' });
      return;
    }

    // 使用 bcrypt 对密码进行哈希加密（不存储明文密码）
    const passwordHash = await hashPassword(password);

    // 将新用户信息插入数据库
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    // 获取插入操作生成的用户 ID
    const insertResult = result as any;
    const userId = insertResult.insertId;

    // 为新用户生成 JWT 令牌
    const token = generateToken({ userId, username });

    // 返回成功响应，包含令牌和用户基本信息
    res.status(201).json({
      message: '注册成功',
      token,  // 返回 JWT 令牌，客户端可用于后续请求的身份认证
      user: {
        id: userId,
        username,
        email
      }
    });
  } catch (error: any) {
    // 捕获并记录服务器错误
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

/**
 * 用户登录处理函数
 * 流程：验证输入 -> 查询用户 -> 验证密码 -> 生成 Token
 */
async function login(req: any, res: any): Promise<void> {
  try {
    // 从请求体中解构获取登录信息
    const { email, password }: LoginBody = req.body;

    // 验证必填字段是否完整
    if (!email || !password) {
      res.status(400).json({ error: '请提供邮箱和密码' });
      return;
    }

    // 从数据库查询用户信息（包含密码哈希值）
    const [users] = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = ?',
      [email]
    );

    const userArray = users as any[];

    // 如果没有找到对应邮箱的用户，返回401错误（不提示具体是邮箱还是密码错误）
    if (userArray.length === 0) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }

    // 获取用户对象
    const user = userArray[0];

    // 使用 bcrypt 验证输入的密码是否与数据库中的哈希值匹配
    const isPasswordValid = await comparePassword(password, user.password_hash);

    // 如果密码不匹配，返回401错误
    if (!isPasswordValid) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }

    // 密码验证成功后，生成 JWT 令牌
    const token = generateToken({ userId: user.id, username: user.username });

    // 返回成功响应，包含令牌和用户基本信息
    res.status(200).json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error: any) {
    // 捕获并记录服务器错误
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

/**
 * 获取当前登录用户信息处理函数
 * 需要携带有效的 JWT 令牌访问
 */
async function getCurrentUser(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取通过认证中间件附加的用户 ID
    const userId = req.userId;

    // 从数据库查询用户的完整信息（不包含密码）
    const [users] = await pool.query(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?',
      [userId]
    );

    const userArray = users as any[];

    // 如果未找到用户（可能已被删除），返回404错误
    if (userArray.length === 0) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    // 返回用户信息
    res.status(200).json({ user: userArray[0] });
  } catch (error: any) {
    // 捕获并记录服务器错误
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

// 导出控制器函数
module.exports = {
  register,       // 用户注册
  login,         // 用户登录
  getCurrentUser // 获取当前用户
};
