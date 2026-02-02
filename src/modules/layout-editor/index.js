// 自定义页面布局编辑器主模块
// 提供可视化编辑页面容器布局的功能

(function() {
  'use strict';

  // 编辑器状态
  const editorState = {
    isActive: false,
    isSelecting: false,
    selectedContainer: null,
    containers: new Map(), // 存储容器配置
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,
    settings: {
      autoApplyToSimilar: true,
      showGuides: true,
      snapToGrid: false,
      gridSize: 10,
      borderThreshold: 8 // 边框检测阈值（像素）
    }
  };

  // DOM元素缓存
  const elements = {
    toolbar: null,
    overlay: null,
    selectionBox: null,
    resizeHandles: null,
    infoTooltip: null
  };

  // 初始化编辑器
  async function initLayoutEditor() {
    console.log('[布局编辑器] 初始化');

    // 注入样式
    injectStyles();

    // 加载已保存的配置（等待加载完成）
    await loadSavedConfig();

    // 创建工具栏
    createToolbar();

    // 创建遮罩层
    createOverlay();

    // 绑定快捷键
    bindKeyboardShortcuts();

    console.log('[布局编辑器] 初始化完成');
  }

  // 注入样式
  function injectStyles() {
    if (document.getElementById('layout-editor-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'layout-editor-styles';
    styleEl.textContent = layoutEditorCSS;
    document.head.appendChild(styleEl);
  }

  // 启动编辑器
  function startEditor() {
    if (editorState.isActive) return;
    
    editorState.isActive = true;
    document.body.classList.add('layout-editor-active');
    
    // 显示工具栏
    if (elements.toolbar) {
      elements.toolbar.style.display = 'flex';
    }
    
    // 显示遮罩层
    if (elements.overlay) {
      elements.overlay.style.display = 'block';
    }
    
    // 进入选择模式
    startSelectionMode();
    
    console.log('[布局编辑器] 编辑器已启动');
  }

  // 停止编辑器
  function stopEditor() {
    if (!editorState.isActive) return;
    
    editorState.isActive = false;
    editorState.isSelecting = false;
    
    document.body.classList.remove('layout-editor-active');
    
    // 隐藏工具栏
    if (elements.toolbar) {
      elements.toolbar.style.display = 'none';
    }
    
    // 隐藏遮罩层
    if (elements.overlay) {
      elements.overlay.style.display = 'none';
    }
    
    // 清除选中状态
    clearSelection();
    
    // 移除事件监听
    removeSelectionListeners();
    if (window.layoutEditorDragger) {
      window.layoutEditorDragger.removeListeners();
    }
    
    console.log('[布局编辑器] 编辑器已停止');
  }

  // 创建工具栏
  function createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'layout-editor-toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-header">
        <span class="toolbar-title">布局编辑器</span>
        <button class="toolbar-close" title="关闭 (ESC)">×</button>
      </div>
      <div class="toolbar-actions">
        <button class="toolbar-btn" id="le-btn-select" title="选择模式 (S)">
          <span class="btn-icon">🔍</span>
          <span class="btn-text">选择</span>
        </button>
        <button class="toolbar-btn" id="le-btn-undo" title="撤销 (Ctrl+Z)">
          <span class="btn-icon">↶</span>
          <span class="btn-text">撤销</span>
        </button>
        <button class="toolbar-btn" id="le-btn-redo" title="重做 (Ctrl+Y)">
          <span class="btn-icon">↷</span>
          <span class="btn-text">重做</span>
        </button>
        <button class="toolbar-btn" id="le-btn-guides" title="显示/隐藏辅助线 (G)">
          <span class="btn-icon">📐</span>
          <span class="btn-text">辅助线</span>
        </button>
        <button class="toolbar-btn" id="le-btn-snap" title="吸附网格 (N)">
          <span class="btn-icon">⊞</span>
          <span class="btn-text">网格</span>
        </button>
        <button class="toolbar-btn btn-primary" id="le-btn-save" title="保存配置">
          <span class="btn-icon">💾</span>
          <span class="btn-text">保存</span>
        </button>
        <button class="toolbar-btn btn-danger" id="le-btn-clear" title="清除所有">
          <span class="btn-icon">🗑</span>
          <span class="btn-text">清除</span>
        </button>
      </div>
      <div class="toolbar-info">
        <div class="info-item">
          <span class="info-label">选中:</span>
          <span class="info-value" id="le-info-selector">无</span>
        </div>
        <div class="info-item">
          <span class="info-label">尺寸:</span>
          <span class="info-value" id="le-info-size">-</span>
        </div>
        <div class="info-item">
          <span class="info-label">位置:</span>
          <span class="info-value" id="le-info-position">-</span>
        </div>
      </div>
    `;
    
    // 绑定工具栏事件
    toolbar.querySelector('.toolbar-close').addEventListener('click', stopEditor);
    toolbar.querySelector('#le-btn-select').addEventListener('click', () => {
      if (editorState.isSelecting) {
        stopSelectionMode();
      } else {
        startSelectionMode();
      }
    });
    toolbar.querySelector('#le-btn-undo').addEventListener('click', undo);
    toolbar.querySelector('#le-btn-redo').addEventListener('click', redo);
    toolbar.querySelector('#le-btn-guides').addEventListener('click', toggleGuides);
    toolbar.querySelector('#le-btn-snap').addEventListener('click', toggleSnap);
    toolbar.querySelector('#le-btn-save').addEventListener('click', saveConfig);
    toolbar.querySelector('#le-btn-clear').addEventListener('click', clearAllContainers);
    
    document.body.appendChild(toolbar);
    elements.toolbar = toolbar;
    
    // 默认隐藏
    toolbar.style.display = 'none';
  }

  // 创建遮罩层
  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'layout-editor-overlay';
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
    elements.overlay = overlay;
  }

  // 创建选中框
  function createSelectionBox() {
    if (elements.selectionBox) {
      elements.selectionBox.remove();
    }
    
    const box = document.createElement('div');
    box.id = 'layout-editor-selection';
    box.innerHTML = `
      <div class="le-border le-border-top"></div>
      <div class="le-border le-border-right"></div>
      <div class="le-border le-border-bottom"></div>
      <div class="le-border le-border-left"></div>
      <div class="le-corner le-corner-tl"></div>
      <div class="le-corner le-corner-tr"></div>
      <div class="le-corner le-corner-bl"></div>
      <div class="le-corner le-corner-br"></div>
      <div class="le-info-panel">
        <div class="le-info-content"></div>
      </div>
    `;
    
    document.body.appendChild(box);
    elements.selectionBox = box;
    
    // 绑定拖拽事件
    if (window.layoutEditorDragger) {
      window.layoutEditorDragger.init(box);
    }
    
    return box;
  }

  // 启动选择模式
  function startSelectionMode() {
    // 如果已经在选择模式，先清除当前选中状态，重新进入选择模式
    if (editorState.isSelecting) {
      clearSelection();
      console.log('[布局编辑器] 重新进入选择模式，已清除当前选中');
      return;
    }
    
    // 清除之前的选中状态
    clearSelection();
    
    editorState.isSelecting = true;
    document.body.classList.add('layout-editor-selecting');
    
    // 更新按钮状态
    const selectBtn = document.getElementById('le-btn-select');
    if (selectBtn) {
      selectBtn.classList.add('active');
    }
    
    // 添加事件监听
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleElementClick, true);
    
    console.log('[布局编辑器] 进入选择模式');
  }

  // 停止选择模式
  function stopSelectionMode() {
    if (!editorState.isSelecting) return;
    
    editorState.isSelecting = false;
    document.body.classList.remove('layout-editor-selecting');
    
    // 更新按钮状态
    const selectBtn = document.getElementById('le-btn-select');
    if (selectBtn) {
      selectBtn.classList.remove('active');
    }
    
    removeSelectionListeners();
    
    console.log('[布局编辑器] 退出选择模式');
  }

  // 移除选择事件监听
  function removeSelectionListeners() {
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleElementClick, true);
  }

  // 鼠标悬停处理
  function handleMouseOver(e) {
    if (!editorState.isSelecting) return;
    
    const target = e.target;
    
    // 排除编辑器自身的元素
    if (isEditorElement(target)) return;
    
    // 排除某些标签
    const excludeTags = ['HTML', 'BODY', 'SCRIPT', 'STYLE', 'HEAD', 'META', 'LINK', 'IFRAME'];
    if (excludeTags.includes(target.tagName)) return;
    
    // 清除之前的悬停效果
    document.querySelectorAll('.layout-editor-hover').forEach(el => {
      if (el !== target) el.classList.remove('layout-editor-hover');
    });
    
    // 添加悬停效果
    target.classList.add('layout-editor-hover');
  }

  // 鼠标离开处理
  function handleMouseOut(e) {
    if (!editorState.isSelecting) return;
    
    const target = e.target;
    target.classList.remove('layout-editor-hover');
  }

  // 元素点击处理
  function handleElementClick(e) {
    if (!editorState.isSelecting) return;
    
    // 排除编辑器自身的元素
    if (isEditorElement(e.target)) {
      // 如果点击的是编辑器元素，不处理
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.target;
    
    // 排除某些标签（这些视为空白区域）
    const excludeTags = ['HTML', 'BODY', 'SCRIPT', 'STYLE', 'HEAD', 'META', 'LINK', 'IFRAME'];
    if (excludeTags.includes(target.tagName)) {
      // 点击空白区域，清除选中状态，继续选择模式
      clearSelection();
      console.log('[布局编辑器] 点击空白区域，清除选中状态');
      return;
    }
    
    // 选中容器
    selectContainer(target);
    
    // 退出选择模式
    stopSelectionMode();
  }

  // 选中容器
  function selectContainer(element) {
    // 清除之前的选中
    clearSelection();
    
    editorState.selectedContainer = element;
    element.classList.add('layout-editor-selected');

    // 生成选择器
    const selector = generateSelector(element);

    // 复制选择器到剪贴板
    copyToClipboard(selector);

    // 获取或创建容器配置
    let config = editorState.containers.get(selector);
    if (!config) {
      config = createContainerConfig(element, selector);
      editorState.containers.set(selector, config);
    }

    // 创建选中框
    const box = createSelectionBox();
    updateSelectionBox(element);

    // 更新信息面板
    updateInfoPanel(element, selector);

    // 滚动到元素可见
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    console.log('[布局编辑器] 选中容器:', selector);
  }

  // 复制文本到剪贴板
  function copyToClipboard(text) {
    if (!text) return;

    // 使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        console.log('[布局编辑器] 选择器已复制到剪贴板:', text);
        showNotification('选择器已复制: ' + text.substring(0, 1000) + (text.length > 1000 ? '...' : ''));
      }).catch(err => {
        console.error('[布局编辑器] 复制到剪贴板失败:', err);
        // 降级方案
        fallbackCopyToClipboard(text);
      });
    } else {
      // 降级方案
      fallbackCopyToClipboard(text);
    }
  }

  // 降级复制方案
  function fallbackCopyToClipboard(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (successful) {
        console.log('[布局编辑器] 选择器已复制到剪贴板(降级):', text);
        showNotification('选择器已复制: ' + text.substring(0, 50) + (text.length > 50 ? '...' : ''));
      } else {
        console.error('[布局编辑器] 降级复制失败');
      }
    } catch (err) {
      console.error('[布局编辑器] 降级复制异常:', err);
    }
  }

  // 清除选中状态
  function clearSelection() {
    if (editorState.selectedContainer) {
      editorState.selectedContainer.classList.remove('layout-editor-selected');
      editorState.selectedContainer = null;
    }
    
    // 清除所有悬停效果
    document.querySelectorAll('.layout-editor-hover').forEach(el => {
      el.classList.remove('layout-editor-hover');
    });
    
    // 移除选中框
    if (elements.selectionBox) {
      elements.selectionBox.remove();
      elements.selectionBox = null;
    }
    
    // 清除信息面板
    updateInfoPanel(null, '');
  }

  // 更新选中框位置和大小
  function updateSelectionBox(element) {
    if (!elements.selectionBox || !element) return;
    
    const rect = element.getBoundingClientRect();
    const box = elements.selectionBox;
    
    box.style.left = rect.left + 'px';
    box.style.top = rect.top + 'px';
    box.style.width = rect.width + 'px';
    box.style.height = rect.height + 'px';
  }

  // 更新信息面板
  function updateInfoPanel(element, selector) {
    const selectorEl = document.getElementById('le-info-selector');
    const sizeEl = document.getElementById('le-info-size');
    const positionEl = document.getElementById('le-info-position');
    
    if (selectorEl) {
      selectorEl.textContent = selector || '无';
      selectorEl.title = selector || '';
    }
    
    if (element) {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      
      if (sizeEl) {
        sizeEl.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
      }
      
      if (positionEl) {
        const parentRect = element.offsetParent ? element.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
        const relLeft = Math.round(rect.left - parentRect.left);
        const relTop = Math.round(rect.top - parentRect.top);
        positionEl.textContent = `X:${relLeft} Y:${relTop}`;
      }
      
      // 更新悬浮提示
      const infoContent = elements.selectionBox?.querySelector('.le-info-content');
      if (infoContent) {
        infoContent.innerHTML = `
          <div>宽度: ${Math.round(rect.width)}px</div>
          <div>高度: ${Math.round(rect.height)}px</div>
          <div>左边距: ${computedStyle.marginLeft}</div>
          <div>右边距: ${computedStyle.marginRight}</div>
        `;
      }
    } else {
      if (sizeEl) sizeEl.textContent = '-';
      if (positionEl) positionEl.textContent = '-';
    }
  }

  // 生成元素选择器
  function generateSelector(element) {
    if (!element) return '';
    if (element.id) return `#${element.id}`;

    // 尝试使用 data-testid 或 role 等稳定属性
    if (element.getAttribute('data-testid')) {
      return `[data-testid="${element.getAttribute('data-testid')}"]`;
    }
    if (element.getAttribute('role')) {
      const role = element.getAttribute('role');
      // 检查是否唯一
      const sameRole = document.querySelectorAll(`[role="${role}"]`);
      if (sameRole.length === 1) {
        return `[role="${role}"]`;
      }
    }

    const parts = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      // 添加类名（过滤动态类名）
      if (current.classList.length > 0) {
        const validClasses = Array.from(current.classList).filter(cls => {
          return !cls.match(/^[a-z0-9]+_[a-z0-9]+$/i) &&
                 !cls.match(/^react-/i) &&
                 !cls.match(/^vue-/i) &&
                 !cls.match(/^woo-/i) &&
                 !cls.match(/^Frame-/i) &&
                 !cls.match(/^Main-/i) &&
                 !cls.match(/^Content-/i) &&
                 !cls.match(/^box-/i) &&
                 !cls.startsWith('layout-editor-') &&
                 cls.length > 2;
        });

        if (validClasses.length > 0) {
          selector += '.' + validClasses.slice(0, 2).join('.');
        }
      }

      // 添加nth-child
      const siblings = Array.from(current.parentNode?.children || []);
      const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);
      if (sameTagSiblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }

      parts.unshift(selector);
      current = current.parentNode;
    }

    return parts.join(' > ');
  }

  // 创建容器配置
  function createContainerConfig(element, selector) {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    const fingerprint = generateFingerprint(element);

    // 计算宽高比类型
    const width = rect.width;
    const height = rect.height;
    let aspectRatioType;
    if (width > height) {
      aspectRatioType = 'landscape'; // 横向（宽大于高）
    } else if (height > width) {
      aspectRatioType = 'portrait'; // 纵向（高大于宽）
    } else {
      aspectRatioType = 'square'; // 正方形（宽高相等）
    }

    return {
      selector: selector,
      fingerprint: fingerprint,
      aspectRatioType: aspectRatioType, // 保存宽高比类型
      originalStyles: {
        width: computedStyle.width,
        height: computedStyle.height,
        position: computedStyle.position,
        left: computedStyle.left,
        top: computedStyle.top,
        margin: computedStyle.margin,
        padding: computedStyle.padding,
        display: computedStyle.display,
        flex: computedStyle.flex
      },
      currentStyles: {
        width: rect.width + 'px',
        height: rect.height + 'px',
        position: computedStyle.position === 'static' ? 'relative' : computedStyle.position,
        left: computedStyle.left,
        top: computedStyle.top,
        marginLeft: computedStyle.marginLeft,
        marginRight: computedStyle.marginRight,
        marginTop: computedStyle.marginTop,
        marginBottom: computedStyle.marginBottom
      },
      children: [],
      pagePattern: window.location.pathname
    };
  }

  // 生成容器指纹
  function generateFingerprint(element) {
    const getStructure = (el, depth = 0) => {
      if (depth > 3 || !el) return '';
      
      const tagName = el.tagName.toLowerCase();
      const validClasses = Array.from(el.classList).filter(cls => {
        return !cls.match(/^[a-z0-9]+_[a-z0-9]+$/i) && 
               !cls.startsWith('layout-editor-') &&
               cls.length > 2;
      }).slice(0, 2);
      
      const classPart = validClasses.length > 0 ? '.' + validClasses.join('.') : '';
      const children = Array.from(el.children).slice(0, 3).map(c => getStructure(c, depth + 1));
      
      return `${tagName}${classPart}{${children.join(',')}}`;
    };
    
    return getStructure(element);
  }

  // 判断是否为编辑器元素
  function isEditorElement(element) {
    if (!element) return false;
    
    // 检查元素或其父元素是否属于编辑器
    let current = element;
    while (current) {
      if (current.id?.startsWith('layout-editor') || 
          current.id?.startsWith('le-') ||
          current.classList?.contains('layout-editor')) {
        return true;
      }
      current = current.parentNode;
    }
    
    return false;
  }

  // 绑定快捷键
  function bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (!editorState.isActive) return;
      
      // ESC: 退出选择模式或取消选中
      if (e.key === 'Escape') {
        if (editorState.isSelecting) {
          stopSelectionMode();
        } else if (editorState.selectedContainer) {
          clearSelection();
          startSelectionMode();
        } else {
          stopEditor();
        }
      }
      
      // Ctrl+Z: 撤销
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Ctrl+Y 或 Ctrl+Shift+Z: 重做
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
      
      // Delete: 删除当前容器配置
      if (e.key === 'Delete' && editorState.selectedContainer) {
        deleteCurrentContainer();
      }
      
      // S: 切换选择模式
      if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
        if (editorState.isSelecting) {
          stopSelectionMode();
        } else {
          startSelectionMode();
        }
      }
      
      // G: 切换辅助线
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        toggleGuides();
      }
      
      // N: 切换网格吸附
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        toggleSnap();
      }
    });
  }

  // 撤销
  function undo() {
    if (editorState.historyIndex <= 0) {
      console.log('[布局编辑器] 没有可撤销的操作');
      return;
    }
    
    editorState.historyIndex--;
    const record = editorState.history[editorState.historyIndex];
    
    applyHistoryRecord(record, true);
    console.log('[布局编辑器] 撤销操作');
  }

  // 重做
  function redo() {
    if (editorState.historyIndex >= editorState.history.length - 1) {
      console.log('[布局编辑器] 没有可重做的操作');
      return;
    }
    
    editorState.historyIndex++;
    const record = editorState.history[editorState.historyIndex];
    
    applyHistoryRecord(record, false);
    console.log('[布局编辑器] 重做操作');
  }

  // 应用历史记录
  function applyHistoryRecord(record, isUndo) {
    const value = isUndo ? record.oldValue : record.newValue;
    
    switch (record.type) {
      case 'resize':
      case 'move':
        const config = editorState.containers.get(record.selector);
        if (config) {
          Object.assign(config.currentStyles, value);
          applyContainerStyles(config);
        }
        break;
      case 'select':
        if (value) {
          const element = document.querySelector(value);
          if (element) {
            selectContainer(element);
          }
        } else {
          clearSelection();
        }
        break;
    }
  }

  // 添加历史记录
  function addHistoryRecord(type, selector, oldValue, newValue) {
    // 移除当前位置之后的历史记录
    editorState.history = editorState.history.slice(0, editorState.historyIndex + 1);
    
    // 添加新记录
    editorState.history.push({
      type,
      selector,
      oldValue: JSON.parse(JSON.stringify(oldValue)),
      newValue: JSON.parse(JSON.stringify(newValue)),
      timestamp: Date.now()
    });
    
    // 限制历史记录大小
    if (editorState.history.length > editorState.maxHistorySize) {
      editorState.history.shift();
    } else {
      editorState.historyIndex++;
    }
  }

  // 切换辅助线
  function toggleGuides() {
    editorState.settings.showGuides = !editorState.settings.showGuides;
    document.body.classList.toggle('layout-editor-guides', editorState.settings.showGuides);
    
    const btn = document.getElementById('le-btn-guides');
    if (btn) {
      btn.classList.toggle('active', editorState.settings.showGuides);
    }
    
    console.log('[布局编辑器] 辅助线:', editorState.settings.showGuides ? '显示' : '隐藏');
  }

  // 切换网格吸附
  function toggleSnap() {
    editorState.settings.snapToGrid = !editorState.settings.snapToGrid;
    
    const btn = document.getElementById('le-btn-snap');
    if (btn) {
      btn.classList.toggle('active', editorState.settings.snapToGrid);
    }
    
    console.log('[布局编辑器] 网格吸附:', editorState.settings.snapToGrid ? '开启' : '关闭');
  }

  // 删除当前容器配置
  function deleteCurrentContainer() {
    if (!editorState.selectedContainer) return;
    
    const selector = generateSelector(editorState.selectedContainer);
    const config = editorState.containers.get(selector);
    
    if (config) {
      // 恢复原始样式
      restoreOriginalStyles(editorState.selectedContainer, config.originalStyles);
      
      // 删除配置
      editorState.containers.delete(selector);
      
      // 添加到历史记录
      addHistoryRecord('delete', selector, config, null);
      
      console.log('[布局编辑器] 删除容器配置:', selector);
    }
    
    clearSelection();
  }

  // 清除所有容器配置
  function clearAllContainers() {
    if (!confirm('确定要清除所有容器配置吗？')) return;
    
    // 恢复所有容器的原始样式
    editorState.containers.forEach((config, selector) => {
      const element = document.querySelector(selector);
      if (element) {
        restoreOriginalStyles(element, config.originalStyles);
      }
    });
    
    // 清空配置
    editorState.containers.clear();
    editorState.history = [];
    editorState.historyIndex = -1;
    
    clearSelection();
    
    console.log('[布局编辑器] 已清除所有容器配置');
  }

  // 恢复原始样式
  function restoreOriginalStyles(element, styles) {
    if (!element || !styles) return;
    
    element.style.width = '';
    element.style.height = '';
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';
    element.style.margin = '';
    element.style.padding = '';
  }

  // 应用容器样式
  // 获取元素的宽高比类型
  function getAspectRatioType(element) {
    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width > height) {
      return 'landscape'; // 横向（宽大于高）
    } else if (height > width) {
      return 'portrait'; // 纵向（高大于宽）
    } else {
      return 'square'; // 正方形（宽高相等）
    }
  }

  function applyContainerStyles(config) {
    const element = document.querySelector(config.selector);
    if (!element) {
      console.log('[布局编辑器] 应用样式失败，未找到元素:', config.selector);
      return false;
    }

    const styles = config.currentStyles;
    if (!styles) {
      console.log('[布局编辑器] 应用样式失败，无样式数据:', config.selector);
      return false;
    }

    // 检查宽高比是否匹配（如果配置中有保存宽高比类型）
    if (config.aspectRatioType) {
      const currentAspectRatioType = getAspectRatioType(element);
      if (currentAspectRatioType !== config.aspectRatioType) {
        console.log(`[布局编辑器] 宽高比不匹配，跳过应用: ${config.selector} (保存: ${config.aspectRatioType}, 当前: ${currentAspectRatioType})`);
        return false;
      }
    }

    // 应用所有样式
    if (styles.width) element.style.setProperty('width', styles.width, 'important');
    if (styles.height) element.style.setProperty('height', styles.height, 'important');
    if (styles.position) element.style.setProperty('position', styles.position, 'important');
    if (styles.left) element.style.setProperty('left', styles.left, 'important');
    if (styles.top) element.style.setProperty('top', styles.top, 'important');
    if (styles.marginLeft) element.style.setProperty('margin-left', styles.marginLeft, 'important');
    if (styles.marginRight) element.style.setProperty('margin-right', styles.marginRight, 'important');
    if (styles.marginTop) element.style.setProperty('margin-top', styles.marginTop, 'important');
    if (styles.marginBottom) element.style.setProperty('margin-bottom', styles.marginBottom, 'important');

    console.log('[布局编辑器] 样式已应用到:', config.selector);
    return true;
  }

  // 保存配置
  async function saveConfig() {
    const config = {
      containers: Array.from(editorState.containers.entries()).map(([selector, containerConfig]) => ({
        selector,
        ...containerConfig
      })),
      settings: editorState.settings,
      timestamp: Date.now(),
      url: window.location.href
    };
    
    try {
      await chromeStorage.setValue('layoutEditor_config', config);
      console.log('[布局编辑器] 配置已保存');
      
      // 显示保存成功提示
      showNotification('配置已保存');
      
      // 同时保存为宽屏配置
      await syncToWidescreen(config);
    } catch (error) {
      console.error('[布局编辑器] 保存配置失败:', error);
      showNotification('保存失败', 'error');
    }
  }

  // 加载保存的配置
  async function loadSavedConfig() {
    try {
      const config = await chromeStorage.getValue('layoutEditor_config', null);
      if (config && config.containers) {
        config.containers.forEach(container => {
          editorState.containers.set(container.selector, container);
        });
        
        if (config.settings) {
          Object.assign(editorState.settings, config.settings);
        }
        
        console.log('[布局编辑器] 已加载保存的配置:', config.containers.length, '个容器');
        
        // 页面加载时自动应用保存的配置
        applySavedConfig();
      }
    } catch (error) {
      console.error('[布局编辑器] 加载配置失败:', error);
    }
  }
  
  // 应用保存的配置
  function applySavedConfig(retryCount = 0) {
    console.log('[布局编辑器] 开始应用保存的配置');

    let appliedCount = 0;
    let missingCount = 0;

    editorState.containers.forEach((config, selector) => {
      const element = document.querySelector(selector);
      if (element) {
        applyContainerStyles(config);
        console.log('[布局编辑器] 已应用配置到:', selector);
        appliedCount++;
      } else {
        console.log('[布局编辑器] 未找到元素:', selector);
        missingCount++;
      }
    });

    // 如果有元素未找到且重试次数小于5次，延迟重试
    if (missingCount > 0 && retryCount < 5) {
      console.log(`[布局编辑器] ${missingCount} 个元素未找到，${(retryCount + 1) * 2}秒后重试...`);
      setTimeout(() => {
        applySavedConfig(retryCount + 1);
      }, 2000 * (retryCount + 1));
    }

    return { applied: appliedCount, missing: missingCount };
  }

  // 同步到宽屏功能
  async function syncToWidescreen(config) {
    // 生成宽屏样式
    const widescreenStyles = generateWidescreenStyles(config);
    
    // 保存到宽屏配置
    await chromeStorage.setValue('customWidescreenStyles', widescreenStyles);
    
    // 触发宽屏样式更新
    if (typeof applyWidescreenStyles === 'function') {
      applyWidescreenStyles();
    }
  }

  // 生成宽屏样式
  function generateWidescreenStyles(config) {
    let css = '';
    
    config.containers.forEach(container => {
      const styles = container.currentStyles;
      css += `
        ${container.selector} {
          ${styles.width ? `width: ${styles.width} !important;` : ''}
          ${styles.height ? `height: ${styles.height} !important;` : ''}
          ${styles.position ? `position: ${styles.position} !important;` : ''}
          ${styles.left ? `left: ${styles.left} !important;` : ''}
          ${styles.top ? `top: ${styles.top} !important;` : ''}
          ${styles.marginLeft ? `margin-left: ${styles.marginLeft} !important;` : ''}
          ${styles.marginRight ? `margin-right: ${styles.marginRight} !important;` : ''}
        }
      `;
    });
    
    return css;
  }

  // 显示通知
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `layout-editor-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // 公开API
  window.layoutEditor = {
    start: startEditor,
    stop: stopEditor,
    isActive: () => editorState.isActive,
    getConfig: () => ({
      containers: Array.from(editorState.containers.entries()),
      settings: editorState.settings
    }),
    save: saveConfig,
    applySavedConfig,
    undo,
    redo,
    // 暴露containers Map供dragger使用
    containers: editorState.containers,
    // 辅助方法
    getContainerConfig: (selector) => editorState.containers.get(selector),
    createContainerConfig: (element, selector) => createContainerConfig(element, selector),
    generateSelector: (element) => generateSelector(element),
    generateFingerprint: (element) => generateFingerprint(element),
    addHistoryRecord: (type, selector, oldValue, newValue) => addHistoryRecord(type, selector, oldValue, newValue),
    getSelectedElement: () => editorState.selectedContainer,
    settings: editorState.settings
  };

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initLayoutEditor());
  } else {
    initLayoutEditor();
  }
})();
