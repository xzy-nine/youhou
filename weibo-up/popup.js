// 弹出界面的JavaScript

// 页面加载时初始化设置
document.addEventListener('DOMContentLoaded', async () => {
  // 从存储中加载设置
  chrome.storage.local.get(null, (settings) => {
    // 主题设置
    const themeOverride = document.getElementById('theme-override');
    const themeDarkMode = document.getElementById('theme-dark-mode');
    
    themeOverride.checked = settings.userOverride || false;
    // 显示或隐藏深色模式选项
    document.getElementById('theme-mode-option').style.display = settings.userOverride ? 'flex' : 'none';
    // 设置主题模式
    themeDarkMode.checked = settings.userThemeMode !== undefined ? settings.userThemeMode : 
                            window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 宽屏设置
    document.getElementById('widescreen-enabled').checked = settings.widescreen_enabled !== undefined ? 
                                                          settings.widescreen_enabled : true;
    document.getElementById('widescreen-loose').checked = settings.widescreen_loose || false;
    document.getElementById('widescreen-ui-visible').checked = settings.widescreen_ui_visible !== undefined ? 
                                                             settings.widescreen_ui_visible : true;
    
    // 背景设置
    const backgroundEnabled = document.getElementById('background-enabled');
    const backgroundType = document.getElementById('background-type');
    const backgroundUrl = document.getElementById('background-url');
    const backgroundOpacity = document.getElementById('background-opacity');
    const contentTransparency = document.getElementById('content-transparency');
    const contentOpacity = document.getElementById('content-opacity');
    const contentBlur = document.getElementById('content-blur');
    
    backgroundEnabled.checked = settings.background_enabled || false;
    backgroundType.value = settings.background_type || 'bing';
    backgroundUrl.value = settings.background_url || '';
    document.getElementById('custom-url-container').style.display = 
      settings.background_type === 'custom' ? 'block' : 'none';
    
    // 设置范围值和显示
    backgroundOpacity.value = settings.background_opacity !== undefined ? settings.background_opacity : 0.2;
    document.getElementById('background-opacity-value').textContent = `${Math.round(backgroundOpacity.value * 100)}%`;
    
    contentTransparency.checked = settings.background_content_transparency !== undefined ? 
                                settings.background_content_transparency : true;
    
    contentOpacity.value = settings.background_content_opacity !== undefined ? settings.background_content_opacity : 0.7;
    document.getElementById('content-opacity-value').textContent = `${Math.round(contentOpacity.value * 100)}%`;
    
    contentBlur.value = settings.background_content_blur !== undefined ? settings.background_content_blur : 5;
    document.getElementById('content-blur-value').textContent = `${contentBlur.value}px`;
    
    // 内容透明度选项的显示/隐藏
    document.getElementById('content-transparency-options').style.display = 
      contentTransparency.checked ? 'block' : 'none';
    
    // 通知设置
    document.getElementById('notify-enabled').checked = settings.widescreen_notify_enabled || false;
  });
  
  // 设置事件监听器
  setupEventListeners();
});

function setupEventListeners() {
  // 主题相关
  const themeOverride = document.getElementById('theme-override');
  themeOverride.addEventListener('change', () => {
    const themeModeOption = document.getElementById('theme-mode-option');
    themeModeOption.style.display = themeOverride.checked ? 'flex' : 'none';
    
    // 保存设置
    chrome.storage.local.set({ 
      userOverride: themeOverride.checked 
    });
    
    // 发送消息到内容脚本
    sendMessageToContentScript({
      action: 'updateTheme',
      userOverride: themeOverride.checked,
      userThemeMode: document.getElementById('theme-dark-mode').checked
    });
  });
  
  document.getElementById('theme-dark-mode').addEventListener('change', (e) => {
    chrome.storage.local.set({ userThemeMode: e.target.checked });
    
    sendMessageToContentScript({
      action: 'updateTheme',
      userOverride: themeOverride.checked,
      userThemeMode: e.target.checked
    });
  });
  
  // 宽屏设置
  document.getElementById('widescreen-enabled').addEventListener('change', (e) => {
    chrome.storage.local.set({ widescreen_enabled: e.target.checked });
    sendMessageToContentScript({ action: 'updateWidescreen' });
  });
  
  document.getElementById('widescreen-loose').addEventListener('change', (e) => {
    chrome.storage.local.set({ widescreen_loose: e.target.checked });
    sendMessageToContentScript({ action: 'updateWidescreen' });
  });
  
  document.getElementById('widescreen-ui-visible').addEventListener('change', (e) => {
    chrome.storage.local.set({ widescreen_ui_visible: e.target.checked });
    sendMessageToContentScript({ action: 'updateWidescreen' });
  });
  
  // 背景设置
  document.getElementById('background-enabled').addEventListener('change', (e) => {
    chrome.storage.local.set({ background_enabled: e.target.checked });
    sendMessageToContentScript({ action: 'updateBackground' });
  });
  
  document.getElementById('background-type').addEventListener('change', (e) => {
    const isCustom = e.target.value === 'custom';
    document.getElementById('custom-url-container').style.display = isCustom ? 'block' : 'none';
    
    chrome.storage.local.set({ background_type: e.target.value });
    sendMessageToContentScript({ action: 'updateBackground' });
  });
  
  document.getElementById('background-url').addEventListener('change', (e) => {
    chrome.storage.local.set({ background_url: e.target.value });
    sendMessageToContentScript({ action: 'updateBackground' });
  });
  
  document.getElementById('background-opacity').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    document.getElementById('background-opacity-value').textContent = `${Math.round(value * 100)}%`;
    chrome.storage.local.set({ background_opacity: value });
    sendMessageToContentScript({ action: 'updateBackground' });
  });
  
  document.getElementById('content-transparency').addEventListener('change', (e) => {
    document.getElementById('content-transparency-options').style.display = 
      e.target.checked ? 'block' : 'none';
    
    chrome.storage.local.set({ background_content_transparency: e.target.checked });
    sendMessageToContentScript({ action: 'updateBackground' });
  });
  
  document.getElementById('content-opacity').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    document.getElementById('content-opacity-value').textContent = `${Math.round(value * 100)}%`;
    chrome.storage.local.set({ background_content_opacity: value });
    sendMessageToContentScript({ action: 'updateBackground' });
  });
  
  document.getElementById('content-blur').addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    document.getElementById('content-blur-value').textContent = `${value}px`;
    chrome.storage.local.set({ background_content_blur: value });
    sendMessageToContentScript({ action: 'updateBackground' });
  });
  
  // 通知设置
  document.getElementById('notify-enabled').addEventListener('change', (e) => {
    chrome.storage.local.set({ 
      widescreen_notify_enabled: e.target.checked,
      background_notify_enabled: e.target.checked
    });
  });
}

function sendMessageToContentScript(message) {
  // 发送消息到当前活动标签页的内容脚本
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0] && tabs[0].url.includes('weibo.com')) {
      chrome.tabs.sendMessage(tabs[0].id, message);
    }
  });
}
