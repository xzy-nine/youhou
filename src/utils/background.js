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
    try {
        console.log('[微博背景] 尝试获取必应每日图片');
        simpleNotify('正在获取必应每日图片...');
          // 检查缓存
        const cachedData = await chromeStorage.getValue(BING_CACHE_KEY, null);
        const now = Date.now();

        // 使用缓存内图片（如未过期）
        if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRATION)) {
            console.log('[微博背景] 使用缓存的必应图片');
            return cachedData.url;
        }

        // 先尝试官方必应API
        let imageUrl = null;
        try {
            // 必应官方API地址
            const apiUrl = 'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1';
            const baseUrl = 'https://cn.bing.com';
            
            console.log(`[微博背景] 尝试从官方API获取必应图片: ${apiUrl}`);
            
            // 使用 GM_xmlhttpRequest 获取API数据
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: apiUrl,
                    responseType: 'json',
                    timeout: 8000, // 8秒超时
                    onload: (res) => {
                        if (res.status >= 200 && res.status < 300) {
                            resolve(res);
                        } else {
                            reject(new Error(`HTTP error! Status: ${res.status}`));
                        }
                    },
                    onerror: (err) => reject(err),
                    ontimeout: () => reject(new Error('请求超时'))
                });
            });
            
            const data = response.response;
            
            if (!data || !data.images || !data.images.length) {
                throw new Error('从官方API响应中未找到图片');
            }
            
            // 确保url存在后再拼接完整图片URL
            if (!data.images[0].url) {
                throw new Error('必应API返回的图片URL为空');
            }
            
            // 拼接完整图片URL
            imageUrl = baseUrl + data.images[0].url;
            console.log('[微博背景] 官方API获取成功:', imageUrl);
        } catch (officialApiError) {
            console.error('[微博背景] 官方API获取失败:', officialApiError);
            
            // 官方API失败，尝试备用接口
            try {
                const backupApiUrl = 'https://api.kdcc.cn';
                console.log(`[微博背景] 尝试从备用API获取必应图片: ${backupApiUrl}`);
                
                const backupResponse = await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: backupApiUrl,
                        timeout: 8000, // 8秒超时
                        onload: (res) => {
                            if (res.status >= 200 && res.status < 300) {
                                resolve(res);
                            } else {
                                reject(new Error(`HTTP error! Status: ${res.status}`));
                            }
                        },
                        onerror: (err) => reject(err),
                        ontimeout: () => reject(new Error('请求超时'))
                    });
                });
                   // 备用接口直接返回图片URL
                imageUrl = backupResponse.responseText.trim();
                
                if (!imageUrl || imageUrl.length < 10) {
                    throw new Error('备用API返回的URL无效');
                }
                
                // 预先验证备用API返回的图片URL格式
                const isValidBackupURL = imageUrl && 
                                       (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) &&
                                       (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') || 
                                        imageUrl.includes('.png') || imageUrl.includes('.webp'));
                                        
                if (!isValidBackupURL) {
                    console.error('[微博背景] 备用API返回的URL格式无效:', imageUrl);
                    throw new Error('备用API返回的URL格式无效');
                }
                
                // 检查备用API返回图片的尺寸
                const checkBackupImageSize = await new Promise((resolve) => {
                    const testImg = new Image();
                    testImg.onload = () => {
                        // 判断图片尺寸是否足够大（宽度和高度都至少为800像素）
                        const isLargeEnough = testImg.width >= 800 && testImg.height >= 800;
                        if (!isLargeEnough) {
                            console.error(`[微博背景] 备用API图片尺寸过小: ${testImg.width}x${testImg.height}`, imageUrl);
                        }
                        resolve(isLargeEnough);
                    };
                    testImg.onerror = () => {
                        console.error('[微博背景] 检查备用API图片尺寸时加载失败');
                        resolve(false); // 加载失败时视为无效
                    };
                    testImg.src = imageUrl;
                    
                    // 设置3秒超时
                    setTimeout(() => {
                        if (!testImg.complete) {
                            console.error('[微博背景] 检查备用API图片尺寸超时');
                            resolve(false);
                        }
                    }, 3000);
                });
                
                if (!checkBackupImageSize) {
                    throw new Error('备用API返回的图片尺寸过小或无法加载');
                }
                
                console.log('[微博背景] 备用API获取成功:', imageUrl);
            } catch (backupApiError) {
                console.error('[微博背景] 备用API获取也失败:', backupApiError);
                throw new Error('官方和备用API都获取失败');
            }
        }
        
        // 添加随机参数，避免缓存问题
        const finalUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + '_t=' + now;
          // 验证URL格式是否有效
        const isValidURL = finalUrl && 
                          (finalUrl.startsWith('http://') || finalUrl.startsWith('https://')) &&
                          (finalUrl.includes('.jpg') || finalUrl.includes('.jpeg') || 
                           finalUrl.includes('.png') || finalUrl.includes('.webp'));
        
        if (!isValidURL) {
            console.error('[微博背景] 获取到的URL可能无效:', finalUrl);
            throw new Error('获取到的必应图片URL格式可能无效');
        }
        
        // 检查图片尺寸，确保不是小尺寸图片
        const checkImageSize = await new Promise((resolve) => {
            const testImg = new Image();
            testImg.onload = () => {
                // 判断图片尺寸是否足够大（宽度和高度都至少为800像素）
                const isLargeEnough = testImg.width >= 800 && testImg.height >= 800;
                if (!isLargeEnough) {
                    console.error(`[微博背景] 图片尺寸过小: ${testImg.width}x${testImg.height}`, finalUrl);
                }
                resolve(isLargeEnough);
            };
            testImg.onerror = () => {
                console.error('[微博背景] 检查图片尺寸时加载失败');
                resolve(false); // 加载失败时视为无效
            };
            testImg.src = finalUrl;
            
            // 设置3秒超时
            setTimeout(() => {
                if (!testImg.complete) {
                    console.error('[微博背景] 检查图片尺寸超时');
                    resolve(false);
                }
            }, 3000);
        });
        
        if (!checkImageSize) {
            throw new Error('获取到的必应图片尺寸过小或无法加载');
        }
          // 更新缓存
        await chromeStorage.setValue(BING_CACHE_KEY, {
            url: finalUrl,
            timestamp: now
        });
        
        console.log('[微博背景] 成功获取必应图片：', finalUrl);
        return finalUrl;
    } catch (error) {
        console.error('[微博背景] 获取必应图片出错:', error);
          // 确定更具体的错误信息
        let errorMessage = '获取必应每日图片失败';
        if (error.message && error.message.includes('尺寸过小')) {
            errorMessage = '获取到的图片尺寸过小，不适合作为背景';
            console.warn('[微博背景] 图片尺寸不满足要求，需要至少800x800像素');
        }
        
        // 显示错误通知
        simpleNotify(`${errorMessage}，将使用淡蓝色背景`);
        
        // 回退策略：尝试使用上一个缓存（即使过期）
        const cachedData = GM_getValue(BING_CACHE_KEY, null);
        if (cachedData && cachedData.url) {
            console.log('[微博背景] 使用上一个缓存的必应图片');
            // 检查缓存图片是否访问还有效
            const img = new Image();
            img.src = cachedData.url;
            
            return cachedData.url;
        }
        
        // 如果没有缓存，返回null
        console.log('[微博背景] 无有效缓存，将使用淡蓝色背景');
        return null;
    }
}

/**
 * 将File对象转换为Base64 URL
 * @param {File} file 用户上传的文件
 * @returns {Promise<string>} base64编码的URL
 */
function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 创建文件选择器用于用户上传图片
 * @returns {Promise<string|null>} 返回Base64格式的图片数据URL
 */
function createFileSelector() {
    return new Promise((resolve) => {
        try {
            console.log('[微博背景] 创建文件选择器');
            
            // 创建一个更简单更可靠的选择器界面
            const overlay = document.createElement('div');
            overlay.setAttribute('id', 'weibo-image-selector-overlay');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            const uploader = document.createElement('div');
            uploader.setAttribute('id', 'weibo-image-uploader');
            uploader.style.cssText = `
                width: 350px;
                padding: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                text-align: center;
            `;
            
            uploader.innerHTML = `
                <h3 style="margin-top:0;color:#333;font-size:16px;">选择背景图片</h3>
                <p style="color:#666;margin-bottom:15px;font-size:14px;">选择本地图片或输入图片URL</p>
                <div style="margin:20px 0;display:flex;flex-direction:column;gap:10px;">
                    <button id="weibo-upload-file-btn" style="width:100%;padding:10px;background:#1890ff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;">选择本地图片</button>
                    <button id="weibo-url-input-btn" style="width:100%;padding:10px;background:#f0f0f0;color:#333;border:1px solid #d9d9d9;border-radius:4px;cursor:pointer;font-size:14px;">输入图片URL</button>
                    <button id="weibo-cancel-upload-btn" style="width:100%;padding:10px;background:#fff;color:#999;border:1px solid #d9d9d9;border-radius:4px;cursor:pointer;font-size:14px;margin-top:5px;">取消</button>
                </div>
                <div id="weibo-upload-status" style="margin-top:15px;padding:10px;font-size:13px;color:#ff8800;display:none;background:#fffbe6;border-radius:4px;"></div>
            `;
            
            // 添加到DOM
            overlay.appendChild(uploader);
            document.body.appendChild(overlay);
            
            // 创建隐藏的文件输入
            const input = document.createElement('input');
            input.setAttribute('id', 'weibo-file-input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.cssText = 'position:absolute;top:-9999px;left:-9999px;';
            document.body.appendChild(input);
            
            // 设置状态显示
            const statusElem = uploader.querySelector('#weibo-upload-status');
            
            // 显示状态消息的函数
            const showStatus = (message, isError = false) => {
                statusElem.textContent = message;
                statusElem.style.display = 'block';
                statusElem.style.color = isError ? '#ff4d4f' : '#ff8800';
                statusElem.style.background = isError ? '#fff2f0' : '#fffbe6';
                statusElem.style.border = isError ? '1px solid #ffccc7' : '1px solid #ffe58f';
            };
            
            // 按钮事件 - 取消
            uploader.querySelector('#weibo-cancel-upload-btn').addEventListener('click', () => {
                overlay.remove();
                input.remove();
                resolve(null);
            });
            
            // 按钮事件 - 选择本地文件
            uploader.querySelector('#weibo-upload-file-btn').addEventListener('click', () => {
                // 使用最简单的方法
                try {
                    input.click();
                } catch (e) {
                    console.error('[微博背景] 点击文件输入失败:', e);
                    showStatus('无法打开文件选择器，请尝试输入URL', true);
                    
                    // 如果点击失败，自动切换到URL输入
                    setTimeout(async () => {
                        overlay.remove();
                        input.remove();
                        const imageUrl = await getImageUrlFromUser();
                        resolve(imageUrl);
                    }, 2000);
                }
            });
            
            // 按钮事件 - 输入URL
            uploader.querySelector('#weibo-url-input-btn').addEventListener('click', async () => {
                overlay.remove();
                input.remove();
                const imageUrl = await getImageUrlFromUser();
                resolve(imageUrl);
            });
            
            // 监听文件选择
            input.addEventListener('change', async () => {
                try {
                    const file = input.files && input.files[0];
                    if (!file) {
                        showStatus('未选择文件', true);
                        return;
                    }
                    
                    // 验证文件大小 (最大10MB)
                    if (file.size > 10 * 1024 * 1024) {
                        showStatus('文件太大，请选择小于10MB的图片', true);
                        return;
                    }
                    
                    // 验证文件类型
                    if (!file.type.match('image.*')) {
                        showStatus('请选择图片文件', true);
                        return;
                    }
                    
                    console.log('[微博背景] 文件已选择:', file.name, file.type, Math.round(file.size/1024), 'KB');
                    showStatus('正在处理图片，请稍候...');
                    
                    try {
                        const dataUrl = await fileToDataUrl(file);
                        
                        // 验证数据URL
                        if (!dataUrl || !dataUrl.startsWith('data:image/')) {
                            showStatus('图片处理失败，请重试', true);
                            return;
                        }
                        
                        // 成功读取文件
                        overlay.remove();
                        input.remove();
                        resolve(dataUrl);
                    } catch (readError) {
                        console.error('[微博背景] 读取文件失败:', readError);
                        showStatus('读取图片失败，请重试或选择其他图片', true);
                    }
                } catch (e) {
                    console.error('[微博背景] 处理文件选择时出错:', e);
                    showStatus('处理文件失败', true);
                }
            });
            
            // 添加ESC键关闭
            const escKeyHandler = (e) => {
                if (e.key === 'Escape') {
                    overlay.remove();
                    input.remove();
                    document.removeEventListener('keydown', escKeyHandler);
                    resolve(null);
                }
            };
            document.addEventListener('keydown', escKeyHandler);
            
            // 添加超时处理
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    console.log('[微博背景] 文件选择器超时，自动关闭');
                    overlay.remove();
                    input.remove();
                    resolve(null);
                }
            }, 120000); // 2分钟超时
        } catch (error) {
            console.error('[微博背景] 创建文件选择器失败:', error);
            simpleNotify('无法打开文件选择对话框，将使用URL输入方式');
            
            setTimeout(async () => {
                const imageUrl = await getImageUrlFromUser();
                resolve(imageUrl);
            }, 500);
        }
    });
}
/**
 * 根据当前设置获取背景图片URL
 * @returns {Promise<string|null>} 背景图片URL或null
 */
async function getBackgroundUrl() {
    // 如果未启用背景，返回null
    if (!backgroundStore.enabled) {
        return null;
    }
    
    // 根据背景类型获取URL
    if (backgroundStore.type === 'bing') {
        return await fetchBingImage();
    } else if (backgroundStore.type === 'custom') {
        // 确认自定义URL存在且有效
        if (backgroundStore.url && backgroundStore.url.trim() !== '') {
            console.log('[微博背景] 使用自定义背景图片');
            return backgroundStore.url;
        } else {
            console.log('[微博背景] 自定义背景URL无效，尝试切换到必应图片');
            // 自动切换到必应
            backgroundStore.type = 'bing';
            saveBackgroundConfig();
            return await fetchBingImage();
        }
    }
    
    return null;
}

/**
 * 设置背景类型
 * @param {'bing'|'custom'} type 背景类型
 */
function setBackgroundType(type) {
    console.log('[微博背景] 设置背景类型为:', type);
    
    // 验证类型是否有效
    if (type !== 'bing' && type !== 'custom') {
        console.error('[微博背景] 无效的背景类型:', type);
        simpleNotify('无效的背景类型，使用默认值');
        type = 'bing';
    }
    
    // 验证自定义类型是否有URL（如果是自定义类型）
    if (type === 'custom' && (!backgroundStore.url || backgroundStore.url.trim() === '')) {
        // 如果没有自定义URL但用户想切换到自定义模式，先弹出上传对话框
        console.log('[微博背景] 切换到自定义模式但缺少URL，将触发上传流程');
        // 延迟执行，保存配置但稍后触发上传
        setTimeout(() => {
            uploadCustomBackground().then(success => {
                if (!success) {
                    // 如果用户取消了上传，回退到必应
                    console.log('[微博背景] 用户取消上传，回退到必应图片');
                    backgroundStore.type = 'bing';
                    saveBackgroundConfig();
                    applyBackground();
                }
            });
        }, 100);
    }
    
    // 显示加载提示
    simpleNotify(`正在切换到${type === 'bing' ? '必应每日图片' : '自定义图片'}...`);
    
    // 先保存新的类型
    backgroundStore.type = type;
    saveBackgroundConfig();
    
    // 特别处理：确保背景功能开启
    if (!backgroundStore.enabled) {
        console.log('[微博背景] 背景功能未启用，自动启用');
        backgroundStore.enabled = true;
        saveBackgroundConfig();
    }
    
    // 在清除旧背景前设置加载指示
    let loadingElement = document.getElementById('weibo-background-loading');
    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.id = 'weibo-background-loading';
        loadingElement.textContent = '加载中...';
        loadingElement.style.position = 'fixed';
        loadingElement.style.top = '10px';
        loadingElement.style.right = '10px';
        loadingElement.style.padding = '5px 10px';
        loadingElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
        loadingElement.style.color = 'white';
        loadingElement.style.borderRadius = '4px';
        loadingElement.style.zIndex = '9999';
        loadingElement.style.fontSize = '12px';
        document.body.appendChild(loadingElement);
    }
    
    // 移除现有背景元素，强制重新创建
    const currentBackground = document.getElementById('weibo-blur-background');
    if (currentBackground) {
        currentBackground.remove();
    }
    
    // 延迟很短的时间再应用新背景，确保UI能更新
    setTimeout(() => {
        applyBackground().then(() => {
            // 应用完成后移除加载指示
            if (loadingElement && loadingElement.parentNode) {
                loadingElement.remove();
            }
        });
    }, 50);
}

/**
 * 设置背景不透明度
 * @param {number} opacity 不透明度 (0-1)
 */
function setBackgroundOpacity(opacity) {
    try {
        // 确保值在0-1范围内
        const newOpacity = Math.max(0, Math.min(1, opacity));
        
        // 记录旧值用于调试
        const oldOpacity = backgroundStore.opacity;
        
        // 更新存储的值
        backgroundStore.opacity = newOpacity;
        saveBackgroundConfig();
        
        console.log(`[微博背景] 设置透明度: ${oldOpacity} -> ${newOpacity}`);
        
        // 直接更新现有背景元素的不透明度，无需完全重新应用
        const backgroundElement = document.getElementById('weibo-blur-background');
        if (!backgroundElement) {
            console.warn('[微博背景] 找不到背景元素，无法设置透明度，尝试重新应用背景');
            // 如果元素不存在，尝试重新应用背景
            setTimeout(() => {
                try {
                    applyBackground();
                } catch (e) {
                    console.error('[微博背景] 重新应用背景失败:', e);
                }
            }, 100);
            return;
        }
        
        console.log('[微博背景] 直接更新背景不透明度:', newOpacity);
        
        try {
            // 尝试多种方式应用不透明度
            // 1. 使用内联样式和!important
            backgroundElement.style.setProperty('opacity', String(newOpacity), 'important');
            
            // 2. 添加特定的样式类
            const styleId = 'weibo-bg-opacity-styles';
            let styleElement = document.getElementById(styleId);
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                document.head.appendChild(styleElement);
            }
            
            // 使用时间戳保证选择器唯一性和优先级
            const timestamp = Date.now();
            const opacityClass = `weibo-bg-opacity-${timestamp}`;
            
            // 添加类到元素
            backgroundElement.classList.add(opacityClass);
            
            // 删除所有其他opacity类
            backgroundElement.className.split(' ').forEach(cls => {
                if (cls !== opacityClass && cls.startsWith('weibo-bg-opacity-')) {
                    backgroundElement.classList.remove(cls);
                }
            });
            
            // 添加高优先级CSS规则
            styleElement.textContent = `
                #weibo-blur-background.${opacityClass} {
                    opacity: ${newOpacity} !important;
                    filter: opacity(${newOpacity * 100}%) !important;
                }
            `;
            
            // 3. 直接操作计算样式后强制重绘
            requestAnimationFrame(() => {
                backgroundElement.style.opacity = String(newOpacity);
                backgroundElement.style.filter = `opacity(${newOpacity * 100}%)`;
                backgroundElement.offsetHeight; // 强制回流
            });
            
            // 额外调试 - 记录DOM更新后的实际计算样式
            setTimeout(() => {
                const computedOpacity = window.getComputedStyle(backgroundElement).opacity;
                console.log(`[微博背景] 透明度设置后的计算样式: ${computedOpacity}`);
                
                // 如果计算样式与期望值不匹配，尝试强制重绘
                if (Math.abs(parseFloat(computedOpacity) - newOpacity) > 0.01) {
                    console.log('[微博背景] 检测到透明度未正确应用，尝试强制重绘');
                    backgroundElement.style.display = 'none';
                    backgroundElement.offsetHeight; // 强制回流
                    backgroundElement.style.display = 'block';
                    backgroundElement.style.setProperty('opacity', String(newOpacity), 'important');
                }
            }, 50);
            
            // 显示反馈
            if (Math.round(newOpacity * 100) % 10 === 0) { // 只在10%的倍数上显示通知
                simpleNotify(`背景不透明度: ${Math.round(newOpacity * 100)}%`);
            }
        } catch (innerError) {
            console.error('[微博背景] 设置透明度详细步骤失败:', innerError);
            // 如果详细步骤失败，尝试最简单的方式
            try {
                backgroundElement.style.opacity = String(newOpacity);
            } catch (simpleError) {
                console.error('[微博背景] 简单设置透明度也失败:', simpleError);
                // 失败时使用完全重新应用
                setTimeout(() => applyBackground(), 100);
            }
        }
    } catch (outerError) {
        console.error('[微博背景] 设置透明度整体操作失败:', outerError);
        // 失败时使用完全重新应用
        setTimeout(() => {
            try {
                applyBackground();
            } catch (e) {
                console.error('[微博背景] 错误处理中重新应用背景失败:', e);
            }
        }, 100);
    }
}

/**
 * 切换背景启用状态
 * @returns {boolean} 新的启用状态
 */
function toggleBackgroundEnabled() {
    backgroundStore.enabled = !backgroundStore.enabled;
    saveBackgroundConfig();
    applyBackground();
    return backgroundStore.enabled;
}

/**
 * 清除必应图片缓存
 * 用于强制刷新背景图片，解决图片过期或加载问题
 * @returns {boolean} 是否成功清除缓存
 */
async function clearBingImageCache() {
    try {
        console.log('[微博背景] 正在清除必应图片缓存');
        await chromeStorage.setValue(BING_CACHE_KEY, null);
        simpleNotify('已清除背景图片缓存，将重新获取最新图片');
          // 自动重新应用背景，使用新图片
        setTimeout(() => {
            if (backgroundStore.type === 'bing') {
                applyBackground();
            }
        }, 500);
        
        return true;
    } catch (error) {
        console.error('[微博背景] 清除缓存失败:', error);
        simpleNotify('清除缓存失败，请尝试刷新页面');
        return false;
    }
}

/**
 * 获取用户输入的图片URL
 * @returns {Promise<string|null>} 用户输入的URL或null
 */
function getImageUrlFromUser() {
    return new Promise(async (resolve) => {
        // 尝试获取当前必应图片作为示例
        let exampleUrl = '';
        try {
            // 尝试获取一个默认示例URL
            const cachedData = GM_getValue(BING_CACHE_KEY, null);
            if (cachedData && cachedData.url) {
                exampleUrl = cachedData.url;
            } else {
                // 如果没有缓存，尝试获取一个新的
                const tempUrl = await fetchBingImage();
                if (tempUrl) {
                    exampleUrl = tempUrl;
                }
            }
        } catch (error) {
            console.error('[微博背景] 获取示例URL失败:', error);
        }
        
        // 弹出提示框，让用户输入图片URL
        const url = prompt('请输入图片URL或粘贴图片链接:', exampleUrl);
        
        if (!url || url.trim() === '') {
            resolve(null);
            return;
        }
        
        // 简单验证URL是否是图片
        const isValidImageURL = /\.(jpg|jpeg|png|gif|bmp|webp)(\?.*)?$/i.test(url);
        if (!isValidImageURL) {
            const confirmUse = confirm('输入的URL可能不是有效的图片链接，是否仍然使用？');
            if (!confirmUse) {
                resolve(null);
                return;
            }
        }
        
        resolve(url.trim());
    });
}

/**
 * 上传自定义背景图片
 * @returns {Promise<boolean>}
 */
async function uploadCustomBackground() {
    try {
        simpleNotify('正在打开图片选择器...');
        
        // 创建一个Promise来处理图片选择过程
        const imageResult = await new Promise(async (resolve) => {
            // 首先尝试文件选择器
            const dataUrl = await createFileSelector();
            if (dataUrl) {
                console.log('[微博背景] 已获取图片数据，应用为背景');
                resolve({ type: 'dataUrl', url: dataUrl });
                return;
            }
            
            console.log('[微博背景] 文件选择器未返回图片，尝试URL输入');
            
            // 如果文件选择器失败，提供URL输入作为备用
            const imageUrl = await getImageUrlFromUser();
            if (imageUrl) {
                resolve({ type: 'url', url: imageUrl });
                return;
            }
            
            resolve(null);
        });
        
        if (!imageResult) {
            console.log('[微博背景] 用户取消了图片选择');
            return false;
        }
        
        // 显示加载中提示
        simpleNotify('图片已选择，正在应用...');
          // 保存到配置
        backgroundStore.url = imageResult.url;
        backgroundStore.type = 'custom';
        saveBackgroundConfig();
        
        // 预加载图片，确保能正常显示
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = () => {
                console.log('[微博背景] 图片加载成功，尺寸:', img.width, 'x', img.height);
                applyBackground();
                simpleNotify('自定义背景图片应用成功');
                resolve(true);
            };
            
            img.onerror = () => {                console.error('[微博背景] 自定义图片加载失败:', imageResult.url.substring(0, 50) + '...');
                simpleNotify('图片加载失败，请尝试其他图片');
                
                // 回退到必应图片
                backgroundStore.type = 'bing';
                saveBackgroundConfig();
                applyBackground();
                resolve(false);
            };
            
            // 设置3秒超时
            const timeout = setTimeout(() => {
                if (!img.complete) {
                    console.error('[微博背景] 图片加载超时');
                    img.src = ''; // 中断加载
                    simpleNotify('图片加载超时，请尝试其他图片');
                      // 回退到必应图片
                    backgroundStore.type = 'bing';
                    saveBackgroundConfig();
                    applyBackground();
                    resolve(false);
                }
            }, 10000);
            
            img.onload = () => {
                clearTimeout(timeout);
                console.log('[微博背景] 图片加载成功');
                applyBackground();
                simpleNotify('自定义背景图片应用成功');
                resolve(true);
            };
            
            img.src = imageResult.url;
        });
        
        return true;
    } catch (error) {
        console.error('[微博背景] 上传图片失败:', error);
        simpleNotify('上传图片失败，请尝试直接输入图片URL');
          // 如果出现错误，尝试URL输入作为备用
        const imageUrl = await getImageUrlFromUser();
        if (imageUrl) {
            backgroundStore.url = imageUrl;
            backgroundStore.type = 'custom';
            saveBackgroundConfig();
            
            // 验证URL
            const img = new Image();
            img.onload = () => applyBackground();
            img.onerror = () => {
                // 失败时切换到必应图片
                backgroundStore.type = 'bing';
                saveBackgroundConfig();
                applyBackground();
                simpleNotify('图片URL无法访问，已切换到必应每日图片');
            };
            img.src = imageUrl;
            
            return true;
        }
        
        return false;
    }
}

/**
 * 应用背景图片
 */
async function applyBackground() {
    console.log('[微博背景] 开始应用背景图片...');    try {        // 移除旧背景
        let bgElement = document.getElementById('weibo-blur-background');
        if (bgElement) {
            bgElement.remove();
            console.log('[微博背景] 已移除旧背景元素');
        }        // 不管背景是否启用，都需要处理内容透明度设置
        addContentTransparencyStyles();
        
        // 如果背景功能未启用，直接返回
        if (!backgroundStore.enabled) {
            console.log('[微博背景] 背景功能未启用，不应用背景');
            return;
        }
        
        // 如果自定义背景类型但URL为空，自动切换到必应
        if (backgroundStore.type === 'custom' && (!backgroundStore.url || backgroundStore.url.trim() === '')) {
            console.log('[微博背景] 自定义背景URL为空，自动切换到必应背景');
            backgroundStore.type = 'bing';
            saveBackgroundConfig();
        }
        
        console.log('[微博背景] 当前背景设置:', {
            enabled: backgroundStore.enabled,
            type: backgroundStore.type,
            opacity: backgroundStore.opacity,
            hasCustomUrl: !!backgroundStore.url
        });        // 创建背景元素并添加到DOM，以便在等待图片加载时就已经有了元素
        bgElement = document.createElement('div');
        bgElement.id = 'weibo-blur-background';
        
        // 添加基础样式 - 调整z-index确保在最底层但仍然可见
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
            opacity: ${backgroundStore.opacity}; /* 使用配置的透明度 */
            z-index: -1; /* 改为-1，确保在最底层但仍然可见 */
            pointer-events: none;
            will-change: opacity; /* 优化性能 */
            transition: opacity 0.5s ease;
            background-color: rgba(173, 216, 230, 0.5); /* 提高初始背景色透明度便于调试 */
        `;        bgElement.style.cssText = baseStyle;
          // 立即添加到页面最前面
        if (document.body.firstChild) {
            document.body.insertBefore(bgElement, document.body.firstChild);
        } else {
            document.body.appendChild(bgElement);
        }
        
        // 强制应用特定样式给页面容器
        forceApplyContainerStyles();
        
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
            clearTimeout(imageTimeout); // 清除超时定时器
            
            console.log('[微博背景] 背景图片加载成功');            // 设置背景图片，保留淡蓝色作为混合
            bgElement.style.backgroundImage = `url("${backgroundUrl}")`;
            // 移除淡蓝色背景，仅在加载完成后
            setTimeout(() => {
                const currentBgElement = document.getElementById('weibo-blur-background');
                if (currentBgElement) {
                    currentBgElement.style.backgroundColor = 'transparent';
                    simpleNotify('背景图片应用成功');
                }
            }, 300);
        };
        
        preloadImg.onerror = () => {
            imageLoadSuccess = false;
            console.error('[微博背景] 背景图片加载失败:', backgroundUrl);
            
            // 显示错误通知并保持淡蓝色调试背景
            simpleNotify('背景图片加载失败，使用纯色背景');
              // 确保背景色可见
            bgElement.style.backgroundImage = 'none';
            bgElement.style.backgroundColor = 'rgba(173, 216, 230, 0.3)';
              // 清理缓存，避免重复使用失败的URL
            chromeStorage.setValue(BING_CACHE_KEY, null);
            
            // 记录加载失败
            console.log('[微博背景] 使用淡蓝色背景作为回退');
        };
          // 添加额外的超时检查，确保在一定时间后如果图片未加载则报错
        const imageTimeout = setTimeout(() => {
            if (!imageLoadSuccess) {
                console.error('[微博背景] 背景图片加载超时:', backgroundUrl);
                preloadImg.onerror(); // 触发错误处理
            }
        }, 8000); // 8秒超时
        
        // 开始加载图片
        preloadImg.src = backgroundUrl;
        console.log('[微博背景] 已将背景元素添加到页面，正在加载图片');
        
        // 确保在页面路由变化时背景依然存在
        setupBackgroundPersistence();
        
    } catch (error) {
        console.error('[微博背景] 应用背景时出错:', error);
        simpleNotify('应用背景图片时出错，请查看控制台获取详细信息');
    }
}

/**
 * 强制应用样式到微博主要容器
 * 确保背景能正确显示在内容下方
 */
function forceApplyContainerStyles() {
    // 处理主要容器，确保z-index正确
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
        document.querySelector('.wbpro-side-main')
    ];

    // 应用半透明效果到微博内容容器
    if (backgroundStore.enabled && backgroundStore.content_transparency) {
        // 优先处理文章容器元素
        const articleSelectors = [
            'article',
            '#scroller > div.vue-recycle-scroller__item-wrapper > div > div > article',
            '#scroller > div.vue-recycle-scroller__item-wrapper > div:nth-child(n) > div > article'
        ];
        
        // 拼接文章选择器
        const articleCombinedSelector = articleSelectors.join(', ');
        
        // 查找所有文章元素
        const articleElements = document.querySelectorAll(articleCombinedSelector);
        
        console.log(`[微博背景] 找到 ${articleElements.length} 个微博文章容器`);
        
        // 应用样式到文章元素
        articleElements.forEach(element => {
            if (element) {
                // 获取用户设置的模糊程度
                const blurPixels = backgroundStore.content_blur || 5;
                // 检测深色模式
                const isDarkMode = document.documentElement.classList.contains('woo-theme-dark');
                // 获取用户设置的背景不透明度
                const opacity = backgroundStore.content_bg_opacity !== undefined ? backgroundStore.content_bg_opacity : 0.3;
                // 使用轻微透明背景让模糊效果更明显
                const bgColor = isDarkMode ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;
                
                // 应用样式到文章容器
                element.style.backgroundColor = bgColor;
                element.style.backdropFilter = `blur(${blurPixels}px)`;
                element.style.borderRadius = '8px';
                element.style.margin = '5px 0';
                element.style.padding = '10px';
                element.style.transition = 'backdrop-filter 0.3s ease, background-color 0.3s ease';
                element.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
                
                // 确保内部元素透明
                const innerElements = element.querySelectorAll('.wbpro-feed-content, [class*="feed-content"], [class*="Feed_body"] > div');
                innerElements.forEach(innerEl => {
                    innerEl.style.backgroundColor = 'transparent';
                    innerEl.style.boxShadow = 'none';
                    innerEl.style.borderRadius = '0';
                });
            }
        });
        
        // 处理其他可能的微博内容容器（旧版或其他页面的容器）
        const otherSelectors = [
            '.content:not(article .content)',
            '.card-feed:not(article .card-feed)',
            '.wb-item .content',
            '.card-wrap .card-feed'
        ];
        
        // 拼接其他选择器
        const otherCombinedSelector = otherSelectors.join(', ');
        
        // 查找所有其他内容容器
        const otherContentElements = document.querySelectorAll(otherCombinedSelector);
        
        console.log(`[微博背景] 找到 ${otherContentElements.length} 个其他微博内容容器`);
        
        // 应用样式到其他内容容器
        otherContentElements.forEach(element => {
            if (element) {
                // 获取用户设置的模糊程度
                const blurPixels = backgroundStore.content_blur || 5;
                // 检测深色模式
                const isDarkMode = document.documentElement.classList.contains('woo-theme-dark');
                // 获取用户设置的背景不透明度
                const opacity = backgroundStore.content_bg_opacity !== undefined ? backgroundStore.content_bg_opacity : 0.3;
                // 使用轻微透明背景让模糊效果更明显
                const bgColor = isDarkMode ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;
                
                element.style.backgroundColor = bgColor;
                element.style.backdropFilter = `blur(${blurPixels}px)`;
                element.style.borderRadius = '8px';
                element.style.margin = '5px';
                element.style.padding = '10px';
                element.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
                element.style.transition = 'backdrop-filter 0.3s ease, background-color 0.3s ease';
            }
        });
        
        if (articleElements.length > 0 || otherContentElements.length > 0) {
            console.log('[微博背景] 已应用半透明效果到微博容器');
        }
    }
    
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
            }
            
            // 应用必要的样式
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
            
            console.log(`[微博背景] 已应用样式到容器:`, container);
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
    });
    
    // 确保body和html也有相对定位并且没有背景色
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
 * 确保背景在页面路由变化时保持显示
 */
function setupBackgroundPersistence() {
    // 保存全局引用
    window.__weiboBackgroundObserver = null;
    
    // 如果已存在观察器，先销毁
    if (window.__weiboBackgroundObserver) {
        window.__weiboBackgroundObserver.disconnect();
    }
      // 定期检查背景是否可见
    const periodicCheck = setInterval(() => {        // 如果背景功能启用，但背景元素丢失，则重新应用
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
                    backgroundElement.style.visibility = 'visible';
                }
            }
        }
    }, 5000); // 每5秒检查一次
    
    // 保存引用以便清除
    window.__weiboBackgroundCheckInterval = periodicCheck;
      // 创建一个MutationObserver来监听DOM变化
    const observer = new MutationObserver((mutations) => {
        // 防抖动处理
        if (window.__weiboBackgroundDebounce) {
            clearTimeout(window.__weiboBackgroundDebounce);
        }
        
        window.__weiboBackgroundDebounce = setTimeout(() => {
            // 检查背景功能状态
            if (!backgroundStore.enabled) {
                const backgroundElement = document.getElementById('weibo-blur-background');
                if (backgroundElement) {
                    console.log('[微博背景] 检测到背景功能已关闭，移除背景元素');
                    backgroundElement.remove();
                }
                return;
            }
            
            // 检查背景功能是否启用
            if (backgroundStore.enabled) {
                // 检查背景元素是否还存在
                const backgroundElement = document.getElementById('weibo-blur-background');
                if (!backgroundElement) {
                    console.log('[微博背景] 检测到背景元素丢失，重新应用背景');
                    applyBackground();
                    return;
                }
            }
              // 如果背景元素存在但没有正确的样式，修复它
            const bgElement = document.getElementById('weibo-blur-background');
            if (bgElement) {
                const backgroundStyle = window.getComputedStyle(bgElement);
                
                // 检查是否需要修复z-index
                if (parseInt(backgroundStyle.zIndex) < -1 || parseFloat(backgroundStyle.opacity) === 0) {
                    console.log('[微博背景] 检测到背景元素样式异常，正在修复 z-index:', backgroundStyle.zIndex, 'opacity:', backgroundStyle.opacity);
                    bgElement.style.zIndex = '-1'; // 使用-1而不是-9999
                    bgElement.style.opacity = backgroundStore.opacity;
                    bgElement.style.display = 'block';
                    bgElement.style.visibility = 'visible';
                }
                
                // 重新应用容器样式，确保内容在背景上方显示
                forceApplyContainerStyles();
            }
        }, 300); // 300ms防抖动
    });
    
    // 启动观察器，监控整个文档
    observer.observe(document.documentElement, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'id']
    });
    
    // 保存引用以备后续使用
    window.__weiboBackgroundObserver = observer;
    console.log('[微博背景] 已设置背景持久性监视');
}

// 添加半透明微博内容的CSS样式
function addContentTransparencyStyles() {
    const styleId = 'weibo-content-transparency-style';
    
    // 如果背景功能未启用或内容透明度未启用，移除已有样式
    if (!backgroundStore.enabled || !backgroundStore.content_transparency) {
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
            console.log('[微博背景] 已移除微博内容模糊样式');
        }
        return;
    }
    
    // 更新或创建样式元素
    let style = document.getElementById(styleId);
    if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
    }
    
    // 获取用户设置的模糊度
    const blurPixels = backgroundStore.content_blur || 5; // 默认值为5px
    // 获取用户设置的不透明度，如果没有设置，使用默认值0.3
    const bgOpacity = backgroundStore.content_bg_opacity !== undefined ? backgroundStore.content_bg_opacity : 0.3;
    
    // 使用用户配置的模糊度和不透明度动态生成CSS
    style.textContent = `
        /* 默认浅色模式 - 微博Feed容器 - 整体article元素背景模糊 */
        #scroller > div.vue-recycle-scroller__item-wrapper > div > div > article,
        #scroller > div.vue-recycle-scroller__item-wrapper > div:nth-child(n) > div > article {
            background-color: rgba(255, 255, 255, ${bgOpacity}) !important;
            backdrop-filter: blur(${blurPixels}px) !important;
            border-radius: 8px !important;
            margin: 5px 0 !important;
            padding: 10px !important;
            transition: backdrop-filter 0.3s ease, background-color 0.3s ease !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05) !important;
        }
        
        /* 微博Feed内容 - 内部容器保持透明 */
        .wbpro-feed-content {
            background-color: transparent !important;
            border-radius: 0 !important;
            padding: 8px !important;
            box-shadow: none !important;
        }
        
        /* 具体的长选择器 - 完全匹配原始选择器内容 */
        #scroller > div.vue-recycle-scroller__item-wrapper > div > div > article > div.Feed_body_3R0rO > div.wbpro-feed-content {
            background-color: transparent !important;
            border-radius: 0 !important;
        }
        
        /* Feed容器的通用选择器 - 内部容器保持透明 */
        article div[class*="feed-content"],
        article div[class*="Feed_body"] > div {
            background-color: transparent !important;
            box-shadow: none !important;
        }
        
        /* 默认浅色模式 - 其他微博样式 */
        .wb-item .content,
        .card-wrap .card-feed {
            background-color: rgba(255, 255, 255, ${bgOpacity}) !important;
            backdrop-filter: blur(${blurPixels}px) !important;
            border-radius: 8px !important;
            margin: 5px !important;
            padding: 10px !important;
            transition: backdrop-filter 0.3s ease, background-color 0.3s ease !important;
        }
          
        /* 深色模式适配 - 整体容器 */
        html.woo-theme-dark #scroller > div.vue-recycle-scroller__item-wrapper > div > div > article,
        html.woo-theme-dark #scroller > div.vue-recycle-scroller__item-wrapper > div:nth-child(n) > div > article {
            background-color: rgba(0, 0, 0, ${bgOpacity}) !important;
            backdrop-filter: blur(${blurPixels}px) !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3) !important;
        }
        
        /* 深色模式适配 - 内部容器 */
        html.woo-theme-dark .wbpro-feed-content,
        html.woo-theme-dark article div[class*="feed-content"],
        html.woo-theme-dark article div[class*="Feed_body"] > div {
            background-color: transparent !important;
            box-shadow: none !important;
        }
          
        /* 深色模式适配 - 其他容器 */
        html.woo-theme-dark .wb-item .content,
        html.woo-theme-dark .card-wrap .card-feed {
            background-color: rgba(0, 0, 0, ${bgOpacity}) !important;
            backdrop-filter: blur(${blurPixels}px) !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
        }
    `;
      
    // 样式已在前面添加到文档，这里不需要再添加
    console.log('[微博背景] 已添加微博内容半透明样式 - 模糊度:', blurPixels, 'px, 不透明度:', bgOpacity);
    
    // 使用MutationObserver监听新添加的内容并应用样式
    setupContentObserver();
}

/**
 * 设置内容观察器，监视新添加的微博内容并应用半透明样式
 */
function setupContentObserver() {
    // 如果已经有观察器，先移除
    if (window.__weiboContentObserver) {
        window.__weiboContentObserver.disconnect();
        window.__weiboContentObserver = null;
    }
    
    // 如果背景或内容透明度未启用，不设置观察器
    if (!backgroundStore.enabled || !backgroundStore.content_transparency) {
        return;
    }

    // 创建观察器
    const observer = new MutationObserver((mutations) => {
        let hasNewContent = false;
        
        // 检查所有变动
        for (const mutation of mutations) {
            // 检查添加的节点
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 查找节点内的微博文章元素
                        const articles = node.querySelectorAll('article, #scroller > div.vue-recycle-scroller__item-wrapper > div > div > article');
                        if (articles.length > 0) {
                            hasNewContent = true;
                            
                            // 将样式直接应用到文章元素
                            articles.forEach(element => {
                                // 获取用户设置的模糊度
                                const blurPixels = backgroundStore.content_blur || 5;
                                // 检测深色模式
                                const isDarkMode = document.documentElement.classList.contains('woo-theme-dark');
                                // 获取用户设置的背景不透明度
                                const opacity = backgroundStore.content_bg_opacity !== undefined ? backgroundStore.content_bg_opacity : 0.3;
                                // 根据深色/浅色模式使用不同的背景色
                                const bgColor = isDarkMode ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;
                                
                                // 首先尝试使用dataset检查是否已应用样式及模糊度
                                const currentBlur = element.dataset.appliedBlur;
                                const currentOpacity = element.dataset.appliedOpacity;
                                
                                // 如果模糊度值或不透明度不同或未应用，则应用新样式
                                if (!currentBlur || parseInt(currentBlur) !== blurPixels || 
                                    !currentOpacity || parseFloat(currentOpacity) !== opacity) {
                                    console.log('[微博背景] 更新文章容器样式 - 模糊度:', blurPixels, '不透明度:', opacity);
                                    // 应用内联样式到文章容器
                                    element.style.backgroundColor = bgColor;
                                    element.style.backdropFilter = `blur(${blurPixels}px)`;
                                    element.style.borderRadius = '8px';
                                    element.style.margin = '5px 0';
                                    element.style.padding = '10px';
                                    element.style.transition = 'backdrop-filter 0.3s ease, background-color 0.3s ease';
                                    element.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
                                    
                                    // 确保内部内容容器是透明的
                                    const innerContents = element.querySelectorAll('.wbpro-feed-content, [class*="feed-content"], [class*="Feed_body"] > div');
                                    innerContents.forEach(inner => {
                                        inner.style.backgroundColor = 'transparent';
                                        inner.style.boxShadow = 'none';
                                        inner.style.borderRadius = '0';
                                    });
                                    
                                    // 标记已应用的模糊度和不透明度
                                    element.dataset.appliedBlur = blurPixels.toString();
                                    element.dataset.appliedOpacity = opacity.toString();
                                }
                            });
                        }
                        
                        // 查找其他类型的内容容器（针对旧版微博或其他页面）
                        const otherElements = node.querySelectorAll('.wb-item .content, .card-wrap .card-feed');
                        if (otherElements.length > 0) {
                            hasNewContent = true;
                            // 将样式应用到其他内容容器
                            otherElements.forEach(element => {
                                // 获取用户设置的模糊度
                                const blurPixels = backgroundStore.content_blur || 5;
                                // 检测深色模式
                                const isDarkMode = document.documentElement.classList.contains('woo-theme-dark');
                                // 获取用户设置的背景不透明度
                                const opacity = backgroundStore.content_bg_opacity !== undefined ? backgroundStore.content_bg_opacity : 0.3;
                                // 根据深色/浅色模式使用不同的背景色
                                const bgColor = isDarkMode ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;
                                
                                // 检查是否需要更新
                                const currentBlur = element.dataset.appliedBlur;
                                const currentOpacity = element.dataset.appliedOpacity;
                               
                                if (!currentBlur || parseInt(currentBlur) !== blurPixels || 
                                    !currentOpacity || parseFloat(currentOpacity) !== opacity) {
                                    element.style.backgroundColor = bgColor;
                                    element.style.backdropFilter = `blur(${blurPixels}px)`;
                                    element.style.borderRadius = '8px';
                                    element.style.margin = '5px';
                                    element.style.padding = '10px';
                                    element.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
                                    element.style.transition = 'backdrop-filter 0.3s ease, background-color 0.3s ease';
                                    
                                    // 标记已应用的模糊度和不透明度
                                    element.dataset.appliedBlur = blurPixels.toString();
                                    element.dataset.appliedOpacity = opacity.toString();
                                }
                            });
                        }
                    }
                }
            }
        }
        
        // 如果有新内容，重新应用容器样式
        if (hasNewContent) {
            console.log('[微博背景] 检测到新内容，重新应用容器样式');
            forceApplyContainerStyles();
        }
    });
    
    // 配置观察选项
    const config = { 
        childList: true,  // 观察直接子节点变化
        subtree: true,    // 观察所有后代节点
        attributes: false  // 不观察属性变化
    };
    
    // 开始观察整个文档
    observer.observe(document.body, config);
    
    // 保存观察器引用
    window.__weiboContentObserver = observer;
    console.log('[微博背景] 已设置内容观察器');
}

// 确保页面加载完成后添加样式
function ensureContentTransparency() {
    // 立即添加一次
    addContentTransparencyStyles();
    
    // DOM就绪时添加
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            addContentTransparencyStyles();
        });
    }
    
    // 页面完全加载后再次添加以确保应用到所有内容
    window.addEventListener('load', () => {
        setTimeout(() => {
            addContentTransparencyStyles();
        }, 1000);
    });
    
    // 处理微博的单页应用路由变化
    const originalPushState = window.history.pushState;
    window.history.pushState = function() {
        originalPushState.apply(this, arguments);
        // 路由变化后添加延迟，确保新内容已加载
        setTimeout(() => {
            addContentTransparencyStyles();
        }, 500);
    };
}

// 初始化时添加样式
ensureContentTransparency();

/**
 * 设置内容的模糊程度
 * @param {number} blurValue 模糊值，0-1之间，将被转换为0-20px的模糊度
 * @returns {boolean} 是否设置成功
 */
function setContentBlur(blurValue) {
    // 验证模糊值，允许0-1的输入值（兼容旧版滑块范围）
    if (typeof blurValue !== 'number' || blurValue < 0 || blurValue > 1) {
        console.error('[微博背景] 无效的模糊度值:', blurValue);
        return false;
    }
    
    // 将0-1的透明度值转换为0-20的模糊值
    const blurPixels = Math.round(blurValue * 20);
    
    // 更新存储的模糊度值
    backgroundStore.content_blur = blurPixels;
    // 同时保持透明度值更新以保持兼容性
    backgroundStore.content_opacity = blurValue;
    saveBackgroundConfig();
    console.log(`[微博背景] 内容模糊度已设置为: ${blurPixels}px (透明度值: ${blurValue})`);
    
    // 重新应用样式
    addContentTransparencyStyles();
    
    // 同时更新DOM中已存在的元素，确保实时生效
    if (backgroundStore.enabled && backgroundStore.content_transparency) {
        try {
            // 应用到所有文章元素
            const articles = document.querySelectorAll('article, #scroller > div.vue-recycle-scroller__item-wrapper > div > div > article');
            // 检测深色模式
            const isDarkMode = document.documentElement.classList.contains('woo-theme-dark');
            // 获取用户设置的背景不透明度，如未设置则使用默认值
            const opacity = backgroundStore.content_bg_opacity !== undefined ? backgroundStore.content_bg_opacity : 0.3;
            // 根据深色/浅色模式使用不同的背景色
            const bgColor = isDarkMode ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;
            const blurFilter = `blur(${blurPixels}px)`;
                
            articles.forEach(element => {
                if (element) {
                    element.style.backdropFilter = blurFilter;
                    element.dataset.appliedBlur = blurPixels.toString();
                }
            });
            
            // 应用到其他内容元素
            const otherContents = document.querySelectorAll('.wb-item .content, .card-wrap .card-feed');
            otherContents.forEach(element => {
                if (element) {
                    element.style.backdropFilter = blurFilter;
                    element.dataset.appliedBlur = blurPixels.toString();
                }
            });
            
            console.log(`[微博背景] 已更新 ${articles.length + otherContents.length} 个元素的模糊度`);
        } catch (error) {
            console.error('[微博背景] 更新DOM元素模糊度时出错:', error);
        }
    }
    
    // 显示通知
    if (blurPixels % 2 === 0) { // 只在偶数像素值时显示通知，避免过多通知
        simpleNotify(`博文模糊度: ${blurPixels}px`);
    }
    
    return true;
}

// 兼容原函数名称，防止旧代码调用出错
function setContentOpacity(blurValue) {
    return setContentBlur(blurValue);
}

/**
 * 设置内容背景的不透明度
 * @param {number} opacityValue 不透明度值，0-1之间
 * @returns {boolean} 是否设置成功
 */
function setContentBgOpacity(opacityValue) {
    // 验证不透明度值
    if (typeof opacityValue !== 'number' || opacityValue < 0 || opacityValue > 1) {
        console.error('[微博背景] 无效的不透明度值:', opacityValue);
        return false;
    }
    
    // 更新存储的不透明度值
    backgroundStore.content_bg_opacity = opacityValue;
    saveBackgroundConfig();
    console.log(`[微博背景] 内容背景不透明度已设置为: ${opacityValue}`);
    
    // 重新应用样式
    addContentTransparencyStyles();
    
    // 同时更新DOM中已存在的元素，确保实时生效
    if (backgroundStore.enabled && backgroundStore.content_transparency) {
        try {
            // 检测深色模式
            const isDarkMode = document.documentElement.classList.contains('woo-theme-dark');
            // 根据深色/浅色模式使用不同的背景色
            const bgColor = isDarkMode ? `rgba(0, 0, 0, ${opacityValue})` : `rgba(255, 255, 255, ${opacityValue})`;
            const blurPixels = backgroundStore.content_blur || 5;
            const blurFilter = `blur(${blurPixels}px)`;
            
            // 应用到所有文章元素
            const articles = document.querySelectorAll('article, #scroller > div.vue-recycle-scroller__item-wrapper > div > div > article');
            articles.forEach(element => {
                if (element) {
                    element.style.backgroundColor = bgColor;
                }
            });
            
            // 应用到其他内容元素
            const otherContents = document.querySelectorAll('.wb-item .content, .card-wrap .card-feed');
            otherContents.forEach(element => {
                if (element) {
                    element.style.backgroundColor = bgColor;
                }
            });
            
            console.log(`[微博背景] 已更新 ${articles.length + otherContents.length} 个元素的背景不透明度`);
        } catch (error) {
            console.error('[微博背景] 更新DOM元素背景不透明度时出错:', error);
        }
    }
    
    // 显示通知
    if (Math.round(opacityValue * 100) % 10 === 0) { // 只在10%的倍数上显示通知
        simpleNotify(`内容背景不透明度: ${Math.round(opacityValue * 100)}%`);
    }
    
    return true;
}

/**
 * 切换内容透明度开关
 * @returns {boolean} 新的状态
 */
function toggleContentTransparency() {
    backgroundStore.content_transparency = !backgroundStore.content_transparency;
    saveBackgroundConfig();
    
    // 更新样式
    addContentTransparencyStyles();
    
    // 显示通知
    simpleNotify(`微博内容模糊效果已${backgroundStore.content_transparency ? '开启' : '关闭'}`);
    
    return backgroundStore.content_transparency;
}
