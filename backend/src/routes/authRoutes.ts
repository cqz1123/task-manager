/**
 * 认证路由模块
 * 定义用户认证相关的 HTTP 路由
 * 包括注册、登录和获取当前用户信息
 */

// 引入 Express 框架的 Router 功能
const express = require('express');

// 引入认证控制器中的处理函数
const { register, login, getCurrentUser } = require('../controllers/authController');

// 引入认证中间件，用于保护需要登录的路由
const { authenticate } = require('../middleware/auth');

// 创建路由实例
const router = express.Router();

/**
 * POST /register
 * 用户注册路由
 * 公开路由，无需认证
 */
router.post('/register', register);

/**
 * POST /login
 * 用户登录路由
 * 公开路由，无需认证
 */
router.post('/login', login);

/**
 * GET /me
 * 获取当前登录用户信息
 * 受保护路由，需要携带有效的 JWT 令牌
 * 使用 authenticate 中间件进行身份验证
 */
router.get('/me', authenticate, getCurrentUser);

// 导出路由模块
module.exports = router;
