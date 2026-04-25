/**
 * 看板路由模块
 * 定义看板相关的 API 路由
 */

const express = require('express');
const router = express.Router();
const { getBoards, createBoard, deleteBoard } = require('../controllers/boardController');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/boards
 * 获取当前登录用户的所有看板
 * 需要认证：是
 */
router.get('/boards', authenticate, getBoards);

/**
 * POST /api/boards
 * 创建新看板
 * 需要认证：是
 */
router.post('/boards', authenticate, createBoard);

/**
 * DELETE /api/boards/:id
 * 删除看板
 * 需要认证：是
 */
router.delete('/boards/:id', authenticate, deleteBoard);

// 导出路由模块
module.exports = router;
