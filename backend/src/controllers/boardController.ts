/**
 * 看板控制器模块
 * 处理看板相关的业务逻辑，包括获取、创建、删除看板
 */

const pool = require('../config/database');

/**
 * 获取当前登录用户的所有看板（支持多人协作）
 * 查询用户拥有的看板以及用户作为成员的看板
 */
async function getBoards(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取通过认证中间件附加的用户 ID
    const userId = req.userId;

    // 查询用户能看到的所有看板：
    // 1. 用户拥有的看板（owner_id = userId）
    // 2. 用户作为成员的看板（board_members.user_id = userId）
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

    // 返回成功响应
    res.status(200).json({
      success: true,
      data: boards
    });
  } catch (error) {
    // 数据库查询失败，返回 500 错误
    console.error('获取看板列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取看板列表失败'
    });
  }
}

/**
 * 生成唯一邀请码
 * 生成 6 位由大写字母和数字组成的字符串，排除容易混淆的字符（0, O, I, l）
 */
function generateInviteCode(): string {
  // 排除容易混淆的字符：0, O, I, l, 1
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let inviteCode = '';
  for (let i = 0; i < 6; i++) {
    inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return inviteCode;
}

/**
 * 创建新看板
 * 验证用户身份后，创建新的看板并自动生成邀请码
 */
async function createBoard(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取通过认证中间件附加的用户 ID
    const userId = req.userId;
    // 从请求体中获取看板信息
    const { name, color } = req.body;

    // 验证必填参数
    if (!name) {
      res.status(400).json({
        success: false,
        error: '看板名称不能为空'
      });
      return;
    }

    // 生成唯一邀请码
    const inviteCode = generateInviteCode();

    // 插入新看板到数据库（包含邀请码）
    const [result] = await pool.query(
      'INSERT INTO boards (name, color, invite_code, owner_id) VALUES (?, ?, ?, ?)',
      [name, color || '#0079BF', inviteCode, userId]
    );

    // 获取刚创建的看板信息（包含邀请码）
    const [boards] = await pool.query(
      'SELECT id, name, color, invite_code, owner_id, created_at FROM boards WHERE id = ?',
      [result.insertId]
    );

    // 返回成功响应
    res.status(201).json({
      success: true,
      data: boards[0]
    });
  } catch (error) {
    // 数据库查询失败，返回 500 错误
    console.error('创建看板失败:', error);
    res.status(500).json({
      success: false,
      error: '创建看板失败'
    });
  }
}

/**
 * 删除看板
 * 验证用户权限后删除看板
 * 使用事务确保数据一致性，删除顺序：卡片 → 列表 → 成员 → 看板
 */
async function deleteBoard(req: any, res: any): Promise<void> {
  const connection = await pool.getConnection();

  try {
    // 从请求对象中获取通过认证中间件附加的用户 ID
    const userId = req.userId;
    // 从路径参数中获取看板 ID
    const boardId = parseInt(req.params.boardId);

    console.log(`[删除看板] 开始删除看板 ${boardId}, 用户 ${userId}`);

    // 验证看板是否存在且属于当前用户
    const [boards] = await connection.query(
      'SELECT id FROM boards WHERE id = ? AND owner_id = ?',
      [boardId, userId]
    );

    if (boards.length === 0) {
      console.log(`[删除看板] 看板 ${boardId} 不存在或用户 ${userId} 无权操作`);
      res.status(404).json({
        success: false,
        error: '看板不存在或无权操作'
      });
      return;
    }

    // 开始事务
    await connection.beginTransaction();
    console.log(`[删除看板] 事务已开启`);

    // 1. 获取该看板下的所有列表 ID
    const [lists] = await connection.query(
      'SELECT id FROM lists WHERE board_id = ?',
      [boardId]
    );
    const listIds = lists.map((list: any) => list.id);
    console.log(`[删除看板] 找到 ${listIds.length} 个列表:`, listIds);

    // 2. 删除卡片（如果存在列表）
    if (listIds.length > 0) {
      const [cardResult] = await connection.query(
        'DELETE FROM cards WHERE list_id IN (?)',
        [listIds]
      );
      console.log(`[删除看板] 已删除卡片: ${(cardResult as any).affectedRows} 条`);
    }

    // 3. 删除列表
    const [listResult] = await connection.query(
      'DELETE FROM lists WHERE board_id = ?',
      [boardId]
    );
    console.log(`[删除看板] 已删除列表: ${(listResult as any).affectedRows} 条`);

    // 4. 删除看板成员
    const [memberResult] = await connection.query(
      'DELETE FROM board_members WHERE board_id = ?',
      [boardId]
    );
    console.log(`[删除看板] 已删除成员: ${(memberResult as any).affectedRows} 条`);

    // 5. 删除看板
    const [boardResult] = await connection.query(
      'DELETE FROM boards WHERE id = ?',
      [boardId]
    );
    console.log(`[删除看板] 已删除看板: ${(boardResult as any).affectedRows} 条`);

    // 提交事务
    await connection.commit();
    console.log(`[删除看板] 事务已提交，看板 ${boardId} 删除成功`);

    // 返回成功响应
    res.status(200).json({
      success: true,
      message: '看板删除成功'
    });
  } catch (error: any) {
    // 回滚事务
    await connection.rollback();
    console.error(`[删除看板] 事务已回滚，错误:`, error.message);
    console.error(`[删除看板] 错误代码:`, error.code);
    console.error(`[删除看板] 错误详情:`, error);

    // 返回 500 错误
    res.status(500).json({
      success: false,
      error: '删除看板失败'
    });
  } finally {
    // 释放连接
    connection.release();
    console.log(`[删除看板] 数据库连接已释放`);
  }
}

/**
 * 修改看板名称
 * 验证用户权限后更新看板名称
 */
async function updateBoard(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取通过认证中间件附加的用户 ID
    const userId = req.userId;
    // 从路径参数中获取看板 ID
    const boardId = parseInt(req.params.boardId);
    // 从请求体中获取看板信息
    const { name, color } = req.body;

    // 验证必填参数
    if (!name) {
      res.status(400).json({
        success: false,
        error: '看板名称不能为空'
      });
      return;
    }

    // 验证看板是否存在且属于当前用户
    const [boards] = await pool.query(
      'SELECT id FROM boards WHERE id = ? AND owner_id = ?',
      [boardId, userId]
    );

    if (boards.length === 0) {
      res.status(404).json({
        success: false,
        error: '看板不存在或无权操作'
      });
      return;
    }

    // 动态构建更新字段
    const updateFields: string[] = ['name = ?'];
    const updateValues: any[] = [name];

    // 如果提供了颜色，也更新颜色
    if (color !== undefined) {
      updateFields.push('color = ?');
      updateValues.push(color);
    }

    // 添加 updated_at 自动更新
    updateFields.push('updated_at = NOW()');

    // 添加看板 ID 作为 WHERE 条件
    updateValues.push(boardId);

    // 执行更新操作
    await pool.query(
      `UPDATE boards SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 获取更新后的看板信息
    const [updatedBoards] = await pool.query(
      'SELECT id, name, color, owner_id, created_at, updated_at FROM boards WHERE id = ?',
      [boardId]
    );

    // 返回成功响应
    res.status(200).json({
      success: true,
      data: updatedBoards[0]
    });
  } catch (error) {
    // 数据库查询失败，返回 500 错误
    console.error('修改看板失败:', error);
    res.status(500).json({
      success: false,
      error: '修改看板失败'
    });
  }
}

/**
 * 通过邀请码加入看板
 * 用户使用邀请码加入他人的看板
 */
async function joinByInviteCode(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取用户 ID
    const userId = req.userId;
    // 从请求体中获取邀请码，并进行格式化处理
    let { inviteCode } = req.body;

    // 格式化邀请码：去除首尾空格，转为大写
    if (inviteCode && typeof inviteCode === 'string') {
      inviteCode = inviteCode.trim().toUpperCase();
    }

    // 验证邀请码
    if (!inviteCode) {
      res.status(400).json({
        success: false,
        error: '邀请码不能为空'
      });
      return;
    }

    // 根据邀请码查找看板（使用 UPPER() 进行大小写不敏感比较）
    const [boards] = await pool.query(
      'SELECT id, name, color, owner_id FROM boards WHERE UPPER(invite_code) = ?',
      [inviteCode]
    );

    if (boards.length === 0) {
      res.status(404).json({
        success: false,
        error: '邀请码无效或看板不存在'
      });
      return;
    }

    const board = boards[0];
    const boardId = board.id;

    // 检查用户是否已经是看板所有者
    if (board.owner_id === userId) {
      res.status(400).json({
        success: false,
        error: '您已经是该看板的所有者'
      });
      return;
    }

    // 检查用户是否已经是成员
    const [members] = await pool.query(
      'SELECT role FROM board_members WHERE board_id = ? AND user_id = ?',
      [boardId, userId]
    );

    if (members.length > 0) {
      res.status(400).json({
        success: false,
        error: '您已经是该看板的成员'
      });
      return;
    }

    // 将用户添加为成员（默认角色为 viewer）
    await pool.query(
      'INSERT INTO board_members (board_id, user_id, role) VALUES (?, ?, ?)',
      [boardId, userId, 'viewer']
    );

    // 返回成功响应
    res.status(200).json({
      success: true,
      message: '成功加入看板',
      data: {
        board: {
          id: board.id,
          name: board.name,
          color: board.color
        },
        myRole: 'viewer'
      }
    });
  } catch (error) {
    console.error('加入看板失败:', error);
    res.status(500).json({
      success: false,
      error: '加入看板失败'
    });
  }
}

/**
 * 重新生成邀请码
 * 仅看板所有者可以重新生成邀请码
 */
async function regenerateInviteCode(req: any, res: any): Promise<void> {
  try {
    const userId = req.userId;
    const boardId = parseInt(req.params.boardId);

    console.log(`[重新生成邀请码] 看板 ${boardId}, 用户 ${userId}`);

    // 验证看板是否存在且属于当前用户
    const [boards] = await pool.query(
      'SELECT id, name, owner_id FROM boards WHERE id = ? AND owner_id = ?',
      [boardId, userId]
    );

    if (boards.length === 0) {
      console.log(`[重新生成邀请码] 看板 ${boardId} 不存在或用户 ${userId} 无权操作`);
      res.status(404).json({
        success: false,
        error: '看板不存在或无权操作'
      });
      return;
    }

    // 生成新的邀请码
    const newInviteCode = generateInviteCode();
    console.log(`[重新生成邀请码] 新邀请码: ${newInviteCode}`);

    // 更新数据库中的邀请码
    await pool.query(
      'UPDATE boards SET invite_code = ? WHERE id = ?',
      [newInviteCode, boardId]
    );

    console.log(`[重新生成邀请码] 看板 ${boardId} 邀请码已更新`);

    res.status(200).json({
      success: true,
      inviteCode: newInviteCode,
      message: '邀请码重新生成成功'
    });
  } catch (error: any) {
    console.error(`[重新生成邀请码] 错误:`, error.message);
    res.status(500).json({
      success: false,
      error: '重新生成邀请码失败'
    });
  }
}

// 导出模块
module.exports = {
  getBoards,
  createBoard,
  deleteBoard,
  updateBoard,
  joinByInviteCode,
  regenerateInviteCode
};