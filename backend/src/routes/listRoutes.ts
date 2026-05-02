/**
 * 列表路由模块
 * 定义列表相关的 API 路由
 */

const express = require('express');
const router = express.Router();
const { getListsWithCards, createList, deleteList, updateList } = require('../controllers/listController');
const { authenticate } = require('../middleware/auth');
const { checkBoardRole } = require('../middleware/boardRole');

/**
 * GET /api/boards/:boardId/lists-with-cards
 * 获取单个看板的所有列表及其卡片
 * 需要认证：是
 * 需要权限：viewer（查看权限）
 */
router.get('/boards/:boardId/lists-with-cards', authenticate, checkBoardRole('viewer'), getListsWithCards);

/**
 * POST /api/boards/:boardId/lists
 * 创建新列表
 * 需要认证：是
 * 需要权限：editor（编辑权限）
 */
router.post('/boards/:boardId/lists', authenticate, checkBoardRole('editor'), createList);

/**
 * PUT /api/boards/:boardId/lists/:listId
 * 修改列表标题
 * 需要认证：是
 * 需要权限：editor（编辑权限）
 */
router.put('/boards/:boardId/lists/:listId', authenticate, checkBoardRole('editor'), updateList);

/**
 * DELETE /api/boards/:boardId/lists/:listId
 * 删除列表
 * 需要认证：是
 * 需要权限：editor（编辑权限）
 */
router.delete('/boards/:boardId/lists/:listId', authenticate, checkBoardRole('editor'), deleteList);

// 导出路由模块
module.exports = router;
