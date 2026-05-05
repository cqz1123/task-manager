/**
 * 列表服务模块
 * 封装列表相关的业务逻辑
 */

const pool = require('../config/database');

/**
 * 获取单个看板的所有列表及其卡片
 * @param boardId 看板ID
 * @returns 看板信息和列表（含卡片）
 */
export async function getListsWithCards(boardId: number) {
  const [boards] = await pool.query(
    'SELECT id, name, color, invite_code, owner_id, created_at FROM boards WHERE id = ?',
    [boardId]
  );

  if (boards.length === 0) {
    throw new Error('看板不存在');
  }

  const board = boards[0];

  const [lists] = await pool.query(
    'SELECT id, board_id, title, order_index, is_system, created_at FROM lists WHERE board_id = ? ORDER BY is_system ASC, order_index ASC',
    [boardId]
  );

  const listIds = lists.map((list: any) => list.id);
  const listCardsMap: { [key: number]: any[] } = {};

  if (listIds.length > 0) {
    const placeholders = listIds.map(() => '?').join(',');
    const [cards] = await pool.query(
      `SELECT id, list_id, title, description, due_date, assignee, order_index, created_at, updated_at, completed_from_list_id 
       FROM cards WHERE list_id IN (${placeholders}) ORDER BY order_index ASC`,
      listIds
    );

    if (cards && cards.length > 0) {
      cards.forEach((card: any) => {
        const listId = card.list_id;
        if (listId !== undefined && listId !== null) {
          if (!listCardsMap[listId]) {
            listCardsMap[listId] = [];
          }
          listCardsMap[listId]!.push(card);
        }
      });
    }
  }

  const listsWithCards = lists.map((list: any) => ({
    id: list.id,
    board_id: list.board_id,
    title: list.title,
    order_index: list.order_index,
    is_system: list.is_system,
    created_at: list.created_at,
    cards: listCardsMap[list.id] || []
  }));

  return { board, lists: listsWithCards };
}

/**
 * 创建新列表
 * @param boardId 看板ID
 * @param title 列表标题
 * @returns 创建的列表
 */
export async function createList(boardId: number, title: string) {
  const [maxOrder] = await pool.query(
    'SELECT MAX(order_index) as max_order FROM lists WHERE board_id = ?',
    [boardId]
  );

  const nextOrderIndex = (maxOrder[0]?.max_order ?? -1) + 1;

  const [result] = await pool.query(
    'INSERT INTO lists (board_id, title, order_index) VALUES (?, ?, ?)',
    [boardId, title, nextOrderIndex]
  );

  const [lists] = await pool.query(
    'SELECT id, board_id, title, order_index, created_at FROM lists WHERE id = ?',
    [(result as any).insertId]
  );

  return lists[0];
}

/**
 * 删除列表
 * @param listId 列表ID
 * @returns 看板ID
 */
export async function deleteList(listId: number) {
  const [lists] = await pool.query(
    'SELECT board_id FROM lists WHERE id = ?',
    [listId]
  );
  
  const boardId = lists[0]?.board_id;

  await pool.query('DELETE FROM lists WHERE id = ?', [listId]);

  return boardId;
}

/**
 * 更新列表
 * @param listId 列表ID
 * @param title 新标题
 * @returns 更新后的列表和看板ID
 */
export async function updateList(listId: number, title: string) {
  const [boardInfo] = await pool.query(
    'SELECT board_id FROM lists WHERE id = ?',
    [listId]
  );
  const boardId = boardInfo[0]?.board_id;

  await pool.query(
    'UPDATE lists SET title = ? WHERE id = ?',
    [title, listId]
  );

  const [updatedLists] = await pool.query(
    'SELECT id, board_id, title, order_index, created_at FROM lists WHERE id = ?',
    [listId]
  );

  return { updatedList: updatedLists[0], boardId };
}

/**
 * 获取或创建"已完成"系统列表
 * @param boardId 看板 ID
 * @param connection 数据库连接（用于事务）
 * @returns 列表对象
 */
export async function getOrCreateCompletedList(boardId: number, connection?: any): Promise<any> {
  const db = connection || pool;
  
  const [existingLists] = await db.query(
    'SELECT id, board_id, title, order_index, created_at FROM lists WHERE board_id = ? AND title = ? AND is_system = 1',
    [boardId, '已完成']
  );
  
  if (existingLists.length > 0) {
    return existingLists[0];
  }
  
  const [maxOrder] = await db.query(
    'SELECT MAX(order_index) as max_order FROM lists WHERE board_id = ?',
    [boardId]
  );
  
  const nextOrderIndex = (maxOrder[0]?.max_order ?? -1) + 1;
  
  const [result] = await db.query(
    'INSERT INTO lists (board_id, title, order_index, is_system) VALUES (?, ?, ?, 1)',
    [boardId, '已完成', nextOrderIndex]
  );
  
  const [newLists] = await db.query(
    'SELECT id, board_id, title, order_index, created_at FROM lists WHERE id = ?',
    [(result as any).insertId]
  );
  
  return newLists[0];
}

/**
 * 获取看板的"已完成"列表（仅查找，不创建）
 * @param boardId 看板 ID
 * @param connection 数据库连接
 * @returns 列表对象或 null
 */
export async function getCompletedList(boardId: number, connection?: any): Promise<any | null> {
  const db = connection || pool;
  
  const [lists] = await db.query(
    'SELECT id, board_id, title, order_index, created_at FROM lists WHERE board_id = ? AND title = ? AND is_system = 1',
    [boardId, '已完成']
  );
  
  return lists.length > 0 ? lists[0] : null;
}

/**
 * 获取看板中 order_index 最小的非系统列表
 * @param boardId 看板 ID
 * @param connection 数据库连接
 * @returns 列表对象或 null
 */
export async function getFirstNonSystemList(boardId: number, connection?: any): Promise<any | null> {
  const db = connection || pool;
  
  const [lists] = await db.query(
    'SELECT id, board_id, title, order_index, created_at FROM lists WHERE board_id = ? AND is_system = 0 ORDER BY order_index ASC LIMIT 1',
    [boardId]
  );
  
  return lists.length > 0 ? lists[0] : null;
}

module.exports = {
  getListsWithCards,
  createList,
  deleteList,
  updateList,
  getOrCreateCompletedList,
  getCompletedList,
  getFirstNonSystemList
};