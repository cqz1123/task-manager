/**
 * 看板路由模块
 * 定义看板相关的 API 路由
 */

const express = require('express');
const router = express.Router();
const { getBoards, createBoard, deleteBoard, updateBoard, joinByInviteCode, regenerateInviteCode } = require('../controllers/boardController');
const { authenticate } = require('../middleware/auth');
const { checkBoardRole } = require('../middleware/boardRole');

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
 * PUT /api/boards/:boardId
 * 修改看板名称（可选颜色）
 * 需要认证：是
 * 需要权限：owner
 */
router.put('/boards/:boardId', authenticate, checkBoardRole('owner'), updateBoard);

/**
 * DELETE /api/boards/:boardId
 * 删除看板
 * 需要认证：是
 * 需要权限：owner
 */
router.delete('/boards/:boardId', authenticate, checkBoardRole('owner'), deleteBoard);

/**
 * POST /api/boards/join-by-code
 * 通过邀请码加入看板
 * 需要认证：是
 */
router.post('/boards/join-by-code', authenticate, joinByInviteCode);

/**
 * POST /api/boards/:boardId/invite-code
 * 重新生成邀请码
 * 需要认证：是
 * 需要权限：owner
 */
router.post('/boards/:boardId/invite-code', authenticate, checkBoardRole('owner'), regenerateInviteCode);

// 导出路由模块
module.exports = router;
