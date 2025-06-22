// 微博增强Chrome扩展内容脚本
// 注意：所有依赖已在manifest.json中按顺序加载，无需导入

// 主初始化函数
async function initialize() {
  try {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    // 首先初始化存储
    await initStorage();

    // 设置主题系统（优先初始化主题）
    setupThemeSystem();
      
    // 优先应用背景（如果启用）
    // 这确保页面一开始就有背景，避免白屏
    if (typeof applyBackground === 'function') {
      applyBackground();
      console.log('[微博增强] 背景功能初始化完成');
    }
    
    // 添加评论悬浮窗样式和功能
    if (typeof setupCommentSystem === 'function') {
      setupCommentSystem();
    }
    
    // 应用宽屏功能
    if (typeof applyWidescreenStyles === 'function') {
      applyWidescreenStyles();
    }
    
    // 创建控制面板
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          if (typeof createControlPanel === 'function') {
            createControlPanel();
          }
        }, 300);
      });
    } else {
      // 延迟创建控制面板，确保主题系统初始化完成
      setTimeout(() => {
        if (typeof createControlPanel === 'function') {
          createControlPanel();
        }      }, 500);
    }
    
    // 在页面加载完成后再次应用背景，确保在所有DOM元素加载后背景依然存在
    window.addEventListener('load', () => {
      // 重新应用背景
      setTimeout(() => {
        if (typeof applyBackground === 'function') {
          applyBackground();
        }
      }, 1000);
      
      // 显示通知
      if (widescreenStore.notify_enabled) {
        simpleNotify('微博增强功能已激活');
      }
    });
    
    // 启动成功日志
    console.log('%c[微博增强] 功能已激活', 'color: #28a745; font-weight: bold;');
      
    // 将重新应用背景函数暴露到全局，方便用户手动调用
    if (typeof applyBackground === 'function') {
      window.weiboApplyBackground = applyBackground;
      console.log('%c[微博增强] 如果背景出现问题，请在控制台执行: weiboApplyBackground()', 'color: #17a2b8; font-style: italic;');
    }
    
  } catch (error) {
    console.error('[微博增强] 初始化失败:', error);
    simpleNotify('微博增强功能初始化失败，请刷新页面重试');
  }
}

// 注册菜单命令
function registerMenus() {
  // Chrome扩展不需要菜单注册，使用popup面板
  console.log('[微博增强] Chrome扩展环境，跳过菜单注册');
}

// 执行初始化
initialize().catch(err => {
  console.error('[微博增强] 初始化失败:', err);
});

// 注册菜单命令（Chrome扩展中为空实现）
registerMenus();

// 处理来自弹出窗口的设置更新消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch(message.action) {
    case 'updateTheme':
      userOverride = message.userOverride;
      if (message.userThemeMode !== undefined) {
        userThemeMode = message.userThemeMode;
      }
      setupThemeSystem();
      break;
      
    case 'updateWidescreen':
      // 重新从存储获取设置并应用
      initStorage().then(() => {
        applyWidescreenStyles();
      });
      break;
      
    case 'updateBackground':
      // 重新从存储获取设置并应用
      initStorage().then(() => {
        if (backgroundStore.enabled) {
          applyBackground();
        } else {
          // 移除背景
          const bg = document.querySelector('.weibo-up-background');
          if (bg) bg.parentNode.removeChild(bg);
        }
      });
      break;
  }
  
  sendResponse({success: true});
});
