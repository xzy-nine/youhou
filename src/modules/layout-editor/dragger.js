// 拖拽拉伸控制模块
// 实现类似Windows窗口的拖拽拉伸功能

(function() {
  'use strict';

  // 拖拽状态
  const dragState = {
    isDragging: false,
    isResizing: false,
    resizeDirection: null, // 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
    startX: 0,
    startY: 0,
    startRect: null,
    startStyles: null,
    element: null,
    config: null,
    borderThreshold: 12 // 边框检测阈值（像素）
  };

  // 拖拽手柄引用
  let selectionBox = null;
  let rafId = null;

  /**
   * 初始化拖拽功能
   * @param {HTMLElement} box - 选中框元素
   */
  function initDragger(box) {
    selectionBox = box;
    bindDragEvents(box);
  }

  /**
   * 绑定拖拽事件
   * @param {HTMLElement} box - 选中框元素
   */
  function bindDragEvents(box) {
    // 鼠标移动检测（用于改变光标样式）
    box.addEventListener('mousemove', handleMouseMove);

    // 鼠标按下开始拖拽
    box.addEventListener('mousedown', handleMouseDown);

    // 双击进入编辑模式
    box.addEventListener('dblclick', handleDoubleClick);
  }

  /**
   * 绑定全局拖拽事件（在mousedown时调用）
   */
  function bindGlobalDragEvents() {
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  }

  /**
   * 移除全局拖拽事件（在mouseup时调用）
   */
  function removeGlobalDragEvents() {
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
  }

  /**
   * 移除拖拽事件监听
   */
  function removeDragListeners() {
    if (!selectionBox) return;

    selectionBox.removeEventListener('mousemove', handleMouseMove);
    selectionBox.removeEventListener('mousedown', handleMouseDown);
    selectionBox.removeEventListener('dblclick', handleDoubleClick);

    // 同时移除全局事件
    removeGlobalDragEvents();
  }

  /**
   * 检测鼠标位置对应的操作类型
   * @param {MouseEvent} e - 鼠标事件
   * @returns {Object} - 包含操作类型和方向的对象
   */
  function detectMousePosition(e) {
    if (!selectionBox) return { action: 'none', direction: null };
    
    const rect = selectionBox.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;
    const threshold = dragState.borderThreshold;
    
    // 检测是否在边框上
    const onLeft = x <= threshold;
    const onRight = x >= width - threshold;
    const onTop = y <= threshold;
    const onBottom = y >= height - threshold;
    
    // 检测角落（优先级最高）
    if (onTop && onLeft) return { action: 'resize', direction: 'nw' };
    if (onTop && onRight) return { action: 'resize', direction: 'ne' };
    if (onBottom && onLeft) return { action: 'resize', direction: 'sw' };
    if (onBottom && onRight) return { action: 'resize', direction: 'se' };
    
    // 检测边
    if (onTop) return { action: 'resize', direction: 'n' };
    if (onBottom) return { action: 'resize', direction: 's' };
    if (onLeft) return { action: 'resize', direction: 'w' };
    if (onRight) return { action: 'resize', direction: 'e' };
    
    // 在中间区域
    return { action: 'move', direction: null };
  }

  /**
   * 处理鼠标移动（改变光标样式）
   * @param {MouseEvent} e - 鼠标事件
   */
  function handleMouseMove(e) {
    if (dragState.isDragging || dragState.isResizing) return;
    
    const { action, direction } = detectMousePosition(e);
    
    // 设置光标样式
    let cursor = 'default';
    if (action === 'move') {
      cursor = 'move';
    } else if (action === 'resize') {
      cursor = getResizeCursor(direction);
    }
    
    selectionBox.style.cursor = cursor;
    
    // 高亮对应的边框
    highlightBorder(direction);
  }

  /**
   * 获取拉伸方向对应的光标样式
   * @param {string} direction - 方向
   * @returns {string} - 光标样式
   */
  function getResizeCursor(direction) {
    const cursorMap = {
      'n': 'ns-resize',
      's': 'ns-resize',
      'e': 'ew-resize',
      'w': 'ew-resize',
      'ne': 'nesw-resize',
      'nw': 'nwse-resize',
      'se': 'nwse-resize',
      'sw': 'nesw-resize'
    };
    return cursorMap[direction] || 'default';
  }

  /**
   * 高亮边框
   * @param {string} direction - 方向
   */
  function highlightBorder(direction) {
    // 清除所有高亮
    selectionBox.querySelectorAll('.le-border, .le-corner').forEach(el => {
      el.classList.remove('active');
    });
    
    if (!direction) return;
    
    // 高亮对应的边框或角落
    const borderMap = {
      'n': '.le-border-top',
      's': '.le-border-bottom',
      'e': '.le-border-right',
      'w': '.le-border-left',
      'ne': '.le-corner-tr',
      'nw': '.le-corner-tl',
      'se': '.le-corner-br',
      'sw': '.le-corner-bl'
    };
    
    const selector = borderMap[direction];
    if (selector) {
      const element = selectionBox.querySelector(selector);
      if (element) element.classList.add('active');
    }
  }

  /**
   * 处理鼠标按下
   * @param {MouseEvent} e - 鼠标事件
   */
  function handleMouseDown(e) {
    // 只响应左键
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const { action, direction } = detectMousePosition(e);

    if (action === 'none') return;

    // 获取选中的元素
    const selectedElement = window.layoutEditor?.getSelectedElement?.() ||
                           document.querySelector('.layout-editor-selected');
    if (!selectedElement) return;

    // 保存初始状态
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    dragState.startRect = selectedElement.getBoundingClientRect();
    dragState.startStyles = {
      width: selectedElement.style.width,
      height: selectedElement.style.height,
      left: selectedElement.style.left,
      top: selectedElement.style.top,
      marginLeft: selectedElement.style.marginLeft,
      marginRight: selectedElement.style.marginRight,
      marginTop: selectedElement.style.marginTop,
      marginBottom: selectedElement.style.marginBottom,
      position: selectedElement.style.position
    };
    dragState.element = selectedElement;

    // 获取配置
    const selector = window.layoutEditor?.generateSelector?.(selectedElement) ||
                    generateSelectorFallback(selectedElement);
    dragState.config = window.layoutEditor?.getContainerConfig?.(selector);

    if (action === 'move') {
      dragState.isDragging = true;
      dragState.isResizing = false;

      // 确保元素有定位
      if (window.getComputedStyle(selectedElement).position === 'static') {
        selectedElement.style.position = 'relative';
      }
    } else if (action === 'resize') {
      dragState.isDragging = false;
      dragState.isResizing = true;
      dragState.resizeDirection = direction;

      // 确保元素有定位
      const computedStyle = window.getComputedStyle(selectedElement);
      if (computedStyle.position === 'static') {
        selectedElement.style.position = 'relative';
      }
    }

    // 添加拖拽中样式
    selectionBox.classList.add('dragging');
    selectedElement.classList.add('layout-editor-dragging');

    // 绑定全局事件
    bindGlobalDragEvents();
  }

  /**
   * 处理全局鼠标移动
   * @param {MouseEvent} e - 鼠标事件
   */
  function handleGlobalMouseMove(e) {
    if (!dragState.isDragging && !dragState.isResizing) return;
    
    // 使用 requestAnimationFrame 优化性能
    if (rafId) return;
    
    rafId = requestAnimationFrame(() => {
      rafId = null;
      
      if (dragState.isDragging) {
        handleMove(e);
      } else if (dragState.isResizing) {
        handleResize(e);
      }
    });
  }

  /**
   * 处理移动
   * @param {MouseEvent} e - 鼠标事件
   */
  function handleMove(e) {
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    const element = dragState.element;
    
    // 基于初始margin值计算新的margin值（避免累积误差）
    const startMarginLeft = parseInt(dragState.startStyles.marginLeft) || 0;
    const startMarginTop = parseInt(dragState.startStyles.marginTop) || 0;
    
    let newMarginLeft = startMarginLeft + deltaX;
    let newMarginTop = startMarginTop + deltaY;
    
    // 网格吸附
    if (window.layoutEditor?.settings?.snapToGrid) {
      const gridSize = window.layoutEditor?.settings?.gridSize || 10;
      newMarginLeft = Math.round(newMarginLeft / gridSize) * gridSize;
      newMarginTop = Math.round(newMarginTop / gridSize) * gridSize;
    }
    
    // 应用样式
    element.style.marginLeft = newMarginLeft + 'px';
    element.style.marginTop = newMarginTop + 'px';
    
    // 更新选中框位置
    updateSelectionBoxPosition();
    
    // 更新信息面板
    updateInfoPanel();
  }

  /**
   * 处理拉伸
   * @param {MouseEvent} e - 鼠标事件
   */
  function handleResize(e) {
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    const direction = dragState.resizeDirection;
    
    const element = dragState.element;
    const startRect = dragState.startRect;
    const computedStyle = window.getComputedStyle(element);
    
    let newWidth = startRect.width;
    let newHeight = startRect.height;
    let newMarginLeft = parseInt(computedStyle.marginLeft) || 0;
    let newMarginRight = parseInt(computedStyle.marginRight) || 0;
    let newMarginTop = parseInt(computedStyle.marginTop) || 0;
    let newMarginBottom = parseInt(computedStyle.marginBottom) || 0;
    
    // 是否居中拉伸（按住Shift键）
    const isCentered = e.shiftKey;
    
    // 根据方向调整尺寸和边距
    if (direction.includes('e')) {
      newWidth = startRect.width + deltaX;
      if (isCentered) {
        newWidth = startRect.width + deltaX * 2;
        newMarginLeft = (parseInt(dragState.startStyles.marginLeft) || 0) - deltaX;
      }
    }
    if (direction.includes('w')) {
      newWidth = startRect.width - deltaX;
      newMarginLeft = (parseInt(dragState.startStyles.marginLeft) || 0) + deltaX;
      if (isCentered) {
        newWidth = startRect.width - deltaX * 2;
        newMarginRight = (parseInt(dragState.startStyles.marginRight) || 0) - deltaX;
      }
    }
    if (direction.includes('s')) {
      newHeight = startRect.height + deltaY;
      if (isCentered) {
        newHeight = startRect.height + deltaY * 2;
        newMarginTop = (parseInt(dragState.startStyles.marginTop) || 0) - deltaY;
      }
    }
    if (direction.includes('n')) {
      newHeight = startRect.height - deltaY;
      newMarginTop = (parseInt(dragState.startStyles.marginTop) || 0) + deltaY;
      if (isCentered) {
        newHeight = startRect.height - deltaY * 2;
        newMarginBottom = (parseInt(dragState.startStyles.marginBottom) || 0) - deltaY;
      }
    }
    
    // 网格吸附
    if (window.layoutEditor?.settings?.snapToGrid) {
      const gridSize = window.layoutEditor?.settings?.gridSize || 10;
      newWidth = Math.round(newWidth / gridSize) * gridSize;
      newHeight = Math.round(newHeight / gridSize) * gridSize;
      newMarginLeft = Math.round(newMarginLeft / gridSize) * gridSize;
      newMarginRight = Math.round(newMarginRight / gridSize) * gridSize;
      newMarginTop = Math.round(newMarginTop / gridSize) * gridSize;
      newMarginBottom = Math.round(newMarginBottom / gridSize) * gridSize;
    }
    
    // 最小尺寸限制
    const minSize = 50;
    newWidth = Math.max(minSize, newWidth);
    newHeight = Math.max(minSize, newHeight);
    
    // 应用样式
    element.style.width = newWidth + 'px';
    element.style.height = newHeight + 'px';
    element.style.marginLeft = newMarginLeft + 'px';
    element.style.marginRight = newMarginRight + 'px';
    element.style.marginTop = newMarginTop + 'px';
    element.style.marginBottom = newMarginBottom + 'px';
    
    // 更新选中框
    updateSelectionBoxPosition();
    
    // 更新信息面板
    updateInfoPanel();
    
    // 联动调整父容器或子容器
    adjustRelatedContainers(element, newWidth, newHeight);
  }

  /**
   * 联动调整相关容器
   * @param {HTMLElement} element - 当前元素
   * @param {number} newWidth - 新宽度
   * @param {number} newHeight - 新高度
   */
  function adjustRelatedContainers(element, newWidth, newHeight) {
    // 检查子容器是否超出
    const children = element.children;
    for (let child of children) {
      const childRect = child.getBoundingClientRect();
      const parentRect = element.getBoundingClientRect();
      
      // 如果子容器宽度超出父容器，调整子容器
      if (childRect.width > parentRect.width) {
        child.style.maxWidth = '100%';
        child.style.boxSizing = 'border-box';
      }
    }
    
    // 检查是否超出父容器
    const parent = element.parentElement;
    if (parent && parent !== document.body) {
      const parentRect = parent.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // 如果当前元素超出父容器，调整父容器
      if (elementRect.width > parentRect.width || elementRect.height > parentRect.height) {
        // 可选：自动扩展父容器
        // parent.style.width = elementRect.width + 'px';
        // parent.style.height = elementRect.height + 'px';
      }
    }
  }

  /**
   * 更新选中框位置
   */
  function updateSelectionBoxPosition() {
    if (!selectionBox || !dragState.element) return;
    
    const rect = dragState.element.getBoundingClientRect();
    
    selectionBox.style.left = rect.left + 'px';
    selectionBox.style.top = rect.top + 'px';
    selectionBox.style.width = rect.width + 'px';
    selectionBox.style.height = rect.height + 'px';
  }

  /**
   * 更新信息面板
   */
  function updateInfoPanel() {
    if (!dragState.element) return;
    
    const element = dragState.element;
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    // 更新工具栏信息
    const sizeEl = document.getElementById('le-info-size');
    const positionEl = document.getElementById('le-info-position');
    
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
    const infoContent = selectionBox?.querySelector('.le-info-content');
    if (infoContent) {
      infoContent.innerHTML = `
        <div>宽度: ${Math.round(rect.width)}px</div>
        <div>高度: ${Math.round(rect.height)}px</div>
        <div>左边距: ${computedStyle.marginLeft}</div>
        <div>右边距: ${computedStyle.marginRight}</div>
      `;
    }
  }

  /**
   * 处理全局鼠标释放
   * @param {MouseEvent} e - 鼠标事件
   */
  function handleGlobalMouseUp(e) {
    // 如果不是左键释放，忽略
    if (e.button !== 0) return;

    // 如果没有在拖拽，直接移除全局事件
    if (!dragState.isDragging && !dragState.isResizing) {
      removeGlobalDragEvents();
      return;
    }

    // 保存最终状态到历史记录
    if (dragState.config) {
      const newStyles = {
        width: dragState.element.style.width,
        height: dragState.element.style.height,
        marginLeft: dragState.element.style.marginLeft,
        marginRight: dragState.element.style.marginRight,
        marginTop: dragState.element.style.marginTop,
        marginBottom: dragState.element.style.marginBottom,
        position: dragState.element.style.position
      };

      const selector = window.layoutEditor?.generateSelector?.(dragState.element) ||
                      generateSelectorFallback(dragState.element);

      // 添加到历史记录
      if (window.layoutEditor?.addHistoryRecord) {
        window.layoutEditor.addHistoryRecord(
          dragState.isResizing ? 'resize' : 'move',
          selector,
          dragState.startStyles,
          newStyles
        );
      }

      // 更新配置
      if (dragState.config) {
        Object.assign(dragState.config.currentStyles, newStyles);
      }

      // 应用到同类容器
      if (window.layoutEditor?.settings?.autoApplyToSimilar !== false) {
        applyToSimilarContainers(dragState.element, dragState.config);
      }
    }

    // 清除拖拽状态
    dragState.isDragging = false;
    dragState.isResizing = false;
    dragState.resizeDirection = null;

    // 移除拖拽中样式
    if (selectionBox) {
      selectionBox.classList.remove('dragging');
    }
    if (dragState.element) {
      dragState.element.classList.remove('layout-editor-dragging');
    }

    // 清除高亮
    selectionBox?.querySelectorAll('.le-border, .le-corner').forEach(el => {
      el.classList.remove('active');
    });

    // 移除全局事件监听
    removeGlobalDragEvents();
  }

  /**
   * 处理双击
   * @param {MouseEvent} e - 鼠标事件
   */
  function handleDoubleClick(e) {
    // 双击可以重置为原始尺寸
    if (!dragState.element) return;
    
    const config = dragState.config;
    if (config && config.originalStyles) {
      const original = config.originalStyles;
      dragState.element.style.width = original.width;
      dragState.element.style.height = original.height;
      dragState.element.style.margin = original.margin;
      
      updateSelectionBoxPosition();
      updateInfoPanel();
    }
  }

  /**
   * 获取元素的宽高比类型
   * @param {HTMLElement} element - 元素
   * @returns {string} - 'landscape' | 'portrait' | 'square'
   */
  function getElementAspectRatioType(element) {
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

  /**
   * 应用到同类容器
   * @param {HTMLElement} sourceElement - 源元素
   * @param {Object} sourceConfig - 源配置
   */
  function applyToSimilarContainers(sourceElement, sourceConfig) {
    if (!sourceConfig || !sourceConfig.fingerprint) return;

    // 查找同类容器
    const allElements = document.querySelectorAll('*');
    const sourceSelector = window.layoutEditor?.generateSelector?.(sourceElement) ||
                          generateSelectorFallback(sourceElement);

    // 获取源元素的宽高比类型
    const sourceAspectRatioType = sourceConfig.aspectRatioType || getElementAspectRatioType(sourceElement);

    allElements.forEach(element => {
      // 跳过当前元素
      if (element === sourceElement) return;

      // 跳过编辑器元素
      if (element.closest('#layout-editor-toolbar') ||
          element.closest('#layout-editor-selection')) return;

      // 生成指纹
      const fingerprint = window.layoutEditor?.generateFingerprint?.(element) ||
                         generateFingerprintFallback(element);

      // 如果指纹匹配，应用相同样式
      if (fingerprint === sourceConfig.fingerprint) {
        // 检查宽高比是否匹配
        const targetAspectRatioType = getElementAspectRatioType(element);
        if (targetAspectRatioType !== sourceAspectRatioType) {
          console.log(`[布局编辑器] 同类容器宽高比不匹配，跳过: (源: ${sourceAspectRatioType}, 目标: ${targetAspectRatioType})`);
          return;
        }

        const selector = window.layoutEditor?.generateSelector?.(element) ||
                        generateSelectorFallback(element);

        // 获取或创建配置
        let config = window.layoutEditor?.getContainerConfig?.(selector);
        if (!config) {
          config = window.layoutEditor?.createContainerConfig?.(element, selector);
          if (config && window.layoutEditor?.containers) {
            window.layoutEditor.containers.set(selector, config);
          }
        }

        // 应用样式
        if (config) {
          Object.assign(config.currentStyles, sourceConfig.currentStyles);

          element.style.width = sourceConfig.currentStyles.width;
          element.style.height = sourceConfig.currentStyles.height;
          element.style.marginLeft = sourceConfig.currentStyles.marginLeft;
          element.style.marginRight = sourceConfig.currentStyles.marginRight;
          element.style.marginTop = sourceConfig.currentStyles.marginTop;
          element.style.marginBottom = sourceConfig.currentStyles.marginBottom;
        }

        console.log('[布局编辑器] 样式已应用到同类容器:', selector);
      }
    });
  }

  /**
   * 生成选择器的备用方法
   * @param {HTMLElement} element - 元素
   * @returns {string} - 选择器
   */
  function generateSelectorFallback(element) {
    if (element.id) return `#${element.id}`;
    
    const parts = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.classList.length > 0) {
        const validClasses = Array.from(current.classList).filter(cls => {
          return !cls.match(/^[a-z0-9]+_[a-z0-9]+$/i) && 
                 !cls.startsWith('layout-editor-') &&
                 cls.length > 2;
        });
        
        if (validClasses.length > 0) {
          selector += '.' + validClasses.slice(0, 2).join('.');
        }
      }
      
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

  /**
   * 生成指纹的备用方法
   * @param {HTMLElement} element - 元素
   * @returns {string} - 指纹
   */
  function generateFingerprintFallback(element) {
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

  // 公开API
  window.layoutEditorDragger = {
    init: initDragger,
    removeListeners: removeDragListeners,
    updateSelectionBox: updateSelectionBoxPosition
  };
})();
