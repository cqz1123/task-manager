/**
 * 看板权限检查中间件模块
 * 验证用户对看板的访问权限，支持 owner、editor、viewer 三种角色
 * 角色权限等级：owner > editor > viewer
 */

const pool = require('../config/database');

// 角色权限等级定义
const ROLE_LEVELS: { [key: string]: number } = {
  viewer: 1,
  editor: 2,
  owner: 3
};

/**
 * 创建看板权限检查中间件
 * @param requiredRole - 所需的最小权限角色
 * @returns Express 中间件函数
 */
function checkBoardRole(requiredRole: 'owner' | 'editor' | 'viewer') {
  return async function (req: any, res: any, next: any): Promise<void> {
    try {
      // 从路径参数中获取看板 ID
      const boardId = parseInt(req.params.boardId);
      
      if (isNaN(boardId)) {
        res.status(400).json({
          success: false,
          error: '看板 ID 无效'
        });
        return;
      }

      // 从请求对象中获取用户 ID（由认证中间件附加）
      const userId = req.userId;

      // 首先检查用户是否是看板所有者
      const [boards] = await pool.query(
        'SELECT id, owner_id FROM boards WHERE id = ?',
        [boardId]
      );

      // 如果看板不存在
      if (boards.length === 0) {
        res.status(404).json({
          success: false,
          error: '看板不存在'
        });
        return;
      }

      // 获取看板信息
      const board = boards[0];
      let userRole: 'owner' | 'editor' | 'viewer' | null = null;

      // 判断用户角色
      if (board.owner_id === userId) {
        // 用户是看板所有者
        userRole = 'owner';
      } else {
        // 查询 board_members 表检查用户是否是成员
        const [members] = await pool.query(
          'SELECT role FROM board_members WHERE board_id = ? AND user_id = ?',
          [boardId, userId]
        );

        if (members.length > 0) {
          userRole = members[0].role;
        }
      }

      // 如果用户没有任何权限
      if (!userRole) {
        res.status(403).json({
          success: false,
          error: '无权访问该看板'
        });
        return;
      }

      // 检查权限等级是否满足要求
      const requiredLevel = ROLE_LEVELS[requiredRole];
      const userLevel = ROLE_LEVELS[userRole];

      // 使用非空断言，因为 requiredRole 和 userRole 都是有效的角色值
      if ((userLevel as number) < (requiredLevel as number)) {
        res.status(403).json({
          success: false,
          error: '权限不足，需要更高权限'
        });
        return;
      }

      // 将用户角色挂载到请求对象，供后续中间件或控制器使用
      req.boardRole = userRole;

      // 权限验证通过，调用下一个中间件
      next();
    } catch (error) {
      // 数据库查询失败，返回 500 错误
      console.error('权限检查失败:', error);
      res.status(500).json({
        success: false,
        error: '权限检查失败'
      });
    }
  };
}

// 导出中间件工厂函数
module.exports = {
  checkBoardRole
};
