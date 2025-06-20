// ==UserScript==
// @name         微博增强
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  微博增强功能：自动适应深色/浅色模式，评论悬浮窗，页面宽屏显示，支持扩展通知
// @author       You
// @match        https://*.weibo.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // ===========================================
    // 宽屏功能相关代码
    // ===========================================
      // 宽屏存储配置
    let widescreenStore = {
        enabled: GM_getValue('widescreen_enabled', true),
        loose: GM_getValue('widescreen_loose', false),
        notify_enabled: GM_getValue('widescreen_notify_enabled', false), // 默认关闭通知
        ui_visible: GM_getValue('widescreen_ui_visible', true)
    };
    
    // 保存宽屏配置
    function saveWidescreenConfig() {
        GM_setValue('widescreen_enabled', widescreenStore.enabled);
        GM_setValue('widescreen_loose', widescreenStore.loose);
        GM_setValue('widescreen_notify_enabled', widescreenStore.notify_enabled);
        GM_setValue('widescreen_ui_visible', widescreenStore.ui_visible);
    }
      // 微博宽屏CSS样式 - 基于宽屏.js优化版本
    const weiboWidescreenCSS = `
        /* 新版微博宽屏样式 */
        @media screen and (min-width: 1340px) {
            :root {
                --inject-page-width: min(90vw, 1380px);
            }
            
            .inject-widescreen-loose-js {
                --inject-page-width: 90vw;
            }
            
            /* 新版微博主要布局 */
            [class*=Frame_content] {
                --main-width: var(--inject-page-width);
                width: var(--inject-page-width);
            }
            
            [class*=Frame_content] > div:nth-of-type(2) {
                flex: 1;
            }
            
            [class*=Frame_main],
            [class*=Main_full] {
                flex-grow: 1;
            }
            
            /* 微博内容区域优化 */
            .woo-box-wrap[class*=picture_inlineNum3] {
                max-width: 409px;
            }
            
            .u-col-4.woo-box-wrap {
                max-width: 546px;
            }
            
            [class*=content_row] [class*=card-video_videoBox] {
                max-width: 540px;
            }
            
            [class*=content_row] [class*=card-article_pic] {
                max-width: 540px;
            }
            
            [class*=ProfileHeader_pic] {
                overflow: hidden;
            }
            
            /* 返回顶部按钮 */
            [class*=Index_backTop] {
                left: calc(50% + var(--inject-page-width)/2 + var(--frame-mod-gap-space));
                margin-left: 0;
                transform: translateX(0);
            }
        }
        
        /* 视频详情页宽屏样式 */
        @media screen and (min-width: 1450px) {
            [class*=Frame_content2] {
                max-width: none;
                width: var(--inject-page-width);
            }
            
            [class*=Frame_main2] {
                flex-grow: 1;
                padding-right: 20px;
            }
        }
        
        /* 旧版微博宽屏样式 - 兼容支持 */
        @media screen and (min-width: 1300px) {
            :root {
                --inject-page-width-legacy: min(75vw, 1330px);
            }
            
            /* 旧版微博主页 */
            .WB_frame {
                display: flex;
                width: var(--inject-page-width-legacy) !important;
            }
            
            .WB_frame #plc_main {
                display: flex !important;
                flex: 1;
                width: auto !important;
            }
            
            .WB_main_c {
                flex: 1;
            }
            
            .WB_frame_c {
                flex: 1;
            }
            
            /* 微博类型标签 */
            .tab_box {
                display: flex;
            }
            
            .tab_box::after {
                content: none;
            }
            
            .tab_box .fr_box {
                flex: 1;
            }
            
            /* 返回顶部按钮 */
            .W_gotop {
                left: calc(50% + (var(--inject-page-width-legacy) / 2));
                margin-left: 0 !important;
            }
            
            /* 微博时间线 */
            .WB_timeline {
                left: calc(50% + (var(--inject-page-width-legacy) / 2) + 10px);
                margin-left: 0;
            }
        }
        
        /* 微博文章页宽屏样式 */
        @media screen and (min-width: 1150px) {
            #articleRoot .WB_frame {
                width: var(--inject-page-width-legacy);
            }
            
            #articleRoot #plc_main {
                max-width: 100%;
                width: auto;
            }
            
            #articleRoot .WB_frame_a,
            #articleRoot .WB_artical {
                max-width: 100%;
                width: auto;
            }
            
            #articleRoot .main_toppic {
                margin-left: auto;
                margin-right: auto;
            }
            
            #articleRoot .WB_editor_iframe_new {
                width: auto;
            }
            
            .B_artical [node-type=sidebar]>.W_gotop {
                left: calc(50% + var(--inject-page-width-legacy)/2);
                margin-left: 0;
            }
        }
    `;
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
            min-width: 200px;
            opacity: 0.9;
            transition: all 0.3s ease;
            z-index: 999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .weibo-enhance-panel:hover {
            opacity: 1;
            transform: translateY(-50%) scale(1.02);
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
            margin-bottom: 12px;
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
    `;
      // 应用宽屏样式 - 包含新版微博检测
    function applyWidescreenStyles() {
        if (widescreenStore.enabled) {
            GM_addStyle(weiboWidescreenCSS);
            
            // 应用宽屏类
            if (widescreenStore.loose) {
                document.documentElement.classList.add('inject-widescreen-loose-js');
            } else {
                document.documentElement.classList.remove('inject-widescreen-loose-js');
            }
            
            // 检测新版微博
            detectNewWeiboVersion();
            
            // iframe内的宽屏样式
            injectIframeStyles();
        }
    }
      // 检测和处理新版微博
    function detectNewWeiboVersion() {
        // 检查是否为新版微博
        const checkNewVersion = () => {
            const app = document.querySelector('#app');
            if (app && app.__vue__) {
                setupNewWeiboStyles(app.__vue__);
                return true;
            }
            return false;
        };
        
        // 立即检查新版微博
        if (checkNewVersion()) {
            return;
        }
        
        // 检查旧版微博
        setupLegacyWeiboStyles();
        
        // 监听DOM变化，等待Vue应用加载
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.id === 'app' || node.querySelector('#app')) {
                                if (checkNewVersion()) {
                                    observer.disconnect();
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // 5秒后停止监听
        setTimeout(() => observer.disconnect(), 5000);
    }
    
    // 设置旧版微博样式支持
    function setupLegacyWeiboStyles() {
        // 监听文档状态变化
        document.addEventListener('readystatechange', () => {
            // 检查是否存在$CONFIG对象（旧版微博标志）
            if (window.$CONFIG) {
                console.log('[微博宽屏] 检测到旧版微博，正在配置宽屏样式');
                handleLegacyWeiboConfig();
            }
        });
        
        // 如果已经加载完成，立即检查
        if (document.readyState !== 'loading' && window.$CONFIG) {
            handleLegacyWeiboConfig();
        }
    }
      // 处理旧版微博配置
    function handleLegacyWeiboConfig() {
        if (!widescreenStore.enabled) return;
        
        let proxyConfig = null;
        let currentStyleSheet = null;
        const classnamePrefix = 'inject-ws-';
        
        const getClassname = (classname) => `${classnamePrefix}${classname}`;
        
        const applyLegacyStyles = () => {
            const { $CONFIG } = window;
            if (!$CONFIG || !$CONFIG.location) return;
            
            // 移除旧样式和类名
            if (currentStyleSheet) {
                currentStyleSheet.remove();
                currentStyleSheet = null;
            }
            
            // 清理旧的类名
            [...document.body.classList.values()].forEach(item => {
                if (item.startsWith(classnamePrefix)) {
                    document.body.classList.remove(item);
                }
            });
            
            // 根据页面类型应用相应样式
            const pages = {
                // 首页(含特别关注)、我的收藏、我的赞、好友圈
                mainpage: {
                    test: /^v6.*_content_home$/.test($CONFIG.location) || /v6_(fav|likes_outbox|content_friends)/.test($CONFIG.location),
                    styles: getLegacyMainPageStyles
                },
                // 用户资料页、相册、管理中心、粉丝、服务、财经专家、热门话题
                profilepage: {
                    test: /^page_.*_(home|photos|manage|myfollow|service|expert|topic)$/.test($CONFIG.location),
                    styles: getLegacyProfilePageStyles
                },
                // 微博详情
                singleweibo: {
                    test: /^page_.*_single_weibo$/.test($CONFIG.location),
                    styles: getLegacySingleWeiboStyles
                }
            };
            
            const matchedPage = Object.entries(pages).find(([, { test }]) => test);
            if (matchedPage) {
                const [pageType, { styles }] = matchedPage;
                const className = getClassname(pageType);
                document.body.classList.add(className);
                currentStyleSheet = GM_addStyle(styles(className));
                console.log(`[微博宽屏] 应用旧版微博${pageType}页面宽屏样式`);                            if (widescreenStore.notify_enabled) {
                                simpleNotify('新版微博宽屏模式已启用');
                            }
            }
        };
        
        // 创建$CONFIG代理以监听位置变化
        if (window.$CONFIG && !proxyConfig) {
            proxyConfig = new Proxy(window.$CONFIG, {
                set(target, property, value, receiver) {
                    const oldVal = target[property];
                    const succeeded = Reflect.set(target, property, value, receiver);
                    
                    if (property === 'location' && value !== oldVal) {
                        console.log('[微博宽屏] 页面位置变化，重新应用样式');
                        setTimeout(applyLegacyStyles, 100);
                    }
                    
                    return succeeded;
                }
            });
            window.$CONFIG = proxyConfig;
        }
        
        // 立即应用样式
        applyLegacyStyles();
    }
    
    // 获取旧版微博主页样式
    function getLegacyMainPageStyles(classname) {
        return `
            .${classname} .WB_frame {
                display: flex;
                width: var(--inject-page-width-legacy) !important;
            }
            .${classname} #plc_main {
                display: flex !important;
                flex: 1;
                width: auto !important;
            }
            .${classname} .WB_main_c {
                flex: 1;
            }
            .${classname} .tab_box {
                display: flex;
            }
            .${classname} .tab_box::after {
                content: none;
            }
            .${classname} .tab_box .fr_box {
                flex: 1;
            }
            .${classname} .W_gotop {
                left: calc(50% + (var(--inject-page-width-legacy) / 2));
                margin-left: 0 !important;
            }
        `;
    }
    
    // 获取旧版微博个人页面样式
    function getLegacyProfilePageStyles(classname) {
        return `
            .${classname} .WB_frame {
                width: var(--inject-page-width-legacy) !important;
            }
            .${classname} .WB_frame_a, 
            .${classname} .WB_frame_a_fix {
                width: 100%;
            }
            .${classname} #plc_main {
                width: 100% !important;
                display: flex;
            }
            .${classname} #plc_main > div:last-child {
                margin-right: 0;
            }
            .${classname} .WB_frame_c .input_simple_wrap .inputfunc_simple_wrap {
                width: calc(100% - 80px);
            }
            .${classname} .WB_frame_c {
                flex: 1;
            }
            .${classname} .WB_timeline {
                left: calc(50% + (var(--inject-page-width-legacy) / 2) + 10px);
                margin-left: 0;
            }
            .${classname} .W_gotop {
                left: calc(50% + (var(--inject-page-width-legacy) / 2));
                margin-left: 0 !important;
            }
        `;
    }
    
    // 获取旧版微博详情页样式
    function getLegacySingleWeiboStyles(classname) {
        return `
            .${classname} .WB_frame {
                width: var(--inject-page-width-legacy) !important;
            }
            .${classname} #plc_main {
                display: flex !important;
                width: auto !important;
            }
            .${classname} #plc_main .WB_frame_c {
                flex: 1;
            }
            .${classname} .W_gotop {
                left: calc(50% + (var(--inject-page-width-legacy) / 2) - 19px);
                margin-left: 0 !important;
            }
        `;
    }
    
    // 设置新版微博样式
    function setupNewWeiboStyles(vueApp) {
        console.log('[微博宽屏] 检测到新版微博，正在配置宽屏样式');
        
        // 支持的页面类型映射
        const pageStyleMap = new Map([
            [['home', 'mygroups', 'profile', 'nameProfile', 'customProfile', 'bidDetail', 
              'atWeibo', 'cmtInbox', 'likeInbox', 'follow', 'myFollowTab', 'fav', 'like', 
              'weibo', 'list', 'topic', 'search', 'searchResult'], 'home'],
            [['Playdetail'], 'video']
        ]);
        
        let currentStyleSheet = null;
        
        // 应用对应页面样式的函数
        const applyPageStyles = (pageType) => {
            // 移除旧样式
            if (currentStyleSheet) {
                currentStyleSheet.remove();
                currentStyleSheet = null;
            }
            
            if (!widescreenStore.enabled) return;
            
            // 新版微博的样式已经包含在weiboWidescreenCSS中，这里只需要确保应用
            console.log(`[微博宽屏] 应用新版微博${pageType}页面宽屏样式`);
              // 通知用户
            if (widescreenStore.notify_enabled) {
                simpleNotify('新版微博宽屏模式已启用');
            }
        };
        
        // 监听路由变化
        if (vueApp.$router) {
            vueApp.$router.afterEach((to) => {
                console.log('[微博宽屏] 路由变化:', to.name);
                
                for (const [routeNames, pageType] of pageStyleMap.entries()) {
                    if (routeNames.includes(to.name)) {
                        applyPageStyles(pageType);
                        break;
                    }
                }
            });
            
            // 应用当前页面样式
            const currentRoute = vueApp.$route;
            if (currentRoute) {
                for (const [routeNames, pageType] of pageStyleMap.entries()) {
                    if (routeNames.includes(currentRoute.name)) {
                        applyPageStyles(pageType);
                        break;
                    }
                }
            }
        }
    }
    
    // 向iframe注入宽屏样式
    function injectIframeStyles() {
        // 监听iframe加载
        document.addEventListener('load', function(e) {
            if (e.target.tagName === 'IFRAME') {
                try {
                    const iframeDoc = e.target.contentDocument || e.target.contentWindow.document;
                    if (iframeDoc && iframeDoc.head) {
                        const style = iframeDoc.createElement('style');
                        style.textContent = weiboWidescreenCSS;
                        iframeDoc.head.appendChild(style);
                        
                        // 同步宽屏状态到iframe
                        if (widescreenStore.loose) {
                            iframeDoc.documentElement.classList.add('inject-widescreen-loose-js');
                        }
                    }
                } catch (error) {
                    // 跨域iframe无法访问，忽略错误
                    console.log('无法访问iframe内容（可能是跨域）');
                }
            }
        }, true);
        
        // 定期检查并更新已存在的iframe
        setInterval(() => {
            document.querySelectorAll('iframe').forEach(iframe => {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc && iframeDoc.head && !iframeDoc.querySelector('#widescreen-style')) {
                        const style = iframeDoc.createElement('style');
                        style.id = 'widescreen-style';
                        style.textContent = weiboWidescreenCSS;
                        iframeDoc.head.appendChild(style);
                        
                        if (widescreenStore.loose) {
                            iframeDoc.documentElement.classList.add('inject-widescreen-loose-js');
                        }
                    }
                } catch (error) {
                    // 忽略跨域错误
                }
            });
        }, 2000);
    }
      // 创建统一控制面板
    function createControlPanel() {
        // 添加样式只需要添加一次
        if (!document.querySelector('#weibo-enhance-panel-style')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'weibo-enhance-panel-style';
            styleElement.textContent = controlPanelCSS;
            document.head.appendChild(styleElement);
        }
        
        // 如果面板已存在，根据visible状态显示或隐藏
        const existingPanel = document.querySelector('.weibo-enhance-panel');
        if (existingPanel) {
            existingPanel.style.display = widescreenStore.ui_visible ? '' : 'none';
            return existingPanel;
        }
        
        // 如果设置为不可见且没有现有面板，则不创建
        if (!widescreenStore.ui_visible) return null;
        
        const panel = document.createElement('div');
        panel.className = 'weibo-enhance-panel';
        panel.innerHTML = `
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
        `;
        
        // 绑定事件
        bindControlEvents(panel);
        
        document.body.appendChild(panel);
    }
    
    // 绑定控制面板事件
    function bindControlEvents(panel) {
        // 宽屏开关
        const widescreenToggle = panel.querySelector('#widescreen-toggle');
        widescreenToggle.addEventListener('click', () => {
            widescreenStore.enabled = !widescreenStore.enabled;
            saveWidescreenConfig();
            simpleNotify(widescreenStore.enabled ? '宽屏已开启' : '宽屏已关闭');
            setTimeout(() => location.reload(), 300);
        });
        
        // 更宽模式
        const looseMode = panel.querySelector('#loose-mode');
        if (looseMode) {
            looseMode.addEventListener('change', (e) => {
                widescreenStore.loose = e.target.checked;
                saveWidescreenConfig();
                
                if (widescreenStore.loose) {
                    document.documentElement.classList.add('inject-widescreen-loose-js');
                } else {
                    document.documentElement.classList.remove('inject-widescreen-loose-js');
                }
                
                simpleNotify(widescreenStore.loose ? '更宽模式已开启' : '标准宽屏模式');
            });
        }
        
        // 主题切换
        const themeToggle = panel.querySelector('#theme-toggle');
        themeToggle.addEventListener('click', () => {
            const currentMode = getCurrentWebsiteMode();
            const newMode = !currentMode;
            
            userOverride = true;
            GM_setValue('userOverride', true);
            
            isScriptOperation = true;
            setWebsiteMode(newMode);
            isScriptOperation = false;
            
            simpleNotify(newMode ? '已切换到深色模式' : '已切换到浅色模式');
        });
        
        // 重置主题跟随
        const themeReset = panel.querySelector('#theme-reset');
        themeReset.addEventListener('click', () => {
            userOverride = false;
            GM_setValue('userOverride', false);
            const systemIsDark = GM_getValue('lastSystemMode', window.matchMedia('(prefers-color-scheme: dark)').matches);
            
            isScriptOperation = true;
            setWebsiteMode(systemIsDark);
            isScriptOperation = false;
            
            simpleNotify('已恢复跟随系统主题');
        });
        
        // 通知开关
        const notificationToggle = panel.querySelector('#notification-toggle');
        notificationToggle.addEventListener('change', (e) => {
            widescreenStore.notify_enabled = e.target.checked;
            saveWidescreenConfig();
            simpleNotify(widescreenStore.notify_enabled ? '通知已开启' : '通知已关闭');
        });
    }
      // 注册菜单命令（简化版）
    function registerMenus() {        GM_registerMenuCommand('显示/隐藏控制面板', function() {
            widescreenStore.ui_visible = !widescreenStore.ui_visible;
            saveWidescreenConfig();
            
            // 动态显示/隐藏控制面板，而不是重载页面
            const panel = document.querySelector('.weibo-enhance-panel');
            if (panel) {
                if (widescreenStore.ui_visible) {
                    panel.style.display = '';
                } else {
                    panel.style.display = 'none';
                }
            } else if (widescreenStore.ui_visible) {
                // 如果面板不存在但应该显示，则创建面板
                createControlPanel();
            }
            
            simpleNotify(widescreenStore.ui_visible ? '控制面板已显示' : '控制面板已隐藏');
        });
        
        GM_registerMenuCommand('重置所有设置', function() {
            if (confirm('确定要重置所有设置吗？页面将会刷新。')) {
                // 重置宽屏设置
                widescreenStore = {
                    enabled: true,
                    loose: false,
                    notify_enabled: false, // 默认关闭通知
                    ui_visible: true
                };
                saveWidescreenConfig();
                
                // 重置主题设置
                userOverride = false;
                GM_setValue('userOverride', false);
                
                simpleNotify('所有设置已重置');
                setTimeout(() => location.reload(), 500);
            }
        });
    }    // ===========================================
    // 原有的深色模式和评论功能代码
    // ===========================================
    
    // 用户手动覆盖标志
    let userOverride = GM_getValue('userOverride', false);
    // 脚本操作标识（防止脚本自己的操作被误判为用户操作）
    let isScriptOperation = false;

    // DOM观察器，确保主题在页面动态变化时也能正确应用
    let observer = null;
    
    // 状态跟踪变量，用于避免重复通知
    let lastNotifiedMode = null;
    let lastNotifiedOverrideState = null;
    let hasShownInitialNotification = false;

    // 添加评论悬浮窗的CSS样式
    const commentModalCSS = `        .comment-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.3);
            z-index: 10000;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .comment-modal-overlay.show {
            opacity: 1;
        }
        
        /* 右侧点击区域提示 */
        .comment-modal-overlay::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 100px;
            height: 100%;
            background: linear-gradient(to left, rgba(0, 0, 0, 0.1), transparent);
            pointer-events: none;
            transition: background 0.2s ease;
        }
        
        .comment-modal-overlay:hover::after {
            background: linear-gradient(to left, rgba(0, 0, 0, 0.2), transparent);
        }
          .comment-modal {
            background: var(--bg-color, #ffffff);
            border-radius: 0 45px 45px 0;
            box-shadow: 2px 0 40px rgba(0, 0, 0, 0.15);
            max-width: calc(100% - 100px);
            height: calc(100vh - 40px);
            width: calc(100% - 100px);
            margin: 20px 100px 20px 0;
            position: relative;
            overflow: hidden;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
        }
        
        .comment-modal-overlay.show .comment-modal {
            transform: translateX(0);
        }        .comment-modal-header {
            padding: 12px 20px;
            border-bottom: 1px solid var(--border-color, #e1e8ed);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--header-bg, #f7f9fa);
            border-radius: 0 45px 0 0;
            min-height: 40px;
        }
          .comment-modal-title {
            font-size: 14px;
            font-weight: bold;
            color: var(--text-color, #14171a);
        }
          .comment-modal-close {
            width: 28px;
            height: 28px;
            border: none;
            background: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
        }
        
        .comment-modal-close:hover {
            background-color: var(--hover-bg, #f0f0f0);
        }
          .comment-modal-close::before {
            content: '×';
            font-size: 20px;
            color: var(--text-color, #657786);
        }        .comment-modal-content {
            padding: 0;
            height: calc(100vh - 100px);
            overflow: hidden;
            position: relative;
        }
        
        .comment-modal-iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: var(--bg-color, #ffffff);
        }
        
        .comment-modal-loading {
            padding: 40px;
            text-align: center;
            color: var(--text-color, #657786);
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--bg-color, #ffffff);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
        }
        
        /* 深色模式样式 */
        body.woo-theme-dark .comment-modal {
            --bg-color: #1d1f23;
            --border-color: #38444d;
            --header-bg: #15181c;
            --text-color: #ffffff;
            --hover-bg: #273340;
        }
        
        /* 浅色模式样式 */
        body.woo-theme-light .comment-modal {
            --bg-color: #ffffff;
            --border-color: #e1e8ed;
            --header-bg: #f7f9fa;
            --text-color: #14171a;
            --hover-bg: #f0f0f0;
        }
        
        /* 滚动条样式 */
        .comment-modal-content::-webkit-scrollbar {
            width: 6px;
        }
        
        .comment-modal-content::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .comment-modal-content::-webkit-scrollbar-thumb {
            background: var(--border-color, #e1e8ed);
            border-radius: 3px;
        }
        
        .comment-modal-content::-webkit-scrollbar-thumb:hover {
            background: var(--text-color, #657786);
        }
    `;

    // 将CSS样式添加到页面
    function addCommentModalStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = commentModalCSS;
        document.head.appendChild(styleElement);
    }

    // 调试函数：分析页面中的评论相关元素
    function analyzeCommentElements() {
        console.log('=== 微博评论元素分析 ===');
        
        // 查找所有可能的评论相关元素
        const commentSelectors = [
            'a[href*="comment"]',
            'div[class*="comment"]',
            'span[class*="comment"]',
            'i[class*="comment"]',
            'div[class*="toolbar"]',
            'footer',
            '[class*="Feed_func"]',
            'a:contains("评论")',
            'div:contains("条评论")'
        ];
        
        commentSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    console.log(`找到 ${elements.length} 个 "${selector}" 元素:`);
                    elements.forEach((el, index) => {
                        if (index < 3) { // 只显示前3个
                            console.log(`  [${index}]`, {
                                element: el,
                                text: el.textContent?.trim()?.substring(0, 50),
                                className: el.className,
                                href: el.getAttribute('href')
                            });
                        }
                    });
                }
            } catch (e) {
                // 忽略querySelector错误
            }
        });
        
        // 查找页面中的微博ID
        const scripts = document.querySelectorAll('script');
        console.log('页面中的微博ID信息:');
        for (const script of scripts) {
            const content = script.textContent || script.innerText;
            if (content.includes('mid') || content.includes('status')) {
                const midMatches = content.match(/"mid":\s*"([^"]+)"/g);
                const statusMatches = content.match(/\/status\/(\w+)/g);
                if (midMatches) {
                    console.log('  找到MID:', midMatches.slice(0, 3));
                }
                if (statusMatches) {
                    console.log('  找到Status:', statusMatches.slice(0, 3));
                }
                break;
            }
        }
        
        console.log('当前页面URL:', window.location.href);
        console.log('=== 分析完成 ===');
    }

    // 添加调试快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+D 分析评论元素
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            analyzeCommentElements();
        }
    });
    
    // 检查系统颜色模式
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 保存最后一次系统模式
    GM_setValue('lastSystemMode', prefersDarkMode);    // 简化的通知函数
    function simpleNotify(message) {
        if (!widescreenStore.notify_enabled) return;
        
        console.log(`%c[微博增强] ${message}`, 'color: #1890ff; font-weight: bold;');
        
        // 创建简单的页面内通知
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1890ff;
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // 自动消失
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    // 创建评论悬浮窗
    function createCommentModal() {
        const overlay = document.createElement('div');
        overlay.className = 'comment-modal-overlay';
        overlay.innerHTML = `
            <div class="comment-modal">
                <div class="comment-modal-header">
                    <div class="comment-modal-title">评论</div>
                    <button class="comment-modal-close" aria-label="关闭"></button>
                </div>
                <div class="comment-modal-content">
                    <div class="comment-modal-loading">加载中...</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 关闭按钮事件
        const closeBtn = overlay.querySelector('.comment-modal-close');
        closeBtn.addEventListener('click', () => {
            closeCommentModal(overlay);
        });        // 点击遮罩层关闭 - 优化右侧点击区域
        overlay.addEventListener('click', (e) => {
            const clickX = e.clientX;
            const windowWidth = window.innerWidth;
            
            // 右侧100px区域内任何点击都关闭
            if (clickX > windowWidth - 100) {
                closeCommentModal(overlay);
            } 
            // 或者点击的是遮罩层本身（不是modal内容）
            else if (e.target === overlay) {
                closeCommentModal(overlay);
            }
        });
        
        // ESC键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeCommentModal(overlay);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        return overlay;
    }
    
    // 关闭评论悬浮窗
    function closeCommentModal(overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
    
    // 显示评论悬浮窗
    function showCommentModal(commentUrl, commentCount) {
        const modal = createCommentModal();
          // 更新标题
        const title = modal.querySelector('.comment-modal-title');
        title.textContent = '详情';
        
        // 显示动画
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // 加载评论内容
        loadCommentContent(modal, commentUrl);
    }      // 加载评论内容
    function loadCommentContent(modal, commentUrl) {
        const contentDiv = modal.querySelector('.comment-modal-content');
        const loadingDiv = contentDiv.querySelector('.comment-modal-loading');
        
        try {
            // 创建iframe元素
            const iframe = document.createElement('iframe');
            iframe.className = 'comment-modal-iframe';
            iframe.src = commentUrl;
            iframe.onload = function() {
                // iframe加载完成后隐藏loading
                if (loadingDiv) {
                    loadingDiv.style.display = 'none';
                }
                
                // 向iframe注入宽屏样式
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc && iframeDoc.head && widescreenStore.enabled) {
                        const style = iframeDoc.createElement('style');
                        style.id = 'widescreen-style';
                        style.textContent = weiboWidescreenCSS;
                        iframeDoc.head.appendChild(style);
                        
                        // 同步宽屏状态到iframe
                        if (widescreenStore.loose) {
                            iframeDoc.documentElement.classList.add('inject-widescreen-loose-js');
                        }
                        
                        console.log('已向评论iframe注入宽屏样式');
                    }
                } catch (error) {
                    console.log('无法向iframe注入样式（可能是跨域）:', error);
                }
            };
            
            iframe.onerror = function() {
                if (loadingDiv) {
                    loadingDiv.textContent = '加载评论失败，请稍后重试';
                }
            };
            
            // 将iframe添加到内容区域
            contentDiv.appendChild(iframe);
            
        } catch (error) {
            console.error('创建iframe失败:', error);
            if (loadingDiv) {
                loadingDiv.textContent = '加载评论失败，请稍后重试';
            }
        }
    }// 拦截评论相关的点击事件
    function interceptCommentLinks() {
        // 使用事件委托处理动态添加的链接和按钮
        document.addEventListener('click', function(e) {
            // 只监听链接元素，避免拦截普通的按钮和展开功能
            const target = e.target.closest('a[href]');
            if (!target) return;
            
            const linkText = target.textContent || target.innerText || '';
            let href = target.getAttribute('href');
            
            // 确保是有效的链接，排除JavaScript链接和锚点
            if (!href || href === '#' || href.startsWith('javascript:')) return;            
            console.log('检测到链接点击:', {
                target: target,
                linkText: linkText.trim(),
                href: href,
                className: target.className
            });
            
            // 只拦截明确的"查看全部评论"链接
            const isViewAllCommentsLink = 
                // 包含"查看全部"和"评论"的链接
                (linkText.includes('查看全部') && linkText.includes('评论')) ||
                // 匹配"查看全部X条评论"的模式
                /查看全部\s*\d+\s*条?评论/.test(linkText) ||
                // 链接文本只是数字，但链接指向详情页（可能是简化的查看全部评论链接）
                (/^\s*\d+\s*条?评论?\s*$/.test(linkText) && (href.includes('/status/') || href.includes('/detail/')));
            
            if (isViewAllCommentsLink) {
                console.log('拦截查看全部评论链接:', linkText.trim());
                e.preventDefault();
                e.stopPropagation();
                  // 如果没有直接的href，尝试从父级元素或相关元素获取
                if (!href) {
                    const article = target.closest('article');
                    if (article) {
                        // 尝试从文章中找到链接
                        const articleLink = article.querySelector('a[href*="/status/"], a[href*="/detail/"], a[href*="/u/"]');
                        if (articleLink) {
                            href = articleLink.getAttribute('href');
                        }
                        
                        // 尝试从微博ID构建链接
                        if (!href) {
                            const midElement = article.querySelector('[data-mid], [mid]');
                            if (midElement) {
                                const mid = midElement.getAttribute('data-mid') || midElement.getAttribute('mid');
                                if (mid) {
                                    href = `/detail/${mid}`;
                                }
                            }
                        }
                        
                        // 尝试从data属性获取
                        if (!href) {
                            const dataElement = article.querySelector('[data-itemid], [data-id]');
                            if (dataElement) {
                                const itemId = dataElement.getAttribute('data-itemid') || dataElement.getAttribute('data-id');
                                if (itemId) {
                                    href = `/detail/${itemId}`;
                                }
                            }
                        }
                    }
                }
                
                // 尝试从页面元素中提取微博ID
                if (!href) {
                    // 查找页面中的微博链接模式
                    const pageLinks = document.querySelectorAll('a[href*="/status/"], a[href*="/detail/"]');
                    if (pageLinks.length > 0) {
                        // 使用最近添加的微博链接
                        const closestLink = Array.from(pageLinks).find(link => {
                            const rect = link.getBoundingClientRect();
                            const targetRect = target.getBoundingClientRect();
                            return Math.abs(rect.top - targetRect.top) < 200; // 200px范围内
                        });
                        if (closestLink) {
                            href = closestLink.getAttribute('href');
                        }
                    }
                }
                
                // 从当前页面URL构建
                if (!href) {
                    const currentUrl = window.location.href;
                    if (currentUrl.includes('/status/')) {
                        href = currentUrl;
                    } else if (currentUrl.includes('/detail/')) {
                        href = currentUrl;
                    } else if (currentUrl.includes('/u/')) {
                        // 如果在用户页面，尝试获取最新的微博
                        const firstWeiboLink = document.querySelector('a[href*="/status/"], a[href*="/detail/"]');
                        if (firstWeiboLink) {
                            href = firstWeiboLink.getAttribute('href');
                        }
                    }
                }
                
                // 最后的尝试：使用页面标题或其他元素推断
                if (!href) {
                    // 尝试从页面的script标签中提取信息
                    const scripts = document.querySelectorAll('script');
                    for (const script of scripts) {
                        const content = script.textContent || script.innerText;
                        const midMatch = content.match(/"mid":\s*"([^"]+)"/);
                        if (midMatch && midMatch[1]) {
                            href = `/detail/${midMatch[1]}`;
                            break;
                        }
                        const statusMatch = content.match(/\/status\/(\w+)/);
                        if (statusMatch && statusMatch[1]) {
                            href = `/status/${statusMatch[1]}`;
                            break;
                        }
                    }
                }
                
                if (!href) {                    console.log('无法确定评论页面URL，尝试的元素:', target);
                    console.log('当前页面URL:', window.location.href);
                    if (widescreenStore.notify_enabled) {
                        simpleNotify('未找到评论页面链接');
                    }
                    return;
                }
                
                // 提取评论数量
                const commentMatch = linkText.match(/(\d+)/);
                const commentCount = commentMatch ? commentMatch[1] : '全部';
                
                // 构建完整的URL
                const fullUrl = href.startsWith('http') ? href : 
                               href.startsWith('//') ? 'https:' + href :
                               href.startsWith('/') ? window.location.origin + href :
                               window.location.href.split('?')[0] + '/' + href;                showCommentModal(fullUrl, commentCount);
                if (widescreenStore.notify_enabled) {
                    simpleNotify('正在加载评论内容...');
                }
            }
        }, true);    }

    // 保存最后一次系统模式
    GM_setValue('lastSystemMode', prefersDarkMode);

    // 监听系统模式变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const newDarkMode = e.matches;
        const oldSystemMode = GM_getValue('lastSystemMode', prefersDarkMode);
        GM_setValue('lastSystemMode', newDarkMode);            // 只有当系统模式真的发生变化且没有用户手动覆盖时才处理
            if (oldSystemMode !== newDarkMode && !userOverride) {
                isScriptOperation = true; // 标记为脚本操作
                setWebsiteMode(newDarkMode);
                // 只有当模式真的改变时才通知
                if (lastNotifiedMode !== newDarkMode && widescreenStore.notify_enabled) {
                    simpleNotify(`已切换到${newDarkMode ? '深色' : '浅色'}模式`);
                    lastNotifiedMode = newDarkMode;
                }
                isScriptOperation = false; // 重置标记
            }
    });

    // 添加键盘快捷键来重置自动跟随状态
    document.addEventListener('keydown', (e) => {        // Ctrl+Shift+R 重置自动跟随
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            const wasOverride = userOverride;
            userOverride = false;
            GM_setValue('userOverride', false);
            const systemIsDark = GM_getValue('lastSystemMode', window.matchMedia('(prefers-color-scheme: dark)').matches);
            const currentMode = getCurrentWebsiteMode();
              // 只有在状态真的改变时才通知和切换
            if (wasOverride || currentMode !== systemIsDark) {
                isScriptOperation = true;
                setWebsiteMode(systemIsDark);
                if (widescreenStore.notify_enabled) {
                    simpleNotify('恢复自动跟随系统模式');
                }
                lastNotifiedMode = systemIsDark;
                lastNotifiedOverrideState = false;
                isScriptOperation = false;
            }
        }
    });

    // 等待扩展通知API准备就绪    // 移除扩展通知API，使用simpleNotify代替// 统一简化的初始化函数
    function initialize() {
        // 添加评论悬浮窗样式
        addCommentModalStyles();
        
        // 启动评论链接拦截
        interceptCommentLinks();
        
        // 应用宽屏功能
        applyWidescreenStyles();
        
        // 创建控制面板
        if (document.body) {
            createControlPanel();
        } else {
            document.addEventListener('DOMContentLoaded', createControlPanel);
        }
        
        // 设置初始主题模式
        if (!userOverride) {
            const currentWebsiteMode = getCurrentWebsiteMode();
            if (currentWebsiteMode !== prefersDarkMode) {
                isScriptOperation = true;
                setWebsiteMode(prefersDarkMode);
                isScriptOperation = false;
            }
            lastNotifiedMode = prefersDarkMode;
        } else {
            const currentWebsiteMode = getCurrentWebsiteMode();
            console.log(`用户手动设置为${currentWebsiteMode ? '深色' : '浅色'}模式，保持不变`);
            lastNotifiedMode = currentWebsiteMode;
        }
        
        lastNotifiedOverrideState = userOverride;
        
        // 启动成功日志
        console.log('%c[微博增强] 功能已激活', 'color: #28a745; font-weight: bold;');
        if (widescreenStore.notify_enabled) {
            simpleNotify('微博增强功能已激活');
        }
    }

    // 获取当前网站的模式
    function getCurrentWebsiteMode() {
        try {
            const darkModeHistory = localStorage.getItem('darkModeHistory');
            if (darkModeHistory) {
                const parsed = JSON.parse(darkModeHistory);
                if (parsed && parsed.length > 0 && parsed[0].length > 1) {
                    return parsed[0][1] === 1;
                }
            }
        } catch (e) {
            // 静默处理错误
        }

        if (document.body) {
            return document.body.classList.contains("woo-theme-dark");
        }

        return false;
    }    // 设置网站模式
    function setWebsiteMode(isDark) {
        try {
            isScriptOperation = true; // 标记为脚本操作
            const userId = getUserId();
            const modeValue = isDark ? 1 : 0;
            localStorage.setItem('darkModeHistory', `[[${userId},${modeValue}]]`);            // 等待DOM加载完成后再设置class
            const applyTheme = () => {
                if (document.body) {
                    // 先移除可能存在的主题类
                    document.body.classList.remove("woo-theme-dark", "woo-theme-light");
                    
                    if (isDark) {
                        document.body.classList.add("woo-theme-dark");
                        // 也尝试添加到html元素上，有些网站主题是应用在html上的
                        document.documentElement.setAttribute('data-theme', 'dark');
                    } else {
                        document.body.classList.add("woo-theme-light");
                        document.documentElement.setAttribute('data-theme', 'light');
                    }
                      console.log(`[微博主题] 已设置为${isDark ? '深色' : '浅色'}模式`);
                    
                    // 启动DOM观察器，确保主题在页面变化时保持
                    startThemeObserver(isDark);
                    
                    // 触发一个自定义事件，让微博的JS知道主题已改变
                    try {
                        const event = new CustomEvent('themechange', { 
                            detail: { theme: isDark ? 'dark' : 'light' } 
                        });
                        window.dispatchEvent(event);
                    } catch (e) {
                        // 静默处理事件创建失败
                    }
                } else {
                    // 如果body还不存在，等待一下再试
                    setTimeout(applyTheme, 100);
                }
            };

            if (document.readyState === 'loading') {
                // 如果文档还在加载，等待DOM内容加载完成
                document.addEventListener('DOMContentLoaded', applyTheme);
            } else {
                // 文档已加载完成，直接应用主题
                applyTheme();
            }

            isScriptOperation = false; // 重置标记
        } catch (error) {
            isScriptOperation = false; // 确保在错误情况下也重置标记
            showNotification('设置失败', '模式设置出错', 'error');
        }
    }    // 获取用户ID
    function getUserId() {
        let userId = null;

        // 尝试从现有的darkModeHistory中获取用户ID
        try {
            const darkModeHistory = localStorage.getItem('darkModeHistory');
            if (darkModeHistory) {
                const parsed = JSON.parse(darkModeHistory);
                if (parsed && parsed.length > 0 && parsed[0].length > 0) {
                    userId = parsed[0][0];
                }
            }
        } catch (e) {
            console.error("解析darkModeHistory失败:", e);
        }

        // 如果没有找到用户ID，尝试从其他地方获取
        if (!userId) {
            // 尝试从页面获取
            const pageSource = document.documentElement.outerHTML;
            const uidMatch = pageSource.match(/uid=(\d+)/);
            if (uidMatch && uidMatch[1]) {
                userId = parseInt(uidMatch[1], 10);
            }
        }

        // 如果还是没有找到用户ID，使用默认值
        return userId || 0;
    }

    // 启动主题观察器，防止页面动态修改时主题被重置
    function startThemeObserver(isDark) {
        if (observer) {
            observer.disconnect();
        }

        observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'class' && 
                    mutation.target === document.body) {
                    
                    const hasThemeClass = document.body.classList.contains('woo-theme-dark');
                    
                    // 如果主题类被移除或不正确，重新应用
                    if (isDark && !hasThemeClass) {
                        console.log('[微博主题] 检测到主题被重置，重新应用深色主题');
                        document.body.classList.add('woo-theme-dark');
                        document.body.classList.remove('woo-theme-light');
                    } else if (!isDark && hasThemeClass) {
                        console.log('[微博主题] 检测到主题被重置，重新应用浅色主题');
                        document.body.classList.remove('woo-theme-dark');
                        document.body.classList.add('woo-theme-light');
                    }
                }
            });
        });

        if (document.body) {
            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
    }

    // 监听localStorage变化以检测用户手动切换模式
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        const result = originalSetItem.apply(this, arguments);        if (key === 'darkModeHistory') {
            try {
                const parsed = JSON.parse(value);
                if (parsed && parsed.length > 0 && parsed[0].length > 1) {
                    const currentIsDark = parsed[0][1] === 1;
                    const systemIsDark = GM_getValue('lastSystemMode', prefersDarkMode);

                    // 只有在非脚本操作且页面已加载完成时才判断为用户操作
                    const isUserAction = !isScriptOperation && document.readyState === 'complete';

                    if (isUserAction) {
                        const newOverrideState = currentIsDark !== systemIsDark;
                        
                        // 只有当覆盖状态真的发生变化时才通知
                        if (newOverrideState !== userOverride || lastNotifiedOverrideState !== newOverrideState) {
                            userOverride = newOverrideState;
                            GM_setValue('userOverride', newOverrideState);
                            lastNotifiedOverrideState = newOverrideState;
                              if (newOverrideState && widescreenStore.notify_enabled) {
                                simpleNotify(currentIsDark ? '深色模式已锁定' : '浅色模式已锁定');
                            } else if (!newOverrideState && widescreenStore.notify_enabled) {
                                simpleNotify('已恢复系统同步');
                            }
                            lastNotifiedMode = currentIsDark;
                        }
                    }
                }
            } catch (e) {
                // 静默处理错误
            }
        }

        return result;
    };    // 初始化函数
    function initialize() {
        // 等待页面加载完成后设置初始模式
        const setInitialMode = () => {
            // 添加评论悬浮窗样式
            addCommentModalStyles();
            
            // 启动评论链接拦截
            interceptCommentLinks();
              // 应用宽屏功能
            applyWidescreenStyles();
            
            // 创建控制面板
            if (document.body) {
                createControlPanel();
            } else {
                document.addEventListener('DOMContentLoaded', createControlPanel);
            }
            
            if (!userOverride) {
                const currentWebsiteMode = getCurrentWebsiteMode();
                // 只有当当前模式与期望模式不同时才切换
                if (currentWebsiteMode !== prefersDarkMode) {
                    isScriptOperation = true;
                    setWebsiteMode(prefersDarkMode);
                    isScriptOperation = false;
                }
                lastNotifiedMode = prefersDarkMode;
            } else {
                const currentWebsiteMode = getCurrentWebsiteMode();
                console.log(`用户手动设置为${currentWebsiteMode ? '深色' : '浅色'}模式，保持不变`);
                lastNotifiedMode = currentWebsiteMode;
            }
            
            lastNotifiedOverrideState = userOverride;
              // 只显示一次初始化通知
            if (!hasShownInitialNotification) {
                hasShownInitialNotification = true;
                if (widescreenStore.notify_enabled) {
                    simpleNotify('微博增强功能已激活');
                }
                console.log('%c[微博增强] 脚本已启动', 'color: #28a745; font-weight: bold;');
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setInitialMode);
        } else {
            setInitialMode();
        }
    }
    
    // 初始化
    initialize();
      // 注册菜单命令
    registerMenus();
    
    // 页面完全加载后不再显示额外的状态指示器，避免重复通知
    // 初始化通知已经在 initialize 函数中处理

})();
