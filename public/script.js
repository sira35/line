// 页面加载时获取商品信息
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 添加随机参数避免缓存问题
    const timestamp = new Date().getTime();
    const response = await fetch(`/api/product-info?v=${timestamp}`);
    
    if (!response.ok) {
      throw new Error(`API 返回错误: ${response.status}`);
    }
    
    const data = await response.json();
    document.getElementById('price').textContent = data.price.toFixed(2);
    document.getElementById('stock').textContent = data.stock;
    
    // 加载商品列表
    loadItems();
    
    // 初始化生成密钥按钮
    initGenerateKeyButton();
  } catch (error) {
    console.error('获取商品信息失败:', error);
    document.getElementById('message').textContent = '获取商品信息失败，请刷新页面';
    document.getElementById('message').style.color = 'red';
  }
});

// 加载商品列表
async function loadItems() {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`/api/items?v=${timestamp}`);
    
    if (!response.ok) {
      throw new Error(`API 返回错误: ${response.status}`);
    }
    
    const items = await response.json();
    console.log('加载的商品列表:', items);
    
    // 如果页面上有商品列表容器，则渲染商品
    const itemsContainer = document.getElementById('itemsList');
    if (itemsContainer) {
      itemsContainer.innerHTML = items.map(item => `
        <div class="item-card">
          <h3>${item.name}</h3>
          <p>价格: ¥${item.price.toFixed(2)}</p>
          <p>库存: ${item.stock}</p>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('加载商品列表失败:', error);
  }
}

// 初始化生成密钥按钮
function initGenerateKeyButton() {
  const generateKeyButton = document.getElementById('generateKeyButton');
  
  if (generateKeyButton) {
    generateKeyButton.addEventListener('click', async () => {
      try {
        // 弹出输入框要求输入验证码
        const adminCode = prompt('请输入管理员验证码:');
        if (!adminCode) return;

        // 验证管理员验证码
        if (adminCode !== '2825380abc') {
          throw new Error('验证码错误，无权生成密钥');
        }

        const timestamp = new Date().getTime();
        const response = await fetch(`/api/generate-key?v=${timestamp}`);
        
        if (!response.ok) {
          throw new Error(`API 返回错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('生成密钥响应:', data);
        
        if (data.success) {
          // 显示生成的密钥
          const keyDisplay = document.getElementById('keyDisplay');
          if (keyDisplay) {
            keyDisplay.textContent = data.key;
            keyDisplay.style.display = 'block';
          }
          
          // 显示成功消息
          const messageElement = document.getElementById('message');
          messageElement.textContent = data.message;
          messageElement.style.color = 'green';
        }
      } catch (error) {
        console.error('生成密钥失败:', error);
        const messageElement = document.getElementById('message');
        messageElement.textContent = '生成密钥失败，请稍后重试';
        messageElement.style.color = 'red';
      }
    });
  }
}

// 购买按钮点击事件
document.getElementById('buyButton').addEventListener('click', async () => {
  const key = prompt('请输入购买密钥:');
  if (!key) return;

  try {
    const endpoint = '/api/purchase';
    console.log(`正在发送购买请求到 ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key })
    });

    if (!response.ok) {
      throw new Error(`API 返回错误: ${response.status}`);
    }

    const data = await response.json();
    console.log('购买响应:', data);
    
    const messageElement = document.getElementById('message');
    messageElement.textContent = data.message;
    messageElement.style.color = data.success ? 'green' : 'red';

    if (data.success) {
      document.getElementById('stock').textContent = data.stock;
      
      // 如果密钥使用成功，清除显示的密钥
      const keyDisplay = document.getElementById('keyDisplay');
      if (keyDisplay) {
        keyDisplay.textContent = '';
        keyDisplay.style.display = 'none';
      }
      
      // 重新加载商品列表
      loadItems();
    }
  } catch (error) {
    console.error('购买请求失败:', error);
    document.getElementById('message').textContent = '购买请求失败，请稍后重试';
    document.getElementById('message').style.color = 'red';
  }
});