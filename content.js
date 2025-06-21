// 微博增强Chrome扩展内容脚本 - 直接使用src模块
// 注意：所有依赖已在manifest.json中按顺序加载，无需导入


// 主初始化函数
async function initialize() {
  // 首先初始化存储
  await initStorage();

  // 设置主题系统（优先初始化主题）
  setupThemeSystem();
    
  // 优先应用背景（如果启用）
  // 这确保页面一开始就有背景，避免白屏
  applyBackground();
  console.log('[微博增强] 背景功能初始化完成');
  
  // 添加评论悬浮窗样式和功能
  setupCommentSystem();
  
  // 应用宽屏功能
  applyWidescreenStyles();
  
  // 创建控制面板
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(createControlPanel, 300);
    });
  } else {
    // 延迟创建控制面板，确保主题系统初始化完成
    setTimeout(createControlPanel, 500);
  }
    
  // 在页面加载完成后再次应用背景，确保在所有DOM元素加载后背景依然存在
  window.addEventListener('load', () => {
    // 重新应用背景
    setTimeout(() => {
      applyBackground();
    }, 1000);
    
    // 显示通知
    if (widescreenStore.notify_enabled) {
      simpleNotify('微博增强功能已激活');
    }
  });
  
  // 启动成功日志
  console.log('%c[微博增强] 功能已激活', 'color: #28a745; font-weight: bold;');
    
  // 将重新应用背景函数暴露到全局，方便用户手动调用
  window.weiboApplyBackground = applyBackground;
  console.log('%c[微博增强] 如果背景出现问题，请在控制台执行: weiboApplyBackground()', 'color: #17a2b8; font-style: italic;');
}

// 执行初始化
initialize().catch(err => {
  console.error('[微博增强] 初始化失败:', err);
});;

// 存储对象
const widescreenStore = {
  enabled: true,
  loose: false,
  notify_enabled: false,
  ui_visible: true,
  panel_expanded: true,
  panel_position: null
};

// 背景设置存储
const backgroundStore = {
  enabled: false,
  type: 'bing',
  url: '',
  opacity: 0.2,
  content_transparency: true,
  content_opacity: 0.7,
  content_blur: 5,
  notify_enabled: true
};

// 主题相关存储
let userOverride = false;
let userThemeMode = null;

// 获取背景图片URL
async function getBackgroundImageUrl() {
  if (backgroundStore.type === 'custom' && backgroundStore.url) {
    return backgroundStore.url;
  }
  
  // 使用必应每日一图
  try {
    const response = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1');
    const data = await response.json();
    
    if (data && data.images && data.images.length > 0) {
      return 'https://www.bing.com' + data.images[0].url;
    }
  } catch (error) {
    console.error('获取必应背景图失败:', error);
  }
  
  // 如果失败，返回默认图片
  return 'https://s2.loli.net/2022/01/14/dKLnDQCwrugxeF8.jpg';
}

// 应用背景图片
async function applyBackground() {
  if (!backgroundStore.enabled) return;
  
  // 获取背景图片URL
  const bgUrl = await getBackgroundImageUrl();
  
  // 移除旧的背景元素
  const oldBg = document.querySelector('.weibo-up-background');
  if (oldBg) {
    oldBg.parentNode.removeChild(oldBg);
  }
  
  // 创建新的背景元素
  const bgElement = document.createElement('div');
  bgElement.className = 'weibo-up-background';
  
  // 设置基本样式
  bgElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('${bgUrl}');
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    opacity: ${backgroundStore.opacity};
    z-index: -1;
    pointer-events: none;
  `;
  
  // 添加到DOM
  document.body.insertBefore(bgElement, document.body.firstChild);
  
  // 如果启用了内容透明效果
  if (backgroundStore.content_transparency) {
    // 添加内容透明和模糊的样式
    const contentStyle = addCustomStyle(`
      .huati_tab, .woo-panel-main, .woo-box-wrap, .Frame_wrap_2Mnfd, 
      .wbpro-side-main-wrap, .Main_full_1dfQX, .card-wrap, .woo-box-item-inlineBlock {
        background-color: rgba(var(--w-bg-c, 255, 255, 255), ${backgroundStore.content_opacity}) !important;
        backdrop-filter: blur(${backgroundStore.content_blur}px) !important;
      }
    `);
  }
  
  // 显示通知
  if (backgroundStore.notify_enabled) {
    simpleNotify('背景已应用');
  }
  
  return bgUrl;
}

// 宽屏模式样式
function applyWidescreenStyles() {
  if (!widescreenStore.enabled) return;
  
  // 移除旧的宽屏样式
  const oldStyle = document.getElementById('weibo-up-widescreen-style');
  if (oldStyle) {
    oldStyle.parentNode.removeChild(oldStyle);
  }
  
  // 宽屏模式的CSS
  let css = `
    /* 基本宽屏设置 */
    .WB_frame, .S_bg2, body .B_index {
      width: 80% !important;
      max-width: 1400px !important;
      min-width: 950px !important;
    }
  `;
  
  // 如果是大幅度宽屏
  if (widescreenStore.loose) {
    css += `
      /* 大幅度宽屏 */
      .WB_frame, .S_bg2, body .B_index {
        width: 95% !important;
        max-width: 1800px !important;
      }
    `;
  }
  
  // 添加宽屏样式
  const style = addCustomStyle(css);
  style.id = 'weibo-up-widescreen-style';
}

// 添加控制面板UI
function createControlPanel() {
  if (!widescreenStore.ui_visible) return;
  
  // 移除旧的控制面板
  const oldPanel = document.getElementById('weibo-up-control-panel');
  if (oldPanel) {
    oldPanel.parentNode.removeChild(oldPanel);
  }
  
  // 创建新的控制面板
  const panel = document.createElement('div');
  panel.id = 'weibo-up-control-panel';
  panel.className = widescreenStore.panel_expanded ? 'expanded' : '';
  
  // 设置面板样式
  panel.style.cssText = `
    position: fixed;
    right: 20px;
    top: 100px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    padding: 10px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    transition: all 0.3s ease;
    max-width: 300px;
  `;
  
  // 如果有保存的位置，应用它
  if (widescreenStore.panel_position) {
    panel.style.top = widescreenStore.panel_position.top + 'px';
    panel.style.right = widescreenStore.panel_position.right + 'px';
  }
  
  // 面板内容
  panel.innerHTML = `
    <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-weight: bold;">微博增强控制面板</span>
      <span class="toggle-btn" style="cursor: pointer; user-select: none;">▼</span>
    </div>
    <div class="panel-body" style="${widescreenStore.panel_expanded ? '' : 'display: none;'}">
      <div style="margin-bottom: 8px;">
        <label style="display: block; margin-bottom: 4px;">宽屏模式</label>
        <div style="display: flex; gap: 8px;">
          <button class="widescreen-btn ${widescreenStore.enabled ? 'active' : ''}" data-action="toggle">
            ${widescreenStore.enabled ? '已开启' : '已关闭'}
          </button>
          <button class="widescreen-loose-btn ${widescreenStore.loose ? 'active' : ''}" data-action="loose">
            ${widescreenStore.loose ? '大幅宽屏' : '适度宽屏'}
          </button>
        </div>
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; margin-bottom: 4px;">主题模式</label>
        <div style="display: flex; gap: 8px;">
          <button class="theme-btn ${userOverride ? 'active' : ''}" data-action="theme-override">
            ${userOverride ? '手动模式' : '自动模式'}
          </button>
          ${userOverride ? `
          <button class="theme-mode-btn" data-action="theme-mode">
            切换为${getCurrentWebsiteMode() ? '浅色' : '深色'}
          </button>` : ''}
        </div>
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; margin-bottom: 4px;">背景图片</label>
        <div style="display: flex; gap: 8px;">
          <button class="background-btn ${backgroundStore.enabled ? 'active' : ''}" data-action="background-toggle">
            ${backgroundStore.enabled ? '已开启' : '已关闭'}
          </button>
          ${backgroundStore.enabled ? `
          <button class="background-refresh-btn" data-action="background-refresh">
            刷新背景
          </button>` : ''}
        </div>
      </div>
    </div>
  `;
  
  // 添加样式
  addCustomStyle(`
    #weibo-up-control-panel button {
      padding: 4px 8px;
      border: 1px solid #ddd;
      background: #f5f5f5;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    #weibo-up-control-panel button.active {
      background: #50a14f;
      color: white;
      border-color: #50a14f;
    }
    #weibo-up-control-panel .panel-header {
      cursor: grab;
    }
    #weibo-up-control-panel .panel-header:active {
      cursor: grabbing;
    }
  `);
  
  // 添加到DOM
  document.body.appendChild(panel);
  
  // 添加拖动功能
  makeDraggable(panel);
  
  // 添加事件监听器
  setupPanelEvents(panel);
}

// 让元素可拖动
function makeDraggable(element) {
  const header = element.querySelector('.panel-header');
  
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  header.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // 获取鼠标位置
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // 计算新位置
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // 设置元素新位置
    const rect = element.getBoundingClientRect();
    element.style.top = (element.offsetTop - pos2) + "px";
    // 计算right值（从窗口右边缘到元素右边缘的距离）
    const newRight = window.innerWidth - (rect.left - pos1 + rect.width);
    element.style.right = newRight + "px";
    element.style.left = 'auto'; // 重置left
    
    // 保存新位置
    widescreenStore.panel_position = {
      top: element.offsetTop - pos2,
      right: newRight
    };
    
    // 保存配置
    chrome.storage.local.set({ widescreen_panel_position: widescreenStore.panel_position });
  }
  
  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// 设置面板事件
function setupPanelEvents(panel) {
  // 切换面板展开/折叠
  const toggleBtn = panel.querySelector('.toggle-btn');
  const panelBody = panel.querySelector('.panel-body');
  
  toggleBtn.addEventListener('click', () => {
    const isExpanded = panel.classList.toggle('expanded');
    panelBody.style.display = isExpanded ? 'block' : 'none';
    toggleBtn.textContent = isExpanded ? '▼' : '▲';
    
    widescreenStore.panel_expanded = isExpanded;
    chrome.storage.local.set({ widescreen_panel_expanded: isExpanded });
  });
  
  // 宽屏切换
  panel.querySelector('[data-action="toggle"]').addEventListener('click', () => {
    widescreenStore.enabled = !widescreenStore.enabled;
    chrome.storage.local.set({ widescreen_enabled: widescreenStore.enabled });
    applyWidescreenStyles();
    createControlPanel(); // 刷新控制面板
  });
  
  // 宽屏程度切换
  panel.querySelector('[data-action="loose"]').addEventListener('click', () => {
    widescreenStore.loose = !widescreenStore.loose;
    chrome.storage.local.set({ widescreen_loose: widescreenStore.loose });
    applyWidescreenStyles();
    createControlPanel(); // 刷新控制面板
  });
  
  // 主题模式切换
  const themeOverrideBtn = panel.querySelector('[data-action="theme-override"]');
  if (themeOverrideBtn) {
    themeOverrideBtn.addEventListener('click', () => {
      userOverride = !userOverride;
      chrome.storage.local.set({ userOverride: userOverride });
      
      // 获取当前状态作为手动设置的初始值
      if (userOverride) {
        userThemeMode = getCurrentWebsiteMode();
        chrome.storage.local.set({ userThemeMode: userThemeMode });
      }
      
      setupThemeSystem();
      createControlPanel(); // 刷新控制面板
    });
  }
  
  // 深色/浅色模式切换
  const themeModeBtn = panel.querySelector('[data-action="theme-mode"]');
  if (themeModeBtn) {
    themeModeBtn.addEventListener('click', () => {
      const currentMode = getCurrentWebsiteMode();
      setWebsiteMode(!currentMode, true);
      userThemeMode = !currentMode;
      chrome.storage.local.set({ userThemeMode: userThemeMode });
      createControlPanel(); // 刷新控制面板
    });
  }
  
  // 背景开关
  const bgToggleBtn = panel.querySelector('[data-action="background-toggle"]');
  if (bgToggleBtn) {
    bgToggleBtn.addEventListener('click', () => {
      backgroundStore.enabled = !backgroundStore.enabled;
      chrome.storage.local.set({ background_enabled: backgroundStore.enabled });
      
      if (backgroundStore.enabled) {
        applyBackground();
      } else {
        // 移除背景
        const bg = document.querySelector('.weibo-up-background');
        if (bg) bg.parentNode.removeChild(bg);
      }
      
      createControlPanel(); // 刷新控制面板
    });
  }
  
  // 刷新背景
  const bgRefreshBtn = panel.querySelector('[data-action="background-refresh"]');
  if (bgRefreshBtn) {
    bgRefreshBtn.addEventListener('click', () => {
      applyBackground();
    });
  }
}

// 获取当前网站模式（深色/浅色）
function getCurrentWebsiteMode() {
  // 检查HTML是否有深色模式标记
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  return isDarkMode;
}

// 设置网站模式（深色/浅色）
function setWebsiteMode(darkMode, isUserOperation = false) {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const targetTheme = darkMode ? 'dark' : 'light';
  
  // 如果主题已经是目标主题，不做操作
  if (currentTheme === targetTheme) return;
  
  // 设置HTML的data-theme属性
  document.documentElement.setAttribute('data-theme', targetTheme);
  
  // 如果是微博新版，还需要设置其他属性
  document.documentElement.style.setProperty('--w-themeName', targetTheme);
  
  // 如果是用户操作，保存设置
  if (isUserOperation) {
    userThemeMode = darkMode;
    userOverride = true;
    chrome.storage.local.set({ 
      userThemeMode: darkMode,
      userOverride: true 
    });
  }
  
  // 显示通知
  if (widescreenStore.notify_enabled) {
    simpleNotify(`已切换为${darkMode ? '深色' : '浅色'}模式`);
  }
}

// 设置主题系统
function setupThemeSystem() {
  // 检查系统颜色模式
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // 如果用户没有手动覆盖，则跟随系统偏好
  if (!userOverride) {
    console.log(`[微博主题] 跟随系统模式: ${prefersDarkMode ? '深色' : '浅色'}`);
    
    // 如果网站当前模式与系统偏好不符，切换模式
    const currentWebsiteMode = getCurrentWebsiteMode();
    if (currentWebsiteMode !== prefersDarkMode) {
      setWebsiteMode(prefersDarkMode, false);
    }
  } else {
    // 如果用户手动设置了主题，尊重用户设置
    console.log(`用户手动设置为${userThemeMode ? '深色' : '浅色'}模式，保持不变`);
    setWebsiteMode(userThemeMode, false);
  }
  
  // 添加系统颜色方案变化的监听器
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!userOverride) {
      setWebsiteMode(e.matches, false);
    }
  });
}

// 评论系统
function setupCommentSystem() {
  // 添加评论相关的CSS样式
  const commentCSS = `
    /* 评论弹出窗样式 */
    .wb-comments-popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 650px;
      max-width: 90vw;
      max-height: 80vh;
      background: var(--w-bg, white);
      border-radius: 8px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      padding: 20px;
      overflow-y: auto;
    }
    
    .wb-comments-popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--w-dividing-line, #f2f2f2);
    }
    
    .wb-comments-popup-title {
      font-size: 16px;
      font-weight: bold;
    }
    
    .wb-comments-popup-close {
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      opacity: 0.6;
    }
    
    .wb-comments-popup-close:hover {
      opacity: 1;
    }
    
    .wb-comments-popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    }
    
    /* 查看更多评论按钮样式 */
    .wb-view-more-comments {
      color: #ff8200;
      cursor: pointer;
      user-select: none;
      display: inline-block;
      margin: 5px 0;
      font-size: 14px;
    }
    
    .wb-view-more-comments:hover {
      text-decoration: underline;
    }
  `;
  
  addCustomStyle(commentCSS);
  
  // 处理添加查看更多评论按钮
  function addViewMoreCommentsButtons() {
    // 查找所有评论区域
    const commentAreas = document.querySelectorAll('.list_li, .vue-recycle-scroller__item-view, [class*="Detail7_wrap"]');
    
    commentAreas.forEach(area => {
      // 检查是否已经添加了按钮
      if (area.querySelector('.wb-view-more-comments')) {
        return;
      }
      
      // 查找评论计数元素
      const commentCountElement = area.querySelector('[class*="comment_"]');
      if (!commentCountElement) {
        return;
      }
      
      // 获取评论数量文本
      const commentText = commentCountElement.textContent.trim();
      const commentCount = parseInt(commentText) || 0;
      
      // 如果评论数量大于0，添加查看更多按钮
      if (commentCount > 0) {
        const viewMoreBtn = document.createElement('div');
        viewMoreBtn.className = 'wb-view-more-comments';
        viewMoreBtn.textContent = '查看全部评论';
        viewMoreBtn.dataset.postId = getPostIdFromElement(area);
        
        viewMoreBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          const postId = viewMoreBtn.dataset.postId;
          if (postId) {
            showCommentsPopup(postId);
          }
        });
        
        // 找到合适的位置插入按钮
        const actionBar = area.querySelector('.woo-box-flex, .wbpro-feed-item, [class*="Bottom7_wrap"]');
        if (actionBar) {
          actionBar.appendChild(viewMoreBtn);
        }
      }
    });
  }
  
  // 从元素获取微博ID
  function getPostIdFromElement(element) {
    // 尝试从数据属性获取
    const dataId = element.dataset.id || '';
    if (dataId) {
      return dataId;
    }
    
    // 尝试从链接获取
    const link = element.querySelector('a[href*="/detail/"]');
    if (link) {
      const href = link.getAttribute('href');
      const match = href.match(/\/detail\/([0-9]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }
  
  // 显示评论弹窗
  function showCommentsPopup(postId) {
    // 创建弹窗覆盖层
    const overlay = document.createElement('div');
    overlay.className = 'wb-comments-popup-overlay';
    document.body.appendChild(overlay);
    
    // 创建弹窗
    const popup = document.createElement('div');
    popup.className = 'wb-comments-popup';
    popup.innerHTML = `
      <div class="wb-comments-popup-header">
        <div class="wb-comments-popup-title">评论</div>
        <div class="wb-comments-popup-close">&times;</div>
      </div>
      <div class="wb-comments-popup-content">
        <div class="wb-comments-loading" style="text-align: center; padding: 20px;">加载评论中...</div>
      </div>
    `;
    
    document.body.appendChild(popup);
    
    // 关闭弹窗的事件
    popup.querySelector('.wb-comments-popup-close').addEventListener('click', () => {
      document.body.removeChild(overlay);
      document.body.removeChild(popup);
    });
    
    overlay.addEventListener('click', () => {
      document.body.removeChild(overlay);
      document.body.removeChild(popup);
    });
    
    // 加载评论
    loadComments(postId, popup);
  }
  
  // 加载评论的函数
  function loadComments(postId, popup) {
    const contentArea = popup.querySelector('.wb-comments-popup-content');
    
    // 实际项目中，这里会从微博API加载评论
    // 因为这是一个演示，我们只显示一条模拟评论
    contentArea.innerHTML = `
      <div style="padding: 10px; border-bottom: 1px solid var(--w-dividing-line, #f2f2f2);">
        <div style="display: flex; align-items: flex-start;">
          <div style="width: 40px; height: 40px; margin-right: 10px; background-color: #f2f2f2; border-radius: 50%;"></div>
          <div>
            <div style="font-weight: bold; margin-bottom: 5px;">微博用户</div>
            <div>这是一条示例评论。在实际项目中，这里会显示从微博API加载的真实评论。</div>
          </div>
        </div>
        <div style="margin-top: 5px; font-size: 12px; color: #999;">刚刚</div>
      </div>
      <div style="text-align: center; padding: 20px; color: #999;">
        这是演示版本，无法加载真实评论。<br>
        实际项目中会通过微博API加载评论数据。
      </div>
    `;
  }
  
  // 定期检查并添加查看更多评论按钮
  setInterval(addViewMoreCommentsButtons, 2000);
}

// 从扩展存储中初始化设置
async function initializeFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      // 宽屏设置
      widescreenStore.enabled = items.widescreen_enabled !== undefined ? items.widescreen_enabled : true;
      widescreenStore.loose = items.widescreen_loose || false;
      widescreenStore.notify_enabled = items.widescreen_notify_enabled || false;
      widescreenStore.ui_visible = items.widescreen_ui_visible !== undefined ? items.widescreen_ui_visible : true;
      widescreenStore.panel_expanded = items.widescreen_panel_expanded !== undefined ? items.widescreen_panel_expanded : true;
      widescreenStore.panel_position = items.widescreen_panel_position || null;
      
      // 背景设置
      backgroundStore.enabled = items.background_enabled || false;
      backgroundStore.type = items.background_type || 'bing';
      backgroundStore.url = items.background_url || '';
      backgroundStore.opacity = items.background_opacity !== undefined ? items.background_opacity : 0.2;
      backgroundStore.content_transparency = items.background_content_transparency !== undefined ? 
                                           items.background_content_transparency : true;
      backgroundStore.content_opacity = items.background_content_opacity !== undefined ? 
                                      items.background_content_opacity : 0.7;
      backgroundStore.content_blur = items.background_content_blur !== undefined ? 
                                   items.background_content_blur : 5;
      backgroundStore.notify_enabled = items.background_notify_enabled !== undefined ?
                                     items.background_notify_enabled : true;
      
      // 主题设置
      userOverride = items.userOverride || false;
      userThemeMode = items.userThemeMode !== undefined ? items.userThemeMode : null;
      
      resolve();
    });
  });
}

// 主初始化函数
async function initialize() {
  // 从存储中初始化设置
  await initializeFromStorage();
  
  // 设置主题系统（优先初始化主题）
  setupThemeSystem();
  
  // 应用背景（如果启用）
  if (backgroundStore.enabled) {
    applyBackground();
  }
  console.log('[微博增强] 背景功能初始化完成');
  
  // 添加评论悬浮窗样式和功能
  setupCommentSystem();
  
  // 应用宽屏功能
  applyWidescreenStyles();
  
  // 创建控制面板
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(createControlPanel, 300);
    });
  } else {
    // 延迟创建控制面板，确保主题系统初始化完成
    setTimeout(createControlPanel, 500);
  }
  
  // 在页面加载完成后再次应用背景，确保在所有DOM元素加载后背景依然存在
  window.addEventListener('load', () => {
    // 重新应用背景
    setTimeout(() => {
      if (backgroundStore.enabled) {
        applyBackground();
      }
    }, 1000);
    
    // 显示通知
    if (widescreenStore.notify_enabled) {
      simpleNotify('微博增强功能已激活');
    }
  });
  
  // 启动成功日志
  console.log('%c[微博增强] 功能已激活', 'color: #28a745; font-weight: bold;');
}

// 处理来自弹出窗口的设置更新消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch(message.action) {
    case 'updateTheme':
      userOverride = message.userOverride;
      if (message.userThemeMode !== undefined) {
        userThemeMode = message.userThemeMode;
      }
      setupThemeSystem();
      break;
      
    case 'updateWidescreen':
      // 重新从存储获取设置
      chrome.storage.local.get(['widescreen_enabled', 'widescreen_loose', 'widescreen_ui_visible'], (items) => {
        widescreenStore.enabled = items.widescreen_enabled !== undefined ? items.widescreen_enabled : true;
        widescreenStore.loose = items.widescreen_loose || false;
        widescreenStore.ui_visible = items.widescreen_ui_visible !== undefined ? items.widescreen_ui_visible : true;
        
        // 应用设置
        applyWidescreenStyles();
        createControlPanel();
      });
      break;
      
    case 'updateBackground':
      // 重新从存储获取设置
      chrome.storage.local.get(null, (items) => {
        backgroundStore.enabled = items.background_enabled || false;
        backgroundStore.type = items.background_type || 'bing';
        backgroundStore.url = items.background_url || '';
        backgroundStore.opacity = items.background_opacity !== undefined ? items.background_opacity : 0.2;
        backgroundStore.content_transparency = items.background_content_transparency !== undefined ? 
                                             items.background_content_transparency : true;
        backgroundStore.content_opacity = items.background_content_opacity !== undefined ? 
                                        items.background_content_opacity : 0.7;
        backgroundStore.content_blur = items.background_content_blur !== undefined ? 
                                     items.background_content_blur : 5;
        
        // 应用背景设置
        if (backgroundStore.enabled) {
          applyBackground();
        } else {
          // 移除背景
          const bg = document.querySelector('.weibo-up-background');
          if (bg) bg.parentNode.removeChild(bg);
        }
        
        createControlPanel();
      });
      break;
  }
  
  sendResponse({success: true});
});

// 初始化扩展
initialize();
