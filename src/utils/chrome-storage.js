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
let userThemeMode = false;

// 初始化获取所有存储数据
async function initStorage() {
  try {
    // 从Chrome存储中获取所有数据
    const allSettings = await new Promise(resolve => {
      chrome.storage.local.get(null, (result) => {
        resolve(result || {});
      });
    });
    
    console.log('[微博增强] 存储初始化 - 原始设置:', allSettings);
      // 宽屏设置 - 使用存储值或默认值
    widescreenStore.enabled = allSettings.widescreen_enabled !== undefined ? allSettings.widescreen_enabled : true;
    widescreenStore.loose = allSettings.widescreen_loose !== undefined ? allSettings.widescreen_loose : false;
    widescreenStore.notify_enabled = allSettings.widescreen_notify_enabled !== undefined ? allSettings.widescreen_notify_enabled : false;    // 背景设置 - 使用存储值或默认值
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
    
    // 主题设置 - 使用存储值或默认值
    userOverride = allSettings.userOverride !== undefined ? allSettings.userOverride : false;
    userThemeMode = allSettings.userThemeMode !== undefined ? allSettings.userThemeMode : false;
    
    console.log('[微博增强] 存储初始化完成', { 
      widescreenStore, 
      backgroundStore, 
      userOverride, 
      userThemeMode,
      totalKeys: Object.keys(allSettings).length
    });
    
    // 如果某些关键配置不存在，保存默认值到存储（仅限缺失的项）
    const defaultsToSave = {};
    
    if (allSettings.widescreen_enabled === undefined) {
      defaultsToSave.widescreen_enabled = widescreenStore.enabled;
    }
    if (allSettings.background_enabled === undefined) {
      defaultsToSave.background_enabled = backgroundStore.enabled;
    }
    if (allSettings.userOverride === undefined) {
      defaultsToSave.userOverride = userOverride;
    }
    
    if (Object.keys(defaultsToSave).length > 0) {
      console.log('[微博增强] 保存缺失的默认配置:', defaultsToSave);
      await chrome.storage.local.set(defaultsToSave);
    }
    
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

// 保存主题配置 - 异步版本
async function saveThemeConfig(isOverride, currentMode = null) {
  try {
    userOverride = isOverride;
    
    const promises = [
      chromeStorage.setValue('userOverride', isOverride)
    ];
    
    // 如果提供了当前模式，保存它
    if (currentMode !== null) {
      userThemeMode = currentMode;
      promises.push(chromeStorage.setValue('userThemeMode', currentMode));
    }
    
    await Promise.all(promises);
    console.log('[微博增强] 主题配置保存成功:', { userOverride: isOverride, userThemeMode: currentMode });
  } catch (error) {
    console.error('[微博增强] 主题配置保存失败:', error);
    throw error;
  }
}

// 配置验证和恢复功能
async function validateAndRecoverConfig() {
  try {
    const allData = await new Promise(resolve => {
      chrome.storage.local.get(null, resolve);
    });
    
    const requiredConfigs = {
      widescreen_enabled: true,
      widescreen_loose: false,
      widescreen_notify_enabled: false,
      background_enabled: false,
      background_type: 'bing',
      background_url: '',
      background_opacity: 1.0,
      background_content_transparency: true,
      background_content_opacity: 0.7,
      background_content_blur: 1,
      background_notify_enabled: true,
      userOverride: false,
      userThemeMode: false
    };
    
    const missingConfigs = {};
    const corruptedConfigs = {};
    
    // 检查缺失和损坏的配置
    for (const [key, defaultValue] of Object.entries(requiredConfigs)) {
      if (!(key in allData)) {
        missingConfigs[key] = defaultValue;
      } else {
        // 验证配置类型
        const storedValue = allData[key];
        const expectedType = typeof defaultValue;
        
        // 特殊处理 userThemeMode：如果存储的是 null，需要转换为 false
        if (key === 'userThemeMode' && storedValue === null) {
          console.warn(`[微博增强] 配置项 ${key} 从 null 转换为 false`);
          corruptedConfigs[key] = defaultValue;
        } else if (typeof storedValue !== expectedType && storedValue !== null) {
          console.warn(`[微博增强] 配置项 ${key} 类型不匹配，期望 ${expectedType}，实际 ${typeof storedValue}`);
          corruptedConfigs[key] = defaultValue;
        }
      }
    }
    
    const needsUpdate = Object.keys(missingConfigs).length > 0 || Object.keys(corruptedConfigs).length > 0;
    
    if (needsUpdate) {
      const configsToSave = { ...missingConfigs, ...corruptedConfigs };
      await chrome.storage.local.set(configsToSave);
      
      console.log('[微博增强] 配置验证完成，已修复:', {
        missing: missingConfigs,
        corrupted: corruptedConfigs
      });
      
      return { fixed: true, changes: configsToSave };
    } else {
      console.log('[微博增强] 配置验证通过，无需修复');
      return { fixed: false, changes: {} };
    }
    
  } catch (error) {
    console.error('[微博增强] 配置验证失败:', error);
    return { fixed: false, error: error.message };
  }
}
