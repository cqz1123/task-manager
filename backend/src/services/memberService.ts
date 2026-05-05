/**
 * 成员管理服务模块
 * 封装看板成员相关的业务逻辑
 */

const pool = require('../config/database');

/**
 * 获取看板成员列表
 * 返回 owner 信息 + 成员列表（含角色）
 * @param boardId 看板ID
 * @returns 成员列表信息
 */
export async function getBoardMembers(boardId: number) {
  // 获取看板信息（包含 owner_id）
  const [boards] = await pool.query(
    'SELECT id, name, owner_id FROM boards WHERE id = ?',
    [boardId]
  );

  if (boards.length === 0) {
    throw new Error('看板不存在');
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

  return {
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
  };
}

/**
 * 修改成员角色
 * @param boardId 看板ID
 * @param userId 用户ID
 * @param role 新角色
 * @returns 更新后的成员信息
 */
export async function updateMemberRole(boardId: number, userId: number, role: string) {
  // 验证角色参数
  if (!role || (role !== 'editor' && role !== 'viewer')) {
    throw new Error('无效的角色值，只能是 editor 或 viewer');
  }

  // 检查成员关系是否存在
  const [members] = await pool.query(
    'SELECT id, role FROM board_members WHERE board_id = ? AND user_id = ?',
    [boardId, userId]
  );

  if (members.length === 0) {
    throw new Error('成员不存在或无权操作');
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

  const updatedMember = updatedMembers[0];
  return {
    id: updatedMember.id,
    userId: updatedMember.user_id,
    username: updatedMember.username,
    email: updatedMember.email,
    role: updatedMember.role
  };
}

/**
 * 移除成员
 * @param boardId 看板ID
 * @param userId 用户ID
 */
export async function removeMember(boardId: number, userId: number) {
  // 检查成员关系是否存在
  const [members] = await pool.query(
    'SELECT id FROM board_members WHERE board_id = ? AND user_id = ?',
    [boardId, userId]
  );

  if (members.length === 0) {
    throw new Error('成员不存在或无权操作');
  }

  // 删除成员关系
  await pool.query(
    'DELETE FROM board_members WHERE board_id = ? AND user_id = ?',
    [boardId, userId]
  );
}