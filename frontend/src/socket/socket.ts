/**
 * Socket.IO 管理模块
 * 提供实时通信功能，支持看板协作
 */

import { io, Socket } from 'socket.io-client';

// 从环境变量读取 WebSocket 地址，默认为 http://localhost:3000
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

// 创建 socket 实例
const socket: Socket = io(WS_URL, {
  auth: {
    token: localStorage.getItem('token') || ''
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

// 监听连接错误
socket.on('connect_error', (error) => {
  console.error('Socket.IO 连接失败:', error);
});

// 监听连接成功
socket.on('connect', () => {
  console.log('Socket.IO 连接成功');
});

// 监听断开连接
socket.on('disconnect', (reason) => {
  console.log('Socket.IO 断开连接:', reason);
});

/**
 * 加入看板房间
 * @param boardId - 看板 ID
 */
const joinBoard = (boardId: number): void => {
  socket.emit('join-board', boardId);
};

/**
 * 离开看板房间
 * @param boardId - 看板 ID
 */
const leaveBoard = (boardId: number): void => {
  socket.emit('leave-board', boardId);
};

/**
 * 更新认证令牌
 * @param token - 新的 JWT 令牌
 */
const updateToken = (token: string): void => {
  socket.auth = { token };
  // 重新连接以使用新令牌
  socket.disconnect();
  socket.connect();
};

export {
  socket,
  joinBoard,
  leaveBoard,
  updateToken
};