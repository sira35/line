const express = require('express');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = process.env.PORT || 3001; // Vercel 会设置 PORT 环境变量

app.use(express.json());

const uri = process.env.MONGODB_URI; // 从环境变量获取连接字符串
const client = new MongoClient(uri);

async function connectToDatabase() {
  await client.connect();
  return client.db('line_db');
}

// 生成密钥
app.get('/api/generate-key', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const newKey = uuidv4();
    await db.collection('keys').insertOne({ key: newKey, used: false });
    res.json({ key: newKey });
  } catch (err) {
    console.error('生成密钥失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 处理购买
app.post('/api/purchase', async (req, res) => {
  try {
    const { key } = req.body;
    const db = await connectToDatabase();

    // 检查密钥
    const keyDoc = await db.collection('keys').findOne({ key });
    if (!keyDoc) {
      return res.status(400).json({ message: '无效的密钥' });
    }
    if (keyDoc.used) {
      return res.status(400).json({ message: '密钥已被使用' });
    }

    // 检查库存
    const item = await db.collection('items').findOne({ id: 1 });
    if (!item || item.stock <= 0) {
      return res.status(400).json({ message: '库存不足' });
    }

    // 更新库存和密钥状态
    await db.collection('items').updateOne({ id: 1 }, { $inc: { stock: -1 } });
    await db.collection('keys').updateOne({ key }, { $set: { used: true } });
    res.json({ message: '购买成功', stock: item.stock - 1 });
  } catch (err) {
    console.error('购买失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取商品信息
app.get('/api/items', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const items = await db.collection('items').find().toArray();
    res.json(items);
  } catch (err) {
    console.error('获取商品失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.listen(port, () => {
  console.log(`服务者运行在 http://localhost:${port}`);
});