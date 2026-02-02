// 布局编辑器样式
const layoutEditorCSS = `
/* 布局编辑器基础样式 */
.layout-editor-active {
  user-select: none !important;
}

/* 工具栏样式 */
#layout-editor-toolbar {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 220px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  color: #333;
  backdrop-filter: blur(10px);
}

#layout-editor-toolbar .toolbar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #e8e8e8;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 8px 8px 0 0;
}

#layout-editor-toolbar .toolbar-title {
  font-weight: 600;
  color: #fff;
  font-size: 14px;
}

#layout-editor-toolbar .toolbar-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

#layout-editor-toolbar .toolbar-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

#layout-editor-toolbar .toolbar-actions {
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

#layout-editor-toolbar .toolbar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 11px;
  color: #666;
}

#layout-editor-toolbar .toolbar-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

#layout-editor-toolbar .toolbar-btn.active {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

#layout-editor-toolbar .toolbar-btn.btn-primary {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

#layout-editor-toolbar .toolbar-btn.btn-primary:hover {
  background: #40a9ff;
}

#layout-editor-toolbar .toolbar-btn.btn-danger {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: #fff;
}

#layout-editor-toolbar .toolbar-btn.btn-danger:hover {
  background: #ff7875;
}

#layout-editor-toolbar .btn-icon {
  font-size: 16px;
  margin-bottom: 2px;
}

#layout-editor-toolbar .toolbar-info {
  padding: 10px 12px;
  border-top: 1px solid #e8e8e8;
  background: #fafafa;
  border-radius: 0 0 8px 8px;
}

#layout-editor-toolbar .info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 11px;
}

#layout-editor-toolbar .info-item:last-child {
  margin-bottom: 0;
}

#layout-editor-toolbar .info-label {
  color: #999;
}

#layout-editor-toolbar .info-value {
  color: #333;
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 遮罩层 */
#layout-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  z-index: 999998;
  pointer-events: none;
}

/* 选中框样式 */
#layout-editor-selection {
  position: fixed;
  border: 2px solid #1890ff;
  z-index: 1000000;
  pointer-events: auto;
  box-sizing: border-box;
}

#layout-editor-selection.dragging {
  opacity: 0.8;
}

/* 边框拉伸区域 */
#layout-editor-selection .le-border {
  position: absolute;
  background: transparent;
  z-index: 1;
}

#layout-editor-selection .le-border:hover,
#layout-editor-selection .le-border.active {
  background: rgba(24, 144, 255, 0.3);
}

#layout-editor-selection .le-border-top {
  top: -6px;
  left: 12px;
  right: 12px;
  height: 12px;
  cursor: ns-resize;
}

#layout-editor-selection .le-border-bottom {
  bottom: -6px;
  left: 12px;
  right: 12px;
  height: 12px;
  cursor: ns-resize;
}

#layout-editor-selection .le-border-left {
  left: -6px;
  top: 12px;
  bottom: 12px;
  width: 12px;
  cursor: ew-resize;
}

#layout-editor-selection .le-border-right {
  right: -6px;
  top: 12px;
  bottom: 12px;
  width: 12px;
  cursor: ew-resize;
}

/* 角落拉伸区域 */
#layout-editor-selection .le-corner {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #1890ff;
  border: 2px solid #fff;
  border-radius: 50%;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

#layout-editor-selection .le-corner:hover,
#layout-editor-selection .le-corner.active {
  background: #40a9ff;
  transform: scale(1.2);
}

#layout-editor-selection .le-corner-tl {
  top: -8px;
  left: -8px;
  cursor: nwse-resize;
}

#layout-editor-selection .le-corner-tr {
  top: -8px;
  right: -8px;
  cursor: nesw-resize;
}

#layout-editor-selection .le-corner-bl {
  bottom: -8px;
  left: -8px;
  cursor: nesw-resize;
}

#layout-editor-selection .le-corner-br {
  bottom: -8px;
  right: -8px;
  cursor: nwse-resize;
}

/* 信息面板 */
#layout-editor-selection .le-info-panel {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}

#layout-editor-selection:hover .le-info-panel,
#layout-editor-selection.dragging .le-info-panel {
  opacity: 1;
}

#layout-editor-selection .le-info-content {
  line-height: 1.4;
}

/* 悬停效果 */
.layout-editor-hover {
  outline: 2px dashed #1890ff !important;
  outline-offset: 2px;
  cursor: crosshair !important;
}

/* 选中效果 */
.layout-editor-selected {
  outline: 2px solid #52c41a !important;
  outline-offset: 2px;
}

/* 拖拽中效果 */
.layout-editor-dragging {
  opacity: 0.9;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 选择模式 */
.layout-editor-selecting * {
  cursor: crosshair !important;
}

.layout-editor-selecting .layout-editor-hover {
  background: rgba(24, 144, 255, 0.1) !important;
}

/* 通知样式 */
.layout-editor-notification {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  padding: 12px 24px;
  background: #52c41a;
  color: #fff;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000001;
  opacity: 0;
  transition: all 0.3s ease;
}

.layout-editor-notification.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.layout-editor-notification.error {
  background: #ff4d4f;
}

/* 辅助线 */
.layout-editor-guides::before,
.layout-editor-guides::after {
  content: '';
  position: fixed;
  background: rgba(24, 144, 255, 0.5);
  pointer-events: none;
  z-index: 999997;
}

.layout-editor-guides::before {
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
}

.layout-editor-guides::after {
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  #layout-editor-toolbar {
    background: rgba(40, 40, 40, 0.95);
    border-color: #444;
    color: #e0e0e0;
  }
  
  #layout-editor-toolbar .toolbar-info {
    background: #333;
    border-color: #444;
  }
  
  #layout-editor-toolbar .info-label {
    color: #888;
  }
  
  #layout-editor-toolbar .info-value {
    color: #e0e0e0;
  }
  
  #layout-editor-toolbar .toolbar-btn {
    background: #333;
    border-color: #444;
    color: #ccc;
  }
  
  #layout-editor-toolbar .toolbar-btn:hover {
    border-color: #1890ff;
    color: #1890ff;
  }
}

/* 响应式 */
@media (max-width: 768px) {
  #layout-editor-toolbar {
    width: 180px;
    right: 10px;
    top: 10px;
  }
  
  #layout-editor-toolbar .toolbar-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}
`;

// 导出样式
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { layoutEditorCSS };
}
