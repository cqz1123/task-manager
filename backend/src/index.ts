const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// 导入路由
const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const listRoutes = require('./routes/listRoutes');
const cardRoutes = require('./routes/cardRoutes');

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

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
