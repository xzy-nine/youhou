// 主题系统模块
// userOverride, userThemeMode, saveThemeConfig, chromeStorage 从chrome-storage.js全局获取
// simpleNotify 从notification.js全局获取

// 状态跟踪变量
let lastNotifiedMode = null;
let lastNotifiedOverrideState = null;
let hasShownInitialNotification = false;
let isScriptOperation = false;
let observer = null;

// 增强的主题检测变量
let themeCheckInterval = null;
let lastKnownTheme = null;

// 设置主题系统
function setupThemeSystem() {
  // 检查系统颜色模式
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // 保存最后一次系统模式
  chromeStorage.setValue('lastSystemMode', prefersDarkMode);
  
  // 初始化lastKnownTheme为当前主题
  lastKnownTheme = getCurrentWebsiteMode();
  
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
      lastKnownTheme = systemDarkMode;
    } else {
      // 如果用户手动设置了主题，尊重用户设置
      // 读取上次保存的用户偏好，如果没有则使用当前网站模式
      const savedMode = (userThemeMode !== null) ? userThemeMode : getCurrentWebsiteMode();
      console.log(`用户手动设置为${savedMode ? '深色' : '浅色'}模式，保持不变`);
      
      // 确保当前主题与用户设置一致
      setWebsiteMode(savedMode, false);
      lastNotifiedMode = savedMode;
      lastKnownTheme = savedMode;
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
  });  // 监听localStorage变化以检测用户手动切换模式
  monitorLocalStorage();
  
  // 监听DOM变化以检测主题切换（更直接的方法）
  observer = monitorDOMChanges();
  
  // 启动定时检测作为备用方案（增强版）
  startThemePolling();
  
  // 监听主题按钮点击（增强版）
  monitorThemeButtonClicks();
}

// 获取当前网站的模式
function getCurrentWebsiteMode() {
  try {
    // 方法1: 检查localStorage中的darkModeHistory
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

  // 方法2: 检查body的类名（最可靠的方法）
  if (document.body) {
    if (document.body.classList.contains("woo-theme-dark")) {
      return true;
    }
    if (document.body.classList.contains("woo-theme-light")) {
      return false;
    }
  }
  
  // 方法3: 检查documentElement的data-theme属性
  if (document.documentElement) {
    const themeAttr = document.documentElement.getAttribute('data-theme');
    if (themeAttr === 'dark') return true;
    if (themeAttr === 'light') return false;
  }
  
  // 方法4: 检查documentElement的类名
  if (document.documentElement) {
    if (document.documentElement.classList.contains("woo-theme-dark")) {
      return true;
    }
    if (document.documentElement.classList.contains("woo-theme-light")) {
      return false;
    }
  }

  // 默认返回false（浅色模式）
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
    
    // 更新最后已知主题状态
    lastKnownTheme = isDark;
    
    // 如果是从用户操作来的，更新用户覆盖设置
    if (fromUserAction) {
      userOverride = true;
      userThemeMode = isDark;
      saveThemeConfig(true, isDark);
    }
    
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
        
        // 通知所有模块主题已改变
        notifyAllModulesThemeChange(isDark);
        
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
          console.log(`[微博主题] localStorage检测到用户手动切换为${newMode ? '深色' : '浅色'}模式`);
          handleNativeThemeChange(newMode);
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
            
            // 使用handleNativeThemeChange处理，确保更新到扩展
            lastKnownTheme = newDarkMode;
            handleNativeThemeChange(newDarkMode);
          }
        }
      } catch (error) {
        console.error('[微博主题] 处理localStorage事件时出错:', error);
      }
    }
  });
}

// 监听DOM变化以检测主题切换
function monitorDOMChanges() {
  // 创建一个MutationObserver来监听DOM变化
  const observer = new MutationObserver((mutations) => {
    let themeChanged = false;
    let newThemeMode = null;
    
    mutations.forEach((mutation) => {
      // 监听body或documentElement的class变化
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        
        if (target === document.body || target === document.documentElement) {
          const currentMode = getCurrentWebsiteMode();
          
          // 检查是否真的发生了主题变化
          if (currentMode !== lastKnownTheme && !isScriptOperation) {
            themeChanged = true;
            newThemeMode = currentMode;
          }
        }
      }
      
      // 监听data-theme属性变化
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        const target = mutation.target;
        
        if (target === document.documentElement) {
          const currentMode = target.getAttribute('data-theme') === 'dark';
          
          if (currentMode !== lastKnownTheme && !isScriptOperation) {
            themeChanged = true;
            newThemeMode = currentMode;
          }
        }
      }
    });
      
    // 如果检测到主题变化，处理它
    if (themeChanged && newThemeMode !== null) {
      console.log(`[微博主题] DOM监听检测到主题变化为${newThemeMode ? '深色' : '浅色'}模式`);
      handleNativeThemeChange(newThemeMode);
    }
  });
  
  // 开始观察body和documentElement的属性变化
  if (document.body) {
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });
  }
  
  if (document.documentElement) {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });
  }
  
  console.log('[微博主题] DOM变化监听已启动');
  
  return observer;
}

// 定时检测主题变化（增强版，更快响应原生主题切换）
function startThemePolling() {
  // 100ms间隔检测，确保快速响应用户的原生主题切换
  themeCheckInterval = setInterval(() => {
    if (isScriptOperation) return;
    
    const currentMode = getCurrentWebsiteMode();
    if (currentMode !== lastKnownTheme) {
      console.log(`[微博主题] 定时检测发现主题变化: ${lastKnownTheme ? '深色' : '浅色'} → ${currentMode ? '深色' : '浅色'}`);
      handleNativeThemeChange(currentMode);
    }
  }, 100); // 更快的检测间隔
  
  console.log('[微博主题] 增强定时主题检测已启动 (100ms间隔)');
}

// 统一处理原生主题变化的函数
function handleNativeThemeChange(newTheme) {
  if (newTheme === lastKnownTheme) return;
  
  console.log(`[微博主题] 处理原生主题变化: ${lastKnownTheme ? '深色' : '浅色'} → ${newTheme ? '深色' : '浅色'}`);
  
  // 更新状态
  lastKnownTheme = newTheme;
  
  // 记录用户手动覆盖状态
  userOverride = true;
  userThemeMode = newTheme; // 确保userThemeMode也被更新
  saveThemeConfig(true, newTheme);
  
  // 向扩展发送消息，更新popup中的按钮状态
  try {
    chrome.runtime.sendMessage({
      action: 'themeChanged',
      isDark: newTheme,
      userOverride: true,
      userThemeMode: newTheme
    });
  } catch (e) {
    console.log('[微博主题] 发送消息到popup失败，这是正常现象:', e);
  }
  
  // 通知所有模块主题已改变
  notifyAllModulesThemeChange(newTheme);
  
  // 显示通知（避免重复通知）
  if (lastNotifiedMode !== newTheme) {
    simpleNotify(`已切换为${newTheme ? '深色' : '浅色'}模式`);
    lastNotifiedMode = newTheme;
    lastNotifiedOverrideState = true;
  }
}

// 通知所有模块主题已改变
function notifyAllModulesThemeChange(isDark) {
  // 更新评论悬浮窗的主题
  updateCommentModalsTheme(isDark);
  
  // 更新背景图片模块的主题感知
  if (typeof updateBackgroundTheme === 'function') {
    updateBackgroundTheme(isDark);
  }
  
  // 更新通知模块的主题
  if (typeof updateNotificationTheme === 'function') {
    updateNotificationTheme(isDark);
  }
    // 更新popup界面的主题（如果存在）
  try {
    chrome.runtime.sendMessage({
      action: 'themeChanged',
      isDark: isDark,
      userOverride: userOverride,
      userThemeMode: isDark
    });
  } catch (e) {
    // 在content script中发送消息到popup可能失败，这是正常的
  }
  
  // 触发全局主题变化事件
  window.dispatchEvent(new CustomEvent('weiboThemeChanged', {
    detail: { isDark: isDark }
  }));
  
  console.log(`[微博主题] 已通知所有模块主题变更为: ${isDark ? '深色' : '浅色'}`);
}

// 监听可能的主题切换按钮点击（增强版）
function monitorThemeButtonClicks() {
  // 监听文档上的所有点击事件
  document.addEventListener('click', (event) => {
    const target = event.target;
    
    // 检查是否点击了主题相关的按钮或元素
    const isThemeButton = target.closest('[data-theme]') ||
                          target.closest('[class*="theme"]') ||
                          target.closest('[class*="dark"]') ||
                          target.closest('[class*="light"]') ||
                          target.closest('[title*="主题"]') ||
                          target.closest('[title*="深色"]') ||
                          target.closest('[title*="浅色"]') ||
                          target.closest('[title*="夜间"]') ||
                          target.closest('[title*="日间"]') ||
                          target.closest('[class*="mode"]') ||    // 增加可能的class匹配
                          target.closest('[id*="mode"]') ||       // 增加可能的id匹配
                          target.closest('[id*="theme"]') ||      // 增加可能的id匹配
                          target.textContent?.includes('主题') ||
                          target.textContent?.includes('深色') ||
                          target.textContent?.includes('浅色') ||
                          target.textContent?.includes('夜间模式') ||
                          target.textContent?.includes('日间模式');
    
    if (isThemeButton) {
      console.log('[微博主题] 检测到可能的主题切换按钮点击:', target);
      
      // 立即检查一次，以便更快响应
      const currentModeNow = getCurrentWebsiteMode();
      if (currentModeNow !== lastKnownTheme && !isScriptOperation) {
        console.log(`[微博主题] 按钮点击立即检测到主题变化`);
        handleNativeThemeChange(currentModeNow);
      }
      
      // 多个时间点检测主题变化，确保不遗漏
      [50, 100, 200, 500, 1000].forEach(delay => {
        setTimeout(() => {
          const currentMode = getCurrentWebsiteMode();
          if (currentMode !== lastKnownTheme && !isScriptOperation) {
            console.log(`[微博主题] 按钮点击后${delay}ms检测到主题变化`);
            handleNativeThemeChange(currentMode);
          }
        }, delay);
      });
    }
  }, true); // 使用捕获阶段确保能捕获到事件
  
  console.log('[微博主题] 增强主题按钮点击监听已启动');
}

// 清理所有监听器的函数
function cleanupThemeListeners() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  if (themeCheckInterval) {
    clearInterval(themeCheckInterval);
    themeCheckInterval = null;
  }
  
  console.log('[微博主题] 所有主题监听器已清理');
}

// 重新初始化主题系统的函数
window.reinitializeThemeSystem = function() {
  console.log('[微博主题] 重新初始化主题系统...');
  
  // 清理现有监听器
  cleanupThemeListeners();
  
  // 重新设置
  setupThemeSystem();
  
  simpleNotify('主题系统已重新初始化');
};

// 页面卸载时清理
window.addEventListener('beforeunload', cleanupThemeListeners);

// 测试原生主题切换同步的调试函数
window.testNativeThemeSync = function() {
  console.log('%c[微博主题] 🧪 开始测试原生主题切换同步...', 'color: #17a2b8; font-weight: bold;');
  
  const currentTheme = getCurrentWebsiteMode();
  console.log(`%c[微博主题] 当前主题状态: ${currentTheme ? '深色' : '浅色'}`, 'color: #17a2b8;');
  console.log(`%c[微博主题] lastKnownTheme: ${lastKnownTheme ? '深色' : '浅色'}`, 'color: #17a2b8;');
  
  // 显示监听器状态
  console.log(`%c[微博主题] 监听器状态:`, 'color: #17a2b8;');
  console.log('  - DOM监听器:', observer ? '✅ 已启动' : '❌ 未启动');
  console.log('  - 定时检测:', themeCheckInterval ? '✅ 已启动' : '❌ 未启动');
  console.log('  - localStorage拦截:', localStorage.setItem.toString().includes('微博主题') ? '✅ 已启动' : '❌ 未启动');
  
  // 启动增强日志记录
  let logCount = 0;
  const originalLog = console.log;
  const enhancedLog = (...args) => {
    if (args[0] && args[0].includes('[微博主题]')) {
      logCount++;
      originalLog(`%c[测试日志 #${logCount}]`, 'color: #007bff;', ...args);
    } else {
      originalLog(...args);
    }
  };
  
  console.log = enhancedLog;
  
  console.log(`%c[微博主题] 📋 请在微博页面上点击主题切换按钮，观察是否有日志输出`, 'color: #ffc107;');
  simpleNotify('🧪 主题同步测试已启动，请测试原生主题切换');
  
  // 15秒后结束测试
  setTimeout(() => {
    console.log = originalLog;
    console.log(`%c[微博主题] ✅ 测试结束，共记录 ${logCount} 条主题相关日志`, 'color: #28a745; font-weight: bold;');
    
    if (logCount === 0) {
      simpleNotify('⚠️ 未检测到主题变化，请检查主题按钮位置');
    } else {
      simpleNotify(`🎉 主题同步测试完成，检测到 ${logCount} 次事件`);
    }
  }, 15000);
};

// 手动触发主题变化（用于测试）
window.triggerManualThemeChange = function(isDark) {
  console.log(`%c[微博主题] 🔧 手动触发主题变化测试: ${isDark ? '深色' : '浅色'}`, 'color: #dc3545; font-weight: bold;');
  
  const previousMode = lastKnownTheme;
  handleNativeThemeChange(isDark);
  
  console.log(`%c[微博主题] 主题变化触发完成: ${previousMode ? '深色' : '浅色'} → ${isDark ? '深色' : '浅色'}`, 'color: #dc3545;');
  simpleNotify(`手动触发主题变化: ${isDark ? '深色' : '浅色'}模式`);
};



