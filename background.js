// Chrome 扩展背景脚本 - 复用原油猴模块
chrome.runtime.onInstalled.addListener(() => {
  console.log('微博增强扩展已安装');
  
  // 设置默认配置
  const defaultSettings = {
    // 宽屏设置
    widescreen_enabled: true,
    widescreen_loose: false,
    widescreen_notify_enabled: false,
    widescreen_ui_visible: true,
    widescreen_panel_expanded: true,
    widescreen_panel_position: null,
    
    // 背景设置
    background_enabled: false,
    background_type: 'bing',
    background_url: '',
    background_opacity: 0.2,
    background_content_transparency: true,
    background_content_opacity: 0.7,
    background_content_blur: 5,
    background_notify_enabled: true,
    
    // 主题设置
    userOverride: false,
    userThemeMode: null
  };
  
  // 将默认设置保存到存储
  chrome.storage.local.set(defaultSettings);
  
  // 显示安装成功的通知
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '微博增强已安装',
    message: '微博增强扩展已成功安装，请访问微博网站体验增强功能。',
    priority: 2
  });
});

// 处理来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 获取设置
  if (message.action === 'getSettings') {
    chrome.storage.local.get(null, (result) => {
      sendResponse(result);
    });
    return true; // 表示将异步发送响应
  }
  
  // 更新设置
  if (message.action === 'updateSettings') {
    chrome.storage.local.set(message.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  // 显示通知
  if (message.action === 'showNotification') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: message.title || '微博增强',
      message: message.message,
      priority: message.priority || 0
    });
    sendResponse({ success: true });
    return true;
  }
});
