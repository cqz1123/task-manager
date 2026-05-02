/**
 * 成员管理路由模块
 * 定义看板成员相关的 API 路由
 */

const express = require('express');
const router = express.Router();
const { getBoardMembers, updateMemberRole, removeMember } = require('../controllers/memberController');
const { authenticate } = require('../middleware/auth');
const { checkBoardRole } = require('../middleware/boardRole');

/**
 * GET /api/boards/:boardId/members
 * 获取看板成员列表
 * 需要认证：是
 * 需要权限：viewer（至少可查看）
 */
router.get('/boards/:boardId/members', authenticate, checkBoardRole('viewer'), getBoardMembers);

/**
 * PATCH /api/boards/:boardId/members/:userId
 * 修改成员角色
 * 需要认证：是
 * 需要权限：owner（仅所有者可修改）
 */
router.patch('/boards/:boardId/members/:userId', authenticate, checkBoardRole('owner'), updateMemberRole);

/**
 * DELETE /api/boards/:boardId/members/:userId
 * 移除成员
 * 需要认证：是
 * 需要权限：owner（仅所有者可移除）
 */
router.delete('/boards/:boardId/members/:userId', authenticate, checkBoardRole('owner'), removeMember);

// 导出路由模块
module.exports = router;
