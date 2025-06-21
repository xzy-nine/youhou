// 微博增强脚本主入口文件
import { widescreenStore, saveWidescreenConfig } from './utils/storage';
import { applyWidescreenStyles } from './modules/widescreen';
import { setupThemeSystem } from './modules/theme';
import { setupCommentSystem } from './modules/comments';
import { createControlPanel, registerMenus } from './modules/ui';
import { simpleNotify } from './utils/notification';
import { applyGaussianBlurStyles } from './modules/gaussianBlur';

// 主初始化函数
function initialize() {
  // 设置主题系统（优先初始化主题）
  setupThemeSystem();
  
  // 优先应用高斯模糊效果和背景（如果启用）
  // 这确保页面一开始就有背景，避免白屏
  applyGaussianBlurStyles();
  console.log('[微博增强] 高斯模糊功能初始化完成');
  
  // 添加评论悬浮窗样式和功能
  setupCommentSystem();
  
  // 应用宽屏功能
  applyWidescreenStyles();
  
  // 创建控制面板
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(createControlPanel, 300);
    });
  } else {
    // 延迟创建控制面板，确保主题系统初始化完成
    setTimeout(createControlPanel, 500);
  }
  
  // 在页面加载完成后再次应用背景，确保在所有DOM元素加载后背景依然存在
  window.addEventListener('load', () => {
    // 重新应用高斯模糊和背景
    setTimeout(() => {
      applyGaussianBlurStyles();
    }, 1000);
    
    // 显示通知
    if (widescreenStore.notify_enabled) {
      simpleNotify('微博增强功能已激活');
    }
  });
  
  // 启动成功日志
  console.log('%c[微博增强] 功能已激活', 'color: #28a745; font-weight: bold;');
}

// 注册菜单命令并初始化
(function() {
  
  // 初始化
  initialize();
  
  // 注册菜单命令
  registerMenus();
})();
