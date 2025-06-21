// Chrome扩展替代版的storage.js，用于替换油猴特有的存储函数

// 存储API替换，提供与油猴脚本兼容的接口
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
  }
};

// 宽屏设置存储
export const widescreenStore = {
  enabled: true,
  loose: false,
  notify_enabled: false,
  ui_visible: true,
  panel_expanded: true,
  panel_position: null
};

// 背景设置存储
export const backgroundStore = {
  enabled: false,
  type: 'bing',
  url: '',
  opacity: 0.2,
  content_transparency: true,
  content_opacity: 0.7,
  content_blur: 5,
  notify_enabled: true
};

// 主题相关设置
export const themeSettings = {
  userOverride: false,
  userThemeMode: null
};

// 为油猴API提供兼容层 - 必须在上面的存储对象声明后
window.GM_getValue = function(key, defaultValue) {
  // 返回缓存数据，这不是异步的，所以不是真正的获取存储值
  // 但我们在初始化时会预先加载所有数据
  if (key.startsWith('widescreen_')) {
    const actualKey = key.replace('widescreen_', '');
    return widescreenStore[actualKey] !== undefined ? widescreenStore[actualKey] : defaultValue;
  } else if (key.startsWith('background_')) {
    const actualKey = key.replace('background_', '');
    return backgroundStore[actualKey] !== undefined ? backgroundStore[actualKey] : defaultValue;
  } else if (key === 'userOverride') {
    return themeSettings.userOverride;
  } else if (key === 'userThemeMode') {
    return themeSettings.userThemeMode;
  }
  return defaultValue;
};

window.GM_setValue = function(key, value) {
  if (key.startsWith('widescreen_')) {
    const actualKey = key.replace('widescreen_', '');
    widescreenStore[actualKey] = value;
  } else if (key.startsWith('background_')) {
    const actualKey = key.replace('background_', '');
    backgroundStore[actualKey] = value;
  } else if (key === 'userOverride') {
    themeSettings.userOverride = value;
  } else if (key === 'userThemeMode') {
    themeSettings.userThemeMode = value;
  }
  
  // 同步到Chrome存储
  chromeStorage.setValue(key, value);
};

window.GM_deleteValue = function(key) {
  chromeStorage.deleteValue(key);
};

// 添加其他GM函数
window.GM_addStyle = function(css) {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
  return style;
};

window.GM_registerMenuCommand = function(name, fn) {
  // 这个函数在Chrome扩展中由popup菜单替代，这里只是为了兼容性
  console.log(`[微博增强] 菜单命令已注册: ${name}`);
};

// 初始化获取所有存储数据
export async function initStorage() {
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
    widescreenStore.notify_enabled = allSettings.widescreen_notify_enabled || false;
    widescreenStore.ui_visible = allSettings.widescreen_ui_visible !== undefined ? allSettings.widescreen_ui_visible : true;
    widescreenStore.panel_expanded = allSettings.widescreen_panel_expanded !== undefined ? allSettings.widescreen_panel_expanded : true;
    widescreenStore.panel_position = allSettings.widescreen_panel_position || null;
    
    // 背景设置
    backgroundStore.enabled = allSettings.background_enabled || false;
    backgroundStore.type = allSettings.background_type || 'bing';
    backgroundStore.url = allSettings.background_url || '';
    backgroundStore.opacity = allSettings.background_opacity !== undefined ? allSettings.background_opacity : 0.2;
    backgroundStore.content_transparency = allSettings.background_content_transparency !== undefined ? 
                                      allSettings.background_content_transparency : true;
    backgroundStore.content_opacity = allSettings.background_content_opacity !== undefined ? 
                                  allSettings.background_content_opacity : 0.7;
    backgroundStore.content_blur = allSettings.background_content_blur !== undefined ? 
                              allSettings.background_content_blur : 5;
    backgroundStore.notify_enabled = allSettings.background_notify_enabled !== undefined ? 
                                allSettings.background_notify_enabled : true;
    
    // 主题设置
    themeSettings.userOverride = allSettings.userOverride || false;
    themeSettings.userThemeMode = allSettings.userThemeMode !== undefined ? allSettings.userThemeMode : null;
    
    console.log('[微博增强] 存储初始化完成', { widescreenStore, backgroundStore, themeSettings });
    return true;
  } catch (error) {
    console.error('[微博增强] 存储初始化失败:', error);
    return false;
  }
}

// 保存宽屏配置到存储
export function saveWidescreenConfig() {
  chromeStorage.setValue('widescreen_enabled', widescreenStore.enabled);
  chromeStorage.setValue('widescreen_loose', widescreenStore.loose);
  chromeStorage.setValue('widescreen_notify_enabled', widescreenStore.notify_enabled);
  chromeStorage.setValue('widescreen_ui_visible', widescreenStore.ui_visible);
  chromeStorage.setValue('widescreen_panel_expanded', widescreenStore.panel_expanded);
  chromeStorage.setValue('widescreen_panel_position', widescreenStore.panel_position);
}

// 保存背景配置
export function saveBackgroundConfig() {
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
export function saveThemeConfig(isOverride, currentMode = null) {
  themeSettings.userOverride = isOverride;
  chromeStorage.setValue('userOverride', isOverride);
  
  // 如果提供了当前模式，保存它
  if (currentMode !== null) {
    themeSettings.userThemeMode = currentMode;
    chromeStorage.setValue('userThemeMode', currentMode);
  }
}
