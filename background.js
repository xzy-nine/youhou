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
    background_opacity: 1.0,
    background_content_transparency: true,
    background_content_opacity: 0.7,
    background_content_blur: 1,
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
  
  // 主题变更消息处理
  if (message.action === 'themeChanged') {
    console.log('[微博增强] 收到主题变更消息:', message);
    // 更新存储中的主题设置
    chrome.storage.local.set({
      userOverride: message.userOverride,
      userThemeMode: message.userThemeMode
    }, () => {
      console.log('[微博增强] 主题设置已同步到存储');
    });
    return true;
  }
  
  // 主题重置消息处理
  if (message.action === 'themeReset') {
    console.log('[微博增强] 收到主题重置消息:', message);
    // 重置存储中的主题设置
    chrome.storage.local.set({
      userOverride: false,
      userThemeMode: null
    }, () => {
      console.log('[微博增强] 主题设置已重置并同步到存储');
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
  
  // 获取必应图片
  if (message.action === 'fetchBingImage') {
    fetchBingImageInBackground().then(result => {
      sendResponse(result);
    }).catch(error => {
      console.error('[微博增强] 获取必应图片失败:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  // 主题变更消息处理
  if (message.action === 'themeChanged') {
    console.log('[微博增强] 收到主题变更消息:', message);
    // 更新存储中的主题设置
    chrome.storage.local.set({
      userOverride: message.userOverride,
      userThemeMode: message.userThemeMode
    }, () => {
      console.log('[微博增强] 主题设置已同步到存储');
    });
    return true;
  }
  
  // 主题重置消息处理
  if (message.action === 'themeReset') {
    console.log('[微博增强] 收到主题重置消息:', message);
    // 重置存储中的主题设置
    chrome.storage.local.set({
      userOverride: false,
      userThemeMode: null
    }, () => {
      console.log('[微博增强] 主题设置已重置并同步到存储');
    });
    return true;
  }
  
  // 处理主题变化消息
  if (message.action === 'themeChanged') {
    console.log(`[微博增强后台] 收到主题变化消息: ${message.isDark ? '深色' : '浅色'}`);
    
    // 更新扩展图标（如果需要的话）
    const iconPath = message.isDark ? 'icons/icon19.png' : 'icons/icon19.png'; // 可以设置不同的图标
    
    chrome.action.setIcon({
      path: {
        '16': 'icons/icon16.png',
        '19': iconPath,
        '32': 'icons/icon32.png',
        '48': 'icons/icon48.png'
      }
    }).catch(err => {
      // 忽略设置图标失败的错误
      console.log('[微博增强后台] 设置图标失败（正常）:', err);
    });
    
    sendResponse({ success: true });
    return false;
  }
});

// 必应图片获取功能
async function fetchBingImageInBackground() {
    const now = Date.now();
    const BING_CACHE_KEY = 'weiboUpBingCache';
    
    try {
        // 检查缓存是否有效 (6小时)
        const cached = await new Promise(resolve => {
            chrome.storage.local.get(BING_CACHE_KEY, result => {
                resolve(result[BING_CACHE_KEY]);
            });
        });
        
        if (cached && (now - cached.timestamp) < 21600000) {
            console.log('[微博背景] 使用缓存的必应图片:', cached.url.substring(0, 100) + '...');
            return { success: true, url: cached.url };
        }

        let imageUrl = '';
        let imageInfo = null;
        let apiUrls = [
            'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1',
            'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1',
            'https://bing.com/HPImageArchive.aspx?format=js&idx=0&n=1'
        ];
        
        let lastError = null;
        
        for (let i = 0; i < apiUrls.length; i++) {
            try {
                const apiUrl = apiUrls[i];
                console.log(`[微博背景] 后台脚本正在尝试第${i+1}个必应API: ${apiUrl}`);
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('[微博背景] 后台脚本必应API返回数据:', data);
                
                // 检查返回数据的格式
                if (!data || !data.images || !Array.isArray(data.images) || data.images.length === 0) {
                    throw new Error('API返回数据格式不正确');
                }
                
                // 获取第一张图片的URL
                imageInfo = data.images[0];
                if (!imageInfo.url) {
                    throw new Error('图片URL不存在');
                }
                
                // 拼接完整的图片URL
                const baseUrl = apiUrl.includes('cn.bing.com') ? 'https://cn.bing.com' : 'https://www.bing.com';
                imageUrl = baseUrl + imageInfo.url;
                
                console.log(`[微博背景] 后台脚本第${i+1}个API成功获取图片`);
                break; // 成功获取，跳出循环
                
            } catch (error) {
                console.error(`[微博背景] 后台脚本第${i+1}个API失败:`, error);
                lastError = error;
                if (i === apiUrls.length - 1) {
                    // 所有API都失败了
                    throw new Error('所有必应API都无法访问: ' + lastError.message);
                }
                // 继续尝试下一个API
            }
        }

        if (!imageUrl) {
            throw new Error('无法获取图片URL');
        }
            
        console.log('[微博背景] 后台脚本获取到必应今日图片:', {
            title: imageInfo?.title || '未知标题',
            copyright: imageInfo?.copyright || '未知版权',
            url: imageUrl
        });
        
        // 添加随机参数，避免缓存问题
        const finalUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + '_t=' + now;
        
        // 更新缓存
        await new Promise(resolve => {
            chrome.storage.local.set({
                [BING_CACHE_KEY]: {
                    url: finalUrl,
                    timestamp: now,
                    originalUrl: imageUrl
                }
            }, resolve);
        });
        
        console.log('[微博背景] 后台脚本成功获取必应图片：', finalUrl);
        return { success: true, url: finalUrl };
        
    } catch (error) {
        console.error('[微博背景] 后台脚本获取必应图片出错:', error);
        return { success: false, error: error.message };
    }
}
