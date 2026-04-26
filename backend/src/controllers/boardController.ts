/**
 * 看板控制器模块
 * 处理看板相关的业务逻辑，包括获取、创建、删除看板
 */

const pool = require('../config/database');

/**
 * 获取当前登录用户的所有看板
 * 从 JWT token 中获取用户 ID，查询该用户拥有的所有看板
 */
async function getBoards(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取通过认证中间件附加的用户 ID
    const userId = req.userId;

    // 查询该用户拥有的所有看板，按 created_at 降序排列
    const [boards] = await pool.query(
      'SELECT id, name, color, owner_id, created_at FROM boards WHERE owner_id = ? ORDER BY created_at DESC',
      [userId]
    );

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
 * 创建新看板
 * 验证用户身份后，创建新的看板
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

    // 插入新看板到数据库
    const [result] = await pool.query(
      'INSERT INTO boards (name, color, owner_id) VALUES (?, ?, ?)',
      [name, color || '#0079BF', userId]
    );

    // 获取刚创建的看板信息
    const [boards] = await pool.query(
      'SELECT id, name, color, owner_id, created_at FROM boards WHERE id = ?',
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
 * 验证用户权限后删除看板（由于外键 ON DELETE CASCADE，其下的列表和卡片会自动删除）
 */
async function deleteBoard(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取通过认证中间件附加的用户 ID
    const userId = req.userId;
    // 从路径参数中获取看板 ID
    const boardId = parseInt(req.params.id);

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

    // 删除看板（由于外键 ON DELETE CASCADE，其下的列表和卡片会自动删除）
    await pool.query('DELETE FROM boards WHERE id = ?', [boardId]);

    // 返回成功响应
    res.status(200).json({
      success: true,
      message: '看板删除成功'
    });
  } catch (error) {
    // 数据库查询失败，返回 500 错误
    console.error('删除看板失败:', error);
    res.status(500).json({
      success: false,
      error: '删除看板失败'
    });
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

// 导出模块
module.exports = {
  getBoards,
  createBoard,
  deleteBoard,
  updateBoard
};