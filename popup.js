// 弹出界面的JavaScript

// 设置对象
let userSettings = {
  // 主题设置
  userOverride: false,
  userThemeMode: false,
  // 宽屏设置
  widescreen_enabled: true,
  widescreen_loose: false,
  widescreen_notify_enabled: false,  // 背景设置
  background_enabled: false,
  background_type: 'bing',
  background_url: '',
  background_opacity: 1.0,
  background_content_transparency: true,
  background_content_opacity: 0.7,
  background_content_blur: 1,
  background_notify_enabled: false
};

// 设置主题模式
function setThemeMode(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
}

// 页面加载时初始化设置
document.addEventListener('DOMContentLoaded', async () => {
  // 应用默认主题
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setThemeMode(prefersDark);
  
  // 从存储中加载设置
  chrome.storage.local.get(null, (settings) => {
    // 更新设置对象
    userSettings = { ...userSettings, ...settings };
    
    // 更新UI状态
    updateUI();
    
    // 根据用户设置更新主题
    if (userSettings.userOverride) {
      setThemeMode(userSettings.userThemeMode);
    }
  });
  
  // 设置事件监听器
  setupEventListeners();
  
  // 监听来自content script的主题变化消息
  setupMessageListener();
});

function updateUI() {
  // 更新宽屏功能状态
  const widescreenToggle = document.getElementById('widescreen-toggle');
  const widescreenStatus = document.getElementById('widescreen-status');
  const widescreenIndicator = widescreenToggle.querySelector('.status-indicator');
    widescreenToggle.className = userSettings.widescreen_enabled ? 'active' : '';
  widescreenStatus.textContent = userSettings.widescreen_enabled ? '已开启' : '已关闭';
  widescreenIndicator.className = `status-indicator ${userSettings.widescreen_enabled ? 'on' : 'off'}`;
  
  const widescreenLooseCheckbox = document.getElementById('widescreen-loose');
  if (widescreenLooseCheckbox) {
    widescreenLooseCheckbox.checked = userSettings.widescreen_loose || false;
  }
  
  // 更新主题按钮状态
  const themeToggle = document.getElementById('theme-toggle');
  const themeIndicator = themeToggle.querySelector('.status-indicator');
  
  if (userSettings.userOverride) {
    themeIndicator.className = `status-indicator ${userSettings.userThemeMode ? 'on' : 'off'}`;
    document.getElementById('theme-status').textContent = userSettings.userThemeMode ? '深色模式' : '浅色模式';
  } else {
    themeIndicator.className = 'status-indicator off';
    document.getElementById('theme-status').textContent = '跟随系统';
  }
  
  // 更新背景设置
  const backgroundToggle = document.getElementById('background-toggle');
  const backgroundStatus = document.getElementById('background-status');
  const backgroundIndicator = backgroundToggle.querySelector('.status-indicator');
  
  backgroundToggle.className = userSettings.background_enabled ? 'active' : '';
  backgroundStatus.textContent = userSettings.background_enabled ? '已开启' : '已关闭';
  backgroundIndicator.className = `status-indicator ${userSettings.background_enabled ? 'on' : 'off'}`;
  
  // 背景选项显示状态
  document.getElementById('background-options').style.display = userSettings.background_enabled ? 'block' : 'none';
    // 背景来源
  if (userSettings.background_type === 'bing') {
    document.getElementById('bing-background').checked = true;
  } else if (userSettings.background_type === 'gradient') {
    document.getElementById('gradient-background').checked = true;
  } else {
    document.getElementById('custom-background').checked = true;
  }
    document.getElementById('custom-url-container').style.display = 
    userSettings.background_type === 'custom' ? 'block' : 'none';
  document.getElementById('background-url').value = userSettings.background_url || '';
  
  // 不透明度设置
  const bgOpacityValue = Math.round(userSettings.background_opacity * 100);
  document.getElementById('background-opacity').value = bgOpacityValue;
  document.getElementById('background-opacity-value').textContent = `${bgOpacityValue}%`;
  // 内容半透明设置
  const contentTransparencyToggle = document.getElementById('content-transparency-toggle');
  if (contentTransparencyToggle) {
    contentTransparencyToggle.checked = userSettings.background_content_transparency;
    const contentOpacityContainer = document.getElementById('content-opacity-container');
    const contentBlurContainer = document.getElementById('content-blur-container');
    
    if (contentOpacityContainer) {
      contentOpacityContainer.style.display = userSettings.background_content_transparency ? 'block' : 'none';
    }
    if (contentBlurContainer) {
      contentBlurContainer.style.display = userSettings.background_content_transparency ? 'block' : 'none';
    }
  }
  
  const contentOpacityValue = Math.round(userSettings.background_content_opacity * 100);
  const contentOpacityInput = document.getElementById('content-opacity');
  const contentOpacityValueSpan = document.getElementById('content-opacity-value');
  if (contentOpacityInput && contentOpacityValueSpan) {
    contentOpacityInput.value = contentOpacityValue;
    contentOpacityValueSpan.textContent = `${contentOpacityValue}%`;
  }
    // 内容模糊度设置
  const contentBlurValue = userSettings.background_content_blur || 1;
  const contentBlurInput = document.getElementById('content-blur');
  const contentBlurValueSpan = document.getElementById('content-blur-value');
  if (contentBlurInput && contentBlurValueSpan) {
    contentBlurInput.value = contentBlurValue;
    contentBlurValueSpan.textContent = `${contentBlurValue}px`;
  }
  // 通知设置
  const notificationToggle = document.getElementById('notification-toggle');
  if (notificationToggle) {
    notificationToggle.checked = userSettings.widescreen_notify_enabled || userSettings.background_notify_enabled || false;
  }
}

function setupEventListeners() {
  // 宽屏切换
  document.getElementById('widescreen-toggle').addEventListener('click', () => {
    userSettings.widescreen_enabled = !userSettings.widescreen_enabled;
    chrome.storage.local.set({ widescreen_enabled: userSettings.widescreen_enabled });
    updateUI();
    sendMessageToContentScript({ action: 'updateWidescreen' });
  });
    document.getElementById('widescreen-loose').addEventListener('change', (e) => {
    userSettings.widescreen_loose = e.target.checked;
    chrome.storage.local.set({ widescreen_loose: e.target.checked });
    sendMessageToContentScript({ action: 'updateWidescreen' });
  });
    // 主题切换 - 使用增强版本
  document.getElementById('theme-toggle').addEventListener('click', enhancedThemeToggle);
  
  // 重置主题跟随系统 - 使用增强版本
  document.getElementById('theme-reset').addEventListener('click', enhancedThemeReset);
  
  // 背景设置
  document.getElementById('background-toggle').addEventListener('click', () => {
    userSettings.background_enabled = !userSettings.background_enabled;
    chrome.storage.local.set({ background_enabled: userSettings.background_enabled });
    updateUI();
    sendMessageToContentScript({ action: 'updateBackground' });
  });
    document.getElementById('bing-background').addEventListener('change', () => {
    if (document.getElementById('bing-background').checked) {
      userSettings.background_type = 'bing';
      chrome.storage.local.set({ background_type: 'bing' });
      document.getElementById('custom-url-container').style.display = 'none';
      sendMessageToContentScript({ action: 'updateBackground' });
    }
  });
  
  document.getElementById('gradient-background').addEventListener('change', () => {
    if (document.getElementById('gradient-background').checked) {
      userSettings.background_type = 'gradient';
      chrome.storage.local.set({ background_type: 'gradient' });
      document.getElementById('custom-url-container').style.display = 'none';
      sendMessageToContentScript({ action: 'updateBackground' });
    }
  });
  
  document.getElementById('custom-background').addEventListener('change', () => {
    if (document.getElementById('custom-background').checked) {
      userSettings.background_type = 'custom';
      chrome.storage.local.set({ background_type: 'custom' });
      document.getElementById('custom-url-container').style.display = 'block';
      sendMessageToContentScript({ action: 'updateBackground' });
    }
  });
  
  document.getElementById('background-url').addEventListener('change', (e) => {
    userSettings.background_url = e.target.value;
    chrome.storage.local.set({ background_url: e.target.value });
    sendMessageToContentScript({ action: 'updateBackground' });
  });
  
  document.getElementById('background-opacity').addEventListener('input', (e) => {
    const value = parseInt(e.target.value) / 100;
    userSettings.background_opacity = value;
    document.getElementById('background-opacity-value').textContent = `${e.target.value}%`;
    chrome.storage.local.set({ background_opacity: value });
    sendMessageToContentScript({ action: 'updateBackground' });
  });
    document.getElementById('content-transparency-toggle').addEventListener('change', (e) => {
    userSettings.background_content_transparency = e.target.checked;
    const contentOpacityContainer = document.getElementById('content-opacity-container');
    const contentBlurContainer = document.getElementById('content-blur-container');
    
    if (contentOpacityContainer) {
      contentOpacityContainer.style.display = e.target.checked ? 'block' : 'none';
    }
    if (contentBlurContainer) {
      contentBlurContainer.style.display = e.target.checked ? 'block' : 'none';
    }
    
    chrome.storage.local.set({ background_content_transparency: e.target.checked });
    sendMessageToContentScript({ action: 'updateBackground' });
  });
    document.getElementById('content-opacity').addEventListener('input', (e) => {
    const value = parseInt(e.target.value) / 100;
    userSettings.background_content_opacity = value;
    document.getElementById('content-opacity-value').textContent = `${e.target.value}%`;
    chrome.storage.local.set({ background_content_opacity: value });
    sendMessageToContentScript({ action: 'updateBackground' });
  });
  
  document.getElementById('content-blur').addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    userSettings.background_content_blur = value;
    document.getElementById('content-blur-value').textContent = `${value}px`;
    chrome.storage.local.set({ background_content_blur: value });
    sendMessageToContentScript({ action: 'updateBackground' });
  });// 通知设置 - 同时控制宽屏和背景通知
  document.getElementById('notification-toggle').addEventListener('change', (e) => {
    userSettings.widescreen_notify_enabled = e.target.checked;
    userSettings.background_notify_enabled = e.target.checked;
    chrome.storage.local.set({ 
      widescreen_notify_enabled: e.target.checked,
      background_notify_enabled: e.target.checked
    });
  });
  
  // 清理缓存按钮
  document.getElementById('clear-cache-btn').addEventListener('click', async () => {
    const btn = document.getElementById('clear-cache-btn');
    const originalText = btn.innerHTML;
    
    try {
      // 更新按钮状态
      btn.innerHTML = '🔄 清理中...';
      btn.disabled = true;
      
      // 调用background脚本的清理缓存功能
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'clearCache' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      // 清理成功
      btn.innerHTML = '✅ 清理完成';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 2000);
      
      // 重新加载设置
      chrome.storage.local.get(null, (settings) => {
        userSettings = { ...userSettings, ...settings };
        updateUI();
      });
      
    } catch (error) {
      console.error('清理缓存失败:', error);
      btn.innerHTML = '❌ 清理失败';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 2000);
    }
  });
}

// 移除重复的消息监听器，使用setupMessageListener中的统一处理

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  // 只有在未手动覆盖时才跟随系统主题
  if (!userSettings.userOverride) {
    console.log(`[微博增强弹出界面] 系统主题变化: ${e.matches ? '深色' : '浅色'}`);
    setThemeMode(e.matches);
    updateUI();
  }
});

function sendMessageToContentScript(message) {
  // 发送消息到当前活动标签页的内容脚本
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0] && tabs[0].url && tabs[0].url.includes('weibo.com')) {
      try {
        chrome.tabs.sendMessage(tabs[0].id, message, response => {
          // 处理可能的响应
          if (chrome.runtime.lastError) {
            // 静默处理错误，避免控制台报错
            console.log('设置已保存，但无法立即应用到页面');
          }
        });
      } catch (e) {
        // 捕获可能的错误，静默处理
        console.log('设置已保存，需要刷新页面后生效');
      }
    } else {
      console.log('设置已保存，将在打开微博页面时自动应用');
    }
  });
}

// 设置消息监听器，监听来自content script的主题变化
function setupMessageListener() {
  // 监听来自background或content script的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[微博增强 Popup] 收到消息:', message);
    
    if (message.action === 'themeChanged') {
      console.log('[微博增强 Popup] 收到主题变化消息:', message);
      
      // 更新用户设置
      userSettings.userOverride = message.userOverride;
      userSettings.userThemeMode = message.isDark;
      
      // 保存到存储
      chrome.storage.local.set({
        userOverride: message.userOverride,
        userThemeMode: message.isDark
      });
      
      // 更新popup界面的主题
      if (message.userOverride) {
        setThemeMode(message.isDark);
      } else {
        // 如果不是用户覆盖，跟随系统主题
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setThemeMode(systemTheme);
      }
      
      // 更新UI状态
      updateUI();
      
      sendResponse({ success: true });
    }
    
    if (message.action === 'themeReset') {
      console.log('[微博增强 Popup] 收到主题重置消息:', message);
      
      // 更新用户设置
      userSettings.userOverride = false;
      userSettings.userThemeMode = null;
      
      // 保存到存储
      chrome.storage.local.set({
        userOverride: false,
        userThemeMode: null
      });
      
      // 应用系统主题
      setThemeMode(message.systemIsDark);
      
      // 更新UI状态
      updateUI();
      
      sendResponse({ success: true });
    }
    
    // 监听存储变化，确保UI与实际状态同步
    if (message.action === 'storageChanged') {
      // 重新加载设置并更新UI
      chrome.storage.local.get(null, (settings) => {
        userSettings = { ...userSettings, ...settings };
        updateUI();
      });
    }
    
    return true; // 表示异步响应
  });
  
  // 监听存储变化事件
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      console.log('[微博增强 Popup] 存储发生变化:', changes);
      
      // 更新本地设置对象
      Object.keys(changes).forEach(key => {
        if (changes[key].newValue !== undefined) {
          userSettings[key] = changes[key].newValue;
        }
      });
      
      // 如果主题设置发生变化，更新UI
      if (changes.userOverride || changes.userThemeMode) {
        if (userSettings.userOverride) {
          setThemeMode(userSettings.userThemeMode);
        } else {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setThemeMode(systemTheme);
        }
      }
      
      // 更新UI状态
      updateUI();
    }
  });
}

// 增强的主题按钮功能，确保与网页原生主题按钮同步
function enhancedThemeToggle() {
  userSettings.userOverride = true;
  userSettings.userThemeMode = !userSettings.userThemeMode;
  
  // 保存设置
  chrome.storage.local.set({ 
    userOverride: true, 
    userThemeMode: userSettings.userThemeMode 
  });
  
  // 更新UI主题
  setThemeMode(userSettings.userThemeMode);
  updateUI();
  
  // 发送消息到content script，强制同步
  sendMessageToContentScript({
    action: 'updateTheme',
    userOverride: true,
    userThemeMode: userSettings.userThemeMode,
    forceSync: true  // 添加强制同步标志
  });
}

// 增强的主题重置功能
async function enhancedThemeReset() {
  try {
    console.log('[微博增强] 开始重置主题跟随系统');
    
    // 重置用户设置状态
    userSettings.userOverride = false;
    userSettings.userThemeMode = null;
    
    // 异步保存到存储，确保同步
    await Promise.all([
      new Promise(resolve => chrome.storage.local.set({ userOverride: false }, resolve)),
      new Promise(resolve => chrome.storage.local.set({ userThemeMode: null }, resolve))
    ]);
    
    // 获取系统主题偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.log(`[微博增强] 系统当前主题: ${prefersDark ? '深色' : '浅色'}`);
    
    // 设置主题模式
    setThemeMode(prefersDark);
    
    // 更新UI
    updateUI();
    
    // 发送消息到content script，包含强制同步标志
    sendMessageToContentScript({
      action: 'updateTheme',
      userOverride: false,
      userThemeMode: null,
      systemTheme: prefersDark,
      forceSync: true,
      forceReset: true
    });
    
    console.log('[微博增强] 主题重置完成');
  } catch (error) {
    console.error('[微博增强] 主题重置过程中出错:', error);
  }
}
