// Chrome原生存储API
const chromeStorage = {
  // 获取数据，返回Promise
  async getValue(key, defaultValue) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(key in result ? result[key] : defaultValue);
      });
    });
  },
  
  // 设置数据
  setValue(key, value) {
    return chrome.storage.local.set({ [key]: value });
  },
  
  // 删除数据
  deleteValue(key) {
    return chrome.storage.local.remove(key);
  },
  
  // 清理缓存数据，保留配置
  async clearCacheKeepConfig() {
    const configKeys = [
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
    
    try {
      // 获取所有数据
      const allData = await new Promise(resolve => {
        chrome.storage.local.get(null, resolve);
      });
      
      // 保存配置数据
      const configData = {};
      configKeys.forEach(key => {
        if (key in allData) {
          configData[key] = allData[key];
        }
      });
      
      // 清空所有数据
      await chrome.storage.local.clear();
      
      // 恢复配置数据
      if (Object.keys(configData).length > 0) {
        await chrome.storage.local.set(configData);
        console.log('[微博增强] 缓存已手动清理，配置已保留:', configData);
      }
      
      return true;
    } catch (error) {
      console.error('[微博增强] 手动清理缓存失败:', error);
      return false;
    }
  }
};

// 宽屏设置存储
const widescreenStore = {
  enabled: true,
  loose: false,
  notify_enabled: false
};

// 背景设置存储
const backgroundStore = {
  enabled: false,
  type: 'bing',
  url: '',
  opacity: 1.0,
  content_transparency: true,
  content_opacity: 0.7,
  content_blur: 1,
  notify_enabled: true
};

// 主题相关设置
let userOverride = false;
let userThemeMode = null;

// 初始化获取所有存储数据
async function initStorage() {
  try {
    // 从Chrome存储中获取所有数据
    const allSettings = await new Promise(resolve => {
      chrome.storage.local.get(null, (result) => {
        resolve(result || {});
      });
    });
      // 宽屏设置
    widescreenStore.enabled = allSettings.widescreen_enabled !== undefined ? allSettings.widescreen_enabled : true;
    widescreenStore.loose = allSettings.widescreen_loose || false;
    widescreenStore.notify_enabled = allSettings.widescreen_notify_enabled || false;    // 背景设置
    backgroundStore.enabled = allSettings.background_enabled !== undefined ? allSettings.background_enabled : false;
    backgroundStore.type = allSettings.background_type || 'bing';
    backgroundStore.url = allSettings.background_url || '';
    backgroundStore.opacity = allSettings.background_opacity !== undefined ? allSettings.background_opacity : 1.0;
    backgroundStore.content_transparency = allSettings.background_content_transparency !== undefined ? 
                                      allSettings.background_content_transparency : true;
    backgroundStore.content_opacity = allSettings.background_content_opacity !== undefined ? 
                                  allSettings.background_content_opacity : 0.7;    backgroundStore.content_blur = allSettings.background_content_blur !== undefined ? 
                              allSettings.background_content_blur : 1;
    backgroundStore.notify_enabled = allSettings.background_notify_enabled !== undefined ? 
                                allSettings.background_notify_enabled : true;
    
    console.log('[微博增强] 背景设置加载完成:', {
      enabled: backgroundStore.enabled,
      type: backgroundStore.type,
      opacity: backgroundStore.opacity,
      content_transparency: backgroundStore.content_transparency,
      content_opacity: backgroundStore.content_opacity,
      content_blur: backgroundStore.content_blur,
      hasCustomUrl: !!backgroundStore.url
    });
    
    // 主题设置
    userOverride = allSettings.userOverride || false;
    userThemeMode = allSettings.userThemeMode !== undefined ? allSettings.userThemeMode : null;
    
    console.log('[微博增强] 存储初始化完成', { widescreenStore, backgroundStore, userOverride, userThemeMode });
    return true;
  } catch (error) {
    console.error('[微博增强] 存储初始化失败:', error);
    return false;
  }
}

// 保存宽屏配置到存储
function saveWidescreenConfig() {
  chromeStorage.setValue('widescreen_enabled', widescreenStore.enabled);
  chromeStorage.setValue('widescreen_loose', widescreenStore.loose);
  chromeStorage.setValue('widescreen_notify_enabled', widescreenStore.notify_enabled);
}

// 保存背景配置
function saveBackgroundConfig() {
  chromeStorage.setValue('background_enabled', backgroundStore.enabled);
  chromeStorage.setValue('background_type', backgroundStore.type);
  chromeStorage.setValue('background_url', backgroundStore.url);
  chromeStorage.setValue('background_opacity', backgroundStore.opacity);
  chromeStorage.setValue('background_content_transparency', backgroundStore.content_transparency);
  chromeStorage.setValue('background_content_opacity', backgroundStore.content_opacity);
  chromeStorage.setValue('background_content_blur', backgroundStore.content_blur);
  chromeStorage.setValue('background_notify_enabled', backgroundStore.notify_enabled);
}

// 保存主题配置
function saveThemeConfig(isOverride, currentMode = null) {
  userOverride = isOverride;
  chromeStorage.setValue('userOverride', isOverride);
  
  // 如果提供了当前模式，保存它
  if (currentMode !== null) {
    userThemeMode = currentMode;
    chromeStorage.setValue('userThemeMode', currentMode);
  }
}
