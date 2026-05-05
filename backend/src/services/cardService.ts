/**
 * 卡片服务模块
 * 封装卡片相关的业务逻辑
 */

const pool = require('../config/database');

/**
 * 创建新卡片
 * @param listId 列表ID
 * @param title 标题
 * @param description 描述
 * @param dueDate 截止日期
 * @param assignee 指派人
 * @returns 创建的卡片和看板ID
 */
export async function createCard(listId: number, title: string, description?: string, dueDate?: string, assignee?: number) {
  const [maxOrder] = await pool.query(
    'SELECT MAX(order_index) as max_order FROM cards WHERE list_id = ?',
    [listId]
  );

  const nextOrderIndex = (maxOrder[0]?.max_order ?? -1) + 1;

  let formattedDueDate = null;
  if (dueDate) {
    const date = new Date(dueDate);
    formattedDueDate = date.toISOString().split('T')[0];
  }

  const [result] = await pool.query(
    `INSERT INTO cards (list_id, title, description, due_date, assignee, order_index) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [listId, title, description || null, formattedDueDate, assignee || null, nextOrderIndex]
  );

  const [cards] = await pool.query(
    `SELECT id, list_id, title, description, due_date, assignee, order_index, created_at, updated_at 
     FROM cards WHERE id = ?`,
    [(result as any).insertId]
  );

  const [lists] = await pool.query(
    'SELECT board_id FROM lists WHERE id = ?',
    [listId]
  );
  const boardId = lists[0]?.board_id;

  return { card: cards[0], boardId };
}

/**
 * 删除卡片
 * @param cardId 卡片ID
 * @returns 看板ID
 */
export async function deleteCard(cardId: number) {
  const [cards] = await pool.query(
    'SELECT c.list_id, l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = ?',
    [cardId]
  );
  
  const boardId = cards[0]?.board_id;

  await pool.query('DELETE FROM cards WHERE id = ?', [cardId]);

  return boardId;
}

/**
 * 更新卡片
 * @param cardId 卡片ID
 * @param updates 更新字段
 * @returns 更新后的卡片和看板ID
 */
export async function updateCard(cardId: number, updates: { title?: string; description?: string; dueDate?: string; assignee?: number }) {
  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (updates.title !== undefined) {
    updateFields.push('title = ?');
    updateValues.push(updates.title);
  }

  if (updates.description !== undefined) {
    updateFields.push('description = ?');
    updateValues.push(updates.description || null);
  }

  if (updates.dueDate !== undefined) {
    updateFields.push('due_date = ?');
    updateValues.push(updates.dueDate || null);
  }

  if (updates.assignee !== undefined) {
    updateFields.push('assignee = ?');
    updateValues.push(updates.assignee || null);
  }

  if (updateFields.length === 0) {
    throw new Error('没有提供需要更新的字段');
  }

  updateFields.push('updated_at = NOW()');
  updateValues.push(cardId);

  await pool.query(
    `UPDATE cards SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  const [updatedCards] = await pool.query(
    'SELECT id, list_id, title, description, due_date, assignee, order_index, created_at, updated_at FROM cards WHERE id = ?',
    [cardId]
  );

  const [lists] = await pool.query(
    'SELECT board_id FROM lists WHERE id = ?',
    [updatedCards[0]?.list_id]
  );
  const boardId = lists[0]?.board_id;

  return { updatedCard: updatedCards[0], boardId };
}

/**
 * 更新卡片位置
 * @param cardId 卡片ID
 * @param sourceListId 源列表ID
 * @param targetListId 目标列表ID
 * @param newOrder 新位置
 * @param userId 用户ID
 * @returns 更新后的卡片和看板ID
 */
export async function updateCardPosition(cardId: number, sourceListId: number | undefined, targetListId: number, newOrder: number, userId: number) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

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
      throw new Error('卡片不存在');
    }

    const card = cards[0];
    const boardId = card.board_id;
    const originalListId = card.list_id;
    const originalOrder = card.order_index;
    const actualSourceListId = sourceListId !== undefined ? sourceListId : originalListId;
    const actualTargetListId = parseInt(targetListId.toString());

    const [targetLists] = await connection.query(
      `SELECT l.id, l.board_id, b.owner_id
       FROM lists l
       JOIN boards b ON l.board_id = b.id
       WHERE l.id = ? AND b.owner_id = ?`,
      [actualTargetListId, userId]
    );

    if (targetLists.length === 0) {
      await connection.rollback();
      throw new Error('目标列表不存在或无权操作');
    }

    const [cardCount] = await connection.query(
      'SELECT COUNT(*) as count FROM cards WHERE list_id = ?',
      [actualTargetListId]
    );
    const targetListCardCount = cardCount[0].count;

    let adjustedNewOrder = newOrder;
    if (adjustedNewOrder < 0) {
      adjustedNewOrder = 0;
    } else if (adjustedNewOrder > targetListCardCount) {
      adjustedNewOrder = targetListCardCount;
    }

    if (actualSourceListId === actualTargetListId) {
      if (adjustedNewOrder === originalOrder) {
        await connection.commit();
        return { updatedCard: card, boardId };
      }

      if (adjustedNewOrder > originalOrder) {
        await connection.query(
          `UPDATE cards SET order_index = order_index - 1
           WHERE list_id = ? AND order_index > ? AND order_index <= ?`,
          [actualSourceListId, originalOrder, adjustedNewOrder]
        );
      } else {
        await connection.query(
          `UPDATE cards SET order_index = order_index + 1
           WHERE list_id = ? AND order_index >= ? AND order_index < ?`,
          [actualSourceListId, adjustedNewOrder, originalOrder]
        );
      }

      await connection.query(
        'UPDATE cards SET order_index = ?, updated_at = NOW() WHERE id = ?',
        [adjustedNewOrder, cardId]
      );
    } else {
      await connection.query(
        `UPDATE cards SET order_index = order_index - 1
         WHERE list_id = ? AND order_index > ?`,
        [actualSourceListId, originalOrder]
      );

      await connection.query(
        `UPDATE cards SET order_index = order_index + 1
         WHERE list_id = ? AND order_index >= ?`,
        [actualTargetListId, adjustedNewOrder]
      );

      await connection.query(
        'UPDATE cards SET list_id = ?, order_index = ?, updated_at = NOW() WHERE id = ?',
        [actualTargetListId, adjustedNewOrder, cardId]
      );
    }

    await connection.commit();

    const [updatedCards] = await pool.query(
      `SELECT c.id, c.list_id, c.title, c.description, c.due_date, c.assignee, c.order_index, c.created_at, c.updated_at
       FROM cards c
       WHERE c.id = ?`,
      [cardId]
    );

    return { updatedCard: updatedCards[0], boardId };
  } finally {
    connection.release();
  }
}

/**
 * 完成卡片
 * @param cardId 卡片ID
 * @param getOrCreateCompletedList 获取或创建已完成列表的函数
 * @returns 更新后的卡片和看板ID
 */
export async function completeCard(cardId: number, getOrCreateCompletedList: any) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

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
      throw new Error('卡片不存在');
    }

    const card = cards[0];
    const boardId = card.board_id;
    const originalListId = card.list_id;

    const completedList = await getOrCreateCompletedList(boardId, connection);
    const completedListId = completedList.id;

    if (originalListId === completedListId) {
      await connection.rollback();
      throw new Error('卡片已在已完成列表中');
    }

    const completedFromListId = originalListId;
    const originalOrderIndex = card.order_index;

    await connection.query(
      `UPDATE cards SET order_index = order_index - 1
       WHERE list_id = ? AND order_index > ?`,
      [originalListId, originalOrderIndex]
    );

    const [cardCount] = await connection.query(
      'SELECT COUNT(*) as count FROM cards WHERE list_id = ?',
      [completedListId]
    );
    const newOrderIndex = cardCount[0].count;

    await connection.query(
      `UPDATE cards 
       SET list_id = ?, order_index = ?, completed_from_list_id = ?, updated_at = NOW() 
       WHERE id = ?`,
      [completedListId, newOrderIndex, completedFromListId, cardId]
    );

    await connection.commit();

    const [updatedCards] = await pool.query(
      `SELECT c.id, c.list_id, c.title, c.description, c.due_date, c.assignee, c.order_index, c.created_at, c.updated_at, c.completed_from_list_id
       FROM cards c
       WHERE c.id = ?`,
      [cardId]
    );

    return { updatedCard: updatedCards[0], boardId };
  } finally {
    connection.release();
  }
}

/**
 * 撤销完成卡片
 * @param cardId 卡片ID
 * @param getCompletedList 获取已完成列表的函数
 * @param getFirstNonSystemList 获取第一个非系统列表的函数
 * @returns 更新后的卡片和看板ID
 */
export async function uncompleteCard(cardId: number, getCompletedList: any, getFirstNonSystemList: any) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

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
      throw new Error('卡片不存在');
    }

    const card = cards[0];
    const boardId = card.board_id;
    const currentListId = card.list_id;
    const currentOrderIndex = card.order_index;
    const completedFromListId = card.completed_from_list_id;

    const completedList = await getCompletedList(boardId, connection);
    if (!completedList) {
      await connection.rollback();
      throw new Error('已完成列表不存在');
    }

    if (currentListId !== completedList.id) {
      await connection.rollback();
      throw new Error('卡片不在已完成列表中');
    }

    if (!completedFromListId) {
      await connection.rollback();
      throw new Error('无法撤销完成，没有记录原始列表');
    }

    let targetListId = completedFromListId;

    const [targetLists] = await connection.query(
      'SELECT id FROM lists WHERE id = ? AND board_id = ?',
      [completedFromListId, boardId]
    );

    if (targetLists.length === 0) {
      const fallbackList = await getFirstNonSystemList(boardId, connection);
      if (!fallbackList) {
        await connection.rollback();
        throw new Error('原始列表已删除，且没有其他可用列表');
      }
      targetListId = fallbackList.id;
    }

    await connection.query(
      `UPDATE cards SET order_index = order_index - 1
       WHERE list_id = ? AND order_index > ?`,
      [completedList.id, currentOrderIndex]
    );

    const [targetCardCount] = await connection.query(
      'SELECT COUNT(*) as count FROM cards WHERE list_id = ?',
      [targetListId]
    );
    const newOrderIndex = targetCardCount[0].count;

    await connection.query(
      `UPDATE cards 
       SET list_id = ?, order_index = ?, completed_from_list_id = NULL, updated_at = NOW() 
       WHERE id = ?`,
      [targetListId, newOrderIndex, cardId]
    );

    await connection.commit();

    const [updatedCards] = await pool.query(
      `SELECT c.id, c.list_id, c.title, c.description, c.due_date, c.assignee, c.order_index, c.created_at, c.updated_at, c.completed_from_list_id
       FROM cards c
       WHERE c.id = ?`,
      [cardId]
    );

    return { updatedCard: updatedCards[0], boardId };
  } finally {
    connection.release();
  }
}

module.exports = {
  createCard,
  deleteCard,
  updateCard,
  updateCardPosition,
  completeCard,
  uncompleteCard
};