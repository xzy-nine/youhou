// 主题系统模块
import { userOverride, saveThemeConfig } from '../utils/storage';

// 状态跟踪变量
let lastNotifiedMode = null;
let lastNotifiedOverrideState = null;
let hasShownInitialNotification = false;
let isScriptOperation = false;
let observer = null;

// 设置主题系统
export function setupThemeSystem() {
  // 检查系统颜色模式
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // 保存最后一次系统模式
  GM_setValue('lastSystemMode', prefersDarkMode);
  
  // 如果用户没有手动覆盖，则跟随系统
  if (!userOverride) {
    const currentWebsiteMode = getCurrentWebsiteMode();
    if (currentWebsiteMode !== prefersDarkMode) {
      isScriptOperation = true;
      setWebsiteMode(prefersDarkMode);
      isScriptOperation = false;
    }
    lastNotifiedMode = prefersDarkMode;
  } else {
    const currentWebsiteMode = getCurrentWebsiteMode();
    console.log(`用户手动设置为${currentWebsiteMode ? '深色' : '浅色'}模式，保持不变`);
    lastNotifiedMode = currentWebsiteMode;
  }
  
  lastNotifiedOverrideState = userOverride;
  
  // 监听系统模式变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const newDarkMode = e.matches;
    const oldSystemMode = GM_getValue('lastSystemMode', prefersDarkMode);
    GM_setValue('lastSystemMode', newDarkMode);
    
    // 只有当系统模式真的发生变化且没有用户手动覆盖时才处理
    if (oldSystemMode !== newDarkMode && !userOverride) {
      isScriptOperation = true; // 标记为脚本操作
      setWebsiteMode(newDarkMode);
      // 只有当模式真的改变时才通知
      if (lastNotifiedMode !== newDarkMode && window.simpleNotify) {
        window.simpleNotify(`已切换到${newDarkMode ? '深色' : '浅色'}模式`);
        lastNotifiedMode = newDarkMode;
      }
      isScriptOperation = false; // 重置标记
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
export function setWebsiteMode(isDark) {
  try {
    isScriptOperation = true; // 标记为脚本操作
    const userId = getUserId();
    const modeValue = isDark ? 1 : 0;
    localStorage.setItem('darkModeHistory', `[[${userId},${modeValue}]]`);
    
    // 等待DOM加载完成后再设置class
    const applyTheme = () => {
      if (document.body) {
        // 先移除可能存在的主题类
        document.body.classList.remove("woo-theme-dark", "woo-theme-light");
        
        if (isDark) {
          document.body.classList.add("woo-theme-dark");
        } else {
          document.body.classList.add("woo-theme-light");
        }
        
        console.log(`[微博主题] 已设置为${isDark ? '深色' : '浅色'}模式`);
        
        // 更新评论悬浮窗的主题
        updateCommentModalsTheme(isDark);
        
        // 启动DOM观察器，确保主题在页面变化时保持
        startThemeObserver(isDark);
        
        // 触发一个自定义事件，让微博的JS知道主题已改变
        try {
          const event = new CustomEvent('themeChange', { detail: { isDark } });
          document.dispatchEvent(event);
        } catch (e) {
          console.error('[微博主题] 无法触发主题变更事件:', e);
        }
      } else {
        document.addEventListener('DOMContentLoaded', applyTheme);
      }
    };

    if (document.readyState === 'loading') {
      // 如果文档还在加载，等待DOM内容加载完成
      document.addEventListener('DOMContentLoaded', applyTheme);
    } else {
      // 文档已加载完成，直接应用主题
      applyTheme();
    }

    isScriptOperation = false; // 重置标记
  } catch (error) {
    isScriptOperation = false; // 确保在错误情况下也重置标记
    console.error('[微博主题] 设置主题模式时出错:', error);
    if (window.simpleNotify) {
      window.simpleNotify('主题设置失败');
    }
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

  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const el = mutation.target;
        const hasDarkClass = el.classList.contains('woo-theme-dark');
        const hasLightClass = el.classList.contains('woo-theme-light');
        
        // 如果当前设置是深色模式但页面不是，重新应用深色模式
        if (isDark && !hasDarkClass) {
          el.classList.remove('woo-theme-light');
          el.classList.add('woo-theme-dark');
        } 
        // 如果当前设置是浅色模式但页面不是，重新应用浅色模式
        else if (!isDark && !hasLightClass) {
          el.classList.remove('woo-theme-dark');
          el.classList.add('woo-theme-light');
        }
      }
    });
  });

  if (document.body) {
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
}

// 监听localStorage变化以检测用户手动切换模式
function monitorLocalStorage() {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    const result = originalSetItem.apply(this, arguments);

    if (key === 'darkModeHistory' && !isScriptOperation) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && parsed.length > 0 && parsed[0].length > 1) {
          const newMode = parsed[0][1] === 1;
          
          // 用户手动切换了主题，记录这个覆盖状态
          userOverride = true;
          saveThemeConfig(true);
          
          console.log(`[微博主题] 检测到用户手动切换为${newMode ? '深色' : '浅色'}模式`);
          
          // 只有当状态变化，或者是第一次通知时才显示
          if ((lastNotifiedOverrideState !== true || lastNotifiedMode !== newMode || !hasShownInitialNotification) && window.simpleNotify) {
            window.simpleNotify(`已手动切换为${newMode ? '深色' : '浅色'}模式`);
            lastNotifiedMode = newMode;
            lastNotifiedOverrideState = true;
            hasShownInitialNotification = true;
          }
        }
      } catch (e) {
        console.error('[微博主题] 解析darkModeHistory时出错:', e);
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
        isScriptOperation = true;
        setWebsiteMode(systemIsDark);
        if (window.simpleNotify) {
          window.simpleNotify('恢复自动跟随系统模式');
        }
        lastNotifiedMode = systemIsDark;
        lastNotifiedOverrideState = false;
        isScriptOperation = false;
      }
    }
  });
}
