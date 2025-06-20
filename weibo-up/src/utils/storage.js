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

// 保存宽屏配置到GM存储
export function saveWidescreenConfig() {
  GM_setValue('widescreen_enabled', widescreenStore.enabled);
  GM_setValue('widescreen_loose', widescreenStore.loose);
  GM_setValue('widescreen_notify_enabled', widescreenStore.notify_enabled); // 与原脚本保持一致
  GM_setValue('widescreen_ui_visible', widescreenStore.ui_visible); // 与原脚本保持一致
  GM_setValue('widescreen_panel_expanded', widescreenStore.panel_expanded); // 与原脚本保持一致
  GM_setValue('widescreen_panel_position', widescreenStore.panel_position); // 与原脚本保持一致
}

// 主题相关存储
export let userOverride = GM_getValue('userOverride', false);

export function saveThemeConfig(isOverride) {
  userOverride = isOverride;
  GM_setValue('userOverride', isOverride);
}
