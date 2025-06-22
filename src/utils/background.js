// 背景图片管理功能
// backgroundStore, saveBackgroundConfig, chromeStorage 从chrome-storage.js全局获取
// simpleNotify 从notification.js全局获取

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
        return;
    }

    try {
        console.log('[微博背景] 开始应用背景...');
        
        // 移除现有背景元素
        const existingBg = document.querySelector('.weibo-up-background');
        if (existingBg) {
            existingBg.remove();
        }
        
        // 创建背景元素
        const backgroundElement = document.createElement('div');
        backgroundElement.className = 'weibo-up-background';        // 基本样式
        backgroundElement.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: -1 !important;
            pointer-events: none !important;
            background-attachment: fixed !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-size: cover !important;
        `;
          // 设置不透明度
        const opacity = backgroundStore.opacity !== undefined ? backgroundStore.opacity : 0.2;
        backgroundElement.style.opacity = opacity.toString();
          // 强制设置body的定位和背景
        document.body.style.position = 'relative';
        document.body.style.zIndex = '1';
        
        // 添加微博内容半透明样式
        addContentTransparencyStyles();
        
        // 获取背景URL
        const backgroundUrl = await getBackgroundUrl();
        
        // 处理渐变背景的特殊情况
        if (backgroundStore.type === 'gradient') {
            console.log('[微博背景] 应用渐变背景');
            backgroundElement.style.background = `linear-gradient(135deg, 
                rgba(74, 144, 226, 0.3) 0%, 
                rgba(80, 200, 120, 0.3) 100%)`;
            // 立即添加到页面，确保在最底层
            document.body.insertBefore(backgroundElement, document.body.firstChild);
            console.log('[微博背景] 渐变背景应用完成');
            return;
        }
        
        if (!backgroundUrl) {
            console.error('[微博背景] 无法应用背景，URL为空');
            console.error('[微博背景] 详细信息:', {
                backgroundStore: backgroundStore,
                type: backgroundStore?.type,
                enabled: backgroundStore?.enabled,
                url: backgroundStore?.url
            });
            
            simpleNotify('无法加载背景图片，请尝试切换背景类型或刷新页面');
            
            // 提供一个默认的淡蓝色背景
            backgroundElement.style.background = `linear-gradient(135deg, 
                rgba(74, 144, 226, 0.1) 0%, 
                rgba(80, 200, 120, 0.1) 100%)`;
            // 立即添加到页面，确保在最底层
            document.body.insertBefore(backgroundElement, document.body.firstChild);
            
            // 暴露诊断函数到控制台
            console.log('[微博背景] 可以在控制台运行 diagnoseBackgroundStatus() 进行诊断');
            return;
        }

        console.log('[微博背景] 获取到背景URL:', backgroundUrl.substring(0, 100) + '...');
          // 预加载图片
        const preloadImg = new Image();
        
        // 设置标志，以便跟踪图片是否成功加载
        let imageLoadSuccess = false;
        
        // 设置跨域属性，避免CORS问题
        preloadImg.crossOrigin = 'anonymous';
          // 图片加载完成后设置背景图
        preloadImg.onload = () => {
            imageLoadSuccess = true;
            console.log('[微博背景] 图片预加载成功，设置背景');
            backgroundElement.style.backgroundImage = `url("${backgroundUrl}")`;
            // 立即添加到页面，确保在最底层
            document.body.insertBefore(backgroundElement, document.body.firstChild);
            console.log('[微博背景] 背景已成功应用');
        };
        
        // 图片加载失败的处理
        preloadImg.onerror = (event) => {
            console.warn('[微博背景] 图片预加载失败，但仍然尝试应用背景:', backgroundUrl);
            console.warn('[微博背景] 错误详情:', event);
            
            // 即使预加载失败，也尝试直接设置背景图
            // 因为浏览器缓存可能已经有这张图片
            backgroundElement.style.backgroundImage = `url("${backgroundUrl}")`;
            // 立即添加到页面，确保在最底层
            document.body.insertBefore(backgroundElement, document.body.firstChild);
            
            // 等待一段时间后检查背景是否真的加载失败
            setTimeout(() => {
                const computedStyle = window.getComputedStyle(backgroundElement);
                const backgroundImage = computedStyle.backgroundImage;
                
                if (backgroundImage === 'none' || backgroundImage === '') {
                    console.error('[微博背景] 背景图片确实加载失败，使用渐变背景作为后备');
                    backgroundElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    simpleNotify('背景图片加载失败，已切换为渐变背景');
                } else {
                    console.log('[微博背景] 背景图片实际加载成功（可能由于浏览器缓存）');
                }
            }, 1000);
        };        // 开始预加载图片
        console.log('[微博背景] 开始预加载图片:', backgroundUrl);
        preloadImg.src = backgroundUrl;
        
        // 设置背景持久化监听
        setupBackgroundPersistence();
        
    } catch (error) {
        console.error('[微博背景] 应用背景时出错:', error);
        simpleNotify('应用背景图片时出错，请检查设置');
    }
}

/**
 * 设置背景持久化监听，防止被页面路由变化清除
 */
function setupBackgroundPersistence() {
    // 防止重复设置
    if (window.__weiboBackgroundObserver) {
        window.__weiboBackgroundObserver.disconnect();
    }
    
    // 创建观察器监听DOM变化
    const observer = new MutationObserver((mutations) => {
        // 防抖处理
        if (window.__weiboBackgroundDebounce) {
            clearTimeout(window.__weiboBackgroundDebounce);
        }
        
        window.__weiboBackgroundDebounce = setTimeout(() => {
            // 检查背景元素是否还存在
            const backgroundElement = document.querySelector('.weibo-up-background');
            if (!backgroundElement && backgroundStore.enabled) {
                console.log('[微博背景] 检测到背景元素丢失，重新应用背景');
                applyBackground();
            }
        }, 500);
    });
    
    // 开始观察
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // 保存观察器引用
    window.__weiboBackgroundObserver = observer;
    
    // 定期检查背景状态
    if (window.__weiboBackgroundInterval) {
        clearInterval(window.__weiboBackgroundInterval);
    }
    
    window.__weiboBackgroundInterval = setInterval(() => {
        if (backgroundStore.enabled) {
            const backgroundElement = document.querySelector('.weibo-up-background');
            if (!backgroundElement) {
                console.log('[微博背景] 定期检查发现背景丢失，重新应用');
                applyBackground();
            }
        }
    }, 10000); // 每10秒检查一次
}

/**
 * 添加内容半透明样式
 */
function addContentTransparencyStyles() {
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
    }

    // 获取用户设置的模糊程度和不透明度
    const blurPixels = backgroundStore.content_blur || 5;
    const opacity = backgroundStore.content_opacity !== undefined ? backgroundStore.content_opacity : 0.3;
    
    // 检测深色模式
    const isDarkMode = document.documentElement && document.documentElement.classList.contains('woo-theme-dark');
    const bgColor = isDarkMode ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;    // 为微博内容添加半透明背景的CSS
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
        }
        
        /* 确保页面主容器有正确的z-index */
        #app,
        #app > div,
        body {
            position: relative !important;
            z-index: 1 !important;
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
            const isArticle = element.tagName === 'ARTICLE';
            const isInArticleContainer = element.closest('article');
            const hasCorrectClass = element.classList.contains('weibo-up-background');
            
            // 如果不是预期的元素，清理其样式
            if (!isArticle && !isInArticleContainer && !hasCorrectClass) {
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
        const bg = document.querySelector('.weibo-up-background');
        if (bg) bg.remove();
        
        const style = document.getElementById('weibo-background-transparency-style');
        if (style) style.remove();
        
        simpleNotify('背景功能已禁用');
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
 * 上传自定义背景
 * @param {File} file 图片文件
 */
async function uploadCustomBackground(file) {
    try {
        // 将文件转换为base64
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
          backgroundStore.url = base64;
        backgroundStore.type = 'custom';
        await saveBackgroundConfig();
        
        if (backgroundStore.enabled) {
            applyBackground();
            simpleNotify('自定义背景已上传并应用');
        }
    } catch (error) {
        console.error('[微博背景] 上传自定义背景失败:', error);
        simpleNotify('上传背景失败，请重试');
    }
}

/**
 * 设置背景不透明度
 * @param {number} opacity 不透明度 (0-1)
 */
async function setBackgroundOpacity(opacity) {
    backgroundStore.opacity = opacity;
    await saveBackgroundConfig();
    
    const bg = document.querySelector('.weibo-up-background');
    if (bg) {
        bg.style.opacity = opacity.toString();
    }
}

/**
 * 设置内容不透明度
 * @param {number} opacity 不透明度 (0-1)
 */
async function setContentOpacity(opacity) {
    backgroundStore.content_opacity = opacity;
    await saveBackgroundConfig();
    
    if (backgroundStore.enabled && backgroundStore.content_transparency) {
        addContentTransparencyStyles();
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
 * 诊断背景功能状态
 */
function diagnoseBackgroundStatus() {
    console.log('[微博背景] 诊断报告开始:');
    console.log('1. backgroundStore状态:', backgroundStore);
    console.log('2. 相关函数是否存在:', {
        getBackgroundUrl: typeof getBackgroundUrl,
        fetchBingImage: typeof fetchBingImage,
        applyBackground: typeof applyBackground,
        simpleNotify: typeof simpleNotify,
        chromeStorage: typeof chromeStorage
    });
    console.log('3. DOM状态:', {
        readyState: document.readyState,
        backgroundElement: !!document.querySelector('.weibo-up-background'),
        transparencyStyle: !!document.getElementById('weibo-background-transparency-style'),
        bodyPosition: window.getComputedStyle(document.body).position,
        bodyZIndex: window.getComputedStyle(document.body).zIndex
    });
    console.log('4. Chrome扩展相关:', {
        runtimeId: chrome.runtime?.id,
        canSendMessage: typeof chrome.runtime.sendMessage === 'function'
    });
    
    // 检查现有背景元素
    const bgElement = document.querySelector('.weibo-up-background');
    if (bgElement) {
        const computedStyle = window.getComputedStyle(bgElement);
        console.log('5. 背景元素样式:', {
            position: computedStyle.position,
            zIndex: computedStyle.zIndex,
            opacity: computedStyle.opacity,
            backgroundImage: computedStyle.backgroundImage !== 'none' ? '已设置' : '未设置',
            width: computedStyle.width,
            height: computedStyle.height
        });
    } else {
        console.log('5. 背景元素: 不存在');
    }
    
    console.log('[微博背景] 诊断报告结束');
}

/**
 * 手动重新应用背景（调试用）
 */
async function reapplyBackground() {
    console.log('[微博背景] 手动重新应用背景...');
    
    // 先运行诊断
    diagnoseBackgroundStatus();
    
    // 强制重新初始化存储
    if (typeof initStorage === 'function') {
        await initStorage();
        console.log('[微博背景] 存储重新初始化完成');
    }
    
    // 重新应用背景
    if (typeof applyBackground === 'function') {
        await applyBackground();
        console.log('[微博背景] 背景重新应用完成');
    }
}

/**
 * 强制应用背景（不依赖存储状态检查）
 */
async function forceApplyBackground() {
    console.log('[微博背景] 强制应用背景，忽略状态检查...');
    
    try {
        // 移除现有背景元素
        const existingBg = document.querySelector('.weibo-up-background');
        if (existingBg) {
            existingBg.remove();
            console.log('[微博背景] 已移除现有背景元素');
        }
        
        // 创建背景元素
        const backgroundElement = document.createElement('div');
        backgroundElement.className = 'weibo-up-background';
        
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
        `;
        
        // 立即添加到页面
        document.body.insertBefore(backgroundElement, document.body.firstChild);
        
        // 确保body有正确的样式
        document.body.style.position = 'relative';
        document.body.style.zIndex = '1';
        
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

/**
 * 测试必应API连接（调试用）
 */
async function testBingAPI() {
    console.log('[微博背景] 开始测试必应API...');
    
    try {
        const apiUrl = 'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1';
        console.log('[微博背景] API地址:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('[微博背景] 响应状态:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[微博背景] API完整响应数据:', data);
        
        if (data && data.images && data.images.length > 0) {
            const imageInfo = data.images[0];
            const fullUrl = 'https://cn.bing.com' + imageInfo.url;
            
            console.log('[微博背景] 今日图片信息:', {
                标题: imageInfo.title,
                版权: imageInfo.copyright,
                原始URL: imageInfo.url,
                完整URL: fullUrl,
                开始日期: imageInfo.startdate,
                结束日期: imageInfo.enddate
            });
            
            return {
                success: true,
                imageInfo: imageInfo,
                fullUrl: fullUrl
            };
        } else {
            console.error('[微博背景] API返回数据格式异常:', data);
            return { success: false, error: 'API返回数据格式异常' };
        }
        
    } catch (error) {
        console.error('[微博背景] 测试必应API失败:', error);
        return { success: false, error: error.message };
    }
}

// 安全地暴露函数到全局，确保在适当的时机执行
function exposeFunctionsToGlobal() {
    // 暴露诊断函数和重新应用函数到全局，方便调试
    window.diagnoseBackgroundStatus = diagnoseBackgroundStatus;
    window.reapplyBackground = reapplyBackground;
    window.forceApplyBackground = forceApplyBackground;
    window.testBingAPI = testBingAPI;
    window.cleanupUnintendedTransparency = cleanupUnintendedTransparency;

    // 暴露背景相关函数到全局，方便调试和控制台调用
    window.weiboApplyBackground = applyBackground;
    window.weiboToggleBackground = toggleBackgroundEnabled;
    window.weiboSetBackgroundType = setBackgroundType;
    window.weiboClearBingCache = clearBingImageCache;
    window.weiboRefreshBingBackground = refreshBingBackground;

    // 验证函数是否正确暴露
    console.log('[微博背景] 全局函数暴露完成:', {
        diagnoseBackgroundStatus: typeof window.diagnoseBackgroundStatus,
        reapplyBackground: typeof window.reapplyBackground,
        forceApplyBackground: typeof window.forceApplyBackground,
        testBingAPI: typeof window.testBingAPI,
        cleanupUnintendedTransparency: typeof window.cleanupUnintendedTransparency,
        weiboApplyBackground: typeof window.weiboApplyBackground,
        weiboToggleBackground: typeof window.weiboToggleBackground,
        weiboSetBackgroundType: typeof window.weiboSetBackgroundType,
        weiboClearBingCache: typeof window.weiboClearBingCache,
        weiboRefreshBingBackground: typeof window.weiboRefreshBingBackground
    });
}

// 立即执行暴露函数
exposeFunctionsToGlobal();

// 确保在DOM完全加载后再次暴露（防止被覆盖）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', exposeFunctionsToGlobal);
} else {
    // DOM已经加载完成，立即执行
    setTimeout(exposeFunctionsToGlobal, 100);
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
        console.log('[微博背景] 检测到页面路由变化:', url);
        // 延迟重新应用背景，确保新页面内容加载完成
        setTimeout(() => {
            if (backgroundStore && backgroundStore.enabled) {
                const bgElement = document.querySelector('.weibo-up-background');
                if (!bgElement) {
                    console.log('[微博背景] 路由变化后重新应用背景');
                    applyBackground();
                }
            }
        }, 1000);
    }
}).observe(document, { subtree: true, childList: true });
