const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const router = express.Router();

const JWT_SECRET = 'your-secret-key'; // 在生产环境中应该使用环境变量

// 中间件：验证JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证token' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '无效的token' });
    }
    req.user = user;
    next();
  });
};

// 管理员登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // 在实际应用中，应该从数据库验证用户名和密码
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: '用户名或密码错误' });
  }
});

// 更新商品信息（需要验证）
router.post('/update', authenticateToken, (req, res) => {
  const { secretKey, stock, price } = req.body;
  
  try {
    const data = JSON.parse(fs.readFileSync('data.json'));
    
    if (secretKey) data.secretKey = secretKey;
    if (stock !== undefined) data.stock = parseInt(stock);
    if (price !== undefined) data.price = parseFloat(price);
    
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    
    res.json({ 
      success: true, 
      message: '更新成功',
      stock: data.stock,
      price: data.price
    });
  } catch (error) {
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

// 获取当前设置（需要验证）
router.get('/settings', authenticateToken, (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync('data.json'));
    res.json({
      stock: data.stock,
      price: data.price,
      secretKey: data.secretKey
    });
  } catch (error) {
    res.status(500).json({ message: '获取设置失败', error: error.message });
  }
});

module.exports = router; 