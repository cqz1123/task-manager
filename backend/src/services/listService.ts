/**
 * 列表服务模块
 * 提供列表相关的辅助函数
 */

const pool = require('../config/database');

/**
 * 获取或创建"已完成"系统列表
 * @param boardId 看板 ID
 * @param connection 数据库连接（用于事务）
 * @returns 列表对象
 */
async function getOrCreateCompletedList(boardId: number, connection?: any): Promise<any> {
  const db = connection || pool;
  
  // 尝试查找已存在的"已完成"系统列表
  const [existingLists] = await db.query(
    'SELECT id, board_id, title, order_index, created_at FROM lists WHERE board_id = ? AND title = ? AND is_system = 1',
    [boardId, '已完成']
  );
  
  if (existingLists.length > 0) {
    return existingLists[0];
  }
  
  // 如果不存在，创建新的"已完成"列表
  // 获取当前看板最大的 order_index
  const [maxOrder] = await db.query(
    'SELECT MAX(order_index) as max_order FROM lists WHERE board_id = ?',
    [boardId]
  );
  
  const nextOrderIndex = (maxOrder[0]?.max_order ?? -1) + 1;
  
  // 插入新列表
  const [result] = await db.query(
    'INSERT INTO lists (board_id, title, order_index, is_system) VALUES (?, ?, ?, 1)',
    [boardId, '已完成', nextOrderIndex]
  );
  
  // 获取刚创建的列表
  const [newLists] = await db.query(
    'SELECT id, board_id, title, order_index, created_at FROM lists WHERE id = ?',
    [result.insertId]
  );
  
  return newLists[0];
}

/**
 * 获取看板的"已完成"列表（仅查找，不创建）
 * @param boardId 看板 ID
 * @param connection 数据库连接
 * @returns 列表对象或 null
 */
async function getCompletedList(boardId: number, connection?: any): Promise<any | null> {
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
async function getFirstNonSystemList(boardId: number, connection?: any): Promise<any | null> {
  const db = connection || pool;
  
  const [lists] = await db.query(
    'SELECT id, board_id, title, order_index, created_at FROM lists WHERE board_id = ? AND is_system = 0 ORDER BY order_index ASC LIMIT 1',
    [boardId]
  );
  
  return lists.length > 0 ? lists[0] : null;
}

module.exports = {
  getOrCreateCompletedList,
  getCompletedList,
  getFirstNonSystemList
};
