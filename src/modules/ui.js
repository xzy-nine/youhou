// UI控制模块 - 简化版（主要控制面板已移至popup页面）
// getCurrentWebsiteMode, setWebsiteMode 从theme.js全局获取
// simpleNotify 从notification.js全局获取

// 更新控制面板UI状态（用于页面内的小控制面板，如果有的话）
function updateControlPanelUI() {
  const panel = document.querySelector('.weibo-enhance-panel');
  if (!panel) return;
  
  // 更新主题切换按钮状态
  const themeToggle = panel.querySelector('#theme-toggle');
  if (themeToggle) {
    const currentMode = getCurrentWebsiteMode();
    const indicator = themeToggle.querySelector('.status-indicator');
    if (indicator) {
      indicator.className = `status-indicator ${currentMode ? 'on' : 'off'}`;
    }
    
    // 更新按钮文本
    const buttonText = currentMode ? '深色模式' : '浅色模式';
    const textNode = Array.from(themeToggle.childNodes).find(node => 
      node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
    );
    if (textNode) {
      textNode.textContent = buttonText;
    }
  }
  
  console.log('[微博增强] 控制面板UI状态已更新');
}

// 刷新UI以应用新主题
function refreshUIWithTheme(isDark) {
  // 确保当前页面的UI元素应用正确的主题
  document.body.classList.remove('woo-theme-dark', 'woo-theme-light');
  document.body.classList.add(isDark ? 'woo-theme-dark' : 'woo-theme-light');
  
  // 更新控制面板的主题（如果存在页面内控制面板）
  const panel = document.querySelector('.weibo-enhance-panel');
  if (panel) {
    panel.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }
  
  // 更新所有iframe内的主题
  document.querySelectorAll('iframe').forEach(iframe => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc && iframeDoc.body) {
        iframeDoc.body.classList.remove('woo-theme-dark', 'woo-theme-light');
        iframeDoc.body.classList.add(isDark ? 'woo-theme-dark' : 'woo-theme-light');
      }
    } catch (e) {
      // 跨域iframe无法访问，忽略错误
    }
  });
  
  // 更新评论模态框主题
  const commentModals = document.querySelectorAll('.comment-modal');
  commentModals.forEach(modal => {
    modal.setAttribute('data-theme', isDark ? 'dark' : 'light');
  });
  
  // 更新页面内控制面板UI状态
  updateControlPanelUI();
  
  // 主题变更事件，触发其他模块更新
  const event = new CustomEvent('themeRefresh', { detail: { isDark } });
  document.dispatchEvent(event);
  
  console.log(`[微博增强] UI主题已更新: ${isDark ? '深色' : '浅色'}模式`);
}

// 监听主题变化事件并更新UI
document.addEventListener('themechange', (event) => {
  if (event.detail && typeof event.detail.theme !== 'undefined') {
    const isDark = event.detail.theme === 'dark';
    refreshUIWithTheme(isDark);
  }
});

// 监听自定义主题变化事件
document.addEventListener('weiboThemeChanged', (event) => {
  if (event.detail && typeof event.detail.isDark !== 'undefined') {
    refreshUIWithTheme(event.detail.isDark);
  }
});

// Chrome扩展环境下的菜单注册（空实现）
function registerMenus() {
  console.log('[微博增强] Chrome扩展环境，控制面板功能已整合到popup页面中');
}