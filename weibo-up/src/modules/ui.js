// UI控制模块
import { widescreenStore, blurStore, saveWidescreenConfig, saveThemeConfig, saveBlurConfig } from '../utils/storage';
import { getCurrentWebsiteMode, setWebsiteMode } from './theme';
import { controlPanelCSS } from '../styles/controlPanel';
import { simpleNotify } from '../utils/notification';
import { toggleGaussianBlur, setBlurIntensity } from './gaussianBlur';

// 创建统一控制面板
export function createControlPanel() {
  // 如果面板已存在，根据visible状态显示或隐藏
  const existingPanel = document.querySelector('.weibo-enhance-panel');
  if (existingPanel) {
    existingPanel.style.display = widescreenStore.ui_visible ? '' : 'none';
    return existingPanel;
  }
  
  // 添加样式只需要添加一次
  if (!document.querySelector('#weibo-enhance-panel-style')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'weibo-enhance-panel-style';
    styleElement.textContent = controlPanelCSS;
    document.head.appendChild(styleElement);
  }
  
  // 如果设置为不可见且没有现有面板，则不创建
  if (!widescreenStore.ui_visible) return null;
  
  const panel = document.createElement('div');
  panel.className = 'weibo-enhance-panel' + (widescreenStore.panel_expanded ? '' : ' collapsed');
  
  // 设置面板位置（如果有保存的位置）
  if (widescreenStore.panel_position) {
    panel.style.top = widescreenStore.panel_position.top;
    panel.style.right = widescreenStore.panel_position.right;
    panel.style.transform = 'none';
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
      
      <div class="control-group" id="blur-control-group">
        <div class="control-title">高斯模糊效果</div>
        <button id="blur-toggle" class="${blurStore.enabled ? 'active' : ''}">
          <span class="status-indicator ${blurStore.enabled ? 'on' : 'off'}"></span>
          ${blurStore.enabled ? '已开启' : '已关闭'}
        </button>
        ${blurStore.enabled ? `
          <div class="range-control">
            <label for="blur-intensity">模糊强度: ${blurStore.intensity}px</label>
            <input type="range" id="blur-intensity" min="1" max="15" value="${blurStore.intensity}">
          </div>
        ` : ''}
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
  return panel;
}

// 刷新UI以应用新主题
function refreshUIWithTheme(isDark) {
  // 确保当前页面的UI元素应用正确的主题
  document.body.classList.remove('woo-theme-dark', 'woo-theme-light');
  document.body.classList.add(isDark ? 'woo-theme-dark' : 'woo-theme-light');
  
  // 更新控制面板的主题
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
  
  // 主题变更事件，触发其他模块更新
  const event = new CustomEvent('themeRefresh', { detail: { isDark } });
  document.dispatchEvent(event);
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
      element.classList.add('dragging-ended');
      setTimeout(() => {
        element.classList.remove('dragging-ended');
      }, 100);
    }
  });
  
  // 拖动超出窗口时，也要结束拖动
  element.addEventListener('mouseleave', function() {
    if (isDragging) {
      isDragging = false;
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
      
      widescreenToggle.className = widescreenStore.enabled ? 'active' : '';
        // 更新按钮文本和指示器
      const indicator = widescreenToggle.querySelector('.status-indicator');
      if (indicator) {
        indicator.className = `status-indicator ${widescreenStore.enabled ? 'on' : 'off'}`;
      }
      
      // 保存指示器元素，清空按钮内容，重新添加指示器和文本
      const newText = document.createTextNode(widescreenStore.enabled ? '已开启' : '已关闭');
      
      // 清空按钮内容并重新添加元素
      widescreenToggle.innerHTML = '';
      if (indicator) {
        widescreenToggle.appendChild(indicator.cloneNode(true));
      }
      widescreenToggle.appendChild(newText);
        // 显示通知
      simpleNotify(widescreenStore.enabled ? '宽屏模式已启用，即将刷新页面' : '宽屏模式已关闭，即将刷新页面');
      
      // 延迟刷新页面，给用户时间看到通知
      setTimeout(() => {
        // 刷新页面应用宽屏样式
        window.location.reload();
      }, 500);
    });
  }
  
  // 高斯模糊开关
  const blurToggle = panel.querySelector('#blur-toggle');
  if (blurToggle) {
    blurToggle.addEventListener('click', () => {
      const enabled = toggleGaussianBlur();
      console.log('[微博增强] 高斯模糊状态切换为:', enabled ? '开启' : '关闭');
      
      blurToggle.className = enabled ? 'active' : '';
      // 更新按钮文本和指示器
      const indicator = blurToggle.querySelector('.status-indicator');
      if (indicator) {
        indicator.className = `status-indicator ${enabled ? 'on' : 'off'}`;
      }
      
      // 保存指示器元素，清空按钮内容，重新添加指示器和文本
      const newText = document.createTextNode(enabled ? '已开启' : '已关闭');
      
      // 清空按钮内容并重新添加元素
      blurToggle.innerHTML = '';
      if (indicator) {
        blurToggle.appendChild(indicator.cloneNode(true));
      }
      blurToggle.appendChild(newText);
      
      // 更新面板 - 显示或隐藏模糊强度控制
      const controlGroup = blurToggle.closest('.control-group');
      if (controlGroup) {
        // 移除现有的range控制（如果有）
        const existingRange = controlGroup.querySelector('.range-control');
        if (existingRange) {
          existingRange.remove();
        }
        
        // 如果启用了模糊，添加模糊强度控制
        if (enabled) {
          const rangeControl = document.createElement('div');
          rangeControl.className = 'range-control';
          rangeControl.innerHTML = `
            <label for="blur-intensity">模糊强度: ${blurStore.intensity}px</label>
            <input type="range" id="blur-intensity" min="1" max="15" value="${blurStore.intensity}">
          `;
          controlGroup.appendChild(rangeControl);
          
          // 为新创建的滑块添加事件
          const intensitySlider = rangeControl.querySelector('#blur-intensity');
          if (intensitySlider) {
            intensitySlider.addEventListener('input', (e) => {
              const newValue = parseInt(e.target.value, 10);
              setBlurIntensity(newValue);
              
              // 更新标签显示
              const label = rangeControl.querySelector('label');
              if (label) {
                label.textContent = `模糊强度: ${newValue}px`;
              }
            });
          }
        }
      }
      
      simpleNotify(enabled ? '高斯模糊效果已启用' : '高斯模糊效果已关闭');
    });
  }
  
  // 初始化模糊强度滑块（如果存在）
  const intensitySlider = panel.querySelector('#blur-intensity');
  if (intensitySlider) {
    intensitySlider.addEventListener('input', (e) => {
      const newValue = parseInt(e.target.value, 10);
      setBlurIntensity(newValue);
      
      // 更新标签显示
      const label = e.target.parentElement.querySelector('label');
      if (label) {
        label.textContent = `模糊强度: ${newValue}px`;
      }
    });
  }
  // 更宽模式
  const looseMode = panel.querySelector('#loose-mode');
  if (looseMode) {
    looseMode.addEventListener('change', (e) => {
      widescreenStore.loose = e.target.checked;
      saveWidescreenConfig();
      
      // 应用变更而不刷新页面
      document.documentElement.classList.toggle('inject-widescreen-loose-js', widescreenStore.loose);
      document.body.classList.toggle('inject-widescreen-loose-js', widescreenStore.loose);
      
      // 处理更宽模式的样式表
      let looseStyleElement = document.getElementById('weibo-widescreen-loose-style');
      if (widescreenStore.loose) {
        if (!looseStyleElement) {
          looseStyleElement = document.createElement('style');
          looseStyleElement.id = 'weibo-widescreen-loose-style';
          document.head.appendChild(looseStyleElement);
          
          // 从模块导入样式可能不直接可用，所以这里直接定义样式
          looseStyleElement.textContent = `
/* 用户自定义宽度设置 - 更宽模式 */
:root.inject-widescreen-loose-js {
  --inject-page-width: 95vw !important;
  --inject-page-width-legacy: 95vw !important;
}

body.inject-widescreen-loose-js {
  --inject-page-width: 95vw !important;
  --inject-page-width-legacy: 95vw !important;
}

/* 更宽模式下的特殊调整 */
.inject-widescreen-loose-js [class*=Frame_content],
.inject-widescreen-loose-js [class*=Frame_content2] {
  width: var(--inject-page-width) !important;
  max-width: var(--inject-page-width) !important;
}

.inject-widescreen-loose-js .WB_frame {
  width: var(--inject-page-width-legacy) !important;
}

/* 确保返回顶部按钮位置正确 */
.inject-widescreen-loose-js [class*=Index_backTop] {
  left: calc(50% + var(--inject-page-width)/2 + 10px);
}

.inject-widescreen-loose-js .W_gotop {
  left: calc(50% + var(--inject-page-width-legacy)/2 + 10px);
}`;
        }
      } else {
        if (looseStyleElement) {
          looseStyleElement.remove();
        }
      }
      
      // 更新iframe内容
      document.querySelectorAll('iframe').forEach(iframe => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          if (iframeDoc) {
            iframeDoc.documentElement.classList.toggle('inject-widescreen-loose-js', widescreenStore.loose);
            if (iframeDoc.body) {
              iframeDoc.body.classList.toggle('inject-widescreen-loose-js', widescreenStore.loose);
            }
            
            // 也更新iframe中的样式表
            let iframeLooseStyle = iframeDoc.getElementById('weibo-widescreen-loose-style');
            if (widescreenStore.loose) {
              if (!iframeLooseStyle) {
                iframeLooseStyle = iframeDoc.createElement('style');
                iframeLooseStyle.id = 'weibo-widescreen-loose-style';
                iframeDoc.head.appendChild(iframeLooseStyle);
              }
              // 复用主页面相同的样式
              iframeLooseStyle.textContent = looseStyleElement ? looseStyleElement.textContent : '';
            } else if (iframeLooseStyle) {
              iframeLooseStyle.remove();
            }
          }
        } catch (e) {
          // 跨域iframe无法访问，忽略错误
        }
      });
      
      // 触发自定义事件让其他模块知道宽屏模式变化了
      const event = new CustomEvent('widescreenChange', {
        detail: {
          enabled: true,
          loose: widescreenStore.loose
        }
      });
      document.dispatchEvent(event);
      
      simpleNotify(`已切换为${widescreenStore.loose ? '更宽' : '标准'}宽屏模式`);
    });
  }  // 主题切换
  const themeToggle = panel.querySelector('#theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      // 获取当前模式
      const currentMode = getCurrentWebsiteMode();
      const newMode = !currentMode;
      
      // 完全对应原始脚本的执行顺序
      saveThemeConfig(true, newMode);
      setWebsiteMode(newMode, true);
      simpleNotify(newMode ? '已切换到深色模式' : '已切换到浅色模式');
      
      // 更新状态指示器
      const indicator = themeToggle.querySelector('.status-indicator');
      if (indicator) {
        setTimeout(() => {
          const updatedMode = getCurrentWebsiteMode();
          indicator.className = `status-indicator ${updatedMode ? 'on' : 'off'}`;
        }, 300);
      }
    });
  }
  
  // 重置主题跟随
  const themeReset = panel.querySelector('#theme-reset');
  if (themeReset) {
    themeReset.addEventListener('click', () => {
      // 重置为跟随系统模式 - 完全对应原始脚本的执行顺序
      saveThemeConfig(false, null);
      const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setWebsiteMode(systemIsDark, true);
      simpleNotify('已恢复跟随系统主题');
      
      // 更新状态指示器
      const themeToggle = panel.querySelector('#theme-toggle');
      if (themeToggle) {
        setTimeout(() => {
          const newMode = getCurrentWebsiteMode();
          const indicator = themeToggle.querySelector('.status-indicator');
          if (indicator) {
            indicator.className = `status-indicator ${newMode ? 'on' : 'off'}`;
          }
        }, 300);
      }
    });
  }
  
  // 通知开关
  const notificationToggle = panel.querySelector('#notification-toggle');
  if (notificationToggle) {
    notificationToggle.addEventListener('change', (e) => {
      widescreenStore.notify_enabled = e.target.checked;
      saveWidescreenConfig();
      
      if (widescreenStore.notify_enabled) {
        simpleNotify('通知已启用');
      } else {
        console.log('[微博增强] 通知已禁用');
      }
    });
  }
  
  // 齿轮图标点击事件 - 展开面板
  panel.addEventListener('click', (e) => {
    // 如果面板已折叠且点击的是面板(或齿轮图标)
    if (panel.classList.contains('collapsed')) {
      togglePanelCollapse(panel, false);
    }
  });
  
  // 收起按钮点击事件
  const toggleBtn = panel.querySelector('.panel-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanelCollapse(panel, true);
      simpleNotify('面板已收起，点击齿轮图标可重新展开');
    });
  }
  
  // 关闭按钮点击事件
  const closeBtn = panel.querySelector('.panel-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      widescreenStore.ui_visible = false;
      saveWidescreenConfig();
      
      panel.style.display = 'none';
      simpleNotify('控制面板已关闭，可通过Tampermonkey菜单重新打开');
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
    } else {
      panel.classList.add('expand-right');
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
      panel.style.display = widescreenStore.ui_visible ? '' : 'none';
    } else if (widescreenStore.ui_visible) {
      createControlPanel();
    }
    
    simpleNotify(widescreenStore.ui_visible ? '控制面板已显示' : '控制面板已隐藏');
  });
    GM_registerMenuCommand('高斯模糊效果', function() {
    // 切换高斯模糊并重建控制面板
    toggleGaussianBlur();
    
    // 更新控制面板
    const panel = document.querySelector('.weibo-enhance-panel');
    if (panel) {
      panel.remove();
      createControlPanel();
    }
    
    simpleNotify(blurStore.enabled ? '高斯模糊效果已启用' : '高斯模糊效果已关闭');
  });
  
  GM_registerMenuCommand('重置所有设置', function() {
    if (confirm('确定要重置所有设置吗？页面将会刷新。')) {
      // 清除所有相关的GM存储
      GM_deleteValue('widescreen_enabled');
      GM_deleteValue('widescreen_loose');
      GM_deleteValue('widescreen_notify_enabled');
      GM_deleteValue('widescreen_ui_visible');
      GM_deleteValue('widescreen_panel_expanded');
      GM_deleteValue('widescreen_panel_position');
      GM_deleteValue('userOverride');
      GM_deleteValue('lastSystemMode');
      // 清除高斯模糊设置
      GM_deleteValue('blur_enabled');
      GM_deleteValue('blur_intensity');
      GM_deleteValue('blur_notify_enabled');
      
      // 刷新页面
      window.location.reload();
    }
  });
}