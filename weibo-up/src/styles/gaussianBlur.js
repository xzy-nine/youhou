// 高斯模糊样式 - 使用F12精确选择的元素
export const gaussianBlurCSS = `
/* 全局CSS变量 */
:root {
  --wb-blur-intensity: 5px;
}

/* 博文卡片模糊效果 - 主要元素 */
#scroller > div.vue-recycle-scroller__item-wrapper > div > div > article,
article.woo-panel-main,
.woo-box-wrap,
.Feed_wrap_K5pCu,
.Card_wrap_2ibWe,
.woo-panel-main,
.wbpro-feed-content,
.wbpro-feed-item,
.Main_full_2ntle article,
.wbpro-side-main-wrap,
.Main_side_oiMEU div,
.woo-panel-main article {
  background-color: rgba(255, 255, 255, 0.3) !important;  /* 更透明 */
  backdrop-filter: blur(var(--wb-blur-intensity)) !important;
  -webkit-backdrop-filter: blur(var(--wb-blur-intensity)) !important;
  border-radius: 8px;
  transition: backdrop-filter 0.3s ease, background-color 0.3s ease;
}

/* 深色模式下博文卡片模糊效果 */
.woo-theme-dark #scroller > div.vue-recycle-scroller__item-wrapper > div > div > article,
.woo-theme-dark article.woo-panel-main,
.woo-theme-dark .woo-box-wrap,
.woo-theme-dark .Feed_wrap_K5pCu,
.woo-theme-dark .Card_wrap_2ibWe,
.woo-theme-dark .woo-panel-main,
.woo-theme-dark .wbpro-feed-content,
.woo-theme-dark .wbpro-feed-item,
.woo-theme-dark .Main_full_2ntle article,
.woo-theme-dark .wbpro-side-main-wrap,
.woo-theme-dark .Main_side_oiMEU div,
.woo-theme-dark .woo-panel-main article {
  background-color: rgba(30, 30, 30, 0.3) !important;  /* 更透明 */
}

/* 
 * 高斯模糊应用模板
 * 请使用F12开发者工具选择需要应用模糊效果的元素，然后添加对应的选择器
 * 
 * 示例:
 * .your-element-class {
 *   background-color: rgba(255, 255, 255, 0.4) !important;
 *   backdrop-filter: blur(var(--wb-blur-intensity)) !important;
 *   -webkit-backdrop-filter: blur(var(--wb-blur-intensity)) !important;
 *   border-radius: 8px;
 *   transition: backdrop-filter 0.3s ease;
 * }
 * 
 * 深色模式示例:
 * .woo-theme-dark .your-element-class {
 *   background-color: rgba(30, 30, 30, 0.4) !important;
 * }
 */

/* 背景图片样式 */
html, body {
  position: relative;
  min-height: 100vh;
}

/* 为页面添加一个相对定位容器，确保内容正常显示 */
.woo-box-flex, #homeWrap, #app, #react-root,
html[data-react-helmet="true"] > body > div[id]:first-child {
  position: relative;
  z-index: 1;
}

/* 背景元素的基础样式 */
#weibo-blur-background {
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
  z-index: -9999;
  pointer-events: none;
  will-change: opacity;
  transition: opacity 0.5s ease, background-color 0.3s ease;
  background-color: rgba(173, 216, 230, 0.3); /* 淡蓝色调试背景，加载图片前可见 */
}

/* 确保模糊不影响交互元素 */
button, 
input, 
select, 
textarea,
a[href],
[role="button"],
[tabindex]:not([tabindex="-1"]) {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  z-index: auto;
}
`;
