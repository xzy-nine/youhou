// 微博增强脚本主入口文件
import { widescreenStore, saveWidescreenConfig } from './utils/storage';
import { applyWidescreenStyles } from './modules/widescreen';
import { setupThemeSystem } from './modules/theme';
import { setupCommentSystem } from './modules/comments';
import { createControlPanel, registerMenus } from './modules/ui';
import { simpleNotify } from './utils/notification';

// 主初始化函数
function initialize() {
  // 设置主题系统（优先初始化主题）
  setupThemeSystem();
  
  // 添加评论悬浮窗样式和功能
  setupCommentSystem();
  
  // 应用宽屏功能
  applyWidescreenStyles();
  
  // 创建控制面板
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createControlPanel);
  } else {
    // 延迟创建控制面板，确保主题系统初始化完成
    setTimeout(createControlPanel, 300);
  }
  
  // 启动成功日志
  console.log('%c[微博增强] 功能已激活', 'color: #28a745; font-weight: bold;');
    // 页面加载完成后显示通知
  window.addEventListener('load', () => {
    if (widescreenStore.notify_enabled) {
      simpleNotify('微博增强功能已激活');
    }
  });
}

// 注册菜单命令并初始化
(function() {
  
  // 初始化
  initialize();
  
  // 注册菜单命令
  registerMenus();
})();
