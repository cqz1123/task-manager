/**
 * 成员管理控制器模块
 * 处理看板成员相关的 HTTP 请求，调用 service 层处理业务逻辑
 */

const { getBoardMembers: getBoardMembersService, updateMemberRole: updateMemberRoleService, removeMember: removeMemberService } = require('../services/memberService');

/**
 * 获取看板成员列表
 */
async function getBoardMembers(req: any, res: any): Promise<void> {
  try {
    const boardId = parseInt(req.params.boardId);
    const result = await getBoardMembersService(boardId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('获取成员列表失败:', error);
    if (error.message === '看板不存在') {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: '获取成员列表失败'
      });
    }
  }
}

/**
 * 修改成员角色
 */
async function updateMemberRole(req: any, res: any): Promise<void> {
  try {
    const boardId = parseInt(req.params.boardId);
    const userId = parseInt(req.params.userId);
    const { role } = req.body;

    const updatedMember = await updateMemberRoleService(boardId, userId, role);

    res.status(200).json({
      success: true,
      message: '角色修改成功',
      data: updatedMember
    });
  } catch (error: any) {
    console.error('修改成员角色失败:', error);
    if (error.message === '无效的角色值，只能是 editor 或 viewer') {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else if (error.message === '成员不存在或无权操作') {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: '修改成员角色失败'
      });
    }
  }
}

/**
 * 移除成员
 */
async function removeMember(req: any, res: any): Promise<void> {
  try {
    const boardId = parseInt(req.params.boardId);
    const userId = parseInt(req.params.userId);

    await removeMemberService(boardId, userId);

    res.status(200).json({
      success: true,
      message: '成员移除成功'
    });
  } catch (error: any) {
    console.error('移除成员失败:', error);
    if (error.message === '成员不存在或无权操作') {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: '移除成员失败'
      });
    }
  }
}

module.exports = {
  getBoardMembers,
  updateMemberRole,
  removeMember
};