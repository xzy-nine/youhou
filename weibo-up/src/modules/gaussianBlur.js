// 高斯模糊功能模块
import { blurStore, saveBlurConfig } from '../utils/storage';
import { gaussianBlurCSS } from '../styles/gaussianBlur';
import { simpleNotify } from '../utils/notification';
import { applyBackground } from '../utils/background';

// 应用高斯模糊样式
export function applyGaussianBlurStyles() {
  // 移除旧样式（如果存在）
  const existingStyle = document.getElementById('weibo-gaussian-blur-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  // 如果功能未启用，则不添加样式
  if (!blurStore.enabled) {
    console.log('[微博高斯模糊] 功能未启用，不应用模糊效果');
    return;
  }

  // 创建样式元素
  const styleElement = document.createElement('style');
  styleElement.id = 'weibo-gaussian-blur-style';
  
  // 设置CSS变量以动态控制模糊强度
  document.documentElement.style.setProperty('--wb-blur-intensity', `${blurStore.intensity}px`);
  
  // 添加样式
  styleElement.textContent = gaussianBlurCSS;
  document.head.appendChild(styleElement);
  
  // 应用背景（如果启用）
  applyBackground();
  
  console.log(`[微博高斯模糊] 已应用模糊效果，强度: ${blurStore.intensity}px`);
  
  // 显示通知
  if (blurStore.notify_enabled) {
    simpleNotify(`已应用微博高斯模糊效果，强度: ${blurStore.intensity}px`);
  }
}

// 切换高斯模糊功能
export function toggleGaussianBlur() {
  blurStore.enabled = !blurStore.enabled;
  saveBlurConfig();
  applyGaussianBlurStyles();
  
  // 当禁用高斯模糊时，确保移除背景元素
  if (!blurStore.enabled) {
    const backgroundElement = document.getElementById('weibo-blur-background');
    if (backgroundElement) {
      console.log('[微博高斯模糊] 功能已禁用，移除背景元素');
      backgroundElement.remove();
    }
  }
  
  // 分发自定义事件，通知其他模块状态变化
  document.dispatchEvent(new CustomEvent('blurChange', {
    detail: {
      enabled: blurStore.enabled,
      intensity: blurStore.intensity
    }
  }));
  
  console.log(`[微博高斯模糊] 状态: ${blurStore.enabled ? '已启用' : '已禁用'}, 强度: ${blurStore.intensity}px`);
  
  return blurStore.enabled;
}

// 设置高斯模糊强度
export function setBlurIntensity(value) {
  const intensity = parseInt(value, 10) || 5;
  blurStore.intensity = Math.max(1, Math.min(15, intensity)); // 限制在1-15px范围内
  saveBlurConfig();
  
  // 直接更新CSS变量，确保实时生效
  try {
    // 设置根元素CSS变量
    document.documentElement.style.setProperty('--wb-blur-intensity', `${blurStore.intensity}px`);
    
    // 强制样式更新，确保所有使用该变量的元素都会立即重新应用样式
    const blurElements = document.querySelectorAll('[style*="backdrop-filter"]');
    blurElements.forEach(el => {
      // 触发重绘
      el.style.backdropFilter = `blur(${blurStore.intensity}px)`;
      el.style.webkitBackdropFilter = `blur(${blurStore.intensity}px)`;
    });
    
    console.log(`[微博高斯模糊] 已更新模糊强度: ${blurStore.intensity}px`);
  } catch (error) {
    console.error('[微博高斯模糊] 更新模糊强度失败:', error);
  }
  
  // 是否需要完全重新应用样式
  const needsFullReapply = intensity >= 10 || intensity <= 2; // 极端值时完全重新应用
  
  // 极端值时重新应用样式（如果已启用）
  if (blurStore.enabled && needsFullReapply) {
    console.log('[微博高斯模糊] 检测到极端值，完全重新应用样式');
    applyGaussianBlurStyles();
  }
  
  return blurStore.intensity;
}
