/**
 * 卡片控制器模块
 * 处理卡片相关的业务逻辑，包括创建、删除卡片
 */

const pool = require('../config/database');
const { emitToBoard } = require('../socket/helpers');
const { getOrCreateCompletedList, getCompletedList, getFirstNonSystemList } = require('../services/listService');

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

    // 获取 board_id
    const [lists] = await pool.query(
      'SELECT board_id FROM lists WHERE id = ?',
      [listId]
    );
    const boardId = lists[0]?.board_id;

    // 广播卡片创建事件
    if (boardId) {
      emitToBoard(boardId, 'card-created', cards[0]);
    }

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

    // 获取卡片的 list_id 和 board_id
    const [cards] = await pool.query(
      'SELECT c.list_id, l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = ?',
      [cardId]
    );
    
    const boardId = cards[0]?.board_id;

    // 删除卡片
    await pool.query('DELETE FROM cards WHERE id = ?', [cardId]);

    // 广播卡片删除事件
    if (boardId) {
      emitToBoard(boardId, 'card-deleted', { cardId });
    }

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

    // 获取 board_id
    const [lists] = await pool.query(
      'SELECT board_id FROM lists WHERE id = ?',
      [updatedCards[0]?.list_id]
    );
    const boardId = lists[0]?.board_id;

    // 广播卡片更新事件
    if (boardId) {
      emitToBoard(boardId, 'card-updated', updatedCards[0]);
    }

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
    const boardId = card.board_id;
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

    // 广播卡片移动事件
    emitToBoard(boardId, 'card-moved', updatedCards[0]);

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

/**
 * 完成卡片
 * 将卡片移动到"已完成"列表
 */
async function completeCard(req: any, res: any): Promise<void> {
  const connection = await pool.getConnection();
  
  try {
    // 从请求对象中获取通过认证中间件附加的用户角色
    const boardRole = req.boardRole;
    // 从路径参数中获取卡片 ID
    const cardId = parseInt(req.params.cardId);

    // 验证权限：只有 owner 和 editor 可以完成卡片
    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
      });
      return;
    }

    // 开启事务
    await connection.beginTransaction();

    // a. 查询当前卡片信息
    const [cards] = await connection.query(
      `SELECT c.id, c.list_id, c.order_index, c.title, c.description, c.due_date, c.assignee, c.created_at, c.updated_at, c.completed_from_list_id,
              l.board_id
       FROM cards c
       JOIN lists l ON c.list_id = l.id
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
    const boardId = card.board_id;
    const originalListId = card.list_id;
    const originalOrderIndex = card.order_index;

    // b. 获取或创建"已完成"列表
    const completedList = await getOrCreateCompletedList(boardId, connection);
    const completedListId = completedList.id;

    // 检查卡片是否已在已完成列表中
    if (originalListId === completedListId) {
      await connection.rollback();
      res.status(400).json({
        success: false,
        error: '卡片已在已完成列表中'
      });
      return;
    }

    // c. 记录卡片当前所在的列表 ID
    const completedFromListId = originalListId;

    // d. 从原列表中删除卡片：将原列表中 order_index > 原卡片的 order_index 的卡片 order_index - 1
    await connection.query(
      `UPDATE cards SET order_index = order_index - 1
       WHERE list_id = ? AND order_index > ?`,
      [originalListId, originalOrderIndex]
    );

    // e. 计算新列表的末尾 order_index
    const [cardCount] = await connection.query(
      'SELECT COUNT(*) as count FROM cards WHERE list_id = ?',
      [completedListId]
    );
    const newOrderIndex = cardCount[0].count;

    // f. 更新卡片
    await connection.query(
      `UPDATE cards 
       SET list_id = ?, order_index = ?, completed_from_list_id = ?, updated_at = NOW() 
       WHERE id = ?`,
      [completedListId, newOrderIndex, completedFromListId, cardId]
    );

    // g. 提交事务
    await connection.commit();

    // 获取更新后的卡片信息
    const [updatedCards] = await pool.query(
      `SELECT c.id, c.list_id, c.title, c.description, c.due_date, c.assignee, c.order_index, c.created_at, c.updated_at, c.completed_from_list_id
       FROM cards c
       WHERE c.id = ?`,
      [cardId]
    );

    // h. 广播卡片移动事件
    emitToBoard(boardId, 'card-moved', updatedCards[0]);

    // 返回成功响应
    res.status(200).json({
      success: true,
      data: updatedCards[0]
    });
  } catch (error) {
    // 回滚事务
    await connection.rollback();
    console.error('完成卡片失败:', error);
    res.status(500).json({
      success: false,
      error: '完成卡片失败'
    });
  } finally {
    // 释放连接
    connection.release();
  }
}

/**
 * 撤销完成卡片
 * 将卡片从"已完成"列表移回原列表
 */
async function uncompleteCard(req: any, res: any): Promise<void> {
  const connection = await pool.getConnection();
  
  try {
    // 从请求对象中获取通过认证中间件附加的用户角色
    const boardRole = req.boardRole;
    // 从路径参数中获取卡片 ID
    const cardId = parseInt(req.params.cardId);

    // 验证权限：只有 owner 和 editor 可以撤销完成卡片
    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
      });
      return;
    }

    // 开启事务
    await connection.beginTransaction();

    // a. 查询卡片信息
    const [cards] = await connection.query(
      `SELECT c.id, c.list_id, c.order_index, c.title, c.description, c.due_date, c.assignee, c.created_at, c.updated_at, c.completed_from_list_id,
              l.board_id
       FROM cards c
       JOIN lists l ON c.list_id = l.id
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
    const boardId = card.board_id;
    const currentListId = card.list_id;
    const currentOrderIndex = card.order_index;
    const completedFromListId = card.completed_from_list_id;

    // 获取"已完成"列表
    const completedList = await getCompletedList(boardId, connection);
    if (!completedList) {
      await connection.rollback();
      res.status(400).json({
        success: false,
        error: '已完成列表不存在'
      });
      return;
    }

    // 检查卡片是否在已完成列表中
    if (currentListId !== completedList.id) {
      await connection.rollback();
      res.status(400).json({
        success: false,
        error: '卡片不在已完成列表中'
      });
      return;
    }

    // b. 检查 completed_from_list_id
    if (!completedFromListId) {
      await connection.rollback();
      res.status(400).json({
        success: false,
        error: '无法撤销完成，没有记录原始列表'
      });
      return;
    }

    // c. 确定目标列表 ID
    let targetListId = completedFromListId;
    
    // 检查目标列表是否存在
    const [targetLists] = await connection.query(
      'SELECT id FROM lists WHERE id = ? AND board_id = ?',
      [completedFromListId, boardId]
    );
    
    if (targetLists.length === 0) {
      // 目标列表已被删除，查找第一个非系统列表
      const fallbackList = await getFirstNonSystemList(boardId, connection);
      if (!fallbackList) {
        await connection.rollback();
        res.status(400).json({
          success: false,
          error: '原始列表已删除，且没有其他可用列表'
        });
        return;
      }
      targetListId = fallbackList.id;
    }

    // d. 从已完成列表中删除卡片：将已完成列表中 order_index > 当前 order_index 的卡片 order_index - 1
    await connection.query(
      `UPDATE cards SET order_index = order_index - 1
       WHERE list_id = ? AND order_index > ?`,
      [completedList.id, currentOrderIndex]
    );

    // e. 在目标列表中添加卡片到末尾
    const [targetCardCount] = await connection.query(
      'SELECT COUNT(*) as count FROM cards WHERE list_id = ?',
      [targetListId]
    );
    const newOrderIndex = targetCardCount[0].count;

    // f. 更新卡片
    await connection.query(
      `UPDATE cards 
       SET list_id = ?, order_index = ?, completed_from_list_id = NULL, updated_at = NOW() 
       WHERE id = ?`,
      [targetListId, newOrderIndex, cardId]
    );

    // g. 提交事务
    await connection.commit();

    // 获取更新后的卡片信息
    const [updatedCards] = await pool.query(
      `SELECT c.id, c.list_id, c.title, c.description, c.due_date, c.assignee, c.order_index, c.created_at, c.updated_at, c.completed_from_list_id
       FROM cards c
       WHERE c.id = ?`,
      [cardId]
    );

    // h. 广播卡片移动事件
    emitToBoard(boardId, 'card-moved', updatedCards[0]);

    // 返回成功响应
    res.status(200).json({
      success: true,
      data: updatedCards[0]
    });
  } catch (error) {
    // 回滚事务
    await connection.rollback();
    console.error('撤销完成卡片失败:', error);
    res.status(500).json({
      success: false,
      error: '撤销完成卡片失败'
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
  updateCardPosition,
  completeCard,
  uncompleteCard
};