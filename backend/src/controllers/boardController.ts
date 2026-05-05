/**
 * 看板控制器模块
 * 处理看板相关的 HTTP 请求，调用 service 层处理业务逻辑
 */

const { getUserBoards, createBoard: createBoardService, deleteBoard: deleteBoardService, updateBoard: updateBoardService, joinByInviteCode: joinByInviteCodeService, regenerateInviteCode: regenerateInviteCodeService } = require('../services/boardService');

/**
 * 获取当前登录用户的所有看板（支持多人协作）
 */
async function getBoards(req: any, res: any): Promise<void> {
  try {
    const userId = req.userId;
    const boards = await getUserBoards(userId);

    res.status(200).json({
      success: true,
      data: boards
    });
  } catch (error) {
    console.error('获取看板列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取看板列表失败'
    });
  }
}

/**
 * 创建新看板
 */
async function createBoard(req: any, res: any): Promise<void> {
  try {
    const userId = req.userId;
    const { name, color } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        error: '看板名称不能为空'
      });
      return;
    }

    const board = await createBoardService(name, color, userId);

    res.status(201).json({
      success: true,
      data: board
    });
  } catch (error) {
    console.error('创建看板失败:', error);
    res.status(500).json({
      success: false,
      error: '创建看板失败'
    });
  }
}

/**
 * 删除看板
 */
async function deleteBoard(req: any, res: any): Promise<void> {
  try {
    const userId = req.userId;
    const boardId = parseInt(req.params.boardId);

    await deleteBoardService(boardId, userId);

    res.status(200).json({
      success: true,
      message: '看板删除成功'
    });
  } catch (error: any) {
    console.error('删除看板失败:', error);

    if (error.message === '看板不存在或无权操作') {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: '删除看板失败'
      });
    }
  }
}

/**
 * 修改看板名称
 */
async function updateBoard(req: any, res: any): Promise<void> {
  try {
    const userId = req.userId;
    const boardId = parseInt(req.params.boardId);
    const { name, color } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        error: '看板名称不能为空'
      });
      return;
    }

    const updatedBoard = await updateBoardService(boardId, userId, name, color);

    res.status(200).json({
      success: true,
      data: updatedBoard
    });
  } catch (error: any) {
    console.error('修改看板失败:', error);

    if (error.message === '看板不存在或无权操作') {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: '修改看板失败'
      });
    }
  }
}

/**
 * 通过邀请码加入看板
 */
async function joinByInviteCode(req: any, res: any): Promise<void> {
  try {
    const userId = req.userId;
    let { inviteCode } = req.body;

    if (!inviteCode) {
      res.status(400).json({
        success: false,
        error: '邀请码不能为空'
      });
      return;
    }

    const result = await joinByInviteCodeService(inviteCode, userId);

    res.status(200).json({
      success: true,
      message: '成功加入看板',
      data: result
    });
  } catch (error: any) {
    console.error('加入看板失败:', error);

    if (error.message === '邀请码无效或看板不存在') {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

/**
 * 重新生成邀请码
 */
async function regenerateInviteCode(req: any, res: any): Promise<void> {
  try {
    const userId = req.userId;
    const boardId = parseInt(req.params.boardId);

    const newInviteCode = await regenerateInviteCodeService(boardId, userId);

    res.status(200).json({
      success: true,
      inviteCode: newInviteCode,
      message: '邀请码重新生成成功'
    });
  } catch (error: any) {
    console.error('重新生成邀请码失败:', error);

    if (error.message === '看板不存在或无权操作') {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: '重新生成邀请码失败'
      });
    }
  }
}

module.exports = {
  getBoards,
  createBoard,
  deleteBoard,
  updateBoard,
  joinByInviteCode,
  regenerateInviteCode
};