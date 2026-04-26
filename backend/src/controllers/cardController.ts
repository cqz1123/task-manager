/**
 * 卡片控制器模块
 * 处理卡片相关的业务逻辑，包括创建、删除卡片
 */

const pool = require('../config/database');

/**
 * 创建新卡片
 * 验证用户权限后，创建新卡片
 */
async function createCard(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取通过认证中间件附加的用户 ID
    const userId = req.userId;
    // 从请求体中获取卡片信息
    const { listId, title, description, dueDate, assignee } = req.body;

    // 验证必填参数
    if (!listId || !title) {
      res.status(400).json({
        success: false,
        error: '列表 ID 和标题不能为空'
      });
      return;
    }

    // 验证列表是否存在且属于当前用户（通过关联的看板）
    const [lists] = await pool.query(
      `SELECT l.id FROM lists l 
       JOIN boards b ON l.board_id = b.id 
       WHERE l.id = ? AND b.owner_id = ?`,
      [listId, userId]
    );

    if (lists.length === 0) {
      res.status(404).json({
        success: false,
        error: '列表不存在或无权操作'
      });
      return;
    }

    // 获取该列表下最大的 order_index
    const [maxOrder] = await pool.query(
      'SELECT MAX(order_index) as max_order FROM cards WHERE list_id = ?',
      [listId]
    );

    const nextOrderIndex = (maxOrder[0]?.max_order ?? -1) + 1;

    // 处理日期格式转换
    let formattedDueDate = null;
    if (dueDate) {
      // 将 ISO 格式的日期转换为 YYYY-MM-DD 格式
      const date = new Date(dueDate);
      formattedDueDate = date.toISOString().split('T')[0];
    }

    // 插入新卡片到数据库
    const [result] = await pool.query(
      `INSERT INTO cards (list_id, title, description, due_date, assignee, order_index) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [listId, title, description || null, formattedDueDate, assignee || null, nextOrderIndex]
    );

    // 获取刚创建的卡片信息
    const [cards] = await pool.query(
      `SELECT id, list_id, title, description, due_date, assignee, order_index, created_at, updated_at 
       FROM cards WHERE id = ?`,
      [result.insertId]
    );

    // 返回成功响应
    res.status(201).json({
      success: true,
      data: cards[0]
    });
  } catch (error) {
    // 数据库查询失败，返回 500 错误
    console.error('创建卡片失败:', error);
    res.status(500).json({
      success: false,
      error: '创建卡片失败'
    });
  }
}

/**
 * 删除卡片
 * 验证用户权限后删除卡片
 */
async function deleteCard(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取通过认证中间件附加的用户 ID
    const userId = req.userId;
    // 从路径参数中获取卡片 ID
    const cardId = parseInt(req.params.cardId);

    // 验证卡片是否存在且属于当前用户（通过关联的列表和看板）
    const [cards] = await pool.query(
      `SELECT c.id FROM cards c 
       JOIN lists l ON c.list_id = l.id 
       JOIN boards b ON l.board_id = b.id 
       WHERE c.id = ? AND b.owner_id = ?`,
      [cardId, userId]
    );

    if (cards.length === 0) {
      res.status(404).json({
        success: false,
        error: '卡片不存在或无权操作'
      });
      return;
    }

    // 删除卡片
    await pool.query('DELETE FROM cards WHERE id = ?', [cardId]);

    // 返回成功响应
    res.status(200).json({
      success: true,
      message: '卡片删除成功'
    });
  } catch (error) {
    // 数据库查询失败，返回 500 错误
    console.error('删除卡片失败:', error);
    res.status(500).json({
      success: false,
      error: '删除卡片失败'
    });
  }
}

/**
 * 修改卡片的所有字段（支持部分更新）
 * 验证用户权限后更新卡片的指定字段
 */
async function updateCard(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取通过认证中间件附加的用户 ID
    const userId = req.userId;
    // 从路径参数中获取卡片 ID
    const cardId = parseInt(req.params.cardId);
    // 从请求体中获取卡片信息
    const { title, description, dueDate, assignee } = req.body;

    // 验证卡片是否存在且属于当前用户（通过关联的列表和看板）
    const [cards] = await pool.query(
      `SELECT c.id FROM cards c 
       JOIN lists l ON c.list_id = l.id 
       JOIN boards b ON l.board_id = b.id 
       WHERE c.id = ? AND b.owner_id = ?`,
      [cardId, userId]
    );

    if (cards.length === 0) {
      res.status(404).json({
        success: false,
        error: '卡片不存在或无权操作'
      });
      return;
    }

    // 动态构建更新字段
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // 如果提供了标题，更新标题
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }

    // 如果提供了描述（可以为 null），更新描述
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description || null);
    }

    // 如果提供了截止日期（可以为 null），更新截止日期
    if (dueDate !== undefined) {
      updateFields.push('due_date = ?');
      updateValues.push(dueDate || null);
    }

    // 如果提供了指派人（可以为 null），更新指派人
    if (assignee !== undefined) {
      updateFields.push('assignee = ?');
      updateValues.push(assignee || null);
    }

    // 如果没有提供任何更新字段，返回错误
    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        error: '没有提供需要更新的字段'
      });
      return;
    }

    // 添加 updated_at 自动更新
    updateFields.push('updated_at = NOW()');

    // 添加卡片 ID 作为 WHERE 条件
    updateValues.push(cardId);

    // 执行更新操作
    await pool.query(
      `UPDATE cards SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 获取更新后的卡片信息
    const [updatedCards] = await pool.query(
      'SELECT id, list_id, title, description, due_date, assignee, order_index, created_at, updated_at FROM cards WHERE id = ?',
      [cardId]
    );

    // 返回成功响应
    res.status(200).json({
      success: true,
      data: updatedCards[0]
    });
  } catch (error) {
    // 数据库查询失败，返回 500 错误
    console.error('修改卡片失败:', error);
    res.status(500).json({
      success: false,
      error: '修改卡片失败'
    });
  }
}

// 导出模块
module.exports = {
  createCard,
  deleteCard,
  updateCard
};
