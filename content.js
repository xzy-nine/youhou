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
    const storageInitialized = await initStorage();
    console.log('[微博增强] 存储初始化结果:', storageInitialized);

    // 设置主题系统（优先初始化主题）
    setupThemeSystem();
      
    // 优先应用背景（如果启用）
    // 这确保页面一开始就有背景，避免白屏
    if (typeof applyBackground === 'function') {
      // 确保存储初始化成功后再应用背景
      if (storageInitialized && backgroundStore) {
        console.log('[微博增强] 开始应用背景，当前配置:', {
          enabled: backgroundStore.enabled,
          type: backgroundStore.type
        });
        await applyBackground();
        console.log('[微博增强] 背景功能初始化完成');
      } else {
        console.warn('[微博增强] 存储未正确初始化，跳过背景应用');
      }
    } else {
      console.warn('[微博增强] applyBackground函数不存在');
    }
    
    // 添加评论悬浮窗样式和功能
    if (typeof setupCommentSystem === 'function') {
      setupCommentSystem();
    }
    
    // 应用宽屏功能
    if (typeof applyWidescreenStyles === 'function') {
      applyWidescreenStyles();
    }
      // 注意：悬浮控制面板已移除，现在只使用弹出页面的控制面板
    console.log('[微博增强] 悬浮控制面板已禁用，请使用扩展图标的弹出页面进行控制');
    
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
      
      // 延迟一点时间后验证所有函数是否正确暴露
      setTimeout(() => {
        const availableFunctions = [];
        if (typeof window.weiboApplyBackground === 'function') availableFunctions.push('weiboApplyBackground()');
        if (typeof window.diagnoseBackgroundStatus === 'function') availableFunctions.push('diagnoseBackgroundStatus()');
        if (typeof window.reapplyBackground === 'function') availableFunctions.push('reapplyBackground()');
        if (typeof window.weiboRefreshBingBackground === 'function') availableFunctions.push('weiboRefreshBingBackground()');
        if (typeof window.weiboSetBackgroundType === 'function') availableFunctions.push('weiboSetBackgroundType("gradient")');
        
        console.log('%c[微博增强] 可用的调试命令:', 'color: #17a2b8; font-weight: bold;');
        availableFunctions.forEach(func => {
          console.log(`%c  - ${func}`, 'color: #17a2b8;');
        });
        
        if (availableFunctions.length === 0) {
          console.warn('%c[微博增强] 警告：调试函数未正确暴露，请刷新页面重试', 'color: #ffc107;');
        } else {
          console.log('%c[微博增强] 更多设置请使用扩展图标的弹出页面', 'color: #6c757d; font-style: italic;');
        }
      }, 500);
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

// 如果 background.js 中的函数没有正确暴露，提供备选的诊断函数
if (!window.diagnoseBackgroundStatus) {
  window.diagnoseBackgroundStatus = function() {
    console.log('[微博增强] 临时诊断函数启动');
    console.log('1. backgroundStore状态:', typeof backgroundStore !== 'undefined' ? backgroundStore : '未定义');
    console.log('2. DOM状态:', {
      readyState: document.readyState,
      backgroundElement: !!document.querySelector('.weibo-up-background'),
      transparencyStyle: !!document.getElementById('weibo-background-transparency-style')
    });
    console.log('3. 扩展脚本加载状态:', {
      applyBackground: typeof applyBackground,
      chromeStorage: typeof chromeStorage,
      simpleNotify: typeof simpleNotify
    });
    console.log('[微博增强] 如果问题持续，请尝试刷新页面');
  };
}

if (!window.reapplyBackground) {
  window.reapplyBackground = async function() {
    console.log('[微博增强] 临时重新应用背景函数...');
    if (typeof applyBackground === 'function') {
      await applyBackground();
      console.log('[微博增强] 背景重新应用完成');
    } else {
      console.error('[微博增强] applyBackground函数不可用，请刷新页面');
    }
  };
}
