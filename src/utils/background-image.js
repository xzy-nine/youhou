// 背景图片管理功能
// backgroundStore, saveBackgroundConfig, chromeStorage 从chrome-storage.js全局获取
// simpleNotify 从notification.js全局获取

// 添加全局状态跟踪，防止重复加载
let backgroundImageLoadState = {
    isLoading: false,
    loadedUrl: null,
    loadSuccess: false
};

// 必应图片缓存键和过期时间（6小时）
const BING_CACHE_KEY = 'weibo_bing_background';
const CACHE_EXPIRATION = 6 * 60 * 60 * 1000; // 6小时

/**
 * 获取必应每日图片
 * @returns {Promise<string|null>} 图片URL，失败返回null
 */
async function fetchBingImage() {
    try {
        console.log('[微博背景] 向后台脚本请求必应图片...');
        
        // 向后台脚本发送消息请求必应图片
        const result = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'fetchBingImage' }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
        
        if (result.success) {
            console.log('[微博背景] 成功从后台脚本获取必应图片:', result.url);
            return result.url;
        } else {
            throw new Error(result.error || '未知错误');
        }
        
    } catch (error) {
        console.error('[微博背景] 获取必应图片出错:', error);
        
        // 显示错误通知
        simpleNotify(`获取必应每日图片失败，将使用淡蓝色背景`);
        
        // 返回默认背景
        return null;
    }
}

/**
 * 获取背景URL
 * @returns {Promise<string|null>} 背景URL
 */
async function getBackgroundUrl() {
    console.log('[微博背景] 获取背景URL，当前配置:', {
        enabled: backgroundStore.enabled,
        type: backgroundStore.type,
        url: backgroundStore.url ? backgroundStore.url.substring(0, 100) + '...' : 'null'
    });
    
    if (!backgroundStore.enabled) {
        console.log('[微博背景] 背景功能已禁用');
        return null;
    }

    try {
        switch (backgroundStore.type) {
            case 'bing':
                console.log('[微博背景] 使用必应每日图片');
                return await fetchBingImage();
            case 'custom':
                console.log('[微博背景] 使用自定义背景，URL是否存在:', !!backgroundStore.url);
                return backgroundStore.url || null;
            case 'gradient':
                console.log('[微博背景] 使用渐变背景');
                return null; // 渐变背景在CSS中实现
            default:
                console.log('[微博背景] 默认使用必应每日图片');
                return await fetchBingImage();
        }
    } catch (error) {
        console.error('[微博背景] 获取背景URL失败:', error);
        return null;
    }
}

/**
 * 应用背景图片到页面
 */
async function applyBackground() {
    // 检查当前URL是否为搜索页面，如果是则禁用背景功能
    const currentUrl = window.location.href;
    if (currentUrl.includes('s.weibo.com/weibo?q=')) {
        console.log('[微博背景] 在搜索页面 s.weibo.com/weibo?q= 下禁用背景功能');
        // 清理现有背景和样式
        const existingBg = document.querySelector('#weibo-blur-background');
        if (existingBg) {
            existingBg.remove();
        }
        const transparencyStyle = document.getElementById('weibo-background-transparency-style');
        if (transparencyStyle) {
            transparencyStyle.remove();
        }
        return;
    }
    
    // 确保存储已初始化
    if (!backgroundStore || backgroundStore.enabled === undefined) {
        console.warn('[微博背景] 存储未初始化，等待2秒后重试...');
        setTimeout(() => {
            if (backgroundStore && backgroundStore.enabled !== undefined) {
                applyBackground();
            } else {
                console.error('[微博背景] 存储初始化失败，无法应用背景');
            }
        }, 2000);
        return;
    }
      if (!backgroundStore.enabled) {
        console.log('[微博背景] 背景功能已禁用');
        // 清理现有背景和样式
        const existingBg = document.querySelector('#weibo-blur-background');
        if (existingBg) {
            existingBg.remove();
        }
        const transparencyStyle = document.getElementById('weibo-background-transparency-style');
        if (transparencyStyle) {
            transparencyStyle.remove();
        }
        return;
    }    try {
        console.log('[微博背景] 开始应用背景...');
        
        // 获取背景图片URL - 用于状态检查
        const backgroundUrlCheck = backgroundStore.url;
        
        // **关键修复**: 检查图片是否已经成功加载过相同URL
        if (backgroundImageLoadState.loadSuccess && backgroundImageLoadState.loadedUrl === backgroundUrlCheck && backgroundUrlCheck) {
            console.log('[微博背景] 图片已成功加载过，检查背景元素状态:', backgroundUrlCheck.substring(0, 50) + '...');
            const backgroundElement = document.getElementById('weibo-blur-background');
            if (backgroundElement && backgroundElement.style.backgroundImage.includes(backgroundUrlCheck)) {
                console.log('[微博背景] 背景图片已正确应用，跳过重复加载');
                // 确保样式正确
                backgroundElement.style.setProperty('z-index', '-1', 'important');
                backgroundElement.style.setProperty('position', 'fixed', 'important');
                forceApplyContainerStyles();
                return;
            } else {
                console.log('[微博背景] 背景元素丢失或样式错误，重新创建');
            }
        }

        // **关键修复**: 如果正在加载相同URL，避免重复加载
        if (backgroundImageLoadState.isLoading && backgroundImageLoadState.loadedUrl === backgroundUrlCheck && backgroundUrlCheck) {
            console.log('[微博背景] 图片正在加载中，跳过重复请求:', backgroundUrlCheck.substring(0, 50) + '...');
            return;
        }
        
        // 移除现有背景元素
        const existingBg = document.querySelector('#weibo-blur-background');
        if (existingBg) {
            existingBg.remove();
        }
          // 创建背景元素
        const backgroundElement = document.createElement('div');
        backgroundElement.id = 'weibo-blur-background';            // 基本样式 - 参考youhou分支的正确实现
        const baseStyle = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100vw;
            height: 100vh;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: ${backgroundStore.opacity};
            z-index: -1;
            pointer-events: none;
            will-change: opacity;
            transition: opacity 0.5s ease;
            background-color: rgba(173, 216, 230, 0.5);
        `;
        
        backgroundElement.style.cssText = baseStyle;
          // 立即添加到页面最前面 - 参考youhou分支的正确插入方式
        if (document.body.firstChild) {
            document.body.insertBefore(backgroundElement, document.body.firstChild);
        } else {
            document.body.appendChild(backgroundElement);
        }        
        // 强制应用容器样式
        forceApplyContainerStyles();
        
        // 延迟再次应用容器样式，确保在DOM完全加载后生效
        setTimeout(() => {
            forceApplyContainerStyles();
        }, 500);
        
        // 添加微博内容半透明样式
        addContentTransparencyStyles();
          // 获取背景URL
        const backgroundUrl = await getBackgroundUrl();
        
        // **关键修复**: 设置加载状态，防止重复请求
        if (backgroundUrl && backgroundStore.type !== 'gradient') {
            backgroundImageLoadState = {
                isLoading: true,
                loadedUrl: backgroundUrl,
                loadSuccess: false
            };
            console.log('[微博背景] 开始加载图片，设置状态标志:', backgroundUrl.substring(0, 50) + '...');
        }        // 处理渐变背景的特殊情况
        if (backgroundStore.type === 'gradient') {
            console.log('[微博背景] 应用渐变背景');
            // 重置图片加载状态
            backgroundImageLoadState = {
                isLoading: false,
                loadedUrl: null,
                loadSuccess: false
            };
            // 清除初始背景色，设置渐变背景
            backgroundElement.style.backgroundColor = '';
            backgroundElement.style.background = `linear-gradient(135deg, 
                rgba(74, 144, 226, 0.3) 0%, 
                rgba(80, 200, 120, 0.3) 100%)`;
            console.log('[微博背景] 渐变背景应用完成');
            return;
        }        if (!backgroundUrl) {
            console.error('[微博背景] 无法应用背景，URL为空');
            console.error('[微博背景] 详细信息:', {
                backgroundStore: backgroundStore,
                type: backgroundStore?.type,
                enabled: backgroundStore?.enabled,
                url: backgroundStore?.url
            });
            
            // **关键修复**: URL为空时重置状态
            backgroundImageLoadState = {
                isLoading: false,
                loadedUrl: null,
                loadSuccess: false
            };
            
            simpleNotify('无法加载背景图片，请尝试切换背景类型或刷新页面');
            
            // 提供一个默认的淡蓝色背景
            backgroundElement.style.backgroundColor = '';
            backgroundElement.style.background = `linear-gradient(135deg, 
                rgba(74, 144, 226, 0.1) 0%, 
                rgba(80, 200, 120, 0.1) 100%)`;
            
            // 暴露诊断函数到控制台
            console.log('[微博背景] 可以在控制台运行 diagnoseBackgroundStatus() 进行诊断');
            return;
        }

        console.log('[微博背景] 获取到背景URL:', backgroundUrl.substring(0, 100) + '...');        // 预加载图片
        const preloadImg = new Image();
        
        // 设置标志，以便跟踪图片是否成功加载
        let imageLoadSuccess = false;
        let imageLoadCompleted = false;        // 设置超时机制，如果10秒内图片没有加载成功，就使用后备方案
        const imageTimeout = setTimeout(() => {
            if (!imageLoadCompleted) {
                console.warn('[微博背景] 图片加载超时，使用渐变背景作为后备');
                imageLoadCompleted = true;
                // **关键修复**: 更新全局状态 - 加载失败
                backgroundImageLoadState = {
                    isLoading: false,
                    loadedUrl: backgroundUrl,
                    loadSuccess: false
                };
                // 切换到渐变背景
                backgroundElement.style.backgroundColor = '';
                backgroundElement.style.background = `linear-gradient(135deg, 
                    rgba(74, 144, 226, 0.3) 0%, 
                    rgba(80, 200, 120, 0.3) 100%)`;
                simpleNotify('背景图片加载超时，已使用渐变背景');
            }
        }, 10000); // 延长到10秒，给图片更多加载时间

        // 图片加载完成后设置背景图 - 参考youhou分支实现，增强稳定性
        preloadImg.onload = () => {
            imageLoadSuccess = true;
            imageLoadCompleted = true;
            clearTimeout(imageTimeout); // 清除超时定时器
            
            // **关键修复**: 更新全局状态 - 加载成功
            backgroundImageLoadState = {
                isLoading: false,
                loadedUrl: backgroundUrl,
                loadSuccess: true
            };
            
            console.log('[微博背景] 背景图片加载成功，更新状态标志');
            console.log('[微博背景] 图片信息:', {
                width: preloadImg.naturalWidth,
                height: preloadImg.naturalHeight,
                complete: preloadImg.complete,
                url: backgroundUrl.substring(0, 50) + '...'
            });
            
            // 设置背景图片，保留淡蓝色作为混合
            backgroundElement.style.backgroundImage = `url("${backgroundUrl}")`;
            
            // 强化背景元素的样式，防止被覆盖
            backgroundElement.style.setProperty('z-index', '-1', 'important');
            backgroundElement.style.setProperty('position', 'fixed', 'important');
            backgroundElement.style.setProperty('top', '0', 'important');
            backgroundElement.style.setProperty('left', '0', 'important');
            backgroundElement.style.setProperty('width', '100vw', 'important');
            backgroundElement.style.setProperty('height', '100vh', 'important');
            backgroundElement.style.setProperty('pointer-events', 'none', 'important');
            
            // 移除淡蓝色背景，仅在加载完成后
            setTimeout(() => {
                const currentBgElement = document.getElementById('weibo-blur-background');
                if (currentBgElement) {
                    currentBgElement.style.backgroundColor = 'transparent';
                    // 再次确保样式稳定
                    currentBgElement.style.setProperty('z-index', '-1', 'important');
                    currentBgElement.style.setProperty('position', 'fixed', 'important');
                    simpleNotify('背景图片应用成功');
                }
            }, 300);
        };        preloadImg.onerror = (event) => {
            imageLoadSuccess = false;
            imageLoadCompleted = true;
            clearTimeout(imageTimeout); // 清除超时定时器
            
            // **关键修复**: 更新全局状态 - 加载失败
            backgroundImageLoadState = {
                isLoading: false,
                loadedUrl: backgroundUrl,
                loadSuccess: false
            };
            
            console.error('[微博背景] 背景图片加载失败，更新状态标志:', backgroundUrl);
            console.error('[微博背景] 加载失败详情:', {
                event: event,
                naturalWidth: preloadImg.naturalWidth,
                naturalHeight: preloadImg.naturalHeight,
                complete: preloadImg.complete
            });
            
            // 显示错误通知并保持淡蓝色调试背景
            simpleNotify('背景图片加载失败，使用纯色背景');
            
            // 确保背景色可见
            backgroundElement.style.backgroundImage = 'none';
            backgroundElement.style.backgroundColor = 'rgba(173, 216, 230, 0.3)';
              // 记录加载失败
            console.log('[微博背景] 使用淡蓝色背景作为回退');
        };        // 开始预加载图片
        console.log('[微博背景] 开始预加载图片:', backgroundUrl);
        
        // 验证 URL 格式
        try {
            new URL(backgroundUrl);
            console.log('[微博背景] URL 格式验证通过');
        } catch (e) {
            console.error('[微博背景] URL 格式无效:', backgroundUrl, e);
            // 如果 URL 无效，直接使用渐变背景
            backgroundElement.style.backgroundColor = '';
            backgroundElement.style.background = `linear-gradient(135deg, 
                rgba(74, 144, 226, 0.3) 0%, 
                rgba(80, 200, 120, 0.3) 100%)`;
            simpleNotify('背景图片URL无效，已使用渐变背景');
            return;
        }
        
        preloadImg.src = backgroundUrl;
          // 设置背景持久化监听
        setupBackgroundPersistence();
        
        // 延迟强化背景显示，解决"显示一会儿就消失"的问题
        setTimeout(() => {
            reinforceBackgroundDisplay();
        }, 1000);
        
        // 定期强化背景显示
        if (window.__weiboBackgroundReinforceInterval) {
            clearInterval(window.__weiboBackgroundReinforceInterval);
        }
        window.__weiboBackgroundReinforceInterval = setInterval(() => {
            reinforceBackgroundDisplay();
        }, 3000); // 每3秒强化一次
          } catch (error) {
        console.error('[微博背景] 应用背景时出错:', error);
        // **关键修复**: 出错时重置状态
        backgroundImageLoadState = {
            isLoading: false,
            loadedUrl: null,
            loadSuccess: false
        };
        simpleNotify('应用背景图片时出错，请检查设置');
    }
}

/**
 * 设置背景持久化监听，防止被页面路由变化清除
 */
function setupBackgroundPersistence() {
    // 保存全局引用
    window.__weiboBackgroundObserver = null;
    
    // 如果已存在观察器，先销毁
    if (window.__weiboBackgroundObserver) {
        window.__weiboBackgroundObserver.disconnect();
    }
      // 定期检查背景是否可见 - 增加检查频率，增强稳定性
    const periodicCheck = setInterval(() => {
        // 如果背景功能启用，但背景元素丢失，则重新应用
        if (backgroundStore.enabled) {
            const backgroundElement = document.getElementById('weibo-blur-background');
            if (!backgroundElement) {
                console.log('[微博背景] 定期检查: 背景元素丢失，重新应用背景');
                applyBackground();
            } else {
                // 检查是否可见 - 这里我们检查计算样式
                const style = window.getComputedStyle(backgroundElement);
                if (style.display === 'none' || parseFloat(style.opacity) === 0 || style.visibility === 'hidden') {
                    console.log('[微博背景] 定期检查: 背景元素不可见，重置样式');
                    backgroundElement.style.display = 'block';
                    backgroundElement.style.opacity = backgroundStore.opacity;
                    backgroundElement.style.visibility = 'visible';                }
                
                // 强化z-index和position检查，防止被覆盖
                if (style.zIndex !== '-1' || style.position !== 'fixed') {
                    console.log('[微博背景] 定期检查: 背景样式被修改，温和重设');
                    backgroundElement.style.setProperty('z-index', '-1', 'important');
                    backgroundElement.style.setProperty('position', 'fixed', 'important');
                    // 其他样式使用普通设置，避免过度强制
                    backgroundElement.style.top = '0';
                    backgroundElement.style.left = '0';
                    backgroundElement.style.width = '100vw';
                    backgroundElement.style.height = '100vh';
                    backgroundElement.style.pointerEvents = 'none';
                }
                
                // 重新应用容器样式，确保层级正确
                forceApplyContainerStyles();
            }
        }
    }, 2000); // 每2秒检查一次，增加频率
    
    // 保存引用以便清除
    window.__weiboBackgroundCheckInterval = periodicCheck;
      // 创建一个MutationObserver来监听DOM变化 - 增强检测和修复能力
    const observer = new MutationObserver((mutations) => {
        // 减少防抖时间，提高响应速度
        if (window.__weiboBackgroundDebounce) {
            clearTimeout(window.__weiboBackgroundDebounce);
        }
        
        window.__weiboBackgroundDebounce = setTimeout(() => {
            // 检查背景元素是否还存在
            const backgroundElement = document.querySelector('#weibo-blur-background');
            if (!backgroundElement && backgroundStore.enabled) {
                console.log('[微博背景] 检测到背景元素丢失，重新应用背景');
                applyBackground();
            } else if (backgroundElement) {
                // 更强的样式保护，使用!important确保不被覆盖
                const style = window.getComputedStyle(backgroundElement);
                
                if (style.zIndex !== '-1' || 
                    style.position !== 'fixed' || 
                    style.display === 'none' ||
                    parseFloat(style.opacity) === 0 ||
                    style.visibility === 'hidden') {
                      console.log('[微博背景] 检测到背景样式异常，温和修复');
                    
                    // 只强制设置关键的背景层级样式
                    backgroundElement.style.setProperty('z-index', '-1', 'important');
                    backgroundElement.style.setProperty('position', 'fixed', 'important');
                    
                    // 其他样式使用普通设置
                    backgroundElement.style.top = '0';
                    backgroundElement.style.left = '0';
                    backgroundElement.style.width = '100vw';
                    backgroundElement.style.height = '100vh';
                    backgroundElement.style.pointerEvents = 'none';
                }
                
                // 重新应用容器样式，防止新加载的内容覆盖背景                forceApplyContainerStyles();
            }
        }, 200); // 减少到200ms，提高响应速度
    });
    
    // 开始观察
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
      // 保存观察器引用
    window.__weiboBackgroundObserver = observer;
}

/**
 * 添加内容半透明样式
 */
function addContentTransparencyStyles() {
    // 检查当前URL是否为搜索页面，如果是则禁用透明功能
    const currentUrl = window.location.href;
    if (currentUrl.includes('s.weibo.com/weibo?q=')) {
        console.log('[微博背景] 在搜索页面 s.weibo.com/weibo?q= 下禁用透明功能');
        // 清理现有的透明样式
        const styleId = 'weibo-background-transparency-style';
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }
        return;
    }
    
    if (!backgroundStore.content_transparency) {
        console.log('[微博背景] 内容半透明功能已禁用');
        return;
    }

    const styleId = 'weibo-background-transparency-style';
    let existingStyle = document.getElementById(styleId);
    
    if (!existingStyle) {
        existingStyle = document.createElement('style');
        existingStyle.id = styleId;
        document.head.appendChild(existingStyle);
    }    // 获取用户设置的模糊程度和不透明度
    const blurPixels = backgroundStore.content_blur || 1;
    const opacity = backgroundStore.content_opacity !== undefined ? backgroundStore.content_opacity : 0.7;
      // 检测深色模式 - 优先使用标准的微博主题类名
    const isDarkMode = document.body && document.body.classList.contains('woo-theme-dark') ||
                       document.documentElement && document.documentElement.classList.contains('woo-theme-dark') ||
                       document.documentElement && document.documentElement.getAttribute('data-theme') === 'dark' ||
                       // 备用检测方法
                       (document.documentElement && (
                           document.documentElement.classList.contains('dark') ||
                           document.documentElement.classList.contains('theme-dark') ||
                           document.documentElement.classList.contains('dark-mode')
                       )) ||
                       (document.body && (
                           document.body.classList.contains('dark') ||
                           document.body.classList.contains('theme-dark') ||
                           document.body.classList.contains('dark-mode')
                       ));
    
    console.log('[微博背景] 深色模式检测结果:', {
        isDarkMode: isDarkMode,
        documentElement_classes: document.documentElement.className,
        body_classes: document.body.className,
        documentElement_bg: window.getComputedStyle(document.documentElement).backgroundColor,
        body_bg: window.getComputedStyle(document.body).backgroundColor
    });
    
    const bgColor = isDarkMode ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;
    
    console.log('[微博背景] 应用背景颜色:', bgColor);// 为微博内容添加半透明背景的CSS
    existingStyle.textContent = `
        /* 主要内容容器 - 优先针对微博文章 */
        article,
        #scroller > div.vue-recycle-scroller__item-wrapper > div > div > article,
        #scroller > div.vue-recycle-scroller__item-wrapper > div:nth-child(n) > div > article {
            background-color: ${bgColor} !important;
            backdrop-filter: blur(${blurPixels}px) !important;
            border-radius: 8px !important;
            margin: 5px 0 !important;
            padding: 10px !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
            transition: backdrop-filter 0.3s ease, background-color 0.3s ease !important;
        }
        
        /* 确保内部内容透明 */
        article .wbpro-feed-content,
        article div[class*="feed-content"],
        article div[class*="Feed_body"] > div {
            background-color: transparent !important;
            box-shadow: none !important;
            border-radius: 0 !important;
        }        /* 确保页面主容器有正确的z-index - 移除过度强制的设置 */
        #app,
        #app > div:not(.woo-modal-wrap),
        body,
        main,
        [role="main"],
        #scroller,
        .vue-recycle-scroller {
            position: relative;
            z-index: 1;
        }
        
        /* 确保弹窗有更高的z-index */
        .woo-modal-wrap,
        .woo-modal-main,
        #app > div.woo-modal-wrap,
        #app > div.woo-box-flex.woo-box-alignCenter.woo-box-justifyCenter.woo-modal-wrap {
            z-index: 9999 !important;
            position: fixed !important;
        }
        
        /* 确保背景元素在最底层 */
        #weibo-blur-background {
            z-index: -1 !important;
            position: fixed !important;
        }
    `;

    console.log('[微博背景] 半透明样式已应用');
}

/**
 * 清理可能被错误应用的半透明效果
 */
function cleanupUnintendedTransparency() {
    console.log('[微博背景] 开始清理意外的半透明效果...');
    
    // 获取所有应用了backdrop-filter的元素
    const allElements = document.querySelectorAll('*');
    let cleanedCount = 0;
    
    allElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const hasBlur = style.backdropFilter && style.backdropFilter !== 'none';
        
        if (hasBlur) {
            // 检查是否是预期的元素（微博文章）
//             const isArticle = element.tagName === 'ARTICLE';            const isInArticleContainer = element.closest('article');
            const hasCorrectId = element.id === 'weibo-blur-background';
            
            // 如果不是预期的元素，清理其样式
            if (!isArticle && !isInArticleContainer && !hasCorrectId) {
                // 检查是否是由我们的样式表应用的
                const styleElement = document.getElementById('weibo-background-transparency-style');
                if (styleElement) {
                    // 重置这个元素的样式
                    element.style.backdropFilter = '';
                    element.style.backgroundColor = '';
                    element.style.borderRadius = '';
                    element.style.boxShadow = '';
                    cleanedCount++;
                    
                    console.log('[微博背景] 清理了意外元素:', element.tagName, element.className);
                }
            }
        }
    });
    
    console.log(`[微博背景] 清理完成，共清理了 ${cleanedCount} 个元素`);
    return cleanedCount;
}

/**
 * 切换背景启用状态
 * @param {boolean} enabled 是否启用
 */
async function toggleBackgroundEnabled(enabled) {
    backgroundStore.enabled = enabled;
    await saveBackgroundConfig();
    
    if (enabled) {
        applyBackground();
        simpleNotify('背景功能已启用');
    } else {
        const bg = document.querySelector('#weibo-blur-background');
        if (bg) bg.remove();
        
        const style = document.getElementById('weibo-background-transparency-style');
        if (style) style.remove();
        
        simpleNotify('背景功能已禁用');
    }
}

/**
 * 切换背景启用状态
 */
function toggleBackgroundEnabled() {
    if (backgroundStore) {
        backgroundStore.enabled = !backgroundStore.enabled;
        saveBackgroundConfig();
        
        if (backgroundStore.enabled) {
            console.log('[微博背景] 背景已启用');
            applyBackground();        } else {
            console.log('[微博背景] 背景已禁用');
            const bgElement = document.querySelector('#weibo-blur-background');
            if (bgElement) {
                bgElement.remove();
            }
        }
        
        simpleNotify(backgroundStore.enabled ? '背景功能已启用' : '背景功能已禁用');
    }
}

/**
 * 设置背景类型
 * @param {string} type 背景类型 ('bing', 'custom', 'gradient')
 */
async function setBackgroundType(type) {
    console.log('[微博背景] 设置背景类型为:', type);
    
    // 验证背景类型
    const validTypes = ['bing', 'custom', 'gradient'];
    if (!validTypes.includes(type)) {
        console.error('[微博背景] 无效的背景类型:', type);
        simpleNotify('无效的背景类型');
        return;
    }
    
    backgroundStore.type = type;
    await saveBackgroundConfig();
    
    // 确保背景功能已启用
    if (!backgroundStore.enabled) {
        backgroundStore.enabled = true;
        await saveBackgroundConfig();
        console.log('[微博背景] 自动启用背景功能');
    }
    
    if (backgroundStore.enabled) {
        await applyBackground();
        const typeNames = {
            'bing': '必应每日图片',
            'custom': '自定义图片',
            'gradient': '渐变背景'
        };
        simpleNotify(`已切换到${typeNames[type]}`);
    }
}

/**
 * 清除必应图片缓存
 */
async function clearBingImageCache() {
    try {
        await chromeStorage.removeValue('weiboUpBingCache');
        simpleNotify('必应图片缓存已清除');
        
        if (backgroundStore.enabled && backgroundStore.type === 'bing') {
            applyBackground();
        }
    } catch (error) {
        console.error('[微博背景] 清除缓存失败:', error);
        simpleNotify('清除缓存失败');
    }
}

/**
 * 清除必应图片缓存
 */
function clearBingImageCache() {
    // 向后台脚本发送清除缓存的消息
    chrome.runtime.sendMessage({ action: 'clearCache' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('[微博背景] 清除缓存消息发送失败:', chrome.runtime.lastError);
            simpleNotify('清除缓存失败：' + chrome.runtime.lastError.message);
            return;
        }
        
        if (response && response.success) {
            console.log('[微博背景] 必应图片缓存已清除');
            simpleNotify('必应图片缓存已清除');
        } else {
            console.error('[微博背景] 清除缓存失败:', response);
            simpleNotify('清除缓存失败');
        }
    });
}

/**
 * 强制刷新必应背景（不使用缓存）
 */
async function refreshBingBackground() {
    try {
        console.log('[微博背景] 强制刷新必应背景...');
        
        // 清除缓存
        await chromeStorage.deleteValue('weiboUpBingCache');
        
        // 如果当前是必应背景且已启用，重新应用
        if (backgroundStore.enabled && backgroundStore.type === 'bing') {
            await applyBackground();
            simpleNotify('必应背景已刷新');
        } else {
            simpleNotify('缓存已清除，请切换到必应背景查看效果');
        }
    } catch (error) {
        console.error('[微博背景] 刷新背景失败:', error);
        simpleNotify('刷新背景失败，请重试');
    }
}

/**
 * 刷新必应背景
 */
async function refreshBingBackground() {
    if (backgroundStore && backgroundStore.type === 'bing' && backgroundStore.enabled) {
        console.log('[微博背景] 正在刷新必应背景...');
        simpleNotify('正在刷新必应背景...');
        
        // 先清除缓存
        clearBingImageCache();
        
        // 延迟一秒后重新应用背景
        setTimeout(async () => {
            try {
                await applyBackground();
                simpleNotify('必应背景已刷新');
            } catch (error) {
                console.error('[微博背景] 刷新背景失败:', error);
                simpleNotify('刷新背景失败');
            }
        }, 1000);
    } else {
        simpleNotify('请先启用必应背景类型');
    }
}

/**
 * 诊断背景功能状态
 */
function diagnoseBackgroundStatus() {
    console.log('%c=== 微博增强背景功能诊断 ===', 'color: #17a2b8; font-weight: bold; font-size: 16px;');
    
    // 1. 检查存储状态
    console.log('1. 存储状态检查:');
    console.log('   backgroundStore:', backgroundStore);
    console.log('   存储是否已初始化:', backgroundStore && backgroundStore.enabled !== undefined);
    
    // **新增**: 检查图片加载状态
    console.log('2. 图片加载状态检查:');
    console.log('   backgroundImageLoadState:', backgroundImageLoadState);
      // 3. 检查DOM状态
    console.log('3. DOM状态检查:');
    const backgroundElement = document.querySelector('#weibo-blur-background');
    const transparencyStyle = document.getElementById('weibo-background-transparency-style');
    
    console.log('   背景元素是否存在:', !!backgroundElement);
    console.log('   半透明样式是否存在:', !!transparencyStyle);
    console.log('   document.readyState:', document.readyState);
    console.log('   body.childElementCount:', document.body.childElementCount);
    
    // **新增**: 检查深色模式状态
    const isDarkMode = document.documentElement && (
        document.documentElement.classList.contains('woo-theme-dark') ||
        document.documentElement.classList.contains('dark') ||
        document.documentElement.classList.contains('theme-dark') ||
        document.documentElement.classList.contains('dark-mode') ||
        document.body.classList.contains('woo-theme-dark') ||
        document.body.classList.contains('dark') ||
        document.body.classList.contains('theme-dark') ||
        document.body.classList.contains('dark-mode')
    );
    
    console.log('   深色模式检测:', {
        isDarkMode: isDarkMode,
        documentElement_classes: document.documentElement.className,
        body_classes: document.body.className,
        documentElement_bg: window.getComputedStyle(document.documentElement).backgroundColor,
        body_bg: window.getComputedStyle(document.body).backgroundColor
    });
    
    if (backgroundElement) {
        const computedStyle = window.getComputedStyle(backgroundElement);
        console.log('   背景元素样式:', {
            display: computedStyle.display,
            position: computedStyle.position,
            zIndex: computedStyle.zIndex,
            opacity: computedStyle.opacity,
            backgroundImage: computedStyle.backgroundImage.substring(0, 100) + (computedStyle.backgroundImage.length > 100 ? '...' : ''),
            background: computedStyle.background.substring(0, 100) + (computedStyle.background.length > 100 ? '...' : '')
        });
    }
    
    // 3. 检查函数可用性
    console.log('3. 函数可用性检查:');
    console.log('   applyBackground:', typeof applyBackground);
    console.log('   getBackgroundUrl:', typeof getBackgroundUrl);
    console.log('   fetchBingImage:', typeof fetchBingImage);
    console.log('   setupBackgroundPersistence:', typeof setupBackgroundPersistence);
    console.log('   simpleNotify:', typeof simpleNotify);
    console.log('   chromeStorage:', typeof chromeStorage);
    
    // 4. 检查扩展API
    console.log('4. 扩展API检查:');
    console.log('   chrome.runtime.sendMessage:', typeof chrome?.runtime?.sendMessage);
    console.log('   chrome.storage.local:', typeof chrome?.storage?.local);
    console.log('   runtime.id:', chrome.runtime?.id);
    
    // 5. 检查网络连接（简单测试）
    console.log('5. 网络连接测试:');
    if (navigator.onLine) {
        console.log('   网络状态: 在线');
    } else {
        console.log('   网络状态: 离线');    }
    
    console.log('%c=== 诊断完成 ===', 'color: #17a2b8; font-weight: bold;');
    
    // 6. 提供修复建议
    if (!backgroundStore || backgroundStore.enabled === undefined) {
        console.warn('%c建议: 存储未初始化，请尝试刷新页面', 'color: #ffc107; font-weight: bold;');
    } else if (backgroundStore.enabled && !backgroundElement) {
        console.warn('%c建议: 背景已启用但元素不存在，尝试运行 reapplyBackground()', 'color: #ffc107; font-weight: bold;');
    } else if (!backgroundStore.enabled) {        console.info('%c提示: 背景功能已禁用，请在扩展弹出页面中启用', 'color: #28a745; font-weight: bold;');
    }
}

/**
 * 强制应用背景（不依赖存储状态检查）
 */
async function forceApplyBackground() {
    console.log('[微博背景] 强制应用背景，忽略状态检查...');
    
    try {        // 移除现有背景元素
        const existingBg = document.querySelector('#weibo-blur-background');
        if (existingBg) {
            existingBg.remove();
            console.log('[微博背景] 已移除现有背景元素');
        }
        // 创建背景元素
        const backgroundElement = document.createElement('div');
        backgroundElement.id = 'weibo-blur-background';
          // 应用强制样式
        backgroundElement.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: -1 !important;
            pointer-events: none !important;
            background: linear-gradient(135deg, rgba(74, 144, 226, 0.3) 0%, rgba(80, 200, 120, 0.3) 100%) !important;
            opacity: 0.5 !important;
            will-change: opacity !important;
            transition: opacity 0.3s ease !important;
        `;
          // 立即添加到页面
        document.body.insertBefore(backgroundElement, document.body.firstChild);
        
        // 强制确保背景元素的z-index
        backgroundElement.style.setProperty('z-index', '-1', 'important');
        backgroundElement.style.setProperty('position', 'fixed', 'important');
        
        // 确保body有正确的样式
        document.body.style.setProperty('position', 'relative', 'important');
        document.body.style.setProperty('z-index', '1', 'important');
        
        console.log('[微博背景] 强制背景已应用（使用渐变色）');
        
        // 如果可能，尝试获取真实背景
        if (backgroundStore && backgroundStore.enabled) {
            const backgroundUrl = await getBackgroundUrl();
            if (backgroundUrl) {
                const img = new Image();
                img.onload = () => {
                    backgroundElement.style.backgroundImage = `url("${backgroundUrl}")`;
                    backgroundElement.style.background = `url("${backgroundUrl}") center/cover no-repeat`;
                    console.log('[微博背景] 已加载真实背景图片');
                };
                img.onerror = () => {
                    console.log('[微博背景] 真实背景加载失败，保持渐变背景');
                };
                img.src = backgroundUrl;
            }
        }
        
        // 设置持久化
        setupBackgroundPersistence();
          } catch (error) {
        console.error('[微博背景] 强制应用背景失败:', error);
    }
}

// 页面加载完成后自动初始化背景功能
function initializeBackground() {
    // 等待存储初始化完成
    const checkAndApply = () => {
        if (typeof backgroundStore !== 'undefined' && backgroundStore !== null) {
            console.log('[微博背景] 存储已初始化，开始应用背景');
            if (backgroundStore.enabled) {
                setTimeout(() => {
                    applyBackground();
                }, 500);
            }
        } else {
            console.log('[微博背景] 等待存储初始化...');
            setTimeout(checkAndApply, 1000);
        }
    };
    
    checkAndApply();
}

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBackground);
} else {
    initializeBackground();
}

// 监听页面路由变化
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log('[微博背景] 检测到页面路由变化:', url);        // 延迟重新应用背景，确保新页面内容加载完成
        setTimeout(() => {
            // 检查新页面是否为搜索页面
            if (url.includes('s.weibo.com/weibo?q=')) {
                console.log('[微博背景] 导航到搜索页面，清理背景功能');
                // 清理现有背景和样式
                const existingBg = document.querySelector('#weibo-blur-background');
                if (existingBg) {
                    existingBg.remove();
                }
                const transparencyStyle = document.getElementById('weibo-background-transparency-style');
                if (transparencyStyle) {
                    transparencyStyle.remove();
                }
            } else if (backgroundStore && backgroundStore.enabled) {
                // 如果不是搜索页面且背景功能启用，重新应用背景
                const bgElement = document.querySelector('#weibo-blur-background');
                if (!bgElement) {
                    console.log('[微博背景] 路由变化后重新应用背景');
                    applyBackground();
                } else {
                    // 即使背景元素存在，也要重新检查透明样式（因为URL可能影响透明功能）
                    console.log('[微博背景] 路由变化后重新检查透明样式');
                    addContentTransparencyStyles();
                }
            }
        }, 1000);
    }
}).observe(document, { subtree: true, childList: true });

    /**
 * 强制应用容器样式，确保z-index正确
 */
function forceApplyContainerStyles() {
    // 处理主要容器，确保z-index正确 - 参考youhou分支实现
    const containers = [
        // 主要内容容器
        document.querySelector('#app > div.woo-box-flex.woo-box-column.Frame_wrap_3g67Q'),
        // 通用选择器
        document.querySelector('#app'),
        document.querySelector('#homeWrap'),
        document.querySelector('#react-root'),
        // 添加更多可能的选择器
        document.querySelector('.Frame_content_3XrxZ'),
        document.querySelector('.Frame_side_2mgLd'),
        document.querySelector('.wbpro-side-main'),
        // 补充一些通用容器
        document.querySelector('.m-page'),
        document.querySelector('.m-main'),
        document.querySelector('.App'),
        document.querySelector('body > div:first-child'),
        document.querySelector('#scroller'),
        document.querySelector('[class*="vue-recycle-scroller"]'),
        document.querySelector('main'),
        document.querySelector('[role="main"]')
    ];

    // 应用样式到所有找到的容器上
    containers.forEach(container => {
        if (container) {
            // 检查当前样式
            const currentStyle = window.getComputedStyle(container);
            
            // 保存原始样式用于后续恢复
            if (!container.dataset.origPosition) {
                container.dataset.origPosition = currentStyle.position;
            }
            if (!container.dataset.origZIndex) {
                container.dataset.origZIndex = currentStyle.zIndex;
            }
            if (!container.dataset.origBgColor) {
                container.dataset.origBgColor = currentStyle.backgroundColor;
            }            // 应用必要的样式 - 使用温和的设置，避免过度强制
            container.style.position = 'relative';
            container.style.zIndex = '1'; // 确保内容在背景之上
            
            // 检查背景颜色并确保它是透明的或足够透明以显示背景图
            const bgColor = currentStyle.backgroundColor;
            if (bgColor && bgColor !== 'transparent' && !bgColor.includes('rgba')) {
                // 如果背景色是纯色，使其半透明
                const rgb = bgColor.match(/\d+/g);
                if (rgb && rgb.length >= 3) {
                    container.style.backgroundColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)`;
                    console.log(`[微博背景] 调整了容器背景色: ${bgColor} -> rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)`);
                }
            }
        }
    });
    
    // 处理可能覆盖背景的元素
    const potentialBlockers = document.querySelectorAll('body > div');
    potentialBlockers.forEach(element => {
        if (element.id !== 'weibo-blur-background') {
            const style = window.getComputedStyle(element);
            // 检查是否可能遮挡背景
            if (style.position === 'fixed' && 
                (style.zIndex === 'auto' || parseInt(style.zIndex) < 0)) {
                console.log('[微博背景] 发现可能阻止背景显示的元素:', element);
                element.style.backgroundColor = 'transparent';
            }
        }
    });    // 确保body和html也有相对定位并且没有背景色 - 使用温和设置
    document.body.style.position = 'relative';
    document.body.style.minHeight = '100vh';
    document.documentElement.style.minHeight = '100vh';
    
    // 检查是否有背景色设置
    const bodyBgColor = window.getComputedStyle(document.body).backgroundColor;
    if (bodyBgColor !== 'transparent' && !bodyBgColor.includes('rgba')) {
        document.body.style.backgroundColor = 'transparent';
        console.log('[微博背景] 已将body背景设置为透明');
    }
}

/**
 * 强化背景显示保护 - 针对"显示一会儿就消失"的问题
 */
function reinforceBackgroundDisplay() {
    if (!backgroundStore || !backgroundStore.enabled) {
        return;
    }
    
    const backgroundElement = document.getElementById('weibo-blur-background');
    if (!backgroundElement) {
        console.log('[微博背景] 强化保护: 背景元素丢失，重新应用');
        applyBackground();
        return;
    }
      // 只对关键的背景样式进行强制设置，避免影响内容显示
    const criticalStyles = {
        'position': 'fixed',
        'z-index': '-1',
        'pointer-events': 'none',
        'display': 'block',
        'visibility': 'visible'
    };
    
    Object.entries(criticalStyles).forEach(([property, value]) => {
        if (property === 'z-index' || property === 'position') {
            // 只对关键的层级属性使用 !important
            backgroundElement.style.setProperty(property, value, 'important');
        } else {
            // 其他属性使用普通设置
            backgroundElement.style.setProperty(property, value);
        }
    });
    
    // 设置透明度但不使用 !important
    backgroundElement.style.opacity = backgroundStore.opacity.toString();
    
    // 确保背景图片或渐变还在
    const currentStyle = window.getComputedStyle(backgroundElement);
    if (!currentStyle.backgroundImage || currentStyle.backgroundImage === 'none') {
        if (backgroundStore.type === 'gradient') {
            backgroundElement.style.setProperty('background', 
                'linear-gradient(135deg, rgba(74, 144, 226, 0.3) 0%, rgba(80, 200, 120, 0.3) 100%)', 
                'important');
        }
    }
    
    // 强化容器样式
    forceApplyContainerStyles();
}

// 定期强化背景显示
setInterval(reinforceBackgroundDisplay, 3000);

/**
 * 响应主题变化的函数
 */
function updateBackgroundTheme(isDark) {
  // 如果背景功能未启用，但内容透明度可能启用，仍需更新
  console.log(`[微博背景] 响应主题变化: ${isDark ? '深色' : '浅色'}`);
  
  // 如果背景功能启用，更新背景样式
  if (backgroundStore.enabled) {
    const existingBg = document.querySelector('#weibo-blur-background');
    if (existingBg) {
      // 更新现有背景的主题相关样式
      updateBackgroundOpacity(existingBg, isDark);
    }
  }
  
  // 无论背景是否启用，都需要更新内容透明度
  if (backgroundStore.content_transparency) {
    updateContentTransparency();
  }
}

// 更新背景不透明度以适应主题
function updateBackgroundOpacity(backgroundElement, isDark) {
  if (!backgroundElement) return;
  
  const opacity = backgroundStore.opacity;
  const bgColor = isDark ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;
  
  // 更新蒙层颜色
  const overlay = backgroundElement.querySelector('.background-overlay');
  if (overlay) {
    overlay.style.backgroundColor = bgColor;
  }
}

// 更新内容透明度以适应主题变化
function updateContentTransparency() {
  if (!backgroundStore.content_transparency) {
    return;
  }
  
  console.log('[微博背景] 更新内容透明度以适应主题变化');
  
  // 重新应用内容透明度样式，这会检测当前主题并应用正确的背景色
  addContentTransparencyStyles();
}

// 监听全局主题变化事件
window.addEventListener('weiboThemeChanged', (event) => {
  console.log(`[微博背景] 收到全局主题变化事件: ${event.detail.isDark ? '深色' : '浅色'}`);
  updateBackgroundTheme(event.detail.isDark);
});

// 增强主题检测 - 也监听DOM变化来检测主题切换
const backgroundThemeObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && 
        (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {
      const target = mutation.target;
      
      if (target === document.body || target === document.documentElement) {
        // 检测主题变化
        const isDark = document.body.classList.contains('woo-theme-dark') ||
                       document.documentElement.getAttribute('data-theme') === 'dark';
        
        console.log(`[微博背景] DOM变化检测到主题: ${isDark ? '深色' : '浅色'}`);
        updateBackgroundTheme(isDark);
      }
    }
  });
});

// 开始观察主题相关的DOM变化
if (document.body) {
  backgroundThemeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['class', 'data-theme']
  });
}

if (document.documentElement) {
  backgroundThemeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme']
  });
}

console.log('[微博背景] 主题变化监听已启动');

/**
 * 确保弹窗正常显示，修复被背景样式影响的问题
 */
function ensureModalVisibility() {
    console.log('[微博背景] 检查并修复弹窗显示问题...');
    
    // 查找所有可能的弹窗元素
    const modalSelectors = [
        '.woo-modal-wrap',
        '.woo-modal-main',
        '#app > div.woo-modal-wrap',
        '#app > div.woo-box-flex.woo-box-alignCenter.woo-box-justifyCenter.woo-modal-wrap',
        '[class*="modal"]',
        '[class*="popup"]',
        '[class*="dialog"]'
    ];
    
    let fixedCount = 0;
    
    modalSelectors.forEach(selector => {
        const modals = document.querySelectorAll(selector);
        modals.forEach(modal => {
            const computedStyle = window.getComputedStyle(modal);
            
            // 检查是否被错误隐藏或者z-index过低
            if (computedStyle.display === 'none' && modal.style.display !== 'none') {
                // 如果元素本身没有设置display:none，但被计算为none，可能是CSS冲突
                console.log('[微博背景] 发现被CSS影响的弹窗:', selector);
            }
            
            // 强制设置弹窗的z-index
            const currentZIndex = parseInt(computedStyle.zIndex) || 0;
            if (currentZIndex < 9999) {
                modal.style.setProperty('z-index', '9999', 'important');
                modal.style.setProperty('position', 'fixed', 'important');
                fixedCount++;
                console.log('[微博背景] 修复弹窗z-index:', selector, 'from', currentZIndex, 'to 9999');
            }
        });
    });
    
    // 特殊处理：确保弹窗容器不受背景透明度影响
    const modalWraps = document.querySelectorAll('.woo-modal-wrap, [class*="woo-modal"]');
    modalWraps.forEach(wrap => {
        // 移除可能被错误应用的背景样式
        wrap.style.removeProperty('backdrop-filter');
        wrap.style.removeProperty('background-color');
        wrap.style.setProperty('background-color', 'initial', 'important');
        wrap.style.setProperty('backdrop-filter', 'none', 'important');
    });
    
    console.log(`[微博背景] 弹窗显示检查完成，修复了 ${fixedCount} 个元素`);
    return fixedCount;
}

/**
 * 监听弹窗的出现，确保新出现的弹窗能正常显示
 */
function setupModalVisibilityObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 检查新添加的节点是否是弹窗
                        if (node.classList && (
                            node.classList.contains('woo-modal-wrap') ||
                            node.classList.contains('woo-modal-main') ||
                            node.className.includes('modal') ||
                            node.className.includes('popup') ||
                            node.className.includes('dialog')
                        )) {
                            console.log('[微博背景] 检测到新弹窗，确保其正常显示:', node.className);
                            setTimeout(() => {
                                ensureModalVisibility();
                            }, 100);
                        }
                        
                        // 也检查新节点的子元素
                        const modalChildren = node.querySelectorAll && node.querySelectorAll('.woo-modal-wrap, .woo-modal-main, [class*="modal"], [class*="popup"], [class*="dialog"]');
                        if (modalChildren && modalChildren.length > 0) {
                            console.log('[微博背景] 检测到包含弹窗的新容器');
                            setTimeout(() => {
                                ensureModalVisibility();
                            }, 100);
                        }
                    }
                });
            }
        });
    });
    
    // 观察整个document的变化
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('[微博背景] 弹窗监听器已启动');
    return observer;
}

// 在应用背景时也自动检查弹窗
const originalAddContentTransparencyStyles = addContentTransparencyStyles;
if (typeof originalAddContentTransparencyStyles === 'function') {
    addContentTransparencyStyles = function(...args) {
        const result = originalAddContentTransparencyStyles.apply(this, args);
        // 延迟一点确保弹窗正常显示
        setTimeout(() => {
            ensureModalVisibility();
        }, 200);
        return result;
    };
}
