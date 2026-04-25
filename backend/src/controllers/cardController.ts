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
    const { listId, title, description, dueDate, assigneeId } = req.body;

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
      `INSERT INTO cards (list_id, title, description, due_date, assignee_id, order_index) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [listId, title, description || null, formattedDueDate, assigneeId || null, nextOrderIndex]
    );

    // 获取刚创建的卡片信息
    const [cards] = await pool.query(
      `SELECT id, list_id, title, description, due_date, assignee_id, order_index, created_at, updated_at 
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

// 导出模块
module.exports = {
  createCard,
  deleteCard
};
