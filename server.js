const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const adminRouter = require('./admin');
const app = express();

// 中间件配置
app.use(express.json());

// 读取和写入数据的辅助函数
const DATA_FILE = path.join(__dirname, 'data.json');

const readData = () => {
  try {
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
  } catch (err) {
    // 如果文件不存在，创建默认数据
    const defaultData = {
      items: [{ id: 1, name: "Line商品", price: 35.00, stock: 100 }],
      keys: {}
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// 使用管理员路由
app.use('/api/admin', adminRouter);

// 生成唯一密钥
app.get('/api/generate-key', (req, res) => {
  console.log('生成新密钥');
  const data = readData();
  
  // 生成唯一密钥
  const newKey = uuidv4();
  
  // 存储密钥（初始状态：未使用）
  data.keys[newKey] = {
    used: false,
    generatedAt: new Date().toISOString()
  };
  
  writeData(data);
  
  res.json({ 
    success: true, 
    key: newKey,
    message: '密钥生成成功，请妥善保管' 
  });
});

// 商品 CRUD API 端点
app.get('/api/items', (req, res) => {
  console.log('GET /api/items 被调用');
  const data = readData();
  res.json(data.items || []);
});

app.post('/api/items', (req, res) => {
  console.log('POST /api/items 被调用', req.body);
  const data = readData();
  const newItem = req.body;
  
  // 生成新的ID
  const maxId = Math.max(0, ...data.items.map(item => item.id));
  newItem.id = maxId + 1;
  
  data.items = data.items || [];
  data.items.push(newItem);
  writeData(data);
  
  res.json({ message: "添加成功", items: data.items });
});

app.put('/api/items/:id', (req, res) => {
  console.log(`PUT /api/items/${req.params.id} 被调用`, req.body);
  const id = parseInt(req.params.id);
  const updatedItem = req.body;
  const data = readData();
  
  data.items = data.items.map(item => 
    item.id === id ? { ...item, ...updatedItem, id } : item
  );
  writeData(data);
  
  res.json({ message: "更新成功", items: data.items });
});

app.delete('/api/items/:id', (req, res) => {
  console.log(`DELETE /api/items/${req.params.id} 被调用`);
  const id = parseInt(req.params.id);
  const data = readData();
  
  data.items = data.items.filter(item => item.id !== id);
  writeData(data);
  
  res.json({ message: "删除成功", items: data.items });
});

// 获取商品信息
app.get('/api/product-info', (req, res) => {
  console.log('GET /api/product-info 被调用');
  const data = readData();
  
  // 计算库存总量
  const totalStock = data.items.reduce((total, item) => total + item.stock, 0);
  
  res.json({
    stock: totalStock,
    price: data.items[0]?.price || 0
  });
});

// 验证密钥并处理购买
app.post('/api/purchase', (req, res) => {
  console.log('接收到购买请求:', req.body);
  const { key } = req.body;
  const data = readData();
  
  // 验证密钥是否存在
  if (!data.keys || !data.keys[key]) {
    console.log('购买失败，密钥不存在:', key);
    return res.json({ success: false, message: '密钥不存在，请获取有效密钥' });
  }
  
  // 验证密钥是否已使用
  if (data.keys[key].used) {
    console.log('购买失败，密钥已使用:', key);
    return res.json({ success: false, message: '密钥已使用，请获取新密钥' });
  }
  
  // 检查库存
  if (data.items[0].stock <= 0) {
    console.log('购买失败，库存不足');
    return res.json({ success: false, message: '库存不足，无法购买' });
  }
  
  // 减少库存
  data.items[0].stock -= 1;
  
  // 标记密钥为已使用
  data.keys[key].used = true;
  data.keys[key].usedAt = new Date().toISOString();
  
  writeData(data);
  
  console.log('购买成功，库存减少为:', data.items[0].stock);
  res.json({ 
    success: true, 
    message: '购买成功！', 
    stock: data.items[0].stock 
  });
});

// 兼容原有代码，将 /api/verify-key 重定向到 /api/purchase
app.post('/api/verify-key', (req, res) => {
  console.log('接收到 /api/verify-key 请求，重定向到 /api/purchase');
  
  // 直接转发到 /api/purchase 处理
  app.handle(req, res, () => {
    req.url = '/api/purchase';
    app.handle(req, res);
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({ message: '服务器内部错误', error: err.message });
});

// 静态文件路由 - 放在 API 路由之后
app.use(express.static('public'));

// 适用于任何其他路由的处理（确保 JSON API 优先）
app.use('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API 端点不存在' });
  }
  // 对于非 API 路由，返回索引页面
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`服务器运行在端口 ${port}`);
  console.log(`API路径: /api/generate-key (生成密钥)`);
  console.log(`API路径: /api/purchase (使用密钥购买商品)`);
});