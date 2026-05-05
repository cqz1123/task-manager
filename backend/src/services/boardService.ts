/**
 * 看板服务模块
 * 封装看板相关的业务逻辑
 */

const pool = require('../config/database');

/**
 * 生成唯一邀请码
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let inviteCode = '';
  for (let i = 0; i < 6; i++) {
    inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return inviteCode;
}

/**
 * 获取当前登录用户的所有看板（支持多人协作）
 * @param userId 用户ID
 * @returns 看板列表
 */
export async function getUserBoards(userId: number) {
  const [boards] = await pool.query(`
    SELECT 
      b.id, 
      b.name, 
      b.color, 
      b.invite_code,
      b.owner_id, 
      b.created_at,
      CASE
        WHEN b.owner_id = ? THEN 'owner'
        WHEN bm.role IS NOT NULL THEN bm.role
        ELSE NULL
      END AS myRole
    FROM boards b
    LEFT JOIN board_members bm 
      ON b.id = bm.board_id AND bm.user_id = ?
    WHERE 
      b.owner_id = ? 
      OR bm.user_id = ?
    ORDER BY b.created_at DESC
  `, [userId, userId, userId, userId]);

  return boards;
}

/**
 * 创建新看板
 * @param name 看板名称
 * @param color 看板颜色
 * @param userId 用户ID
 * @returns 创建的看板
 */
export async function createBoard(name: string, color: string, userId: number) {
  const inviteCode = generateInviteCode();

  const [result] = await pool.query(
    'INSERT INTO boards (name, color, invite_code, owner_id) VALUES (?, ?, ?, ?)',
    [name, color || '#0079BF', inviteCode, userId]
  );

  const [boards] = await pool.query(
    'SELECT id, name, color, invite_code, owner_id, created_at FROM boards WHERE id = ?',
    [(result as any).insertId]
  );

  return boards[0];
}

/**
 * 删除看板（使用事务）
 * @param boardId 看板ID
 * @param userId 用户ID
 */
export async function deleteBoard(boardId: number, userId: number) {
  const connection = await pool.getConnection();

  try {
    const [boards] = await connection.query(
      'SELECT id FROM boards WHERE id = ? AND owner_id = ?',
      [boardId, userId]
    );

    if (boards.length === 0) {
      throw new Error('看板不存在或无权操作');
    }

    await connection.beginTransaction();

    const [lists] = await connection.query(
      'SELECT id FROM lists WHERE board_id = ?',
      [boardId]
    );
    const listIds = lists.map((list: any) => list.id);

    if (listIds.length > 0) {
      await connection.query(
        'DELETE FROM cards WHERE list_id IN (?)',
        [listIds]
      );
    }

    await connection.query('DELETE FROM lists WHERE board_id = ?', [boardId]);
    await connection.query('DELETE FROM board_members WHERE board_id = ?', [boardId]);
    await connection.query('DELETE FROM boards WHERE id = ?', [boardId]);

    await connection.commit();
  } finally {
    connection.release();
  }
}

/**
 * 更新看板
 * @param boardId 看板ID
 * @param userId 用户ID
 * @param name 新名称
 * @param color 新颜色
 * @returns 更新后的看板
 */
export async function updateBoard(boardId: number, userId: number, name: string, color?: string) {
  const [boards] = await pool.query(
    'SELECT id FROM boards WHERE id = ? AND owner_id = ?',
    [boardId, userId]
  );

  if (boards.length === 0) {
    throw new Error('看板不存在或无权操作');
  }

  const updateFields: string[] = ['name = ?'];
  const updateValues: any[] = [name];

  if (color !== undefined) {
    updateFields.push('color = ?');
    updateValues.push(color);
  }

  updateFields.push('updated_at = NOW()');
  updateValues.push(boardId);

  await pool.query(
    `UPDATE boards SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  const [updatedBoards] = await pool.query(
    'SELECT id, name, color, owner_id, created_at, updated_at FROM boards WHERE id = ?',
    [boardId]
  );

  return updatedBoards[0];
}

/**
 * 通过邀请码加入看板
 * @param inviteCode 邀请码
 * @param userId 用户ID
 * @returns 看板信息和用户角色
 */
export async function joinByInviteCode(inviteCode: string, userId: number) {
  const formattedInviteCode = inviteCode.trim().toUpperCase();

  const [boards] = await pool.query(
    'SELECT id, name, color, owner_id FROM boards WHERE UPPER(invite_code) = ?',
    [formattedInviteCode]
  );

  if (boards.length === 0) {
    throw new Error('邀请码无效或看板不存在');
  }

  const board = boards[0];
  const boardId = board.id;

  if (board.owner_id === userId) {
    throw new Error('您已经是该看板的所有者');
  }

  const [members] = await pool.query(
    'SELECT role FROM board_members WHERE board_id = ? AND user_id = ?',
    [boardId, userId]
  );

  if (members.length > 0) {
    throw new Error('您已经是该看板的成员');
  }

  await pool.query(
    'INSERT INTO board_members (board_id, user_id, role) VALUES (?, ?, ?)',
    [boardId, userId, 'viewer']
  );

  return {
    board: {
      id: board.id,
      name: board.name,
      color: board.color
    },
    myRole: 'viewer'
  };
}

/**
 * 重新生成邀请码
 * @param boardId 看板ID
 * @param userId 用户ID
 * @returns 新邀请码
 */
export async function regenerateInviteCode(boardId: number, userId: number) {
  const [boards] = await pool.query(
    'SELECT id FROM boards WHERE id = ? AND owner_id = ?',
    [boardId, userId]
  );

  if (boards.length === 0) {
    throw new Error('看板不存在或无权操作');
  }

  const newInviteCode = generateInviteCode();

  await pool.query(
    'UPDATE boards SET invite_code = ? WHERE id = ?',
    [newInviteCode, boardId]
  );

  return newInviteCode;
}

module.exports = {
  getUserBoards,
  createBoard,
  deleteBoard,
  updateBoard,
  joinByInviteCode,
  regenerateInviteCode
};