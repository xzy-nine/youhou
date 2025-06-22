// UI控制模块
// widescreenStore, backgroundStore, saveWidescreenConfig, saveThemeConfig, saveBackgroundConfig 从chrome-storage.js全局获取
// getCurrentWebsiteMode, setWebsiteMode 从theme.js全局获取
// controlPanelCSS 从styles/controlPanel.js全局获取
// simpleNotify 从notification.js全局获取
// toggleBackgroundEnabled, setBackgroundType, uploadCustomBackground, setBackgroundOpacity, setContentOpacity, clearBingImageCache, applyBackground 从background-image.js全局获取

// 创建统一控制面板
function createControlPanel() {
  // 确保DOM已加载
  if (!document.body || !document.head) {
    console.warn('[微博增强] DOM未完全加载，延迟创建控制面板');
    setTimeout(createControlPanel, 500);
    return;
  }
  
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
        <button id="theme-reset">重置跟随</button>      </div>
        <div class="control-group" id="background-control-group">
        <div class="control-title">背景设置</div>
        <button id="background-toggle" class="${backgroundStore.enabled ? 'active' : ''}">
          <span class="status-indicator ${backgroundStore.enabled ? 'on' : 'off'}"></span>
          ${backgroundStore.enabled ? '已开启' : '已关闭'}
        </button>
        ${backgroundStore.enabled ? `
          <div class="radio-control">
            <input type="radio" id="bing-background" name="background-type" ${backgroundStore.type === 'bing' ? 'checked' : ''}>
            <label for="bing-background">必应每日图片</label>
            
            <input type="radio" id="custom-background" name="background-type" ${backgroundStore.type === 'custom' ? 'checked' : ''}>
            <label for="custom-background">自定义图片</label>
          </div>
          
          ${backgroundStore.type === 'custom' ? `
            <button id="upload-background" class="small-button">上传图片</button>
          ` : ''}
            <div class="range-control">
            <label for="background-opacity">背景不透明度: ${Math.round(backgroundStore.opacity * 100)}%</label>
            <input type="range" id="background-opacity" min="1" max="100" value="${Math.round(backgroundStore.opacity * 100)}">          </div>
            <div class="checkbox-control" id="content-transparency-container">
            <input type="checkbox" id="content-transparency-toggle" ${backgroundStore.content_transparency ? 'checked' : ''}>
            <label for="content-transparency-toggle">微博内容半透明</label>
          </div>
          
          ${backgroundStore.content_transparency ? `
          <div class="range-control" id="content-opacity-container">
            <label for="content-opacity">内容不透明度: ${Math.round(backgroundStore.content_opacity * 100)}%</label>
            <input type="range" id="content-opacity" min="20" max="95" value="${Math.round(backgroundStore.content_opacity * 100)}">
          </div>
          ` : ''}
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
  // 背景开关
  const backgroundToggle = panel.querySelector('#background-toggle');
  if (backgroundToggle) {
    backgroundToggle.addEventListener('click', () => {
      const enabled = toggleBackgroundEnabled();
      console.log('[微博增强] 背景状态切换为:', enabled ? '开启' : '关闭');
      
      backgroundToggle.className = enabled ? 'active' : '';
      // 更新按钮文本和指示器
      const indicator = backgroundToggle.querySelector('.status-indicator');
      if (indicator) {
        indicator.className = `status-indicator ${enabled ? 'on' : 'off'}`;
      }
      
      // 保存指示器元素，清空按钮内容，重新添加指示器和文本
      const newText = document.createTextNode(enabled ? '已开启' : '已关闭');
      
      // 清空按钮内容并重新添加元素
      backgroundToggle.innerHTML = '';
      if (indicator) {
        backgroundToggle.appendChild(indicator.cloneNode(true));
      }
      backgroundToggle.appendChild(newText);
      
      // 更新面板 - 显示或隐藏背景控制选项
      const controlGroup = backgroundToggle.closest('.control-group');
      if (controlGroup) {
        // 清空现有控制选项
        const existingControls = controlGroup.querySelectorAll('.radio-control, .range-control, button.small-button, .checkbox-control');
        existingControls.forEach(el => el.remove());
        
        // 如果启用了背景，添加背景设置控制
        if (enabled) {
          // 添加背景类型选择
          const radioControl = document.createElement('div');
          radioControl.className = 'radio-control';
          radioControl.innerHTML = `
            <input type="radio" id="bing-background" name="background-type" ${backgroundStore.type === 'bing' ? 'checked' : ''}>
            <label for="bing-background">必应每日图片</label>
            
            <input type="radio" id="custom-background" name="background-type" ${backgroundStore.type === 'custom' ? 'checked' : ''}>
            <label for="custom-background">自定义图片</label>
          `;
          controlGroup.appendChild(radioControl);
          
          // 添加上传按钮（如果是自定义类型）
          if (backgroundStore.type === 'custom') {
            const uploadButton = document.createElement('button');
            uploadButton.id = 'upload-background';
            uploadButton.className = 'small-button';
            uploadButton.textContent = '上传图片';
            controlGroup.appendChild(uploadButton);
          }
            
          // 添加背景透明度滑块
          const rangeControl = document.createElement('div');
          rangeControl.className = 'range-control';
          rangeControl.innerHTML = `
            <label for="background-opacity">背景不透明度: ${Math.round(backgroundStore.opacity * 100)}%</label>
            <input type="range" id="background-opacity" min="1" max="100" value="${Math.round(backgroundStore.opacity * 100)}">
          `;
          controlGroup.appendChild(rangeControl);
          
          // 添加内容半透明开关
          const transparencyControl = document.createElement('div');
          transparencyControl.className = 'checkbox-control';
          transparencyControl.id = 'content-transparency-container';
          transparencyControl.innerHTML = `
            <input type="checkbox" id="content-transparency-toggle" ${backgroundStore.content_transparency ? 'checked' : ''}>
            <label for="content-transparency-toggle">微博内容半透明</label>
          `;
          controlGroup.appendChild(transparencyControl);
          
          // 如果内容半透明已启用，添加内容透明度滑块
          if (backgroundStore.content_transparency) {
              const contentOpacityControl = document.createElement('div');
              contentOpacityControl.className = 'range-control';
              contentOpacityControl.id = 'content-opacity-container';
              contentOpacityControl.innerHTML = `
                <label for="content-opacity">内容不透明度: ${Math.round(backgroundStore.content_opacity * 100)}%</label>
                <input type="range" id="content-opacity" min="20" max="95" value="${Math.round(backgroundStore.content_opacity * 100)}">
              `;
              controlGroup.appendChild(contentOpacityControl);
          }
          
          // 绑定背景设置相关控件的事件
          bindBackgroundControlEvents(controlGroup);
        }
      }
      
      simpleNotify(enabled ? '背景功能已启用' : '背景功能已关闭');
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
function bindBackgroundControlEvents(container) {
  // 背景类型单选框
  const bingRadio = container.querySelector('#bing-background');
  const customRadio = container.querySelector('#custom-background');

  if (bingRadio) {
    bingRadio.addEventListener('change', (e) => {
      if (e.target.checked) {
        try {
          setBackgroundType('bing');
          applyBackground();
          simpleNotify('已切换到必应每日图片背景');
        } catch (error) {
          console.error('[微博增强] 切换背景类型出错:', error);
          simpleNotify('切换背景类型出错，请重试');
        }
      }
    });
  }
  if (customRadio) {
    customRadio.addEventListener('change', (e) => {
      if (e.target.checked) {
        try {
          setBackgroundType('custom');
          applyBackground();
          simpleNotify('已切换到自定义图片背景');
        } catch (error) {
          console.error('[微博增强] 切换背景类型出错:', error);
          simpleNotify('切换背景类型出错，请重试');
        }
      }
    });
  }
  // 上传图片按钮
  const uploadButton = container.querySelector('#upload-background');
  if (uploadButton) {
    uploadButton.addEventListener('click', async () => {
      uploadButton.disabled = true;
      uploadButton.textContent = '上传中...';
      try {
        const success = await uploadCustomBackground();
        if (success) {
          uploadButton.textContent = '上传成功';
          setBackgroundType('custom');
          applyBackground();
          setTimeout(() => {
            uploadButton.disabled = false;
            uploadButton.textContent = '重新上传';
          }, 1500);
        } else {
          uploadButton.textContent = '上传取消';
          setTimeout(() => {
            uploadButton.disabled = false;
            uploadButton.textContent = '上传图片';
          }, 1000);
        }
      } catch (error) {
        uploadButton.textContent = '上传失败';
        setTimeout(() => {
          uploadButton.disabled = false;
          uploadButton.textContent = '重试上传';
        }, 1000);
      }
    });
  }
  // 透明度滑块
  const opacitySlider = container.querySelector('#background-opacity');
  if (opacitySlider) {
    opacitySlider.addEventListener('input', (e) => {
      const newValue = parseInt(e.target.value, 10) / 100;
      setBackgroundOpacity(newValue);
      const label = opacitySlider.parentElement.querySelector('label');
      if (label) {
        label.textContent = `背景不透明度: ${Math.round(newValue * 100)}%`;
      }
    });
  }
  // 清除必应图片缓存按钮
  const clearCacheButton = container.querySelector('#clear-bing-cache');
  if (clearCacheButton) {
    clearCacheButton.addEventListener('click', () => {
      try {
        const success = clearBingImageCache();
        if (success) {
          clearCacheButton.textContent = '缓存已清除';
          clearCacheButton.disabled = true;
          setTimeout(() => {
            clearCacheButton.disabled = false;
            clearCacheButton.textContent = '清除图片缓存';
          }, 1500);
        } else {
          simpleNotify('清除缓存失败，请重试');
        }
      } catch (error) {
        simpleNotify('清除缓存时发生错误');
      }
    });
  }
  
  // 内容半透明开关
  const contentTransparencyToggle = container.querySelector('#content-transparency-toggle');
  if (contentTransparencyToggle) {
    // 防止重复绑定事件
    contentTransparencyToggle.removeEventListener('change', contentTransparencyChangeHandler);
    contentTransparencyToggle.addEventListener('change', contentTransparencyChangeHandler);
  }
  
  // 内容透明度滑块
  const contentOpacitySlider = container.querySelector('#content-opacity');
  if (contentOpacitySlider) {
    // 防止重复绑定事件
    contentOpacitySlider.removeEventListener('input', contentOpacityInputHandler);
    contentOpacitySlider.addEventListener('input', contentOpacityInputHandler);
  }
}

// 内容半透明开关事件处理函数
function contentTransparencyChangeHandler(e) {
  const enabled = e.target.checked;
  try {
    // 更新存储
    backgroundStore.content_transparency = enabled;
    saveBackgroundConfig();
    
    // 应用背景，这会触发内容透明度设置
    applyBackground();
    
    // 处理UI：添加或移除内容透明度滑块
    const controlGroup = e.target.closest('.control-group');
    if (controlGroup) {
      // 检查是否已有透明度控件容器
      let opacityContainer = controlGroup.querySelector('#content-opacity-container');
      
      // 如果启用了内容半透明
      if (enabled) {
        // 如果没有透明度滑块容器，创建一个
        if (!opacityContainer) {
          opacityContainer = document.createElement('div');
          opacityContainer.className = 'range-control';
          opacityContainer.id = 'content-opacity-container';
          opacityContainer.innerHTML = `
            <label for="content-opacity">内容不透明度: ${Math.round(backgroundStore.content_opacity * 100)}%</label>
            <input type="range" id="content-opacity" min="20" max="95" value="${Math.round(backgroundStore.content_opacity * 100)}">
          `;
          
          // 插入到半透明开关后面
          const transparencyContainer = e.target.closest('#content-transparency-container');
          if (transparencyContainer) {
            // 确保只插入一次
            if (!controlGroup.querySelector('#content-opacity-container')) {
              if (transparencyContainer.nextSibling) {
                controlGroup.insertBefore(opacityContainer, transparencyContainer.nextSibling);
              } else {
                controlGroup.appendChild(opacityContainer);
              }
              
              // 为新滑块添加事件处理
              const slider = opacityContainer.querySelector('#content-opacity');
              if (slider) {
                slider.addEventListener('input', contentOpacityInputHandler);
              }
            }
          }
        } else {
          // 如果已有滑块容器，确保可见
          opacityContainer.style.display = '';
        }
      } 
      // 如果禁用了内容半透明且有滑块容器，隐藏它
      else if (!enabled && opacityContainer) {
        opacityContainer.style.display = 'none';
      }
    }
    
    // 通知用户
    simpleNotify(enabled ? '微博内容半透明已启用' : '微博内容半透明已关闭');
    console.log(`[微博增强] 微博内容半透明: ${enabled ? '开启' : '关闭'}`);
  } catch (error) {
    console.error('[微博增强] 切换内容半透明设置失败:', error);
    simpleNotify('设置内容半透明失败');
  }
}

// 内容透明度滑块事件处理函数
function contentOpacityInputHandler(e) {
  const newValue = parseInt(e.target.value, 10) / 100;
  try {
    // 设置内容透明度
    setContentOpacity(newValue);
    
    // 更新滑块标签
    const label = e.target.parentElement.querySelector('label');
    if (label) {
      label.textContent = `内容不透明度: ${Math.round(newValue * 100)}%`;
    }
  } catch (error) {
    console.error('[微博增强] 设置内容透明度失败:', error);
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

// 注册菜单命令 - Chrome扩展版本
function registerMenus() {
  // Chrome扩展不需要菜单注册，使用popup面板
  console.log('[微博增强] Chrome扩展环境，菜单功能已整合到popup面板中');
  
  // 为兼容性保留重置功能，但改为内部函数
  window.weiboResetAllSettings = async function() {
    if (confirm('确定要重置所有设置吗？页面将会刷新。')) {
      try {
        // 明确列出要删除的配置键
        const configKeys = [
          // 宽屏相关
          'widescreen_enabled', 
          'widescreen_loose', 
          'widescreen_notify_enabled', 
          'widescreen_ui_visible', 
          'widescreen_panel_expanded', 
          'widescreen_panel_position',
          // 背景功能相关
          'background_enabled',
          'background_type',
          'background_url',
          'background_opacity',
          'background_content_transparency',
          'background_content_opacity',
          'background_content_blur',
          'background_notify_enabled',
          
          // 主题相关
          'userOverride',
          'userThemeMode',
          'lastSystemMode',
          
          // 必应图片缓存
          'weibo_bing_background'
        ];
        
        // 删除指定的键值对
        for (const key of configKeys) {
          console.log(`[微博增强] 正在删除配置项: ${key}`);
          await chromeStorage.deleteValue(key);
        }
        
        // 通知用户
        simpleNotify('所有设置已完全重置，配置已删除');
        
        // 刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('[微博增强] 重置配置失败:', error);
        simpleNotify('重置配置失败，请检查控制台');      }
    }
  };
  
  console.log('[微博增强] 如需重置所有设置，请在控制台执行: weiboResetAllSettings()');
}