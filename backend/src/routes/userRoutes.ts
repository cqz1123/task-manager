/**
 * 用户路由模块
 * 定义用户个人信息相关的 API 路由
 */

const express = require('express');
const router = express.Router();

// 引入认证中间件（JWT 验证）
const { authenticate } = require('../middleware/auth');

// 引入用户控制器
const { updateProfile, updatePassword } = require('../controllers/userController');

/**
 * 修改用户名路由
 * PUT /api/user/profile
 * 需要 JWT 认证
 */
router.put('/profile', authenticate, updateProfile);

/**
 * 修改密码路由
 * PUT /api/user/password
 * 需要 JWT 认证
 */
router.put('/password', authenticate, updatePassword);

// 导出路由模块
module.exports = router;
