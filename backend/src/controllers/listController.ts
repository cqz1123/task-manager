/**
 * 列表控制器模块
 * 处理列表相关的业务逻辑，包括获取、创建、删除列表
 */

const pool = require('../config/database');
const { emitToBoard } = require('../socket/helpers');

/**
 * 获取单个看板的所有列表及其卡片
 * 验证用户权限后，返回嵌套的列表和卡片结构
 */
async function getListsWithCards(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取通过认证中间件附加的用户 ID 和角色
    const userId = req.userId;
    const boardRole = req.boardRole;
    // 从路径参数中获取看板 ID
    const boardId = parseInt(req.params.boardId);

    // 如果没有权限（权限中间件已验证，这里作为双重检查）
    if (!boardRole) {
      res.status(403).json({
        success: false,
        error: '无权访问该看板'
      });
      return;
    }

    // 获取看板信息
    const [boards] = await pool.query(
      'SELECT id, name, color, invite_code, owner_id, created_at FROM boards WHERE id = ?',
      [boardId]
    );

    if (boards.length === 0) {
      res.status(404).json({
        success: false,
        error: '看板不存在'
      });
      return;
    }

    const board = boards[0];

    // 查询该看板下的所有列表，按 is_system 升序（系统列表排后），再按 order_index 升序排列
    const [lists] = await pool.query(
      'SELECT id, board_id, title, order_index, is_system, created_at FROM lists WHERE board_id = ? ORDER BY is_system ASC, order_index ASC',
      [boardId]
    );

    // 为每个列表查询其下的所有卡片
    const listIds = lists.map((list: any) => list.id);
    const listCardsMap: { [key: number]: any[] } = {};

    if (listIds.length > 0) {
      const placeholders = listIds.map(() => '?').join(',');
      const [cards] = await pool.query(
        `SELECT id, list_id, title, description, due_date, assignee, order_index, created_at, updated_at, completed_from_list_id 
         FROM cards WHERE list_id IN (${placeholders}) ORDER BY order_index ASC`,
        listIds
      );

      // 将卡片按 list_id 分组
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

    // 构建嵌套结构
    const listsWithCards = lists.map((list: any) => ({
      id: list.id,
      board_id: list.board_id,
      title: list.title,
      order_index: list.order_index,
      is_system: list.is_system,
      created_at: list.created_at,
      cards: listCardsMap[list.id] || []
    }));

    // 返回成功响应（包含用户角色）
    res.status(200).json({
      success: true,
      board: {
        ...board,
        myRole: boardRole
      },
      boardId: boardId,
      lists: listsWithCards
    });
  } catch (error) {
    // 数据库查询失败，返回 500 错误
    console.error('获取列表和卡片失败:', error);
    res.status(500).json({
      success: false,
      error: '获取列表和卡片失败'
    });
  }
}

/**
 * 创建新列表
 * 验证用户权限后，创建新列表
 */
async function createList(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取通过认证中间件附加的用户角色（权限中间件已验证）
    const boardRole = req.boardRole;
    // 从路径参数中获取看板 ID
    const boardId = parseInt(req.params.boardId);
    // 从请求体中获取列表信息
    const { title } = req.body;

    // 验证参数
    if (!boardId || !title) {
      res.status(400).json({
        success: false,
        error: '看板 ID 和标题不能为空'
      });
      return;
    }

    // 验证权限：只有 owner 和 editor 可以创建列表
    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
      });
      return;
    }

    // 获取当前看板下最大的 order_index
    const [maxOrder] = await pool.query(
      'SELECT MAX(order_index) as max_order FROM lists WHERE board_id = ?',
      [boardId]
    );

    const nextOrderIndex = (maxOrder[0]?.max_order ?? -1) + 1;

    // 插入新列表到数据库
    const [result] = await pool.query(
      'INSERT INTO lists (board_id, title, order_index) VALUES (?, ?, ?)',
      [boardId, title, nextOrderIndex]
    );

    // 获取刚创建的列表信息
    const [lists] = await pool.query(
      'SELECT id, board_id, title, order_index, created_at FROM lists WHERE id = ?',
      [result.insertId]
    );

    const newList = lists[0];
    
    // 广播列表创建事件
    emitToBoard(boardId, 'list-created', {
      ...newList,
      cards: []
    });

    // 返回成功响应
    res.status(201).json({
      success: true,
      data: newList
    });
  } catch (error) {
    // 数据库查询失败，返回 500 错误
    console.error('创建列表失败:', error);
    res.status(500).json({
      success: false,
      error: '创建列表失败'
    });
  }
}

/**
 * 删除列表
 * 验证用户权限后删除列表（由于外键 ON DELETE CASCADE，其下的卡片会自动删除）
 */
async function deleteList(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取通过认证中间件附加的用户角色（权限中间件已验证）
    const boardRole = req.boardRole;
    // 从路径参数中获取列表 ID
    const listId = parseInt(req.params.listId);

    // 验证权限：只有 owner 和 editor 可以删除列表
    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
      });
      return;
    }

    // 获取列表所属的看板 ID
    const [lists] = await pool.query(
      'SELECT board_id FROM lists WHERE id = ?',
      [listId]
    );
    
    const boardId = lists[0]?.board_id;

    // 删除列表（由于外键 ON DELETE CASCADE，其下的卡片会自动删除）
    await pool.query('DELETE FROM lists WHERE id = ?', [listId]);

    // 广播列表删除事件
    if (boardId) {
      emitToBoard(boardId, 'list-deleted', { listId });
    }

    // 返回成功响应
    res.status(200).json({
      success: true,
      message: '列表删除成功'
    });
  } catch (error) {
    // 数据库查询失败，返回 500 错误
    console.error('删除列表失败:', error);
    res.status(500).json({
      success: false,
      error: '删除列表失败'
    });
  }
}

/**
 * 修改列表标题
 * 验证用户权限后更新列表标题
 */
async function updateList(req: any, res: any): Promise<void> {
  try {
    // 从请求对象中获取通过认证中间件附加的用户角色（权限中间件已验证）
    const boardRole = req.boardRole;
    // 从路径参数中获取列表 ID
    const listId = parseInt(req.params.listId);
    // 从请求体中获取列表信息
    const { title } = req.body;

    // 验证必填参数
    if (!title) {
      res.status(400).json({
        success: false,
        error: '列表标题不能为空'
      });
      return;
    }

    // 验证权限：只有 owner 和 editor 可以修改列表
    if (boardRole !== 'owner' && boardRole !== 'editor') {
      res.status(403).json({
        success: false,
        error: '权限不足，需要编辑权限'
      });
      return;
    }

    // 获取列表所属的看板 ID
    const [boardInfo] = await pool.query(
      'SELECT board_id FROM lists WHERE id = ?',
      [listId]
    );
    const boardId = boardInfo[0]?.board_id;

    // 更新列表标题
    await pool.query(
      'UPDATE lists SET title = ? WHERE id = ?',
      [title, listId]
    );

    // 获取更新后的列表信息
    const [updatedLists] = await pool.query(
      'SELECT id, board_id, title, order_index, created_at FROM lists WHERE id = ?',
      [listId]
    );

    const updatedList = updatedLists[0];

    // 广播列表更新事件
    if (boardId) {
      emitToBoard(boardId, 'list-updated', updatedList);
    }

    // 返回成功响应
    res.status(200).json({
      success: true,
      data: updatedList
    });
  } catch (error) {
    // 数据库查询失败，返回 500 错误
    console.error('修改列表失败:', error);
    res.status(500).json({
      success: false,
      error: '修改列表失败'
    });
  }
}

// 导出模块
module.exports = {
  getListsWithCards,
  createList,
  deleteList,
  updateList
};
