// 背景图片管理功能
import { blurStore, saveBlurConfig } from './storage';
import { simpleNotify } from './notification';

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
        const cachedData = GM_getValue(BING_CACHE_KEY, null);
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
        GM_setValue(BING_CACHE_KEY, {
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
            // 使用油猴API直接调用文件选择
            if (typeof GM_openInTab === 'function') {
                console.log('[微博背景] 尝试使用油猴API进行文件选择');
                
                // 创建一个隐藏的文件输入
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.style.position = 'fixed';
                input.style.top = '-1000px';
                document.body.appendChild(input);
                
                // 添加事件监听
                input.addEventListener('change', async (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        try {
                            const dataUrl = await fileToDataUrl(file);
                            input.remove();
                            resolve(dataUrl);
                        } catch (error) {
                            console.error('[微博背景] 读取文件失败：', error);
                            input.remove();
                            simpleNotify('读取图片失败，请重试或尝试直接输入图片URL');
                            resolve(null);
                        }
                    } else {
                        input.remove();
                        resolve(null);
                    }
                });
                
                // 模拟点击打开文件选择器
                console.log('[微博背景] 触发文件选择器点击');
                input.click();
                
                // 处理取消选择的情况
                setTimeout(() => {
                    if (input && document.body.contains(input) && input.files.length === 0) {
                        console.log('[微博背景] 文件选择超时或取消');
                        input.remove();
                        resolve(null);
                    }
                }, 60000); // 1分钟超时
            } else {
                // 回退方法 - 创建普通的文件选择器
                console.log('[微博背景] 使用标准DOM API进行文件选择');
                
                // 创建一个临时包装容器，确保元素添加到DOM中并可见
                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'position: fixed; top: 10px; left: 10px; z-index: 9999; background: white; padding: 10px; border: 1px solid #ccc;';
                wrapper.innerHTML = '<p>请选择背景图片：</p>';
                document.body.appendChild(wrapper);
                
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                wrapper.appendChild(input);
                
                // 添加关闭按钮
                const closeBtn = document.createElement('button');
                closeBtn.textContent = '取消';
                closeBtn.style.marginLeft = '10px';
                wrapper.appendChild(closeBtn);
                
                closeBtn.onclick = () => {
                    wrapper.remove();
                    resolve(null);
                };
                
                // 添加点击事件处理
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        try {
                            const dataUrl = await fileToDataUrl(file);
                            wrapper.remove();
                            resolve(dataUrl);
                        } catch (error) {
                            console.error('[微博背景] 读取上传的文件失败:', error);
                            simpleNotify('读取图片失败，请重试或尝试直接输入图片URL');
                            wrapper.remove();
                            resolve(null);
                        }
                    } else {
                        wrapper.remove();
                        resolve(null);
                    }
                };
            }
        } catch (error) {
            console.error('[微博背景] 创建文件选择器失败:', error);
            simpleNotify('无法打开文件选择对话框，将使用URL输入方式');
            
            // 直接转到URL输入方式
            setTimeout(() => {
                resolve(null);
            }, 500);
        }
    });
}

/**
 * 根据当前设置获取背景图片URL
 * @returns {Promise<string|null>} 背景图片URL或null
 */
export async function getBackgroundUrl() {
    // 如果未启用背景，返回null
    if (!blurStore.background_enabled) {
        return null;
    }
    
    // 根据背景类型获取URL
    if (blurStore.background_type === 'bing') {
        return await fetchBingImage();
    } else if (blurStore.background_type === 'custom' && blurStore.background_url) {
        return blurStore.background_url;
    }
    
    return null;
}

/**
 * 设置背景类型
 * @param {'bing'|'custom'} type 背景类型
 */
export function setBackgroundType(type) {
    console.log('[微博背景] 设置背景类型为:', type);
    
    // 显示加载提示
    simpleNotify(`正在切换到${type === 'bing' ? '必应每日图片' : '自定义图片'}...`);
    
    // 先保存新的类型
    blurStore.background_type = type;
    saveBlurConfig();
    
    // 特别处理：确保背景功能开启
    if (!blurStore.background_enabled) {
        console.log('[微博背景] 背景功能未启用，自动启用');
        blurStore.background_enabled = true;
        saveBlurConfig();
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
export function setBackgroundOpacity(opacity) {
    // 确保值在0-1范围内
    const newOpacity = Math.max(0, Math.min(1, opacity));
    
    // 记录旧值用于调试
    const oldOpacity = blurStore.background_opacity;
    
    // 更新存储的值
    blurStore.background_opacity = newOpacity;
    saveBlurConfig();
    
    console.log(`[微博背景] 设置透明度: ${oldOpacity} -> ${newOpacity}`);
    
    // 直接更新现有背景元素的不透明度，无需完全重新应用
    const backgroundElement = document.getElementById('weibo-blur-background');
    if (backgroundElement) {
        console.log('[微博背景] 直接更新背景不透明度:', newOpacity);
        
        // 强制使用!important确保样式被应用
        backgroundElement.style.setProperty('opacity', newOpacity, 'important');
        
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
                backgroundElement.style.setProperty('opacity', newOpacity, 'important');
            }
        }, 50);
        
        // 显示反馈
        if (Math.round(newOpacity * 100) % 10 === 0) { // 只在10%的倍数上显示通知
            simpleNotify(`背景不透明度: ${Math.round(newOpacity * 100)}%`);
        }
    } else {
        // 如果背景元素不存在，则完全重新应用
        console.log('[微博背景] 未找到背景元素，重新应用背景');
        applyBackground();
    }
}

/**
 * 切换背景启用状态
 * @returns {boolean} 新的启用状态
 */
export function toggleBackgroundEnabled() {
    blurStore.background_enabled = !blurStore.background_enabled;
    saveBlurConfig();
    applyBackground();
    return blurStore.background_enabled;
}

/**
 * 清除必应图片缓存
 * 用于强制刷新背景图片，解决图片过期或加载问题
 * @returns {boolean} 是否成功清除缓存
 */
export function clearBingImageCache() {
    try {
        console.log('[微博背景] 正在清除必应图片缓存');
        GM_setValue(BING_CACHE_KEY, null);
        simpleNotify('已清除背景图片缓存，将重新获取最新图片');
        
        // 自动重新应用背景，使用新图片
        setTimeout(() => {
            if (blurStore.background_type === 'bing') {
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
export async function uploadCustomBackground() {
    try {
        simpleNotify('正在打开图片选择器...');
        
        // 首先尝试文件选择器
        const dataUrl = await createFileSelector();
        if (dataUrl) {
            console.log('[微博背景] 已获取图片数据，应用为背景');
            
            // 显示加载中提示
            simpleNotify('图片已选择，正在应用...');
            
            // 保存到配置
            blurStore.background_url = dataUrl;
            blurStore.background_type = 'custom';
            saveBlurConfig();
            
            // 预加载图片，确保能正常显示
            const img = new Image();
            img.onload = () => {
                applyBackground();
                simpleNotify('自定义背景图片应用成功');
            };
            img.onerror = () => {
                console.error('[微博背景] 自定义图片加载失败');
                simpleNotify('图片加载失败，请尝试其他图片');
                
                // 回退到必应图片
                blurStore.background_type = 'bing';
                saveBlurConfig();
                applyBackground();
            };
            img.src = dataUrl;
            
            return true;
        }
        
        console.log('[微博背景] 文件选择器未返回图片，尝试URL输入');
        
        // 如果文件选择器失败，提供URL输入作为备用
        const imageUrl = await getImageUrlFromUser();
        if (imageUrl) {
            simpleNotify('正在加载图片...');
            
            // 保存到配置
            blurStore.background_url = imageUrl;
            blurStore.background_type = 'custom';
            saveBlurConfig();
            
            // 验证URL可访问性
            const img = new Image();
            img.onload = () => {
                applyBackground();
                simpleNotify('自定义背景图片应用成功');
            };
            img.onerror = () => {
                console.error('[微博背景] URL图片加载失败:', imageUrl);
                simpleNotify('图片URL无法访问，请检查链接是否正确或尝试其他方式');
                
                // 自动切换到必应图片
                blurStore.background_type = 'bing';
                saveBlurConfig();
                applyBackground();
            };
            img.src = imageUrl;
            
            return true;
        }
        
        console.log('[微博背景] 用户取消了图片选择');
        return false;
    } catch (error) {
        console.error('[微博背景] 上传图片失败:', error);
        simpleNotify('上传图片失败，请尝试直接输入图片URL');
        
        // 如果出现错误，尝试URL输入作为备用
        const imageUrl = await getImageUrlFromUser();
        if (imageUrl) {
            blurStore.background_url = imageUrl;
            blurStore.background_type = 'custom';
            saveBlurConfig();
            
            // 验证URL
            const img = new Image();
            img.onload = () => applyBackground();
            img.onerror = () => {
                // 失败时切换到必应图片
                blurStore.background_type = 'bing';
                saveBlurConfig();
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
export async function applyBackground() {
    console.log('[微博背景] 开始应用背景图片...');
    try {
        // 移除旧背景
        let backgroundElement = document.getElementById('weibo-blur-background');
        if (backgroundElement) {
            backgroundElement.remove();
            console.log('[微博背景] 已移除旧背景元素');
        }
        
        // 如果高斯模糊未启用，直接返回，不应用背景
        if (!blurStore.enabled) {
            console.log('[微博背景] 高斯模糊功能未启用，不应用背景');
            return;
        }
        
        // 如果背景功能未启用，直接返回
        if (!blurStore.background_enabled) {
            console.log('[微博背景] 背景功能未启用，不应用背景');
            return;
        }
        
        console.log('[微博背景] 当前背景设置:', {
            enabled: blurStore.background_enabled,
            type: blurStore.background_type,
            opacity: blurStore.background_opacity,
            hasCustomUrl: !!blurStore.background_url
        });
        
        // 创建背景元素并添加到DOM，以便在等待图片加载时就已经有了元素
        backgroundElement = document.createElement('div');
        backgroundElement.id = 'weibo-blur-background';
        
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
            opacity: ${blurStore.background_opacity}; /* 使用配置的透明度 */
            z-index: -1; /* 改为-1，确保在最底层但仍然可见 */
            pointer-events: none;
            will-change: opacity; /* 优化性能 */
            transition: opacity 0.5s ease;
            background-color: rgba(173, 216, 230, 0.5); /* 提高初始背景色透明度便于调试 */
        `;
        backgroundElement.style.cssText = baseStyle;
        
        // 立即添加到页面最前面
        if (document.body.firstChild) {
            document.body.insertBefore(backgroundElement, document.body.firstChild);
        } else {
            document.body.appendChild(backgroundElement);
        }
        
        // 强制应用特定样式给页面容器
        forceApplyContainerStyles();
        
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
            
            console.log('[微博背景] 背景图片加载成功');
            // 设置背景图片，保留淡蓝色作为混合
            backgroundElement.style.backgroundImage = `url("${backgroundUrl}")`;
            // 移除淡蓝色背景，仅在加载完成后
            setTimeout(() => {
                if (backgroundElement) {
                    backgroundElement.style.backgroundColor = 'transparent';
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
            backgroundElement.style.backgroundImage = 'none';
            backgroundElement.style.backgroundColor = 'rgba(173, 216, 230, 0.3)';
            
            // 清理缓存，避免重复使用失败的URL
            GM_setValue(BING_CACHE_KEY, null);
            
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
    const periodicCheck = setInterval(() => {
        const backgroundElement = document.getElementById('weibo-blur-background');
        if (!backgroundElement && blurStore.background_enabled && blurStore.enabled) {
            console.log('[微博背景] 定期检查: 背景元素丢失，重新应用背景');
            applyBackground();
        } else if (backgroundElement) {
            // 检查是否可见 - 这里我们检查计算样式
            const style = window.getComputedStyle(backgroundElement);
            if (style.display === 'none' || parseFloat(style.opacity) === 0 || style.visibility === 'hidden') {
                console.log('[微博背景] 定期检查: 背景元素不可见，重置样式');
                backgroundElement.style.display = 'block';
                backgroundElement.style.opacity = blurStore.background_opacity;
                backgroundElement.style.visibility = 'visible';
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
            // 检查高斯模糊是否启用
            if (!blurStore.enabled) {
                // 如果高斯模糊未启用，移除背景元素
                const backgroundElement = document.getElementById('weibo-blur-background');
                if (backgroundElement) {
                    console.log('[微博背景] 检测到高斯模糊已关闭，移除背景元素');
                    backgroundElement.remove();
                }
                return;
            }
            
            // 检查背景元素是否还存在
            const backgroundElement = document.getElementById('weibo-blur-background');
            if (!backgroundElement && blurStore.background_enabled && blurStore.enabled) {
                console.log('[微博背景] 检测到背景元素丢失，重新应用背景');
                applyBackground();
                return;
            }
            
            // 如果背景元素存在但没有正确的样式，修复它
            if (backgroundElement) {
                const backgroundStyle = window.getComputedStyle(backgroundElement);
                
                // 检查是否需要修复z-index
                if (parseInt(backgroundStyle.zIndex) < -1 || parseFloat(backgroundStyle.opacity) === 0) {
                    console.log('[微博背景] 检测到背景元素样式异常，正在修复 z-index:', backgroundStyle.zIndex, 'opacity:', backgroundStyle.opacity);
                    backgroundElement.style.zIndex = '-1'; // 使用-1而不是-9999
                    backgroundElement.style.opacity = blurStore.background_opacity;
                    backgroundElement.style.display = 'block';
                    backgroundElement.style.visibility = 'visible';
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
