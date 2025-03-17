const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// 中间件，解析 JSON 请求体
app.use(express.json());
// 托管前端静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 读取和写入 data.json 的函数
const readData = () => {
  const data = fs.readFileSync('data.json');
  return JSON.parse(data);
};
const writeData = (data) => {
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
};

// 初始化数据文件（如果不存在）
if (!fs.existsSync('data.json')) {
  const initialData = {
    price: 35.00,
    stock: 100,
    secretKey: 'mysecret123', // 自定义密钥
    purchases: {} // 记录用户购买情况（基于 IP 或其他标识）
  };
  writeData(initialData);
}

// 获取商品信息
app.get('/api/product', (req, res) => {
  const data = readData();
  res.json({ price: data.price, stock: data.stock });
});

// 购买商品
app.post('/api/purchase', (req, res) => {
  const { key, userId } = req.body; // userId 可以是 IP 或其他唯一标识
  const data = readData();

  // 验证密钥
  if (key !== data.secretKey) {
    return res.status(400).json({ message: '密钥错误' });
  }

  // 检查是否已购买（限购 1 个）
  if (data.purchases[userId]) {
    return res.status(400).json({ message: '您已购买过此商品，限购 1 个' });
  }

  // 检查库存
  if (data.stock <= 0) {
    return res.status(400).json({ message: '库存不足' });
  }

  // 减少库存
  data.stock -= 1;
  data.purchases[userId] = true; // 记录购买
  writeData(data);

  res.json({ message: '购买成功', stock: data.stock });
});

// 管理员接口：更新价格和库存
app.post('/api/admin/update', (req, res) => {
  const { price, stock, adminPassword } = req.body;
  if (adminPassword !== 'admin123') { // 管理员密码
    return res.status(403).json({ message: '管理员密码错误' });
  }

  const data = readData();
  if (price !== undefined) data.price = parseFloat(price);
  if (stock !== undefined) data.stock = parseInt(stock);
  writeData(data);

  res.json({ message: '更新成功', price: data.price, stock: data.stock });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});