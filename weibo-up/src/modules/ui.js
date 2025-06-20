// UI控制模块
import { widescreenStore, saveWidescreenConfig, saveThemeConfig } from '../utils/storage';
import { getCurrentWebsiteMode, setWebsiteMode } from './theme';

// 创建统一控制面板
export function createControlPanel() {
  // 添加样式只需要添加一次
  if (!document.querySelector('#weibo-enhance-panel-style')) {
    const panelStyle = document.createElement('style');
    panelStyle.id = 'weibo-enhance-panel-style';
    panelStyle.textContent = `
      .weibo-enhance-panel {
        position: fixed;
        right: 20px;
        top: 70px;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        border: 1px solid #e1e8ed;
        z-index: 9999;
        width: 240px;
        padding: 16px;
        font-size: 14px;
        color: #333;
        transition: opacity 0.3s ease, transform 0.3s ease, background 0.3s ease;
        cursor: move;
        user-select: none;
      }
      
      body.woo-theme-dark .weibo-enhance-panel {
        background: rgba(21, 32, 43, 0.95);
        border-color: #38444d;
        color: #fff;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      }
      
      .weibo-enhance-panel h3 {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: bold;
        text-align: center;
      }
      
      .weibo-enhance-panel .control-group {
        margin-bottom: 15px;
        border-bottom: 1px solid #e1e8ed;
        padding-bottom: 12px;
      }
      
      body.woo-theme-dark .weibo-enhance-panel .control-group {
        border-color: #38444d;
      }
      
      .weibo-enhance-panel .control-group:last-child {
        margin-bottom: 0;
        border-bottom: none;
        padding-bottom: 0;
      }
      
      .weibo-enhance-panel .control-title {
        font-weight: bold;
        margin-bottom: 8px;
      }
      
      .weibo-enhance-panel button {
        padding: 6px 12px;
        background: #f5f8fa;
        border: 1px solid #e1e8ed;
        border-radius: 4px;
        cursor: pointer;
        margin: 4px 0;
        width: 100%;
        text-align: center;
        transition: background 0.2s;
      }
      
      body.woo-theme-dark .weibo-enhance-panel button {
        background: #192734;
        border-color: #38444d;
        color: #fff;
      }
      
      .weibo-enhance-panel button:hover {
        background: #e8f4fc;
      }
      
      body.woo-theme-dark .weibo-enhance-panel button:hover {
        background: #273340;
      }
      
      .weibo-enhance-panel button.active {
        background: #1da1f2;
        color: white;
        border-color: #1991db;
      }
      
      body.woo-theme-dark .weibo-enhance-panel button.active {
        background: #1da1f2;
        border-color: #1991db;
      }
      
      .weibo-enhance-panel .checkbox-control {
        display: flex;
        align-items: center;
        margin: 8px 0;
      }
      
      .weibo-enhance-panel .checkbox-control label {
        margin-left: 6px;
        cursor: pointer;
        flex: 1;
      }
      
      .weibo-enhance-panel .status-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 6px;
        vertical-align: middle;
      }
      
      .weibo-enhance-panel .status-indicator.on {
        background: #1da1f2;
        box-shadow: 0 0 4px #1da1f2;
      }
      
      .weibo-enhance-panel .status-indicator.off {
        background: #657786;
      }
      
      /* 面板折叠样式 */
      .weibo-enhance-panel.collapsed {
        width: auto;
        padding: 10px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(2px);
        border: none;
      }
      
      body.woo-theme-dark .weibo-enhance-panel.collapsed {
        background: rgba(21, 32, 43, 0.8);
      }
      
      .weibo-enhance-panel.collapsed .panel-content {
        display: none;
      }
      
      .weibo-enhance-panel .panel-gear-icon {
        font-size: 18px;
        text-align: center;
        cursor: pointer;
        width: 24px;
        height: 24px;
        line-height: 24px;
      }
      
      .weibo-enhance-panel:not(.collapsed) .panel-gear-icon {
        display: none;
      }
      
      /* 展开方向控制 */
      .weibo-enhance-panel.expand-left {
        transform-origin: right center;
      }
      
      .weibo-enhance-panel.expand-right {
        transform-origin: left center;
      }
      
      /* 拖动结束标识 */
      .weibo-enhance-panel.dragged::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(29, 161, 242, 0.1);
        border-radius: inherit;
        pointer-events: none;
        animation: pulse 0.5s ease-out;
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(panelStyle);
  }
  
  // 如果面板已存在，根据visible状态显示或隐藏
  const existingPanel = document.querySelector('.weibo-enhance-panel');
  if (existingPanel) {
    existingPanel.style.display = widescreenStore.ui_visible ? 'block' : 'none';
    return;
  }
  
  // 如果设置为不可见且没有现有面板，则不创建
  if (!widescreenStore.ui_visible) return;
  
  const panel = document.createElement('div');
  panel.className = 'weibo-enhance-panel' + (widescreenStore.panel_expanded ? '' : ' collapsed');
  
  // 设置面板位置（如果有保存的位置）
  if (widescreenStore.panel_position) {
    panel.style.top = widescreenStore.panel_position.top;
    panel.style.right = widescreenStore.panel_position.right;
    panel.style.left = 'auto';
  }
  
  // 齿轮图标 (⚙️)
  const gearIcon = '<div class="panel-gear-icon">⚙️</div>';
  
  // 创建面板内容
  let panelContent = `
      <div class="panel-content">
          <h3>微博增强</h3>
          
          <div class="control-group">
              <div class="control-title">宽屏功能</div>
              <button id="widescreen-toggle" class="${widescreenStore.enabled ? 'active' : ''}">
                  <span class="status-indicator ${widescreenStore.enabled ? 'on' : 'off'}"></span>
                  ${widescreenStore.enabled ? '已开启' : '已关闭'}
              </button>
              ${widescreenStore.enabled ? `
                  <div class="checkbox-control">
                      <input type="checkbox" id="loose-mode" ${widescreenStore.loose ? 'checked' : ''}>
                      <label for="loose-mode">更宽模式</label>
                  </div>
              ` : ''}
          </div>
          
          <div class="control-group">
              <div class="control-title">主题切换</div>
              <button id="theme-toggle">
                  <span class="status-indicator ${getCurrentWebsiteMode() ? 'on' : 'off'}"></span>
                  切换主题
              </button>
              <button id="theme-reset">重置跟随</button>
          </div>
          
          <div class="control-group">
              <div class="control-title">其他功能</div>
              <div class="checkbox-control">
                  <input type="checkbox" id="notification-toggle" ${widescreenStore.notify_enabled ? 'checked' : ''}>
                  <label for="notification-toggle">启用通知</label>
              </div>
          </div>
          
          <div class="control-group">
              <div class="control-title">面板控制</div>
              <button class="panel-toggle-btn">收起面板</button>
              <button class="panel-close-btn">关闭面板</button>
          </div>
      </div>
  `;
  
  panel.innerHTML = gearIcon + panelContent;
  
  // 绑定事件
  bindControlEvents(panel);
  
  // 添加面板拖动功能
  makeElementDraggable(panel);
  
  // 添加自动关闭功能
  setupAutoDismiss(panel);
  
  document.body.appendChild(panel);
}

// 拖动功能实现
function makeElementDraggable(element) {
  let offsetX = 0, offsetY = 0;
  let isDragging = false;
  
  // 记录拖动的距离，用于判断是否是真正的拖动
  let hasMoved = false;
  let startX = 0, startY = 0;
  
  // 鼠标按下开始拖动
  element.addEventListener('mousedown', function(e) {
    // 如果点击的是按钮或输入框，不触发拖动
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') {
      return;
    }
    
    // 记录初始位置和偏移
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    hasMoved = false;
    
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    
    // 添加临时样式增强拖动体验
    element.style.transition = 'none';
    element.style.cursor = 'grabbing';
  });
  
  // 鼠标移动更新位置
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    
    // 计算移动距离，判断是否真的在拖动
    const moveX = Math.abs(e.clientX - startX);
    const moveY = Math.abs(e.clientY - startY);
    if (moveX > 3 || moveY > 3) {
      hasMoved = true;
    }
    
    // 计算新位置
    const left = e.clientX - offsetX;
    const top = e.clientY - offsetY;
    
    // 防止面板拖出窗口
    const maxLeft = window.innerWidth - element.offsetWidth;
    const maxTop = window.innerHeight - element.offsetHeight;
    
    const newLeft = Math.min(Math.max(0, left), maxLeft);
    const newTop = Math.min(Math.max(0, top), maxTop);
    
    // 设置面板的新位置
    element.style.left = newLeft + 'px';
    element.style.top = newTop + 'px';
    element.style.right = 'auto';
    element.style.transform = 'none';
    
    // 防止事件冒泡
    e.preventDefault();
  });
  
  // 鼠标释放结束拖动
  document.addEventListener('mouseup', function(e) {
    if (!isDragging) return;
    
    isDragging = false;
    element.style.cursor = 'move';
    element.style.transition = 'opacity 0.3s ease, transform 0.3s ease, background 0.3s ease';
    
    // 计算移动距离
    const moveX = Math.abs(e.clientX - startX);
    const moveY = Math.abs(e.clientY - startY);
    hasMoved = (moveX > 5 || moveY > 5); // 移动超过5像素才算真正的拖动
    
    // 保存当前位置
    const rect = element.getBoundingClientRect();
    widescreenStore.panel_position = {
      top: rect.top + 'px',
      right: (window.innerWidth - rect.right) + 'px'
    };
    saveWidescreenConfig();
    
    // 只有真正拖动过才添加拖动结束标记，时间改为100毫秒
    if (hasMoved) {
      element.classList.add('dragged');
      setTimeout(() => {
        element.classList.remove('dragged');
      }, 500);
    }
  });
  
  // 拖动超出窗口时，也要结束拖动
  element.addEventListener('mouseleave', function() {
    if (isDragging) {
      isDragging = false;
      element.style.cursor = 'move';
      element.style.transition = 'opacity 0.3s ease, transform 0.3s ease, background 0.3s ease';
    }
  });
}

// 设置自动关闭功能
function setupAutoDismiss(panel) {
  // 自动隐藏计时器
  let autoDismissTimer;
  
  // 鼠标进入面板时清除定时器
  panel.addEventListener('mouseenter', () => {
    clearTimeout(autoDismissTimer);
  });
  
  // 鼠标离开面板时启动定时器
  panel.addEventListener('mouseleave', () => {
    // 如果面板处于折叠状态，不自动关闭
    if (panel.classList.contains('collapsed')) {
      return;
    }
    
    // 5秒后自动收起面板
    autoDismissTimer = setTimeout(() => {
      togglePanelCollapse(panel, true);
    }, 5000);
  });
}

// 绑定控制面板事件
function bindControlEvents(panel) {
  // 宽屏开关
  const widescreenToggle = panel.querySelector('#widescreen-toggle');
  if (widescreenToggle) {
    widescreenToggle.addEventListener('click', () => {
      widescreenStore.enabled = !widescreenStore.enabled;
      saveWidescreenConfig();
      
      // 更新按钮样式
      widescreenToggle.className = widescreenStore.enabled ? 'active' : '';
      widescreenToggle.innerHTML = `
        <span class="status-indicator ${widescreenStore.enabled ? 'on' : 'off'}"></span>
        ${widescreenStore.enabled ? '已开启' : '已关闭'}
      `;
      
      // 立即刷新页面以应用变更
      location.reload();
    });
  }
  
  // 更宽模式
  const looseMode = panel.querySelector('#loose-mode');
  if (looseMode) {
    looseMode.addEventListener('change', (e) => {
      widescreenStore.loose = e.target.checked;
      saveWidescreenConfig();
      
      // 立即刷新页面以应用变更
      location.reload();
    });
  }
  
  // 主题切换
  const themeToggle = panel.querySelector('#theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentMode = getCurrentWebsiteMode();
      const newMode = !currentMode;
      
      // 设置为用户手动覆盖模式
      saveThemeConfig(true);
      
      // 切换主题
      setWebsiteMode(newMode);
      
      // 更新按钮状态
      themeToggle.innerHTML = `
        <span class="status-indicator ${newMode ? 'on' : 'off'}"></span>
        切换主题
      `;
    });
  }
  
  // 重置主题跟随
  const themeReset = panel.querySelector('#theme-reset');
  if (themeReset) {
    themeReset.addEventListener('click', () => {
      // 取消用户手动覆盖
      saveThemeConfig(false);
      
      // 获取系统当前模式
      const systemMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // 设置为系统模式
      setWebsiteMode(systemMode);
      
      // 更新按钮状态
      themeToggle.innerHTML = `
        <span class="status-indicator ${systemMode ? 'on' : 'off'}"></span>
        切换主题
      `;
      
      // 显示通知
      if (window.simpleNotify) {
        window.simpleNotify('已恢复跟随系统主题模式');
      }
    });
  }
  
  // 通知开关
  const notificationToggle = panel.querySelector('#notification-toggle');
  if (notificationToggle) {
    notificationToggle.addEventListener('change', (e) => {
      widescreenStore.notify_enabled = e.target.checked;
      saveWidescreenConfig();
      
      if (e.target.checked && window.simpleNotify) {
        window.simpleNotify('已启用通知');
      }
    });
  }
  
  // 齿轮图标点击事件 - 展开面板
  panel.addEventListener('click', (e) => {
    // 如果面板已折叠且点击的是面板(或齿轮图标)
    if (panel.classList.contains('collapsed')) {
      // 检查是否点击了齿轮图标或面板本身（非其他控件）
      const isGearIcon = e.target.classList.contains('panel-gear-icon');
      const isPanelSelf = e.target === panel;
      
      // 只有点击齿轮图标或面板本身时才展开，避免干扰控件操作
      if (isGearIcon || isPanelSelf) {
        togglePanelCollapse(panel, false);
      }
    }
  });
  
  // 收起按钮点击事件
  const toggleBtn = panel.querySelector('.panel-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault(); // 防止事件冒泡
      e.stopPropagation(); // 防止事件冒泡
      togglePanelCollapse(panel, true); // 折叠面板
    });
  }
  
  // 关闭按钮点击事件
  const closeBtn = panel.querySelector('.panel-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      // 隐藏面板
      panel.style.display = 'none';
      widescreenStore.ui_visible = false;
      saveWidescreenConfig();
      if (window.simpleNotify) {
        window.simpleNotify('控制面板已隐藏');
      }
    });
  }
}

// 折叠/展开面板函数
function togglePanelCollapse(panel, collapse) {
  console.log(`切换面板状态: ${collapse ? '收起' : '展开'}`);
  
  if (collapse) {
    panel.classList.add('collapsed');
    widescreenStore.panel_expanded = false;
    console.log('面板已收起');
  } else {
    // 判断面板位置，决定展开方向
    const rect = panel.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const panelWidth = panel.offsetWidth;
    const panelHeight = panel.offsetHeight;
    
    // 重置可能已有的方向类
    panel.classList.remove('expand-left', 'expand-right');
    
    // 如果面板靠近右边缘，设置向左展开
    if (rect.right > windowWidth - 100) {
      panel.classList.add('expand-left');
      console.log('面板向左展开');
    } 
    // 如果面板靠近左边缘，设置向右展开
    else if (rect.left < 100) {
      panel.classList.add('expand-right');
      console.log('面板向右展开');
    }
    
    panel.classList.remove('collapsed');
    widescreenStore.panel_expanded = true;
    console.log('面板已展开');
  }
  
  saveWidescreenConfig();
}

// 注册菜单命令
export function registerMenus() {
  GM_registerMenuCommand('显示/隐藏控制面板', function() {
    widescreenStore.ui_visible = !widescreenStore.ui_visible;
    saveWidescreenConfig();
    
    // 动态显示/隐藏控制面板，而不是重载页面
    const panel = document.querySelector('.weibo-enhance-panel');
    if (panel) {
      if (widescreenStore.ui_visible) {
        panel.style.display = 'block';
      } else {
        panel.style.display = 'none';
      }
    } else if (widescreenStore.ui_visible) {
      createControlPanel();
    }
    
    if (window.simpleNotify) {
      window.simpleNotify(widescreenStore.ui_visible ? '控制面板已显示' : '控制面板已隐藏');
    }
  });
  
  GM_registerMenuCommand('重置所有设置', function() {
    if (confirm('确定要重置所有设置吗？页面将会刷新。')) {
      // 重置宽屏设置
      widescreenStore.enabled = true;
      widescreenStore.loose = false;
      widescreenStore.notify_enabled = false;
      widescreenStore.ui_visible = true;
      widescreenStore.panel_expanded = true;
      widescreenStore.panel_position = null;
      saveWidescreenConfig();
      
      // 重置主题设置
      saveThemeConfig(false);
      
      if (window.simpleNotify) {
        window.simpleNotify('所有设置已重置');
      }
      
      // 延迟刷新页面
      setTimeout(() => location.reload(), 500);
    }
  });
}
