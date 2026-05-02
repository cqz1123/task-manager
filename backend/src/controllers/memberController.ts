/**
 * 成员管理控制器模块
 * 处理看板成员相关的业务逻辑
 */

const pool = require('../config/database');

/**
 * 获取看板成员列表
 * 返回 owner 信息 + 成员列表（含角色）
 */
async function getBoardMembers(req: any, res: any): Promise<void> {
  try {
    // 从路径参数中获取看板 ID
    const boardId = parseInt(req.params.boardId);

    // 获取看板信息（包含 owner_id）
    const [boards] = await pool.query(
      'SELECT id, name, owner_id FROM boards WHERE id = ?',
      [boardId]
    );

    if (boards.length === 0) {
      res.status(404).json({
        success: false,
        error: '看板不存在'
      });
      return;
    }

    const board = boards[0];
    const ownerId = board.owner_id;

    // 获取 owner 信息
    const [owners] = await pool.query(
      'SELECT id, username, email FROM users WHERE id = ?',
      [ownerId]
    );

    const owner = owners.length > 0 ? owners[0] : null;

    // 获取成员列表
    const [members] = await pool.query(
      `SELECT 
        bm.id,
        bm.user_id,
        bm.role,
        bm.created_at,
        u.username,
        u.email
       FROM board_members bm
       JOIN users u ON bm.user_id = u.id
       WHERE bm.board_id = ?
       ORDER BY bm.created_at ASC`,
      [boardId]
    );

    // 返回成功响应
    res.status(200).json({
      success: true,
      data: {
        boardId,
        boardName: board.name,
        owner: owner ? {
          id: owner.id,
          username: owner.username,
          email: owner.email,
          role: 'owner'
        } : null,
        members: members.map((member: any) => ({
          id: member.id,
          userId: member.user_id,
          username: member.username,
          email: member.email,
          role: member.role,
          joinedAt: member.created_at
        }))
      }
    });
  } catch (error) {
    console.error('获取成员列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取成员列表失败'
    });
  }
}

/**
 * 修改成员角色
 * 仅看板 owner 可用
 */
async function updateMemberRole(req: any, res: any): Promise<void> {
  try {
    // 从路径参数中获取看板 ID 和成员用户 ID
    const boardId = parseInt(req.params.boardId);
    const userId = parseInt(req.params.userId);
    // 从请求体中获取新角色
    const { role } = req.body;

    // 验证角色参数
    if (!role || (role !== 'editor' && role !== 'viewer')) {
      res.status(400).json({
        success: false,
        error: '无效的角色值，只能是 editor 或 viewer'
      });
      return;
    }

    // 检查成员关系是否存在
    const [members] = await pool.query(
      'SELECT id, role FROM board_members WHERE board_id = ? AND user_id = ?',
      [boardId, userId]
    );

    if (members.length === 0) {
      res.status(404).json({
        success: false,
        error: '成员不存在或无权操作'
      });
      return;
    }

    // 更新角色
    await pool.query(
      'UPDATE board_members SET role = ? WHERE board_id = ? AND user_id = ?',
      [role, boardId, userId]
    );

    // 获取更新后的成员信息
    const [updatedMembers] = await pool.query(
      `SELECT 
        bm.id,
        bm.user_id,
        bm.role,
        u.username,
        u.email
       FROM board_members bm
       JOIN users u ON bm.user_id = u.id
       WHERE bm.board_id = ? AND bm.user_id = ?`,
      [boardId, userId]
    );

    // 返回成功响应
    res.status(200).json({
      success: true,
      message: '角色修改成功',
      data: {
        id: updatedMembers[0].id,
        userId: updatedMembers[0].user_id,
        username: updatedMembers[0].username,
        email: updatedMembers[0].email,
        role: updatedMembers[0].role
      }
    });
  } catch (error) {
    console.error('修改成员角色失败:', error);
    res.status(500).json({
      success: false,
      error: '修改成员角色失败'
    });
  }
}

/**
 * 移除成员
 * 仅看板 owner 可用
 */
async function removeMember(req: any, res: any): Promise<void> {
  try {
    // 从路径参数中获取看板 ID 和成员用户 ID
    const boardId = parseInt(req.params.boardId);
    const userId = parseInt(req.params.userId);

    // 检查成员关系是否存在
    const [members] = await pool.query(
      'SELECT id FROM board_members WHERE board_id = ? AND user_id = ?',
      [boardId, userId]
    );

    if (members.length === 0) {
      res.status(404).json({
        success: false,
        error: '成员不存在或无权操作'
      });
      return;
    }

    // 删除成员关系
    await pool.query(
      'DELETE FROM board_members WHERE board_id = ? AND user_id = ?',
      [boardId, userId]
    );

    // 返回成功响应
    res.status(200).json({
      success: true,
      message: '成员移除成功'
    });
  } catch (error) {
    console.error('移除成员失败:', error);
    res.status(500).json({
      success: false,
      error: '移除成员失败'
    });
  }
}

// 导出模块
module.exports = {
  getBoardMembers,
  updateMemberRole,
  removeMember
};
