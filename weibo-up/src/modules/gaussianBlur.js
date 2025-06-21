// 高斯模糊功能模块
import { blurStore, saveBlurConfig } from '../utils/storage';
import { gaussianBlurCSS } from '../styles/gaussianBlur';
import { simpleNotify } from '../utils/notification';

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
  
  // 更新CSS变量
  document.documentElement.style.setProperty('--wb-blur-intensity', `${blurStore.intensity}px`);
  
  // 重新应用样式（如果已启用）
  if (blurStore.enabled) {
    applyGaussianBlurStyles();
  }
  
  return blurStore.intensity;
}
