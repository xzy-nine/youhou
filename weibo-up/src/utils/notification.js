// 通知功能
import { widescreenStore } from './storage';

// 简单通知函数（全局可访问）
export function simpleNotify(message) {
  if (!widescreenStore.notify_enabled) return;
  
  console.log(`%c[微博增强] ${message}`, 'color: #1890ff; font-weight: bold;');
  
  // 创建简单的页面内通知
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: rgba(255, 255, 255, 0.95);
    color: #333;
    padding: 10px 15px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    font-size: 14px;
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(-20px);
  `;
  
  // 如果是深色模式，反转颜色
  const isDarkMode = document.documentElement.classList.contains('woo-theme-dark') || 
                     document.body.classList.contains('woo-theme-dark');
  if (isDarkMode) {
    notification.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
    notification.style.color = '#ddd';
  }
  
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
