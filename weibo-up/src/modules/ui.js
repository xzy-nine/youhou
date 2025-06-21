// UI控制模块
import { widescreenStore, blurStore, saveWidescreenConfig, saveThemeConfig, saveBlurConfig } from '../utils/storage';
import { getCurrentWebsiteMode, setWebsiteMode } from './theme';
import { controlPanelCSS } from '../styles/controlPanel';
import { simpleNotify } from '../utils/notification';
import { toggleGaussianBlur, setBlurIntensity } from './gaussianBlur';
import { toggleBackgroundEnabled, setBackgroundType, uploadCustomBackground, setBackgroundOpacity, clearBingImageCache } from '../utils/background';

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
      </div>      <div class="control-group" id="blur-control-group">
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
          
          <div class="sub-control-group">
            <div class="sub-control-title">背景设置</div>
            <div class="checkbox-control">
              <input type="checkbox" id="background-toggle" ${blurStore.background_enabled ? 'checked' : ''}>
              <label for="background-toggle">启用背景图</label>
            </div>
            
            ${blurStore.background_enabled ? `
              <div class="radio-control">
                <input type="radio" id="bing-background" name="background-type" ${blurStore.background_type === 'bing' ? 'checked' : ''}>
                <label for="bing-background">必应每日图片</label>
                
                <input type="radio" id="custom-background" name="background-type" ${blurStore.background_type === 'custom' ? 'checked' : ''}>
                <label for="custom-background">自定义图片</label>
              </div>
              
              ${blurStore.background_type === 'custom' ? `
                <button id="upload-background" class="small-button">上传图片</button>
              ` : ''}
              
              <div class="range-control">
                <label for="background-opacity">背景不透明度: ${Math.round(blurStore.background_opacity * 100)}%</label>
                <input type="range" id="background-opacity" min="1" max="100" value="${Math.round(blurStore.background_opacity * 100)}">
              </div>
            ` : ''}
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
        // 更新面板 - 显示或隐藏模糊控制选项
      const controlGroup = blurToggle.closest('.control-group');
      if (controlGroup) {
        // 清空现有控制选项
        const existingControls = controlGroup.querySelectorAll('.range-control, .sub-control-group');
        existingControls.forEach(el => el.remove());
        
        // 如果启用了模糊，添加模糊强度控制和背景设置
        if (enabled) {
          // 添加模糊强度滑块
          const rangeControl = document.createElement('div');
          rangeControl.className = 'range-control';
          rangeControl.innerHTML = `
            <label for="blur-intensity">模糊强度: ${blurStore.intensity}px</label>
            <input type="range" id="blur-intensity" min="1" max="15" value="${blurStore.intensity}">
          `;
          controlGroup.appendChild(rangeControl);
          
          // 为模糊强度滑块添加事件
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
            // 添加背景设置控制组
          const subControlGroup = document.createElement('div');
          subControlGroup.className = 'sub-control-group';
          subControlGroup.innerHTML = `
            <div class="sub-control-title">背景设置</div>
            <div class="checkbox-control">
              <input type="checkbox" id="background-toggle" ${blurStore.background_enabled ? 'checked' : ''}>
              <label for="background-toggle">启用背景图</label>
            </div>
            
            ${blurStore.background_enabled ? `
              <div class="radio-control">
                <input type="radio" id="bing-background" name="background-type" ${blurStore.background_type === 'bing' ? 'checked' : ''}>
                <label for="bing-background">必应每日图片</label>
                
                <input type="radio" id="custom-background" name="background-type" ${blurStore.background_type === 'custom' ? 'checked' : ''}>
                <label for="custom-background">自定义图片</label>
              </div>
              
              ${blurStore.background_type === 'bing' ? `
                <button id="clear-bing-cache" class="small-button">清除图片缓存</button>
              ` : ''}
              
              ${blurStore.background_type === 'custom' ? `
                <button id="upload-background" class="small-button">上传图片</button>
              ` : ''}
              
              <div class="range-control">
                <label for="background-opacity">背景不透明度: ${Math.round(blurStore.background_opacity * 100)}%</label>
                <input type="range" id="background-opacity" min="1" max="100" value="${Math.round(blurStore.background_opacity * 100)}">
              </div>
            ` : ''}
          `;
          controlGroup.appendChild(subControlGroup);
          
          // 绑定背景设置相关控件的事件
          bindBackgroundControlEvents(subControlGroup);
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

// 绑定背景设置控件事件
function bindBackgroundControlEvents(container) {  // 背景开关
  const backgroundToggle = container.querySelector('#background-toggle');
  if (backgroundToggle) {
    backgroundToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      blurStore.background_enabled = enabled;
      saveBlurConfig();
      
      // 更新UI
      const controlGroup = backgroundToggle.closest('.control-group');
      
      // 重新应用高斯模糊以更新背景
      if (blurStore.enabled) {
        // 直接重新应用背景 - 调用 applyBackground 而不是重复调用 toggleGaussianBlur
        try {
          // 确保模糊效果被应用
          applyGaussianBlur();
          // 重新应用背景
          applyBackground();
        } catch (error) {
          console.error('[微博背景] 切换背景状态出错:', error);
        }
      }
      
      simpleNotify(enabled ? '背景图片已启用' : '背景图片已禁用');
    });
  }
    // 背景类型单选框
  const bingRadio = container.querySelector('#bing-background');
  const customRadio = container.querySelector('#custom-background');
  
  if (bingRadio) {
    bingRadio.addEventListener('change', (e) => {
      if (e.target.checked) {
        try {
          console.log('[微博增强] 切换到必应每日图片背景');
          
          // 显示加载状态
          const loadingMsg = document.createElement('span');
          loadingMsg.id = 'bing-loading-msg';
          loadingMsg.textContent = ' (加载中...)';
          loadingMsg.style.fontSize = '12px';
          loadingMsg.style.color = '#ff8200';
          
          // 添加到单选框标签后
          const label = bingRadio.nextElementSibling;
          if (label) {
            label.appendChild(loadingMsg);
          }
          
          // 禁用单选框，防止重复点击
          bingRadio.disabled = true;
          if (customRadio) customRadio.disabled = true;
            // 直接设置背景类型并应用
          setBackgroundType('bing');
          // 重新应用背景
          applyBackground();
          // 更新UI
          const subControlGroup = bingRadio.closest('.sub-control-group');
          
          // 移除可能存在的上传按钮
          const oldUploadButton = subControlGroup.querySelector('#upload-background');
          if (oldUploadButton) {
            oldUploadButton.remove();
          }
          
          // 添加清除必应缓存按钮（如果不存在）
          if (!subControlGroup.querySelector('#clear-bing-cache')) {
            const clearCacheButton = document.createElement('button');
            clearCacheButton.id = 'clear-bing-cache';
            clearCacheButton.className = 'small-button';
            clearCacheButton.textContent = '清除图片缓存';
            
            // 在radio控件后插入按钮
            const radioControl = bingRadio.closest('.radio-control');
            if (radioControl && radioControl.nextElementSibling) {
              subControlGroup.insertBefore(clearCacheButton, radioControl.nextElementSibling);
            } else {
              subControlGroup.appendChild(clearCacheButton);
            }
            
            // 绑定清除缓存事件
            clearCacheButton.addEventListener('click', () => {
              try {
                // 清除缓存并应用
                const success = clearBingImageCache();
                
                if (success) {
                  // 显示按钮状态变化
                  clearCacheButton.textContent = '缓存已清除';
                  clearCacheButton.disabled = true;
                  
                  // 1.5秒后恢复按钮状态
                  setTimeout(() => {
                    clearCacheButton.disabled = false;
                    clearCacheButton.textContent = '清除图片缓存';
                  }, 1500);
                } else {
                  simpleNotify('清除缓存失败，请重试');
                }
              } catch (error) {
                console.error('[微博背景] 清除缓存出错:', error);
                simpleNotify('清除缓存时发生错误');
              }
            });
          }
          
          // 延时恢复交互状态
          setTimeout(() => {
            // 移除加载提示
            const loadingEl = document.getElementById('bing-loading-msg');
            if (loadingEl) loadingEl.remove();
            
            // 恢复单选框状态
            bingRadio.disabled = false;
            if (customRadio) customRadio.disabled = false;
            
            simpleNotify('已切换到必应每日图片背景');
          }, 1500);
        } catch (error) {
          console.error('[微博增强] 切换背景类型出错:', error);
          simpleNotify('切换背景类型出错，请重试');
          
          // 恢复单选框状态
          bingRadio.disabled = false;
          if (customRadio) customRadio.disabled = false;
          
          // 移除可能的加载提示
          const loadingEl = document.getElementById('bing-loading-msg');
          if (loadingEl) loadingEl.remove();
        }
      }
    });
  }
  
  if (customRadio) {
    customRadio.addEventListener('change', (e) => {
      if (e.target.checked) {
        try {
          console.log('[微博增强] 切换到自定义图片背景');
          
          // 显示加载状态
          const loadingMsg = document.createElement('span');
          loadingMsg.id = 'custom-loading-msg';
          loadingMsg.textContent = ' (准备中...)';
          loadingMsg.style.fontSize = '12px';
          loadingMsg.style.color = '#ff8200';
          
          // 添加到单选框标签后
          const label = customRadio.nextElementSibling;
          if (label) {
            label.appendChild(loadingMsg);
          }
          
          // 禁用单选框，防止重复点击
          customRadio.disabled = true;
          if (bingRadio) bingRadio.disabled = true;
            // 直接设置背景类型
          setBackgroundType('custom');
          // 重新应用背景
          applyBackground();
          // 更新UI
          const subControlGroup = customRadio.closest('.sub-control-group');
          
          // 移除可能存在的清除缓存按钮
          const clearCacheButton = subControlGroup.querySelector('#clear-bing-cache');
          if (clearCacheButton) {
            clearCacheButton.remove();
          }
          
          // 添加上传按钮（如果不存在）
          if (!subControlGroup.querySelector('#upload-background')) {
            const uploadButton = document.createElement('button');
            uploadButton.id = 'upload-background';
            uploadButton.className = 'small-button';
            uploadButton.textContent = '上传图片';
            
            // 在radio控件后插入按钮
            const radioControl = customRadio.closest('.radio-control');
            if (radioControl && radioControl.nextElementSibling) {
              subControlGroup.insertBefore(uploadButton, radioControl.nextElementSibling);
            } else {
              subControlGroup.appendChild(uploadButton);
            }
            
            // 绑定上传事件
            uploadButton.addEventListener('click', async () => {
              // 禁用按钮
              uploadButton.disabled = true;
              uploadButton.textContent = '上传中...';
              
              try {
                const success = await uploadCustomBackground();
                if (success) {
                  uploadButton.textContent = '上传成功';
                  setTimeout(() => {
                    uploadButton.disabled = false;
                    uploadButton.textContent = '上传图片';
                  }, 2000);
                } else {
                  uploadButton.textContent = '上传取消';
                  setTimeout(() => {
                    uploadButton.disabled = false;
                    uploadButton.textContent = '上传图片';
                  }, 1000);
                }
              } catch (error) {
                console.error('[微博增强] 上传图片出错:', error);
                uploadButton.textContent = '上传失败';
                setTimeout(() => {
                  uploadButton.disabled = false;
                  uploadButton.textContent = '重试上传';
                }, 1000);
              }
            });
          }
          
          // 延时恢复交互状态
          setTimeout(() => {
            // 移除加载提示
            const loadingEl = document.getElementById('custom-loading-msg');
            if (loadingEl) loadingEl.remove();
            
            // 恢复单选框状态
            customRadio.disabled = false;
            if (bingRadio) bingRadio.disabled = false;
            
            simpleNotify('已切换到自定义图片背景');
          }, 1000);
        } catch (error) {
          console.error('[微博增强] 切换背景类型出错:', error);
          simpleNotify('切换背景类型出错，请重试');
          
          // 恢复单选框状态
          customRadio.disabled = false;
          if (bingRadio) bingRadio.disabled = false;
          
          // 移除可能的加载提示
          const loadingEl = document.getElementById('custom-loading-msg');
          if (loadingEl) loadingEl.remove();
        }
      }
    });
  }
    // 清除必应图片缓存按钮
  const clearCacheButton = container.querySelector('#clear-bing-cache');
  if (clearCacheButton) {
    clearCacheButton.addEventListener('click', () => {
      try {
        // 清除缓存并应用
        const success = clearBingImageCache();
        
        if (success) {
          // 显示按钮状态变化
          clearCacheButton.textContent = '缓存已清除';
          clearCacheButton.disabled = true;
          
          // 1.5秒后恢复按钮状态
          setTimeout(() => {
            clearCacheButton.disabled = false;
            clearCacheButton.textContent = '清除图片缓存';
          }, 1500);
        } else {
          simpleNotify('清除缓存失败，请重试');
        }
      } catch (error) {
        console.error('[微博背景] 清除缓存出错:', error);
        simpleNotify('清除缓存时发生错误');
      }
    });
  }

  // 上传背景按钮
  const uploadButton = container.querySelector('#upload-background');
  if (uploadButton) {
    uploadButton.addEventListener('click', async () => {
      const success = await uploadCustomBackground();
      if (success) {
        simpleNotify('图片上传成功，已应用为背景');
      } else {
        simpleNotify('图片上传取消或失败');
      }
    });
  }
    // 背景不透明度滑块
  const opacitySlider = container.querySelector('#background-opacity');
  if (opacitySlider) {
    // 初始化滑块值
    opacitySlider.value = Math.round(blurStore.background_opacity * 100);
    
    // 初始化标签文本
    const label = opacitySlider.previousElementSibling;
    if (label && label.tagName === 'LABEL') {
      label.textContent = `背景不透明度: ${Math.round(blurStore.background_opacity * 100)}%`;
    }
    
    // 防抖函数，避免频繁触发应用函数
    let opacityDebounceTimer = null;
    const debounceDelay = 100; // 毫秒
    
    // 实时更新UI，但延迟应用实际效果
    opacitySlider.addEventListener('input', (e) => {
      const newValue = parseInt(e.target.value, 10) / 100; // 转换为0-1范围
      
      // 立即更新UI显示
      const label = opacitySlider.previousElementSibling;
      if (label && label.tagName === 'LABEL') {
        label.textContent = `背景不透明度: ${Math.round(newValue * 100)}%`;
      }
      
      // 实时预览 - 直接更新DOM元素不透明度，但不保存配置
      const backgroundElement = document.getElementById('weibo-blur-background');
      if (backgroundElement) {
        backgroundElement.style.setProperty('opacity', newValue, 'important');
      }
      
      // 防抖处理 - 只在停止滑动一段时间后调用完整的setBackgroundOpacity
      clearTimeout(opacityDebounceTimer);
      opacityDebounceTimer = setTimeout(() => {
        console.log('[微博背景] 应用新不透明度:', newValue);
        
        // 调用背景工具函数来保存配置并应用透明度
        setBackgroundOpacity(newValue);
      }, debounceDelay);
    });
    
    // 滑块值变化结束事件
    opacitySlider.addEventListener('change', (e) => {
      const newValue = parseInt(e.target.value, 10) / 100;
      console.log('[微博背景] 不透明度调整完成:', newValue);
      
      // 确保值已应用到全局配置
      setBackgroundOpacity(newValue);
      
      // 提供反馈
      simpleNotify(`背景不透明度已设置为 ${Math.round(newValue * 100)}%`);
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
      // 获取所有GM存储的键
      const allKeys = GM_listValues();

      // 清除所有GM存储的键值对
      allKeys.forEach(key => {
        console.log(`[微博增强] 正在删除配置项: ${key}`);
        GM_deleteValue(key);
      });
      
      // 通知用户
      simpleNotify('所有设置已完全重置，配置已删除');
      
      // 刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  });
}