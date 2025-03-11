document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const buyButton = document.getElementById('buyButton');
    const keyModal = document.getElementById('keyModal');
    const successModal = document.getElementById('successModal');
    const closeBtn = document.querySelector('.close-btn');
    const verifyButton = document.getElementById('verifyButton');
    const successCloseButton = document.getElementById('successCloseButton');
    const keyInput = document.getElementById('keyInput');
    const keyError = document.getElementById('keyError');
    const stockCount = document.getElementById('stockCount');
    const purchaseNotification = document.getElementById('purchaseNotification');

    // 存储已使用的密钥
    const usedKeys = new Set();

    // 显示密钥验证弹窗
    buyButton.addEventListener('click', () => {
        keyModal.style.display = 'flex';
        keyInput.value = '';
        keyError.style.display = 'none';
    });

    // 关闭密钥验证弹窗
    closeBtn.addEventListener('click', () => {
        keyModal.style.display = 'none';
    });

    // 生成随机QQ邮箱
    function generateRandomQQEmail() {
        // 生成9到11位的随机数
        const length = Math.floor(Math.random() * 3) + 9; // 9, 10, 或 11
        let number = '';
        for (let i = 0; i < length; i++) {
            number += Math.floor(Math.random() * 10);
        }
        return `${number}@qq.com`;
    }

    // 显示购买提示
    function showPurchaseNotification() {
        const customerEmail = generateRandomQQEmail();
        purchaseNotification.textContent = `${customerEmail}客户购买了该商品`;
        purchaseNotification.style.display = 'block';
        
        // 5秒后隐藏提示
        setTimeout(() => {
            purchaseNotification.style.display = 'none';
        }, 5000);
    }

    // 验证密钥
    verifyButton.addEventListener('click', () => {
        const key = parseInt(keyInput.value);
        
        // 验证密钥是否为数字
        if (isNaN(key)) {
            showError('请输入有效的密钥！');
            return;
        }

        // 验证密钥是否在1-100之间
        if (key < 1 || key > 100) {
            showError('密钥无效！');
            return;
        }

        // 验证密钥是否已被使用
        if (usedKeys.has(key)) {
            showError('该密钥已被使用！');
            return;
        }

        // 验证库存是否充足
        const currentStock = parseInt(stockCount.textContent);
        if (currentStock <= 0) {
            showError('商品已售罄！');
            return;
        }

        // 购买成功处理
        usedKeys.add(key);
        stockCount.textContent = currentStock - 1;
        keyModal.style.display = 'none';
        successModal.style.display = 'flex';
        showPurchaseNotification();
    });

    // 关闭成功弹窗
    successCloseButton.addEventListener('click', () => {
        successModal.style.display = 'none';
    });

    // 显示错误信息
    function showError(message) {
        keyError.textContent = message;
        keyError.style.display = 'block';
    }

    // 点击弹窗外部关闭弹窗
    window.addEventListener('click', (event) => {
        if (event.target === keyModal) {
            keyModal.style.display = 'none';
        }
        if (event.target === successModal) {
            successModal.style.display = 'none';
        }
    });
}); 