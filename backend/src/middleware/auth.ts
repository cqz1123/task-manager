/**
 * JWT 认证中间件模块
 * 验证请求头中的 JWT 令牌，实现用户身份认证
 * 保护需要登录才能访问的路由
 */

// 从 jwt 工具模块引入 verifyToken 函数
const { verifyToken } = require('../utils/jwt');

function authenticate(req: any, res: any, next: any): void {
  // 从请求头中获取 Authorization 字段
  const authHeader = req.headers.authorization;

  // 如果没有提供认证令牌，返回 401 错误
  if (!authHeader) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }

  // 将令牌字符串按空格分割成数组
  // 期望格式: "Bearer <token>"
  const parts = authHeader.split(' ');

  // 验证令牌格式是否正确（必须是两个部分，且第一部分是 "Bearer"）
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: '令牌格式无效，请使用 Bearer <token>' });
    return;
  }

  // 提取令牌字符串（第二部分）
  const token = parts[1];

  try {
    // 验证令牌并获取解码后的用户信息
    const decoded = verifyToken(token);

    // 将用户 ID 和用户名附加到请求对象上，供后续中间件或路由使用
    req.userId = decoded.userId;
    req.username = decoded.username;

    // 调用 next() 将控制权传递给下一个中间件
    next();
  } catch (error) {
    // 如果令牌验证失败（如过期、无效），返回 401 错误
    res.status(401).json({ error: '令牌验证失败或已过期' });
  }
}

// 导出中间件
module.exports = {
  authenticate  // 认证中间件
};
