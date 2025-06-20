// 主题系统模块
import { userOverride, saveThemeConfig } from '../utils/storage';

// 状态跟踪变量
let lastNotifiedMode = null;
let lastNotifiedOverrideState = null;
let hasShownInitialNotification = false;
let isScriptOperation = false;
let observer = null;

// 导出一个简单通知函数，以便其他模块使用
export let simpleNotify;

// 设置简单通知函数
export function 
setSimpleNotify(notifyFunction) {
  simpleNotify = notifyFunction;
}

// 设置主题系统
export function setupThemeSystem() {
  // 检查系统颜色模式
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // 保存最后一次系统模式
  GM_setValue('lastSystemMode', prefersDarkMode);
  
  // 延迟主题初始化，确保页面完全加载
  setTimeout(() => {
    // 如果用户没有手动覆盖，则跟随系统
    if (!userOverride) {
      const currentWebsiteMode = getCurrentWebsiteMode();
      if (currentWebsiteMode !== prefersDarkMode) {
        // 传递false表示这不是用户操作
        setWebsiteMode(prefersDarkMode, false);
      }
      lastNotifiedMode = prefersDarkMode;
    } else {
      // 如果用户手动设置了主题，尊重用户设置
      const currentWebsiteMode = getCurrentWebsiteMode();
      console.log(`用户手动设置为${currentWebsiteMode ? '深色' : '浅色'}模式，保持不变`);
      
      // 确保当前主题与用户设置一致
      setWebsiteMode(currentWebsiteMode, false);
      lastNotifiedMode = currentWebsiteMode;
    }
    
    lastNotifiedOverrideState = userOverride;
  }, 500); // 延迟500毫秒执行，确保页面已加载
  
  // 监听系统模式变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const newDarkMode = e.matches;
    const oldSystemMode = GM_getValue('lastSystemMode', prefersDarkMode);
    GM_setValue('lastSystemMode', newDarkMode);
      // 只有当系统模式真的发生变化且没有用户手动覆盖时才处理
    if (oldSystemMode !== newDarkMode && !userOverride) {
      // 传递false表示这不是用户操作
      setWebsiteMode(newDarkMode, false);
      
      // 只有当模式真的改变时才通知
      if (lastNotifiedMode !== newDarkMode && simpleNotify) {
        simpleNotify(`已切换到${newDarkMode ? '深色' : '浅色'}模式`);
        lastNotifiedMode = newDarkMode;
      }
    }
  });
  
  // 监听localStorage变化以检测用户手动切换模式
  monitorLocalStorage();
  
  // 添加键盘快捷键
  setupKeyboardShortcuts();
}

// 获取当前网站的模式
export function getCurrentWebsiteMode() {
  try {
    const darkModeHistory = localStorage.getItem('darkModeHistory');
    if (darkModeHistory) {
      const parsed = JSON.parse(darkModeHistory);
      if (parsed && parsed.length > 0 && parsed[0].length > 1) {
        return parsed[0][1] === 1;
      }
    }
  } catch (e) {
    // 静默处理错误
  }

  if (document.body) {
    return document.body.classList.contains("woo-theme-dark");
  }

  return false;
}

// 设置网站模式
export function setWebsiteMode(isDark, fromUserAction = false) {
  try {
    // 只有当不是用户操作时才设置isScriptOperation
    if (!fromUserAction) {
      isScriptOperation = true; // 标记为脚本操作
    }
    
    const userId = getUserId();
    const modeValue = isDark ? 1 : 0;
    
    // 直接设置微博暗色模式的LocalStorage
    try {
      localStorage.setItem('darkModeHistory', `[[${userId},${modeValue}]]`);
      console.log(`[微博主题] 设置localStorage: darkModeHistory=${isDark ? '深色' : '浅色'}`);
    } catch(e) {
      console.error('[微博主题] 设置localStorage失败:', e);
    }
    
    // 等待DOM加载完成后再设置class
    const applyTheme = () => {
      if (document.body) {
        // 先移除可能存在的主题类
        document.body.classList.remove("woo-theme-dark", "woo-theme-light");
        
        // 给body应用主题类
        if (isDark) {
          document.body.classList.add("woo-theme-dark");
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.body.classList.add("woo-theme-light");
          document.documentElement.setAttribute('data-theme', 'light');
        }
        
        console.log(`[微博主题] 已设置为${isDark ? '深色' : '浅色'}模式`);
        
        // 更新评论悬浮窗的主题
        updateCommentModalsTheme(isDark);
        
        // 启动DOM观察器，确保主题在页面变化时保持
        startThemeObserver(isDark);
        
        // 触发主题变更事件
        try {
          // 使用较普遍的事件名
          ['themeChange', 'theme-change', 'darkModeChange'].forEach(eventName => {
            const event = new CustomEvent(eventName, { 
              bubbles: true, 
              detail: { 
                isDark, 
                theme: isDark ? 'dark' : 'light' 
              } 
            });
            document.dispatchEvent(event);
            window.dispatchEvent(event);
          });
        } catch (e) {
          console.error('[微博主题] 无法触发主题变更事件:', e);
        }
        
        // 尝试调用微博自身的主题切换函数
        triggerWeiboThemeChange(isDark);
        
        // 确保触发localstorage事件
        try {
          const storageEvent = new StorageEvent('storage', {
            key: 'darkModeHistory',
            newValue: `[[${userId},${modeValue}]]`,
            url: window.location.href,
            storageArea: localStorage
          });
          window.dispatchEvent(storageEvent);
        } catch (e) {
          // 兼容旧版本浏览器
          const storageEvent = new Event('storage');
          storageEvent.key = 'darkModeHistory';
          storageEvent.newValue = `[[${userId},${modeValue}]]`;
          window.dispatchEvent(storageEvent);
        }
      } else {
        document.addEventListener('DOMContentLoaded', applyTheme);
      }
    };

    // 检查文档准备状态
    if (document.readyState === 'loading') {
      // 如果文档还在加载，等待DOM内容加载完成
      document.addEventListener('DOMContentLoaded', applyTheme);
    } else {
      // 文档已加载完成，直接应用主题
      applyTheme();
    }

    // 只有当不是用户操作时才重置isScriptOperation
    if (!fromUserAction) {
      isScriptOperation = false; // 重置标记
    }
    
    // 返回设置的模式，便于其他函数使用
    return isDark;
  } catch (error) {
    // 只有当不是用户操作时才重置isScriptOperation
    if (!fromUserAction) {
      isScriptOperation = false; // 确保在错误情况下也重置标记
    }
    console.error('[微博主题] 设置主题模式时出错:', error);
    if (simpleNotify) {
      simpleNotify('主题设置失败');
    }
    return null;
  }
}

// 触发微博原生的主题切换函数
function triggerWeiboThemeChange(isDark) {
  try {
    let success = false;
    
    // 方法1: 尝试查找微博原生主题切换按钮并触发点击
    const themeSelector = isDark ? 
      '[class*="nav_item_dark"]:not([class*="nav_item_active"])' :
      '[class*="nav_item_light"]:not([class*="nav_item_active"])';
    
    const themeButton = document.querySelector(themeSelector);
    if (themeButton) {
      console.log(`[微博主题] 找到原生主题按钮，触发点击事件`);
      themeButton.click();
      success = true;
    }
    
    // 方法2: 尝试通过Vue实例切换
    if (window.app) {
      // 检查Vue应用实例
      let vueApp = window.app;
      
      // 尝试直接获取Vue实例
      if (!vueApp && window.__VUE_APP__) {
        vueApp = window.__VUE_APP__;
      }
      
      // 尝试获取vue根元素
      if (!vueApp) {
        const appElement = document.querySelector('#app');
        if (appElement && appElement.__vue__) {
          vueApp = appElement.__vue__;
        }
      }
      
      if (vueApp && vueApp.$store) {
        console.log('[微博主题] 尝试通过Vue实例切换主题');
        const themeMutation = isDark ? 'toggleDarkMode' : 'toggleLightMode';
        
        if (vueApp.$store.commit && typeof vueApp.$store.commit === 'function') {
          vueApp.$store.commit(themeMutation);
          success = true;
        }
      }
    }
    
    // 方法3: 尝试找到其他可能的微博主题切换方法
    if (window.$CONFIG && typeof window.$CONFIG.theme !== 'undefined') {
      console.log('[微博主题] 尝试通过$CONFIG设置主题');
      window.$CONFIG.theme = isDark ? 'dark' : 'light';
      
      // 尝试触发localStorage事件通知微博更新主题
      const storageEvent = new Event('storage');
      storageEvent.key = 'weiboThemeMode';
      storageEvent.newValue = isDark ? 'dark' : 'light';
      window.dispatchEvent(storageEvent);
      
      success = true;
    }
    
    // 方法4: 通过修改localStorage直接触发微博的主题系统
    try {
      const userId = getUserId();
      const darkModeHistory = `[[${userId},${isDark ? 1 : 0}]]`;
      localStorage.setItem('darkModeHistory', darkModeHistory);
      
      // 手动触发storage事件，让微博的监听器知道主题变化了
      const storageEvent = new Event('storage');
      storageEvent.key = 'darkModeHistory';
      storageEvent.newValue = darkModeHistory;
      window.dispatchEvent(storageEvent);
      
      success = true;
    } catch (e) {
      console.error('[微博主题] 通过localStorage切换主题失败:', e);
    }
    
    if (!success) {
      console.log('[微博主题] 未找到微博原生主题切换机制，仅应用CSS样式');
    }
    
    return success;
  } catch (error) {
    console.error('[微博主题] 触发原生主题切换失败:', error);
    return false;
  }
}

// 获取用户ID
function getUserId() {
  let userId = null;

  // 尝试从现有的darkModeHistory中获取用户ID
  try {
    const darkModeHistory = localStorage.getItem('darkModeHistory');
    if (darkModeHistory) {
      const parsed = JSON.parse(darkModeHistory);
      if (parsed && parsed.length > 0 && parsed[0].length > 0) {
        userId = parsed[0][0];
      }
    }
  } catch (e) {
    console.error("解析darkModeHistory失败:", e);
  }

  // 如果没有找到用户ID，尝试从其他地方获取
  if (!userId) {
    // 尝试从页面获取
    const pageSource = document.documentElement.outerHTML;
    const uidMatch = pageSource.match(/uid=(\d+)/);
    if (uidMatch && uidMatch[1]) {
      userId = parseInt(uidMatch[1], 10);
    }
  }

  // 如果还是没有找到用户ID，使用默认值
  return userId || 0;
}

// 更新所有已打开的评论模态框的主题
function updateCommentModalsTheme(isDark) {
  // 更新所有已打开的评论模态框
  const commentModals = document.querySelectorAll('.comment-modal');
  commentModals.forEach(modal => {
    modal.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // 尝试更新iframe内容的主题
    const iframe = modal.querySelector('.comment-modal-iframe');
    if (iframe) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc && iframeDoc.body) {
          iframeDoc.body.classList.remove('woo-theme-dark', 'woo-theme-light');
          iframeDoc.body.classList.add(isDark ? 'woo-theme-dark' : 'woo-theme-light');
        }
      } catch (error) {
        console.log('[微博主题] 无法更新iframe主题（可能是跨域）:', error);
      }
    }
  });
}

// 启动主题观察器，防止页面动态修改时主题被重置
function startThemeObserver(isDark) {
  if (observer) {
    observer.disconnect();
  }

  // 创建新的观察器
  observer = new MutationObserver((mutations) => {
    let needsCorrection = false;
    let classChanged = false;
    
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        classChanged = true;
        const el = mutation.target;
        const hasDarkClass = el.classList.contains('woo-theme-dark');
        const hasLightClass = el.classList.contains('woo-theme-light');
        
        // 检查当前主题是否与设置不符
        if (isDark && !hasDarkClass) {
          needsCorrection = true;
        } 
        else if (!isDark && !hasLightClass) {
          needsCorrection = true;
        }
      }
    });
    
    // 如果需要修正且这是一个class变更，立即修正
    if (needsCorrection && classChanged) {
      correctTheme(isDark);
    }
  });

  // 观察body的class变化
  if (document.body) {
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  
  // 观察html的class变化（一些网站在html元素上控制主题）
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
  
  // 初始立即修正主题
  correctTheme(isDark);
}

// 修正页面主题
function correctTheme(isDark) {
  if (!document.body) return;
  
  // 移除冲突的主题类
  document.body.classList.remove(isDark ? 'woo-theme-light' : 'woo-theme-dark');
  // 添加正确的主题类
  document.body.classList.add(isDark ? 'woo-theme-dark' : 'woo-theme-light');
  
  // 修正微博新版的DOM主题和样式
  const themeSwitchers = document.querySelectorAll('[class*="theme-switch"]');
  if (themeSwitchers.length > 0) {
    console.log('[微博主题] 找到主题切换器元素，尝试修正');
  }
  
  // 检查并修正iframe内的主题
  document.querySelectorAll('iframe').forEach(iframe => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc && iframeDoc.body) {
        iframeDoc.body.classList.remove('woo-theme-dark', 'woo-theme-light');
        iframeDoc.body.classList.add(isDark ? 'woo-theme-dark' : 'woo-theme-light');
      }
    } catch (e) {
      // 跨域iframe无法访问
    }
  });
}

// 监听localStorage变化以检测用户手动切换模式
function monitorLocalStorage() {
  // 保存原始的localStorage.setItem方法
  const originalSetItem = localStorage.setItem;
  
  // 重载localStorage.setItem方法以监控主题更改
  localStorage.setItem = function(key, value) {
    // 先调用原始方法确保存储正常工作
    const result = originalSetItem.apply(this, arguments);

    // 只监控主题相关的localStorage变化，且确保不是脚本自身引起的变化
    if ((key === 'darkModeHistory' || key === 'weiboThemeMode') && !isScriptOperation) {
      try {
        let newMode = false;
        
        // 解析不同格式的主题存储值
        if (key === 'darkModeHistory') {
          try {
            const parsed = JSON.parse(value);
            if (parsed && parsed.length > 0 && parsed[0].length > 1) {
              newMode = parsed[0][1] === 1;
            }
          } catch (e) {
            console.error('[微博主题] 无法解析主题设置:', e);
          }
        } else if (key === 'weiboThemeMode') {
          newMode = value === 'dark';
        }
        
        // 检查当前实际主题模式与检测到的变化是否不同
        const currentWebsiteMode = getCurrentWebsiteMode();
        if (currentWebsiteMode !== newMode) {
          console.log(`[微博主题] 检测到用户手动切换为${newMode ? '深色' : '浅色'}模式`);
          
          // 记录用户手动覆盖状态
          userOverride = true;
          saveThemeConfig(true);
          
          // 更新DOM中的主题类以匹配用户选择
          if (!isScriptOperation) {
            isScriptOperation = true; // 防止递归调用
            localStorage.setItem('weiboThemeMode', newMode ? 'dark' : 'light');
            isScriptOperation = false;
          } else if (key === 'weiboThemeMode' && !isScriptOperation) {
            isScriptOperation = true;
            const userId = getUserId();
            localStorage.setItem('darkModeHistory', `[[${userId},${newMode ? 1 : 0}]]`);
            isScriptOperation = false;
          }
          
          // 只有当状态变化，或者是第一次通知时才显示
          if ((lastNotifiedOverrideState !== true || lastNotifiedMode !== newMode || !hasShownInitialNotification) && simpleNotify) {
            simpleNotify(`已手动切换为${newMode ? '深色' : '浅色'}模式`);
            lastNotifiedMode = newMode;
            lastNotifiedOverrideState = true;
            hasShownInitialNotification = true;
          }
          
          // 确保主题已正确应用到DOM
          if (document.body) {
            correctTheme(newMode);
          }
        }
      } catch (e) {
        console.error(`[微博主题] 解析${key}时出错:`, e);
      }
    }

    return result;
  };
}

// 设置键盘快捷键
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+R 重置自动跟随
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      const wasOverride = userOverride;
      userOverride = false;
      saveThemeConfig(false);
      const systemIsDark = GM_getValue('lastSystemMode', window.matchMedia('(prefers-color-scheme: dark)').matches);
      const currentMode = getCurrentWebsiteMode();
        // 只有在状态真的改变时才通知和切换
      if (wasOverride || currentMode !== systemIsDark) {
        // 传递true表示这是用户操作（通过键盘快捷键）
        setWebsiteMode(systemIsDark, true);
        if (simpleNotify) {
          simpleNotify('恢复自动跟随系统模式');
        }
        lastNotifiedMode = systemIsDark;
        lastNotifiedOverrideState = false;
      }
    }
  });
}
