// 背景图片管理功能
// backgroundStore, saveBackgroundConfig, chromeStorage 从chrome-storage.js全局获取
// simpleNotify 从notification.js全局获取

// 必应图片缓存键和过期时间（24小时）
const BING_CACHE_KEY = 'weibo_bing_background';
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24小时

/**
 * 获取必应每日图片
 * @returns {Promise<string|null>} 图片URL，失败返回null
 */
async function fetchBingImage() {
    const now = Date.now();
    const BING_CACHE_KEY = 'weiboUpBingCache';
    
    try {
        // 检查缓存是否有效 (1小时)
        const cached = await chromeStorage.getValue(BING_CACHE_KEY);
        if (cached && (now - cached.timestamp) < 3600000) {
            console.log('[微博背景] 使用缓存的必应图片:', cached.url.substring(0, 100) + '...');
            return cached.url;
        }

        let imageUrl = '';
        
        try {
            // Chrome扩展中使用预设的必应图片URL
            const bingImageUrls = [
                'https://cn.bing.com/th?id=OHR.TiffaugesCouple_ZH-CN0648967969_1920x1080.jpg',
                'https://cn.bing.com/th?id=OHR.RugbyPortugal_ZH-CN0542849742_1920x1080.jpg',
                'https://cn.bing.com/th?id=OHR.RyoanjiTemple_ZH-CN0469851012_1920x1080.jpg',
                'https://cn.bing.com/th?id=OHR.ParkCity_ZH-CN0386820484_1920x1080.jpg',
                'https://cn.bing.com/th?id=OHR.ChristmasEveNorway_ZH-CN0303787956_1920x1080.jpg'
            ];
            
            // 随机选择一张图片
            const randomIndex = Math.floor(Math.random() * bingImageUrls.length);
            imageUrl = bingImageUrls[randomIndex];
            
            console.log('[微博背景] 使用预设必应图片:', imageUrl);
        } catch (error) {
            console.error('[微博背景] 获取图片失败:', error);
            throw new Error('获取必应图片失败');
        }
        
        // 添加随机参数，避免缓存问题
        const finalUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + '_t=' + now;
        
        // 更新缓存
        await chromeStorage.setValue(BING_CACHE_KEY, {
            url: finalUrl,
            timestamp: now
        });
        
        console.log('[微博背景] 成功获取必应图片：', finalUrl);
        return finalUrl;
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
    if (!backgroundStore.enabled) {
        return null;
    }

    try {
        switch (backgroundStore.type) {
            case 'bing':
                return await fetchBingImage();
            case 'custom':
                return backgroundStore.custom_url || null;
            case 'gradient':
                return null; // 渐变背景在CSS中实现
            default:
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
        backgroundElement.className = 'weibo-up-background';
        
        // 基本样式
        backgroundElement.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: -1000 !important;
            pointer-events: none !important;
            background-attachment: fixed !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-size: cover !important;
        `;
        
        // 设置不透明度
        const opacity = backgroundStore.opacity !== undefined ? backgroundStore.opacity : 0.3;
        backgroundElement.style.opacity = opacity.toString();
        
        // 添加微博内容半透明样式
        addContentTransparencyStyles();
        
        // 获取背景URL
        const backgroundUrl = await getBackgroundUrl();
        if (!backgroundUrl) {
            console.error('[微博背景] 无法应用背景，URL为空');
            simpleNotify('无法加载背景图片，请尝试切换背景类型或刷新页面');
            // 即使URL获取失败，也保留带有淡蓝色背景的背景元素
            return;
        }

        console.log('[微博背景] 获取到背景URL:', backgroundUrl.substring(0, 100) + '...');
        
        // 预加载图片
        const preloadImg = new Image();
        
        // 设置标志，以便跟踪图片是否成功加载
        let imageLoadSuccess = false;
        
        // 图片加载完成后设置背景图
        preloadImg.onload = () => {
            imageLoadSuccess = true;
            console.log('[微博背景] 图片预加载成功，设置背景');
            backgroundElement.style.backgroundImage = `url("${backgroundUrl}")`;
            console.log('[微博背景] 背景已成功应用');
        };
        
        // 图片加载失败的处理
        preloadImg.onerror = () => {
            console.error('[微博背景] 图片加载失败:', backgroundUrl);
            // 使用渐变背景作为后备
            backgroundElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            simpleNotify('背景图片加载失败，已切换为渐变背景');
        };
        
        // 开始预加载图片
        preloadImg.src = backgroundUrl;
        
        // 设置超时，如果3秒内没有加载成功，使用默认背景
        setTimeout(() => {
            if (!imageLoadSuccess) {
                console.warn('[微博背景] 图片加载超时，使用默认渐变背景');
                backgroundElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }
        }, 3000);
        
        // 将背景元素添加到页面
        document.body.appendChild(backgroundElement);
        
    } catch (error) {
        console.error('[微博背景] 应用背景时出错:', error);
        simpleNotify('应用背景图片时出错，请检查设置');
    }
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
    const opacity = backgroundStore.content_bg_opacity !== undefined ? backgroundStore.content_bg_opacity : 0.3;
    
    // 检测深色模式
    const isDarkMode = document.documentElement && document.documentElement.classList.contains('woo-theme-dark');
    const bgColor = isDarkMode ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;

    // 为微博内容添加半透明背景的CSS
    existingStyle.textContent = `
        /* 主要内容容器 */
        article,
        #scroller > div.vue-recycle-scroller__item-wrapper > div > div > article,
        .wb-item .content,
        .card-wrap .card-feed {
            background-color: ${bgColor} !important;
            backdrop-filter: blur(${blurPixels}px) !important;
            border-radius: 8px !important;
            margin: 5px !important;
            padding: 10px !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
            transition: backdrop-filter 0.3s ease, background-color 0.3s ease !important;
        }
        
        /* 侧边栏和其他容器 */
        .Left_left_2bwVX,
        .Right_right_3CFhg,
        .Frame_wrap_2j35t,
        .nav {
            background-color: ${bgColor} !important;
            backdrop-filter: blur(${blurPixels}px) !important;
            border-radius: 8px !important;
            margin: 5px !important;
            padding: 10px !important;
        }
    `;

    console.log('[微博背景] 半透明样式已应用');
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
    backgroundStore.type = type;
    await saveBackgroundConfig();
    
    if (backgroundStore.enabled) {
        applyBackground();
        simpleNotify(`已切换到${type === 'bing' ? '必应每日图片' : type === 'custom' ? '自定义图片' : '渐变'}背景`);
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
        
        backgroundStore.custom_url = base64;
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
    backgroundStore.content_bg_opacity = opacity;
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
        await chromeStorage.removeValue(BING_CACHE_KEY);
        simpleNotify('必应图片缓存已清除');
        
        if (backgroundStore.enabled && backgroundStore.type === 'bing') {
            applyBackground();
        }
    } catch (error) {
        console.error('[微博背景] 清除缓存失败:', error);
        simpleNotify('清除缓存失败');
    }
}
