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

// 扩展启用时的处理 - 包含配置验证
chrome.management.onEnabled.addListener(async (info) => {
  if (info.id === chrome.runtime.id) {
    console.log('[微博增强] 扩展已启用，开始配置验证和缓存清理...');
    
    try {
      // 获取当前存储的配置
      const existingSettings = await new Promise(resolve => {
        chrome.storage.local.get(null, resolve);
      });
      
      console.log('[微博增强] 现有配置:', existingSettings);
      
      // 验证关键配置项
      const requiredKeys = [
        'widescreen_enabled', 'background_enabled', 'userOverride',
        'background_type', 'background_opacity'
      ];
      
      const missingKeys = requiredKeys.filter(key => !(key in existingSettings));
      
      if (missingKeys.length > 0) {
        console.warn('[微博增强] 发现缺失配置项:', missingKeys);
        
        // 补充缺失的配置项
        const defaultValues = {
          widescreen_enabled: true,
          background_enabled: false,
          userOverride: false,
          background_type: 'bing',
          background_opacity: 1.0
        };
        
        const configsToAdd = {};
        missingKeys.forEach(key => {
          if (key in defaultValues) {
            configsToAdd[key] = defaultValues[key];
          }
        });
        
        if (Object.keys(configsToAdd).length > 0) {
          await chrome.storage.local.set(configsToAdd);
          console.log('[微博增强] 已补充缺失配置:', configsToAdd);
        }
      } else {
        console.log('[微博增强] 配置完整性验证通过');
      }
      
      // 清理缓存数据但保留用户配置
      await clearCacheData();
      
    } catch (error) {
      console.error('[微博增强] 启用时处理失败:', error);
    }
    
    // 显示通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '微博增强',
      message: '扩展已启用，配置已验证，缓存已清理',
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

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('微博增强扩展已安装，原因:', details.reason);
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
  
  // 只在首次安装或重新安装时设置默认配置，更新时保留用户配置
  if (details.reason === 'install') {
    await chrome.storage.local.set(defaultSettings);
    console.log('[微博增强] 首次安装，已设置默认配置');
  } else if (details.reason === 'update') {
    // 检查现有配置，只添加缺失的配置项
    const existingSettings = await new Promise(resolve => {
      chrome.storage.local.get(null, resolve);
    });
    
    const missingSettings = {};
    for (const [key, value] of Object.entries(defaultSettings)) {
      if (!(key in existingSettings)) {
        missingSettings[key] = value;
      }
    }
    
    if (Object.keys(missingSettings).length > 0) {
      await chrome.storage.local.set(missingSettings);
      console.log('[微博增强] 扩展更新，已添加缺失的配置项:', missingSettings);
    } else {
      console.log('[微博增强] 扩展更新，用户配置完整，无需添加默认配置');
    }
  } else {
    // 开发者模式重新加载等情况，检查并保留用户配置
    const existingSettings = await new Promise(resolve => {
      chrome.storage.local.get(null, resolve);
    });
    
    if (Object.keys(existingSettings).length === 0) {
      // 如果没有配置，设置默认配置
      await chrome.storage.local.set(defaultSettings);
      console.log('[微博增强] 重新加载，已设置默认配置');
    } else {
      console.log('[微博增强] 重新加载，保留现有用户配置:', existingSettings);
    }
  }
  
  // 显示安装成功的通知
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '微博增强已安装',
    message: '微博增强扩展已成功安装，请访问微博网站体验增强功能。',
    priority: 2
  });
});

// 扩展启动时的处理
chrome.runtime.onStartup.addListener(async () => {
  console.log('[微博增强] 扩展启动，开始验证配置完整性');
  
  try {
    // 获取现有配置
    const existingSettings = await new Promise(resolve => {
      chrome.storage.local.get(null, resolve);
    });
    
    // 验证关键配置项是否存在
    const requiredKeys = [
      'widescreen_enabled', 'background_enabled', 'userOverride'
    ];
    
    const missingKeys = requiredKeys.filter(key => !(key in existingSettings));
    
    if (missingKeys.length > 0) {
      console.warn('[微博增强] 启动时发现缺失配置项:', missingKeys);
      // 可以选择设置缺失的默认值或者提示用户
    } else {
      console.log('[微博增强] 启动时配置验证通过，用户配置:', existingSettings);
    }
  } catch (error) {
    console.error('[微博增强] 启动时配置验证失败:', error);
  }
});

// 处理来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[微博增强后台] 收到消息:', message);
  
  // 获取设置
  if (message.action === 'getSettings') {
    chrome.storage.local.get(null, (result) => {
      if (chrome.runtime.lastError) {
        console.error('[微博增强后台] 获取设置失败:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(result);
      }
    });
    return true; // 表示将异步发送响应
  }
  
  // 更新设置
  if (message.action === 'updateSettings') {
    chrome.storage.local.set(message.settings, () => {
      if (chrome.runtime.lastError) {
        console.error('[微博增强后台] 更新设置失败:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }
  
  // 主题变更消息处理
  if (message.action === 'themeChanged') {
    console.log('[微博增强后台] 收到主题变更消息:', message);
    
    // 更新存储中的主题设置
    const themeData = {
      userOverride: message.userOverride,
      userThemeMode: message.userThemeMode || message.isDark
    };
    
    chrome.storage.local.set(themeData, () => {
      if (chrome.runtime.lastError) {
        console.error('[微博增强后台] 主题设置保存失败:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('[微博增强后台] 主题设置已同步到存储');
        
        // 更新扩展图标（可选）
        const iconPath = (message.userThemeMode || message.isDark) ? 'icons/icon19.png' : 'icons/icon19.png';
        
        chrome.action.setIcon({
          path: {
            '16': 'icons/icon16.png',
            '19': iconPath,
            '32': 'icons/icon32.png',
            '48': 'icons/icon48.png'
          }
        }).catch(err => {
          console.log('[微博增强后台] 设置图标失败（正常）:', err);
        });
        
        sendResponse({ success: true });
      }
    });
    return true;
  }
  
  // 主题重置消息处理
  if (message.action === 'themeReset') {
    console.log('[微博增强后台] 收到主题重置消息:', message);
    
    chrome.storage.local.set({
      userOverride: false,
      userThemeMode: null
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('[微博增强后台] 主题重置失败:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('[微博增强后台] 主题设置已重置并同步到存储');
        sendResponse({ success: true });
      }
    });
    return true;
  }
  
  // 请求主题同步
  if (message.type === 'requestThemeSync') {
    chrome.storage.local.get(['userOverride', 'userThemeMode'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('[微博增强后台] 获取主题设置失败:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        const themeMode = result.userOverride ? result.userThemeMode : 
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        sendResponse({ 
          success: true, 
          themeMode: themeMode,
          userOverride: result.userOverride 
        });
      }
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
    }, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error('[微博增强后台] 创建通知失败:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, notificationId: notificationId });
      }
    });
    return true;
  }
  
  // 获取必应图片
  if (message.action === 'fetchBingImage') {
    fetchBingImageInBackground().then(result => {
      sendResponse(result);
    }).catch(error => {
      console.error('[微博增强后台] 获取必应图片失败:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  // 清除缓存
  if (message.action === 'clearCache') {
    clearCacheData().then(success => {
      sendResponse({ success: success });
    }).catch(error => {
      console.error('[微博增强后台] 清除缓存失败:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  // 如果没有匹配的消息类型，返回false表示不处理
  console.warn('[微博增强后台] 未识别的消息类型:', message);
  return false;
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
