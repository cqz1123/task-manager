/**
 * 卡片路由模块
 * 定义卡片相关的 API 路由
 */

const express = require('express');
const router = express.Router();
const { createCard, deleteCard, updateCard, updateCardPosition, completeCard, uncompleteCard } = require('../controllers/cardController');
const { authenticate } = require('../middleware/auth');
const { checkBoardRole } = require('../middleware/boardRole');

/**
 * POST /api/boards/:boardId/cards
 * 创建新卡片
 * 需要认证：是
 * 需要权限：editor（编辑权限）
 */
router.post('/boards/:boardId/cards', authenticate, checkBoardRole('editor'), createCard);

/**
 * PUT /api/boards/:boardId/cards/:cardId
 * 修改卡片的所有字段（支持部分更新）
 * 需要认证：是
 * 需要权限：editor（编辑权限）
 */
router.put('/boards/:boardId/cards/:cardId', authenticate, checkBoardRole('editor'), updateCard);

/**
 * PATCH /api/boards/:boardId/cards/:cardId/position
 * 修改卡片位置（支持拖拽排序和跨列表移动）
 * 需要认证：是
 * 需要权限：editor（编辑权限）
 */
router.patch('/boards/:boardId/cards/:cardId/position', authenticate, checkBoardRole('editor'), updateCardPosition);

/**
 * DELETE /api/boards/:boardId/cards/:cardId
 * 删除卡片
 * 需要认证：是
 * 需要权限：editor（编辑权限）
 */
router.delete('/boards/:boardId/cards/:cardId', authenticate, checkBoardRole('editor'), deleteCard);

/**
 * POST /api/boards/:boardId/cards/:cardId/complete
 * 完成卡片（移动到"已完成"列表）
 * 需要认证：是
 * 需要权限：editor（编辑权限）
 */
router.post('/boards/:boardId/cards/:cardId/complete', authenticate, checkBoardRole('editor'), completeCard);

/**
 * POST /api/boards/:boardId/cards/:cardId/uncomplete
 * 撤销完成卡片（移回原列表）
 * 需要认证：是
 * 需要权限：editor（编辑权限）
 */
router.post('/boards/:boardId/cards/:cardId/uncomplete', authenticate, checkBoardRole('editor'), uncompleteCard);

// 导出路由模块
module.exports = router;
