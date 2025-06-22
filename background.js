// Chrome 扩展背景脚本 - 复用原油猴模块

// 配置项键名列表 - 这些数据在清理时会保留
const CONFIG_KEYS = [
  'widescreen_enabled',
  'widescreen_loose', 
  'widescreen_notify_enabled',
  'background_enabled',
  'background_type',
  'background_url',
  'background_opacity',
  'background_content_transparency',
  'background_content_opacity',
  'background_content_blur',
  'background_notify_enabled',
  'userOverride',
  'userThemeMode'
];

// 清理缓存数据，保留配置
async function clearCacheData() {
  try {
    // 获取所有存储的数据
    const allData = await new Promise(resolve => {
      chrome.storage.local.get(null, resolve);
    });
    
    // 保存配置数据
    const configData = {};
    CONFIG_KEYS.forEach(key => {
      if (key in allData) {
        configData[key] = allData[key];
      }
    });
    
    // 清空所有数据
    await chrome.storage.local.clear();
    
    // 恢复配置数据
    if (Object.keys(configData).length > 0) {
      await chrome.storage.local.set(configData);
      console.log('[微博增强] 缓存已清理，配置已保留:', configData);
    } else {
      console.log('[微博增强] 缓存已清理，无配置需要保留');
    }
    
    return true;
  } catch (error) {
    console.error('[微博增强] 清理缓存失败:', error);
    return false;
  }
}

// 扩展启用时的处理
chrome.management.onEnabled.addListener(async (info) => {
  if (info.id === chrome.runtime.id) {
    console.log('[微博增强] 扩展已启用，正在清理缓存...');
    await clearCacheData();
    
    // 显示通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '微博增强',
      message: '扩展已启用，缓存已清理，配置已保留',
      priority: 1
    });
  }
});

// 扩展禁用时的处理（为下次启用做准备）
chrome.management.onDisabled.addListener(async (info) => {
  if (info.id === chrome.runtime.id) {
    console.log('[微博增强] 扩展已禁用');
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('微博增强扩展已安装');
    // 设置默认配置
  const defaultSettings = {
    // 宽屏设置
    widescreen_enabled: true,
    widescreen_loose: false,
    widescreen_notify_enabled: false,
    
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
  
  // 清理缓存 (开发调试用)
  if (message.action === 'clearCache') {
    clearCacheData().then(success => {
      sendResponse({ success: success });
    }).catch(error => {
      console.error('[微博增强] 手动清理缓存失败:', error);
      sendResponse({ success: false, error: error.message });
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
