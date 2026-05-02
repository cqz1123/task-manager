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
    // 从请求对象中获取通过认证中间件附加的用户角色（权限中间件已验证）
    const boardRole = req.boardRole;
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

    // 验证权限：只有 owner 和 editor 可以创建卡片
    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
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
    // 从请求对象中获取通过认证中间件附加的用户角色（权限中间件已验证）
    const boardRole = req.boardRole;
    // 从路径参数中获取卡片 ID
    const cardId = parseInt(req.params.cardId);

    // 验证权限：只有 owner 和 editor 可以删除卡片
    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
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
    // 从请求对象中获取通过认证中间件附加的用户角色（权限中间件已验证）
    const boardRole = req.boardRole;
    // 从路径参数中获取卡片 ID
    const cardId = parseInt(req.params.cardId);
    // 从请求体中获取卡片信息
    const { title, description, dueDate, assignee } = req.body;

    // 验证权限：只有 owner 和 editor 可以修改卡片
    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
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

/**
 * 修改卡片位置（支持拖拽排序和跨列表移动）
 * 使用事务确保数据一致性
 */
async function updateCardPosition(req: any, res: any): Promise<void> {
  // 获取数据库连接
  const connection = await pool.getConnection();

  try {
    // 从请求对象中获取通过认证中间件附加的用户角色（权限中间件已验证）
    const boardRole = req.boardRole;
    // 从路径参数中获取卡片 ID
    const cardId = parseInt(req.params.cardId);
    // 从请求体中获取移动信息
    const { sourceListId, targetListId, newOrder } = req.body;

    // 验证必填参数
    if (targetListId === undefined || newOrder === undefined) {
      res.status(400).json({
        success: false,
        error: '目标列表ID和新位置不能为空'
      });
      return;
    }

    // 验证权限：只有 owner 和 editor 可以移动卡片
    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
      });
      return;
    }

    // 开启事务
    await connection.beginTransaction();

    // 获取卡片信息
    const [cards] = await connection.query(
      `SELECT c.id, c.list_id, c.order_index, c.title, c.description, c.due_date, c.assignee, c.created_at, c.updated_at,
              l.board_id, b.owner_id
       FROM cards c
       JOIN lists l ON c.list_id = l.id
       JOIN boards b ON l.board_id = b.id
       WHERE c.id = ?`,
      [cardId]
    );

    if (cards.length === 0) {
      await connection.rollback();
      res.status(404).json({
        success: false,
        error: '卡片不存在'
      });
      return;
    }

    const card = cards[0];
    const originalListId = card.list_id;
    const originalOrder = card.order_index;
    const actualSourceListId = sourceListId !== undefined ? sourceListId : originalListId;
    const actualTargetListId = parseInt(targetListId);

    // 验证目标列表是否存在且属于当前用户
    const [targetLists] = await connection.query(
      `SELECT l.id, l.board_id, b.owner_id
       FROM lists l
       JOIN boards b ON l.board_id = b.id
       WHERE l.id = ? AND b.owner_id = ?`,
      [actualTargetListId, req.userId]
    );

    if (targetLists.length === 0) {
      await connection.rollback();
      res.status(404).json({
        success: false,
        error: '目标列表不存在或无权操作'
      });
      return;
    }

    // 获取目标列表的卡片总数
    const [cardCount] = await connection.query(
      'SELECT COUNT(*) as count FROM cards WHERE list_id = ?',
      [actualTargetListId]
    );
    const targetListCardCount = cardCount[0].count;

    // 调整 newOrder：如果超出范围，调整为末尾
    let adjustedNewOrder = newOrder;
    if (adjustedNewOrder < 0) {
      adjustedNewOrder = 0;
    } else if (adjustedNewOrder > targetListCardCount) {
      adjustedNewOrder = targetListCardCount;
    }

    // 判断是同列表排序还是跨列表移动
    if (actualSourceListId === actualTargetListId) {
      // 同一列表内重新排序
      if (adjustedNewOrder === originalOrder) {
        // 位置没有变化，直接返回
        await connection.commit();
        res.status(200).json({
          success: true,
          data: card
        });
        return;
      }

      if (adjustedNewOrder > originalOrder) {
        // 卡片向下移动：将原位置+1 到新位置之间的卡片向上移动
        await connection.query(
          `UPDATE cards SET order_index = order_index - 1
           WHERE list_id = ? AND order_index > ? AND order_index <= ?`,
          [actualSourceListId, originalOrder, adjustedNewOrder]
        );
      } else {
        // 卡片向上移动：将新位置到原位置-1 的卡片向下移动
        await connection.query(
          `UPDATE cards SET order_index = order_index + 1
           WHERE list_id = ? AND order_index >= ? AND order_index < ?`,
          [actualSourceListId, adjustedNewOrder, originalOrder]
        );
      }

      // 更新卡片的 order_index
      await connection.query(
        'UPDATE cards SET order_index = ?, updated_at = NOW() WHERE id = ?',
        [adjustedNewOrder, cardId]
      );
    } else {
      // 跨列表移动
      // 1. 从源列表中删除该卡片：将源列表中 order_index 大于原 order_index 的卡片向上移动
      await connection.query(
        `UPDATE cards SET order_index = order_index - 1
         WHERE list_id = ? AND order_index > ?`,
        [actualSourceListId, originalOrder]
      );

      // 2. 在目标列表中将所有 order_index >= newOrder 的卡片向下移动
      await connection.query(
        `UPDATE cards SET order_index = order_index + 1
         WHERE list_id = ? AND order_index >= ?`,
        [actualTargetListId, adjustedNewOrder]
      );

      // 3. 更新卡片的 list_id 和 order_index
      await connection.query(
        'UPDATE cards SET list_id = ?, order_index = ?, updated_at = NOW() WHERE id = ?',
        [actualTargetListId, adjustedNewOrder, cardId]
      );
    }

    // 提交事务
    await connection.commit();

    // 获取更新后的卡片信息
    const [updatedCards] = await pool.query(
      `SELECT c.id, c.list_id, c.title, c.description, c.due_date, c.assignee, c.order_index, c.created_at, c.updated_at
       FROM cards c
       WHERE c.id = ?`,
      [cardId]
    );

    // 返回成功响应
    res.status(200).json({
      success: true,
      data: updatedCards[0]
    });
  } catch (error) {
    // 回滚事务
    await connection.rollback();
    console.error('修改卡片位置失败:', error);
    res.status(500).json({
      success: false,
      error: '修改卡片位置失败'
    });
  } finally {
    // 释放连接
    connection.release();
  }
}

// 导出模块
module.exports = {
  createCard,
  deleteCard,
  updateCard,
  updateCardPosition
};
