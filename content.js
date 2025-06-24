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
    }    // 首先初始化存储
    const storageInitialized = await initStorage();
    console.log('[微博增强] 存储初始化结果:', storageInitialized);    // 设置主题系统（优先初始化主题）
    setupThemeSystem();
    
    // 设置主题联动系统
    setupThemeSync();
        // 优先应用背景（如果启用）
    // 这确保页面一开始就有背景，避免白屏
    if (typeof applyBackground === 'function') {
      // 确保存储初始化成功后再应用背景
      if (storageInitialized && backgroundStore) {
        console.log('[微博增强] 开始应用背景，当前配置:', {
          enabled: backgroundStore.enabled,
          type: backgroundStore.type
        });
        
        // 确保DOM准备就绪后应用背景
        const applyBackgroundWhenReady = async () => {
          try {
            await applyBackground();
            console.log('[微博增强] 背景功能初始化完成');
            
            // 如果启用了通知，显示成功消息
            if (backgroundStore.enabled && backgroundStore.notify_enabled) {
              setTimeout(() => {
                simpleNotify('背景功能已激活');
              }, 1000);
            }
          } catch (error) {
            console.error('[微博增强] 背景应用失败:', error);
            // 重试一次
            setTimeout(() => {
              if (typeof applyBackground === 'function') {
                applyBackground().catch(e => console.error('[微博增强] 背景重试失败:', e));
              }
            }, 2000);
          }
        };
        
        // 如果DOM已准备就绪，立即应用；否则等待
        if (document.readyState === 'loading') {
          setTimeout(applyBackgroundWhenReady, 100);
        } else {
          applyBackgroundWhenReady();
        }
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
    
    // 注意：页面控制面板已移除，现在主要通过popup页面进行控制
    console.log('[微博增强] 主要控制面板已集成到扩展popup页面，点击扩展图标进行控制');
    
    // 在页面加载完成后再次应用背景，确保在所有DOM元素加载后背景依然存在
    window.addEventListener('load', () => {
      // 重新应用背景
      setTimeout(() => {
        if (typeof applyBackground === 'function' && backgroundStore && backgroundStore.enabled) {          // 检查背景元素是否还存在
          const existingBg = document.querySelector('#weibo-blur-background');
          if (!existingBg) {
            console.log('[微博增强] 页面加载完成后检测到背景丢失，重新应用');
            applyBackground().catch(e => console.error('[微博增强] 页面加载后背景重新应用失败:', e));
          } else {
            console.log('[微博增强] 页面加载完成，背景元素正常存在');
          }
        }
      }, 1000);
      
      // 显示通知
      if (widescreenStore.notify_enabled) {
        simpleNotify('微博增强功能已激活');
      }    });
      // 启动成功日志
    console.log('%c[微博增强] 功能已激活', 'color: #28a745; font-weight: bold;');
    
  } catch (error) {
    console.error('[微博增强] 初始化失败:', error);
    simpleNotify('微博增强功能初始化失败，请刷新页面重试');
  }
}

// 设置主题联动系统
function setupThemeSync() {
  // 监听全局主题变化事件
  window.addEventListener('weiboThemeChanged', (event) => {
    const isDark = event.detail.isDark;
    console.log(`[微博增强] 收到全局主题变化事件: ${isDark ? '深色' : '浅色'}`);
    
    // 通知popup界面主题变化，包含完整的状态信息
    try {
      chrome.runtime.sendMessage({
        action: 'themeChanged',
        isDark: isDark,
        userOverride: userOverride || false,
        userThemeMode: userThemeMode
      }, (response) => {
        if (chrome.runtime.lastError) {
          // popup可能未打开，这是正常的
          console.log('[微博增强] popup未打开，无法发送主题变化消息');
        } else {
          console.log('[微博增强] 主题变化消息已发送到popup');
        }
      });
    } catch (e) {
      // 消息发送失败是正常的，popup可能未打开
      console.log('[微博增强] 发送主题变化消息失败:', e);
    }
  });
  
  // 监听微博原生的主题变化事件
  window.addEventListener('themechange', (event) => {
    const isDark = event.detail.theme === 'dark';
    console.log(`[微博增强] 收到微博原生主题变化事件: ${isDark ? '深色' : '浅色'}`);
    
    // 确保所有模块都能响应
    window.dispatchEvent(new CustomEvent('weiboThemeChanged', {
      detail: { isDark: isDark }
    }));
  });
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
    case 'requestThemeSync':
      // 弹出页请求主题状态同步
      console.log('[微博增强] 收到主题同步请求');
      try {
        const currentTheme = getCurrentWebsiteMode();
        sendResponse({
          success: true,
          userOverride: userOverride || false,
          userThemeMode: userThemeMode,
          currentTheme: currentTheme
        });
        console.log('[微博增强] 主题同步响应已发送:', {
          userOverride: userOverride || false,
          userThemeMode: userThemeMode,
          currentTheme: currentTheme
        });
      } catch (error) {
        console.error('[微博增强] 主题同步失败:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      }
      return true;
      
    case 'updateTheme':
      console.log('[微博增强] 收到主题更新消息:', message);
      
      // 处理主题重置
      if (message.forceReset) {
        console.log('[微博增强] 执行主题重置');
        userOverride = false;
        userThemeMode = null;
        
        // 异步保存重置状态
        Promise.all([
          chromeStorage.setValue('userOverride', false),
          chromeStorage.setValue('userThemeMode', null)
        ]).then(() => {
          console.log('[微博增强] 主题重置状态已保存');
          
          // 应用系统主题
          if (message.systemTheme !== undefined) {
            const success = setWebsiteMode(message.systemTheme, false);
            if (success) {
              console.log('[微博增强] 系统主题应用成功');
            } else {
              console.error('[微博增强] 系统主题应用失败');
            }
          }
        }).catch(error => {
          console.error('[微博增强] 保存主题重置状态失败:', error);
        });
        
        sendResponse({ success: true });
        return true;
      }
      
      // 处理普通主题更新
      userOverride = message.userOverride;
      if (message.userThemeMode !== undefined) {
        userThemeMode = message.userThemeMode;
      }
      
      // 异步保存配置到存储，确保同步
      Promise.all([
        chromeStorage.setValue('userOverride', userOverride),
        chromeStorage.setValue('userThemeMode', userThemeMode)
      ]).then(() => {
        console.log('[微博增强] 主题配置已保存到存储');
        
        // 如果是用户手动设置，立即应用主题
        if (userOverride && message.userThemeMode !== undefined) {
          const success = setWebsiteMode(message.userThemeMode, true);
          if (!success) {
            console.error('[微博增强] 应用主题失败');
          }
        }
        
        // 如果有强制同步标志，确保原生主题按钮状态也更新
        if (message.forceSync) {
          setTimeout(() => {
            const currentMode = getCurrentWebsiteMode();            if (currentMode !== message.userThemeMode && message.userThemeMode !== undefined) {
              console.log('[微博增强] 强制同步原生主题按钮状态');
              setWebsiteMode(message.userThemeMode, false);
            }
          }, 100);
        }
        
        sendResponse({ success: true });
      }).catch(error => {
        console.error('[微博增强] 主题配置保存失败:', error);
        sendResponse({ success: false, error: error.message });
      });
      
      return true; // 表示异步响应
      
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
          // 使用更新函数而不是重新创建，避免闪烁
          if (typeof updateBackgroundStyles === 'function') {
            updateBackgroundStyles();
          } else {
            // 如果更新函数不存在，则温和地应用背景
            const existingBg = document.querySelector('#weibo-blur-background');
            if (!existingBg) {
              // 只有在背景不存在时才创建新的
              applyBackground().catch(error => {
                console.error('[微博增强] 背景应用失败:', error);
              });
            } else {
              // 背景存在时，只更新样式参数
              if (typeof updateBackgroundOpacity === 'function') {
                updateBackgroundOpacity();
              }
              if (typeof addContentTransparencyStyles === 'function') {
                addContentTransparencyStyles();
              }
            }
          }
        } else {          // 移除背景
          const bg = document.querySelector('#weibo-blur-background');
          if (bg) {
            bg.remove();
          }
          
          // 移除内容半透明样式
          const transparencyStyle = document.getElementById('weibo-background-transparency-style');
          if (transparencyStyle) {
            transparencyStyle.remove();
          }
          
          console.log('[微博增强] 背景功能已禁用，相关样式已清理');
        }
      });
      break;
  }
  
  sendResponse({success: true});
});

// 如果 background-image.js 中的函数没有正确暴露，提供备选的诊断函数
if (!window.diagnoseBackgroundStatus) {
  window.diagnoseBackgroundStatus = function() {
    console.log('[微博增强] 临时诊断函数启动');
    console.log('1. backgroundStore状态:', typeof backgroundStore !== 'undefined' ? backgroundStore : '未定义');    console.log('2. DOM状态:', {
      readyState: document.readyState,
      backgroundElement: !!document.querySelector('#weibo-blur-background'),
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
      await applyBackground();      console.log('[微博增强] 背景重新应用完成');
    } else {
      console.error('[微博增强] applyBackground函数不可用，请刷新页面');
    }
  };
}
