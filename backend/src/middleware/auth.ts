const { verifyToken } = require('../utils/jwt');

function authenticate(req: any, res: any, next: any): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: '令牌格式无效，请使用 Bearer <token>' });
    return;
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    res.status(401).json({ error: '令牌验证失败或已过期' });
  }
}

module.exports = {
  authenticate
};
