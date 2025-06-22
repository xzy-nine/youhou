// 主题系统模块
// userOverride, userThemeMode, saveThemeConfig, chromeStorage 从chrome-storage.js全局获取
// simpleNotify 从notification.js全局获取

// 状态跟踪变量
let lastNotifiedMode = null;
let lastNotifiedOverrideState = null;
let hasShownInitialNotification = false;
let isScriptOperation = false;
let observer = null;

// 设置主题系统
function setupThemeSystem() {// 检查系统颜色模式
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // 保存最后一次系统模式
  chromeStorage.setValue('lastSystemMode', prefersDarkMode);
  
  // 延迟主题初始化，确保页面完全加载
  setTimeout(() => {
    // 如果用户没有手动覆盖，则跟随系统偏好
    if (!userOverride) {
      // 获取实时系统偏好
      const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const currentWebsiteMode = getCurrentWebsiteMode();
      
      console.log(`[微博主题] 跟随系统模式: ${systemDarkMode ? '深色' : '浅色'}`);
      
      // 如果网站当前模式与系统偏好不符，切换模式
      if (currentWebsiteMode !== systemDarkMode) {
        // 传递false表示这不是用户操作
        setWebsiteMode(systemDarkMode, false);
      }
      lastNotifiedMode = systemDarkMode;
    } else {
      // 如果用户手动设置了主题，尊重用户设置
      // 读取上次保存的用户偏好，如果没有则使用当前网站模式
      const savedMode = (userThemeMode !== null) ? userThemeMode : getCurrentWebsiteMode();
      console.log(`用户手动设置为${savedMode ? '深色' : '浅色'}模式，保持不变`);
      
      // 确保当前主题与用户设置一致
      setWebsiteMode(savedMode, false);
      lastNotifiedMode = savedMode;
    }
    
    lastNotifiedOverrideState = userOverride;
  }, 500); // 延迟500毫秒执行，确保页面已加载
    // 监听系统模式变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const newDarkMode = e.matches;
    chromeStorage.getValue('lastSystemMode', prefersDarkMode).then(oldSystemMode => {
      // 更新系统模式缓存
      chromeStorage.setValue('lastSystemMode', newDarkMode);
      
      console.log(`[微博主题] 系统模式变化: ${newDarkMode ? '深色' : '浅色'}`);
      
      // 只有当没有用户手动覆盖时才跟随系统
      if (!userOverride) {
        // 传递false表示这不是用户操作
        setWebsiteMode(newDarkMode, false);
        
        // 只有当模式真的改变时才通知
        if (lastNotifiedMode !== newDarkMode) {
          simpleNotify(`已切换到${newDarkMode ? '深色' : '浅色'}模式`);
          lastNotifiedMode = newDarkMode;
        }
      }
    });
  });
  
  // 监听localStorage变化以检测用户手动切换模式
  monitorLocalStorage();
}

// 获取当前网站的模式
function getCurrentWebsiteMode() {
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

// 设置网站模式 - 与原始版本保持一致的简化实现
function setWebsiteMode(isDark, fromUserAction = false) {
  try {
    // 标记为脚本操作，防止触发我们自己的监听器
    isScriptOperation = true;
    
    // 获取用户ID
    const userId = getUserId();
    const modeValue = isDark ? 1 : 0;
    
    // 直接设置localStorage，这会触发微博自己的主题切换逻辑
    localStorage.setItem('darkModeHistory', `[[${userId},${modeValue}]]`);
    
    // DOM主题应用
    const applyDomTheme = () => {
      if (document.body) {
        // 先移除可能存在的主题类
        document.body.classList.remove("woo-theme-dark", "woo-theme-light");
        
        // 添加正确的主题类
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
        
        // 触发一个自定义事件，让微博的JS知道主题已改变
        try {
          const event = new CustomEvent('themechange', { 
            detail: { theme: isDark ? 'dark' : 'light' } 
          });
          window.dispatchEvent(event);
        } catch (e) {
          // 静默处理事件创建失败
        }
      } else {
        // 如果body还不存在，等待一下再试
        setTimeout(applyDomTheme, 100);
      }
    };
    
    // 根据文档状态决定何时应用主题
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyDomTheme);
    } else {
      applyDomTheme();
    }

    // 重置标记
    if (!fromUserAction) {
      isScriptOperation = false;
    }
    
    return true;
  } catch (error) {
    // 确保在错误情况下也重置标记
    isScriptOperation = false;
    console.error('[微博主题] 设置主题模式时出错:', error);
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
          saveThemeConfig(true, newMode);
          
          // 更新评论悬浮窗的主题
          updateCommentModalsTheme(newMode);
            
          // 只有当状态变化，或者是第一次通知时才显示
          if (lastNotifiedOverrideState !== true || lastNotifiedMode !== newMode || !hasShownInitialNotification) {
            simpleNotify(`已手动切换为${newMode ? '深色' : '浅色'}模式`);
            lastNotifiedMode = newMode;
            lastNotifiedOverrideState = true;
            hasShownInitialNotification = true;
          }
        }
      } catch (e) {
        console.error(`[微博主题] 解析${key}时出错:`, e);
      }
    }

    return result;
  };
  
  // 监听localStorage变化事件，用于检测用户通过微博原生方式切换主题
  window.addEventListener('storage', (event) => {
    // 如果是我们自己触发的事件，则忽略
    if (isScriptOperation) {
      return;
    }
    
    // 只关注darkModeHistory键
    if (event.key === 'darkModeHistory') {
      try {
        const newValue = event.newValue;
        if (newValue) {
          const parsed = JSON.parse(newValue);
          // parsed格式为[[用户ID, 模式值]]，模式值1为深色，0为浅色
          if (parsed && parsed.length > 0 && parsed[0].length > 1) {
            const newDarkMode = parsed[0][1] === 1;
            
            console.log(`[微博主题] 检测到用户通过微博界面切换主题: ${newDarkMode ? '深色' : '浅色'}`);
            
            // 记录用户手动覆盖和当前主题状态
            userOverride = true;
            saveThemeConfig(true, newDarkMode);
            
            // 更新评论悬浮窗的主题
            updateCommentModalsTheme(newDarkMode);
            
            // 只有当状态变化时才通知
            if (lastNotifiedMode !== newDarkMode || lastNotifiedOverrideState !== true) {
              simpleNotify(`已切换为${newDarkMode ? '深色' : '浅色'}模式`);
              lastNotifiedMode = newDarkMode;
              lastNotifiedOverrideState = true;
            }
          }
        }
      } catch (error) {
        console.error('[微博主题] 处理localStorage事件时出错:', error);
      }
    }
  });
}



