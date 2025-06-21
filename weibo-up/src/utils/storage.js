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

// 高斯模糊设置存储
export const blurStore = {
  enabled: GM_getValue('blur_enabled', false),
  intensity: GM_getValue('blur_intensity', 5), // 模糊强度，默认5px
  notify_enabled: GM_getValue('blur_notify_enabled', true),
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

// 保存高斯模糊配置
export function saveBlurConfig() {
  GM_setValue('blur_enabled', blurStore.enabled);
  GM_setValue('blur_intensity', blurStore.intensity);
  GM_setValue('blur_notify_enabled', blurStore.notify_enabled);
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
