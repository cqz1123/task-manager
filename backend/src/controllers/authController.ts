const pool = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/bcrypt');

interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

async function register(req: any, res: any): Promise<void> {
  try {
    const { username, email, password }: RegisterBody = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: '请提供完整的注册信息（用户名、邮箱、密码）' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: '密码长度至少为 6 个字符' });
      return;
    }

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      res.status(409).json({ error: '用户名或邮箱已存在' });
      return;
    }

    const passwordHash = await hashPassword(password);

    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    const insertResult = result as any;
    const userId = insertResult.insertId;

    const token = generateToken({ userId, username });

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: userId,
        username,
        email
      }
    });
  } catch (error: any) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

async function login(req: any, res: any): Promise<void> {
  try {
    const { email, password }: LoginBody = req.body;

    if (!email || !password) {
      res.status(400).json({ error: '请提供邮箱和密码' });
      return;
    }

    const [users] = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = ?',
      [email]
    );

    const userArray = users as any[];
    if (userArray.length === 0) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }

    const user = userArray[0];

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }

    const token = generateToken({ userId: user.id, username: user.username });

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
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

async function getCurrentUser(req: any, res: any): Promise<void> {
  try {
    const userId = req.userId;

    const [users] = await pool.query(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?',
      [userId]
    );

    const userArray = users as any[];
    if (userArray.length === 0) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    res.status(200).json({ user: userArray[0] });
  } catch (error: any) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

module.exports = {
  register,
  login,
  getCurrentUser
};
