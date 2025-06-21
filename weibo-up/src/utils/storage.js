// 存储相关功能

// 宽屏设置存储
export const widescreenStore = {
  enabled: GM_getValue('widescreen_enabled', true),
  loose: GM_getValue('widescreen_loose', false),
  notify_enabled: GM_getValue('widescreen_notify_enabled', false), // 与原脚本保持一致
  ui_visible: GM_getValue('widescreen_ui_visible', true), // 与原脚本保持一致
  panel_expanded: GM_getValue('widescreen_panel_expanded', true), // 与原脚本保持一致
  panel_position: GM_getValue('widescreen_panel_position', null) // 与原脚本保持一致
};

// 背景设置存储
export const backgroundStore = {
  enabled: GM_getValue('background_enabled', false), // 是否启用背景
  type: GM_getValue('background_type', 'bing'), // 背景类型：'bing'或'custom'
  url: GM_getValue('background_url', ''), // 自定义背景URL
  opacity: GM_getValue('background_opacity', 0.2), // 背景透明度
  content_transparency: GM_getValue('background_content_transparency', true), // 是否启用内容半透明
  content_opacity: GM_getValue('background_content_opacity', 0.7), // 内容透明度，默认0.7
  content_blur: GM_getValue('background_content_blur', 5), // 内容模糊度，默认5px
  notify_enabled: GM_getValue('background_notify_enabled', true) // 是否启用背景相关通知
};

// 保存宽屏配置到GM存储
export function saveWidescreenConfig() {
  GM_setValue('widescreen_enabled', widescreenStore.enabled);
  GM_setValue('widescreen_loose', widescreenStore.loose);
  GM_setValue('widescreen_notify_enabled', widescreenStore.notify_enabled); // 与原脚本保持一致
  GM_setValue('widescreen_ui_visible', widescreenStore.ui_visible); // 与原脚本保持一致
  GM_setValue('widescreen_panel_expanded', widescreenStore.panel_expanded); // 与原脚本保持一致
  GM_setValue('widescreen_panel_position', widescreenStore.panel_position); // 与原脚本保持一致
}

// 保存背景配置
export function saveBackgroundConfig() {
  GM_setValue('background_enabled', backgroundStore.enabled);
  GM_setValue('background_type', backgroundStore.type);
  GM_setValue('background_url', backgroundStore.url);
  GM_setValue('background_opacity', backgroundStore.opacity);
  GM_setValue('background_content_transparency', backgroundStore.content_transparency);
  GM_setValue('background_content_opacity', backgroundStore.content_opacity);
  GM_setValue('background_content_blur', backgroundStore.content_blur);
  GM_setValue('background_notify_enabled', backgroundStore.notify_enabled);
}

// 主题相关存储
export let userOverride = GM_getValue('userOverride', false);

export function saveThemeConfig(isOverride, currentMode = null) {
  userOverride = isOverride;
  GM_setValue('userOverride', isOverride);
  
  // 如果提供了当前模式，保存它
  if (currentMode !== null) {
    GM_setValue('userThemeMode', currentMode);
  }
}
