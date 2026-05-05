/**
 * 列表控制器模块
 * 处理列表相关的 HTTP 请求，调用 service 层处理业务逻辑
 */

const { getListsWithCards: getListsWithCardsService, createList: createListService, deleteList: deleteListService, updateList: updateListService } = require('../services/listService');
const { emitToBoard } = require('../socket/helpers');

/**
 * 获取单个看板的所有列表及其卡片
 */
async function getListsWithCards(req: any, res: any): Promise<void> {
  try {
    const boardRole = req.boardRole;
    const boardId = parseInt(req.params.boardId);

    if (!boardRole) {
      res.status(403).json({
        success: false,
        error: '无权访问该看板'
      });
      return;
    }

    const { board, lists } = await getListsWithCardsService(boardId);

    res.status(200).json({
      success: true,
      board: {
        ...board,
        myRole: boardRole
      },
      boardId: boardId,
      lists: lists
    });
  } catch (error: any) {
    console.error('获取列表和卡片失败:', error);

    if (error.message === '看板不存在') {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: '获取列表和卡片失败'
      });
    }
  }
}

/**
 * 创建新列表
 */
async function createList(req: any, res: any): Promise<void> {
  try {
    const boardRole = req.boardRole;
    const boardId = parseInt(req.params.boardId);
    const { title } = req.body;

    if (!boardId || !title) {
      res.status(400).json({
        success: false,
        error: '看板 ID 和标题不能为空'
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

    const newList = await createListService(boardId, title);

    emitToBoard(boardId, 'list-created', {
      ...newList,
      cards: []
    });

    res.status(201).json({
      success: true,
      data: newList
    });
  } catch (error) {
    console.error('创建列表失败:', error);
    res.status(500).json({
      success: false,
      error: '创建列表失败'
    });
  }
}

/**
 * 删除列表
 */
async function deleteList(req: any, res: any): Promise<void> {
  try {
    const boardRole = req.boardRole;
    const listId = parseInt(req.params.listId);

    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
      });
      return;
    }

    const boardId = await deleteListService(listId);

    if (boardId) {
      emitToBoard(boardId, 'list-deleted', { listId });
    }

    res.status(200).json({
      success: true,
      message: '列表删除成功'
    });
  } catch (error) {
    console.error('删除列表失败:', error);
    res.status(500).json({
      success: false,
      error: '删除列表失败'
    });
  }
}

/**
 * 修改列表标题
 */
async function updateList(req: any, res: any): Promise<void> {
  try {
    const boardRole = req.boardRole;
    const listId = parseInt(req.params.listId);
    const { title } = req.body;

    if (!title) {
      res.status(400).json({
        success: false,
        error: '列表标题不能为空'
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

    const { updatedList, boardId } = await updateListService(listId, title);

    if (boardId) {
      emitToBoard(boardId, 'list-updated', updatedList);
    }

    res.status(200).json({
      success: true,
      data: updatedList
    });
  } catch (error) {
    console.error('修改列表失败:', error);
    res.status(500).json({
      success: false,
      error: '修改列表失败'
    });
  }
}

module.exports = {
  getListsWithCards,
  createList,
  deleteList,
  updateList
};