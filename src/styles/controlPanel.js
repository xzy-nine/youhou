// 控制面板CSS样式
const controlPanelCSS = `
.weibo-enhance-panel {
    position: fixed;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    background: var(--panel-bg, #ffffff);
    border: 1px solid var(--panel-border, #e1e8ed);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    padding: 16px;
    min-width: 240px; /* 增加宽度以确保所有控件有足够空间显示 */
    /* 添加过渡效果，使方向变化平滑 */
    transition: transform 0.3s ease, left 0.3s ease, right 0.3s ease;
    opacity: 0.9;
    transition: opacity 0.3s ease, transform 0.3s ease, background 0.3s ease;
    z-index: 999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    cursor: move; /* 表明面板可拖动 */
    user-select: none; /* 防止拖动时选中文字 */
}

.weibo-enhance-panel:hover {
    opacity: 1;
}

/* 缩小的齿轮图标状态 */
.weibo-enhance-panel.collapsed {
    min-width: unset;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    padding: 0;
    background: #1890ff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    opacity: 0.8;
    border: none;
    transform: translateY(-50%) scale(1);
    transition: all 0.3s ease;
}

.weibo-enhance-panel.collapsed:hover {
    transform: translateY(-50%) scale(1.1);
    opacity: 1;
}

/* 面板内容容器 */
.panel-content {
    width: 100%;
    opacity: 1;
    transition: opacity 0.3s ease;
}

.weibo-enhance-panel.collapsed .panel-content {
    display: none;
}

/* 齿轮图标 */
.panel-gear-icon {
    display: none; /* 默认隐藏 */
    color: white;
    font-size: 22px;
    animation: spin 10s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.weibo-enhance-panel.collapsed .panel-gear-icon {
    display: block;
}

/* 关闭按钮 */
.panel-close-btn {
    background: none;
    border: none;
    color: var(--panel-text-secondary, #666);
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 8px 12px;
    opacity: 0.8;
    transition: opacity 0.2s ease, transform 0.2s ease;
    border-radius: 6px;
}

.panel-close-btn:hover {
    opacity: 1;
    background: var(--button-hover-bg, #f5f5f5);
    color: var(--button-text, #333);
}

/* 折叠/展开按钮 */
.panel-toggle-btn {
    background: var(--button-bg, #fff);
    border: 1px solid var(--button-border, #ddd);
    border-radius: 6px;
    color: var(--button-text, #333);
    cursor: pointer;
    font-size: 12px;
    padding: 8px 12px;
    opacity: 0.8;
    transition: opacity 0.2s ease;
}

.panel-toggle-btn:hover {
    opacity: 1;
    background: var(--button-hover-bg, #f5f5f5);
}

.weibo-enhance-panel h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--panel-text, #333);
    text-align: center;
    border-bottom: 1px solid var(--panel-border, #e1e8ed);
    padding-bottom: 8px;
}

.weibo-enhance-panel .control-group {
    margin-bottom: 16px;
    width: 100%;
    overflow: visible; /* 确保子元素溢出不会被裁剪 */
    display: block; /* 保证显示为块级元素 */
}

.weibo-enhance-panel .control-group:last-child {
    margin-bottom: 0;
}

.weibo-enhance-panel .control-title {
    font-size: 12px;
    color: var(--panel-text-secondary, #666);
    margin-bottom: 6px;
    font-weight: 500;
}

.weibo-enhance-panel button {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--button-border, #ddd);
    border-radius: 6px;
    background: var(--button-bg, #fff);
    color: var(--button-text, #333);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s ease;
    margin-bottom: 4px;
}

.weibo-enhance-panel button:hover {
    background: var(--button-hover-bg, #f5f5f5);
    border-color: var(--button-hover-border, #bbb);
}

.weibo-enhance-panel button.active {
    background: var(--button-active-bg, #1890ff);
    color: white;
    border-color: var(--button-active-bg, #1890ff);
}

.weibo-enhance-panel .checkbox-control {
    display: flex;
    align-items: center;
    padding: 6px;
    margin-bottom: 4px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s ease;
}

.weibo-enhance-panel .checkbox-control:hover {
    background: var(--checkbox-hover-bg, #f5f5f5);
}

.weibo-enhance-panel .checkbox-control input {
    margin-right: 8px;
}

.weibo-enhance-panel .checkbox-control label {
    font-size: 12px;
    color: var(--panel-text, #333);
    cursor: pointer;
    margin: 0;
}

/* 滑块控件样式 */
.weibo-enhance-panel .range-control {
    margin-top: 8px;
    width: 100%;
}

.weibo-enhance-panel .range-control label {
    display: block;
    font-size: 12px;
    color: var(--panel-text, #333);
    margin-bottom: 6px;
}

.weibo-enhance-panel .range-control input[type="range"] {
    width: 100%;
    height: 5px;
    border-radius: 5px;
    background: var(--panel-border, #e1e8ed);
    outline: none;
    opacity: 0.7;
    -webkit-transition: opacity .2s;
    transition: opacity .2s;
}

.weibo-enhance-panel .range-control input[type="range"]:hover {
    opacity: 1;
}

.weibo-enhance-panel .range-control input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: var(--button-active-bg, #1890ff);
    cursor: pointer;
}

.weibo-enhance-panel .range-control input[type="range"]::-moz-range-thumb {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: var(--button-active-bg, #1890ff);
    cursor: pointer;
}

/* 深色模式样式 */
body.woo-theme-dark .weibo-enhance-panel {
    --panel-bg: #2f3349;
    --panel-border: #484b6a;
    --panel-text: #ffffff;
    --panel-text-secondary: #b3b3b3;
    --button-bg: #404466;
    --button-text: #ffffff;
    --button-border: #484b6a;
    --button-hover-bg: #4a4f73;
    --button-hover-border: #5a5f83;
    --button-active-bg: #1890ff;
    --checkbox-hover-bg: #404466;
}

/* 浅色模式样式 */
body.woo-theme-light .weibo-enhance-panel {
    --panel-bg: #ffffff;
    --panel-border: #e1e8ed;
    --panel-text: #333333;
    --panel-text-secondary: #666666;
    --button-bg: #ffffff;
    --button-text: #333333;
    --button-border: #dddddd;
    --button-hover-bg: #f5f5f5;
    --button-hover-border: #bbbbbb;
    --button-active-bg: #1890ff;
    --checkbox-hover-bg: #f5f5f5;
}

.weibo-enhance-panel .status-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
}

.weibo-enhance-panel .status-indicator.on {
    background: #52c41a;
}

.weibo-enhance-panel .status-indicator.off {
    background: #f5222d;
}

/* 拖动结束后暂时禁用点击 */
.weibo-enhance-panel.dragging-ended {
    pointer-events: none;
}

/* 边缘展开方向控制 */
.weibo-enhance-panel.expand-left {
    right: auto;
    left: 20px;
}

.weibo-enhance-panel.expand-right {
    left: auto;
    right: 20px;
}

/* 确保模糊控制组正确显示 */
#blur-control-group {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    height: auto !important;
}

/* 子控制组样式 */
.weibo-enhance-panel .sub-control-group {
    margin-top: 12px;
    padding: 8px;
    border: 1px solid var(--panel-border, #e1e8ed);
    border-radius: 6px;
    background-color: var(--panel-secondary-bg, rgba(245, 245, 245, 0.5));
}

.weibo-enhance-panel .sub-control-title {
    font-size: 11px;
    color: var(--panel-text-secondary, #666);
    margin-bottom: 8px;
    font-weight: 500;
}

/* 单选框样式 */
.weibo-enhance-panel .radio-control {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 8px;
}

.weibo-enhance-panel .radio-control input[type="radio"] {
    margin-right: 5px;
}

.weibo-enhance-panel .radio-control label {
    margin-right: 12px;
    font-size: 12px;
    color: var(--panel-text, #333);
    cursor: pointer;
    flex: 0 0 auto;
}

/* 小按钮样式 */
.weibo-enhance-panel .small-button {
    font-size: 12px;
    padding: 5px 10px;
    margin: 5px 0;
    background: var(--button-secondary-bg, #f0f7ff);
    border: 1px solid var(--button-secondary-border, #95bfff);
    color: var(--button-secondary-text, #1890ff);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.weibo-enhance-panel .small-button:hover {
    background: var(--button-secondary-hover-bg, #e6f2ff);
    border-color: var(--button-secondary-hover-border, #69a2ff);
}
`;
