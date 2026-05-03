/**
 * Socket.IO 辅助函数模块
 * 提供向指定看板房间广播消息的功能
 */

import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

/**
 * 设置 Socket.IO 实例
 * @param server - Socket.IO 服务器实例
 */
export function setIo(server: SocketIOServer): void {
  io = server;
}

/**
 * 向指定看板房间广播消息
 * @param boardId - 看板 ID
 * @param event - 事件名称
 * @param data - 事件数据
 */
export function emitToBoard(boardId: number, event: string, data: any): void {
  if (!io) {
    console.error('Socket.IO 实例尚未初始化');
    return;
  }
  
  const roomName = `board:${boardId}`;
  io.to(roomName).emit(event, data);
}

/**
 * 获取 Socket.IO 实例
 * @returns Socket.IO 服务器实例
 */
export function getIo(): SocketIOServer | null {
  return io;
}