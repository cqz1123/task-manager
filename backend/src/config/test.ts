 const pool = require('./database');

async function test() {
  try {
    const [results] = await pool.query('SELECT * FROM users');
    console.log('查询结果：', results);
  } catch (err: any) {
    console.error('查询失败：', err.message);
  }
  process.exit();
}

test();