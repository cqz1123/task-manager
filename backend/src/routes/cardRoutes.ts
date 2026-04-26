/**
 * 卡片路由模块
 * 定义卡片相关的 API 路由
 */

const express = require('express');
const router = express.Router();
const { createCard, deleteCard, updateCard } = require('../controllers/cardController');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/cards
 * 创建新卡片
 * 需要认证：是
 */
router.post('/cards', authenticate, createCard);

/**
 * PUT /api/cards/:cardId
 * 修改卡片的所有字段（支持部分更新）
 * 需要认证：是
 */
router.put('/cards/:cardId', authenticate, updateCard);

/**
 * DELETE /api/cards/:cardId
 * 删除卡片
 * 需要认证：是
 */
router.delete('/cards/:cardId', authenticate, deleteCard);

// 导出路由模块
module.exports = router;
