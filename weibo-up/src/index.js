// 微博增强脚本主入口文件
import { widescreenStore, saveWidescreenConfig } from './utils/storage';
import { applyWidescreenStyles } from './modules/widescreen';
import { setupThemeSystem } from './modules/theme';
import { setupCommentSystem } from './modules/comments';
import { createControlPanel, registerMenus } from './modules/ui';

// 主初始化函数
function initialize() {
  // 添加评论悬浮窗样式和功能
  setupCommentSystem();
  
  // 应用宽屏功能
  applyWidescreenStyles();
  
  // 设置主题系统
  setupThemeSystem();
  
  // 创建控制面板
  if (document.body) {
    createControlPanel();
  } else {
    document.addEventListener('DOMContentLoaded', createControlPanel);
  }
  
  // 启动成功日志
  console.log('%c[微博增强] 功能已激活', 'color: #28a745; font-weight: bold;');
  if (widescreenStore.notify_enabled) {
    window.simpleNotify('微博增强功能已激活');
  }
}

// 注册菜单命令并初始化
(function() {
  // 暴露全局通知函数
  window.simpleNotify = function(message) {
    if (!widescreenStore.notify_enabled) return;
    
    console.log(`%c[微博增强] ${message}`, 'color: #1890ff; font-weight: bold;');
    
    // 创建简单的页面内通知
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1890ff;
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // 自动消失
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 2000);
  };
  
  // 初始化
  initialize();
  
  // 注册菜单命令
  registerMenus();
})();
