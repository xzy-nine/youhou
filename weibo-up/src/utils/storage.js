// 存储相关功能

// 宽屏设置存储
export const widescreenStore = {
  enabled: GM_getValue('widescreen_enabled', true),
  loose: GM_getValue('widescreen_loose', false),
  notify_enabled: GM_getValue('notify_enabled', false),
  ui_visible: GM_getValue('ui_visible', true),
  panel_expanded: GM_getValue('panel_expanded', true),
  panel_position: GM_getValue('panel_position', null)
};

// 保存宽屏配置到GM存储
export function saveWidescreenConfig() {
  GM_setValue('widescreen_enabled', widescreenStore.enabled);
  GM_setValue('widescreen_loose', widescreenStore.loose);
  GM_setValue('notify_enabled', widescreenStore.notify_enabled);
  GM_setValue('ui_visible', widescreenStore.ui_visible);
  GM_setValue('panel_expanded', widescreenStore.panel_expanded);
  GM_setValue('panel_position', widescreenStore.panel_position);
}

// 主题相关存储
export let userOverride = GM_getValue('userOverride', false);

export function saveThemeConfig(isOverride) {
  userOverride = isOverride;
  GM_setValue('userOverride', isOverride);
}
