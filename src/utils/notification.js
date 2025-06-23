// 通知功能
// widescreenStore 从chrome-storage.js全局获取

// 简单通知函数（全局可访问）
function simpleNotify(message) {
  if (!widescreenStore.notify_enabled) return;
  
  console.log(`%c[微博增强] ${message}`, 'color: #1890ff; font-weight: bold;');
    // 创建主题化的通知
  const notification = createThemedNotification(message);
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // 动画显示
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);
  
  // 3秒后淡出
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    
    // 等动画结束后移除DOM元素
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);  }, 3000);
}

// 响应主题变化的函数
function updateNotificationTheme(isDark) {
  // 更新现有通知的主题
  const notifications = document.querySelectorAll('.weibo-enhancement-notification');
  notifications.forEach(notification => {
    if (isDark) {
      notification.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
      notification.style.color = '#ddd';
    } else {
      notification.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      notification.style.color = '#333';
    }
  });
}

// 改进的通知函数，支持主题自动更新
function createThemedNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'weibo-enhancement-notification';
  
  const isDarkMode = (document.documentElement && document.documentElement.classList.contains('woo-theme-dark')) || 
                     (document.body && document.body.classList.contains('woo-theme-dark'));
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 15px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    font-size: 14px;
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(-20px);
  `;
  
  // 应用主题样式
  if (isDarkMode) {
    notification.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
    notification.style.color = '#ddd';
  } else {
    notification.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    notification.style.color = '#333';
  }
  
  return notification;
}

// 监听全局主题变化事件
window.addEventListener('weiboThemeChanged', (event) => {
  updateNotificationTheme(event.detail.isDark);
});
