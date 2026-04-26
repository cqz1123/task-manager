/**
 * 列表路由模块
 * 定义列表相关的 API 路由
 */

const express = require('express');
const router = express.Router();
const { getListsWithCards, createList, deleteList, updateList } = require('../controllers/listController');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/boards/:boardId/lists-with-cards
 * 获取单个看板的所有列表及其卡片
 * 需要认证：是
 */
router.get('/boards/:boardId/lists-with-cards', authenticate, getListsWithCards);

/**
 * POST /api/lists
 * 创建新列表
 * 需要认证：是
 */
router.post('/lists', authenticate, createList);

/**
 * PUT /api/lists/:listId
 * 修改列表标题
 * 需要认证：是
 */
router.put('/lists/:listId', authenticate, updateList);

/**
 * DELETE /api/lists/:listId
 * 删除列表
 * 需要认证：是
 */
router.delete('/lists/:listId', authenticate, deleteList);

// 导出路由模块
module.exports = router;
