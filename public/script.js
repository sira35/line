// 获取初始商品信息
fetch('/api/product')
  .then(response => response.json())
  .then(data => {
    document.getElementById('price').textContent = data.price.toFixed(2);
    document.getElementById('stock').textContent = data.stock;
  });

// 购买逻辑
function purchase() {
  const key = document.getElementById('key').value;
  const userId = 'user_' + Math.random().toString(36).substr(2, 9); // 简单用户标识

  fetch('/api/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, userId })
  })
    .then(response => response.json())
    .then(data => {
      document.getElementById('message').textContent = data.message;
      if (data.stock !== undefined) {
        document.getElementById('stock').textContent = data.stock;
      }
    })
    .catch(error => {
      document.getElementById('message').textContent = '购买失败，请重试';
    });
}