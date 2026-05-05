/**
 * 卡片控制器模块
 * 处理卡片相关的 HTTP 请求，调用 service 层处理业务逻辑
 */

const { createCard: createCardService, deleteCard: deleteCardService, updateCard: updateCardService, updateCardPosition: updateCardPositionService, completeCard: completeCardService, uncompleteCard: uncompleteCardService } = require('../services/cardService');
const { emitToBoard } = require('../socket/helpers');
const { getOrCreateCompletedList, getCompletedList, getFirstNonSystemList } = require('../services/listService');

/**
 * 创建新卡片
 * 验证用户权限后，调用 service 创建新卡片
 */
async function createCard(req: any, res: any): Promise<void> {
  try {
    const boardRole = req.boardRole;
    const { listId, title, description, dueDate, assignee } = req.body;

    if (!listId || !title) {
      res.status(400).json({
        success: false,
        error: '列表 ID 和标题不能为空'
      });
      return;
    }

    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
      });
      return;
    }

    const { card, boardId } = await createCardService(listId, title, description, dueDate, assignee);

    if (boardId) {
      emitToBoard(boardId, 'card-created', card);
    }

    res.status(201).json({
      success: true,
      data: card
    });
  } catch (error) {
    console.error('创建卡片失败:', error);
    res.status(500).json({
      success: false,
      error: '创建卡片失败'
    });
  }
}

/**
 * 删除卡片
 * 验证用户权限后调用 service 删除卡片
 */
async function deleteCard(req: any, res: any): Promise<void> {
  try {
    const boardRole = req.boardRole;
    const cardId = parseInt(req.params.cardId);

    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
      });
      return;
    }

    const boardId = await deleteCardService(cardId);

    if (boardId) {
      emitToBoard(boardId, 'card-deleted', { cardId });
    }

    res.status(200).json({
      success: true,
      message: '卡片删除成功'
    });
  } catch (error) {
    console.error('删除卡片失败:', error);
    res.status(500).json({
      success: false,
      error: '删除卡片失败'
    });
  }
}

/**
 * 修改卡片的所有字段（支持部分更新）
 * 验证用户权限后调用 service 更新卡片
 */
async function updateCard(req: any, res: any): Promise<void> {
  try {
    const boardRole = req.boardRole;
    const cardId = parseInt(req.params.cardId);
    const { title, description, dueDate, assignee } = req.body;

    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
      });
      return;
    }

    const { updatedCard, boardId } = await updateCardService(cardId, { title, description, dueDate, assignee });

    if (boardId) {
      emitToBoard(boardId, 'card-updated', updatedCard);
    }

    res.status(200).json({
      success: true,
      data: updatedCard
    });
  } catch (error: any) {
    console.error('修改卡片失败:', error);

    if (error.message === '没有提供需要更新的字段') {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: '修改卡片失败'
      });
    }
  }
}

/**
 * 修改卡片位置（支持拖拽排序和跨列表移动）
 * 验证用户权限后调用 service 更新卡片位置
 */
async function updateCardPosition(req: any, res: any): Promise<void> {
  try {
    const boardRole = req.boardRole;
    const cardId = parseInt(req.params.cardId);
    const { sourceListId, targetListId, newOrder } = req.body;

    if (targetListId === undefined || newOrder === undefined) {
      res.status(400).json({
        success: false,
        error: '目标列表ID和新位置不能为空'
      });
      return;
    }

    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
      });
      return;
    }

    const { updatedCard, boardId } = await updateCardPositionService(cardId, sourceListId, targetListId, newOrder, req.userId);

    emitToBoard(boardId, 'card-moved', updatedCard);

    res.status(200).json({
      success: true,
      data: updatedCard
    });
  } catch (error: any) {
    console.error('修改卡片位置失败:', error);

    if (error.message === '卡片不存在' || error.message === '目标列表不存在或无权操作') {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: '修改卡片位置失败'
      });
    }
  }
}

/**
 * 完成卡片
 * 将卡片移动到"已完成"列表
 */
async function completeCard(req: any, res: any): Promise<void> {
  try {
    const boardRole = req.boardRole;
    const cardId = parseInt(req.params.cardId);

    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
      });
      return;
    }

    const { updatedCard, boardId } = await completeCardService(cardId, getOrCreateCompletedList);

    emitToBoard(boardId, 'card-moved', updatedCard);

    res.status(200).json({
      success: true,
      data: updatedCard
    });
  } catch (error: any) {
    console.error('完成卡片失败:', error);

    if (error.message === '卡片不存在' || error.message === '卡片已在已完成列表中') {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: '完成卡片失败'
      });
    }
  }
}

/**
 * 撤销完成卡片
 * 将卡片从"已完成"列表移回原列表
 */
async function uncompleteCard(req: any, res: any): Promise<void> {
  try {
    const boardRole = req.boardRole;
    const cardId = parseInt(req.params.cardId);

    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
      });
      return;
    }

    const { updatedCard, boardId } = await uncompleteCardService(cardId, getCompletedList, getFirstNonSystemList);

    emitToBoard(boardId, 'card-moved', updatedCard);

    res.status(200).json({
      success: true,
      data: updatedCard
    });
  } catch (error: any) {
    console.error('撤销完成卡片失败:', error);

    if (error.message === '卡片不存在' || error.message === '已完成列表不存在' || 
        error.message === '卡片不在已完成列表中' || error.message === '无法撤销完成，没有记录原始列表' ||
        error.message === '原始列表已删除，且没有其他可用列表') {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: '撤销完成卡片失败'
      });
    }
  }
}

// 导出模块
module.exports = {
  createCard,
  deleteCard,
  updateCard,
  updateCardPosition,
  completeCard,
  uncompleteCard
};