const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Socket.IO 相关导入
const { Server } = require('socket.io');
const { setIo } = require('./socket/helpers');
const { verifyToken } = require('./utils/jwt');

// 导入路由
const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const listRoutes = require('./routes/listRoutes');
const cardRoutes = require('./routes/cardRoutes');
const memberRoutes = require('./routes/memberRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors()); // 跨域
app.use(morgan('dev')); // 日志
app.use(express.json()); // JSON 解析
app.use(express.urlencoded({ extended: true })); // URL 编码

// 路由
app.use('/api/auth', authRoutes);
app.use('/api', boardRoutes);
app.use('/api', listRoutes);
app.use('/api', cardRoutes);
app.use('/api', memberRoutes);
app.use('/api/user', userRoutes);

// 根路径
app.get('/', (req: any, res: any) => {
  res.json({ 
    message: 'Task Manager API',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 处理
app.use((req: any, res: any) => {
  res.status(404).json({ error: '路由不存在' });
});

// 错误处理中间件
app.use((err: any, req: any, res: any, next: any) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 创建 HTTP 服务器
const server = http.createServer(app);

// 创建 Socket.IO 实例并配置
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 初始化 Socket.IO 辅助函数
setIo(io);

// Socket.IO 身份验证中间件
io.use((socket: any, next: any) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('未提供认证令牌'));
  }
  
  try {
    const decoded = verifyToken(token);
    socket.data.userId = decoded.userId;
    socket.data.username = decoded.username;
    next();
  } catch (error) {
    return next(new Error('令牌验证失败'));
  }
});

// 监听连接事件
io.on('connection', (socket: any) => {
  console.log(`用户 ${socket.data.userId} 已连接`);
  
  // 监听加入看板房间的消息
  socket.on('join-board', (boardId: number) => {
    const roomName = `board:${boardId}`;
    socket.join(roomName);
    console.log(`用户 ${socket.data.userId} 加入看板房间: ${roomName}`);
  });
  
  // 监听断开连接事件
  socket.on('disconnect', () => {
    console.log(`用户 ${socket.data.userId} 已断开连接`);
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 导出 io 实例供其他模块使用
module.exports = { io };