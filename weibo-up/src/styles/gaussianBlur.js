// 高斯模糊样式
export const gaussianBlurCSS = `
/* 全局CSS变量 */
:root {
  --wb-blur-intensity: 5px;
}

/* 新版微博界面常见块元素模糊效果 */
.Frame_content_3Q0J-,
.Main_full_1dfQX,
.Frame_side_2DhSN,
.Card_wrap_2ibWe,
.woo-panel-main,
.woo-box-wrap,
.woo-box-flex,
.ProfileHeader_box_2t0AM,
.wbpro-feed-content,
.pic-beta-carousel,
.picture_11lhb,
.Article_articlePanel_30d3K,
.Nav_wrap_vuYwf,
.Search_searchItemsBox_13s0m,
.Search_hotItemContainer_2GwRK,
.LevelInfo_lev_3YJy5,
.UserStats_wrap_3itlm,
.UserAtt_wrap_GiJQu,
[class*=Card_wrap],
[class*=Feed_wrap],
[class*=woo-panel],
[class*=woo-modal-content],
[class*=Detail_wrap] {
  background-color: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(var(--wb-blur-intensity)) !important;
  -webkit-backdrop-filter: blur(var(--wb-blur-intensity)) !important;
  border-radius: 8px;
  transition: backdrop-filter 0.3s ease;
}

/* 深色模式下的调整 */
.woo-theme-dark .Frame_content_3Q0J-,
.woo-theme-dark .Main_full_1dfQX,
.woo-theme-dark .Frame_side_2DhSN,
.woo-theme-dark .Card_wrap_2ibWe,
.woo-theme-dark .woo-panel-main,
.woo-theme-dark .woo-box-wrap,
.woo-theme-dark .woo-box-flex,
.woo-theme-dark .ProfileHeader_box_2t0AM,
.woo-theme-dark .wbpro-feed-content,
.woo-theme-dark .pic-beta-carousel,
.woo-theme-dark .picture_11lhb,
.woo-theme-dark .Article_articlePanel_30d3K,
.woo-theme-dark .Nav_wrap_vuYwf,
.woo-theme-dark .Search_searchItemsBox_13s0m,
.woo-theme-dark .Search_hotItemContainer_2GwRK,
.woo-theme-dark .LevelInfo_lev_3YJy5,
.woo-theme-dark .UserStats_wrap_3itlm,
.woo-theme-dark .UserAtt_wrap_GiJQu,
.woo-theme-dark [class*=Card_wrap],
.woo-theme-dark [class*=Feed_wrap],
.woo-theme-dark [class*=woo-panel],
.woo-theme-dark [class*=woo-modal-content],
.woo-theme-dark [class*=Detail_wrap] {
  background-color: rgba(30, 30, 30, 0.7) !important;
}

/* 旧版微博元素兼容 */
.WB_frame,
.WB_global_nav,
.WB_main_c,
.WB_frame_c,
.WB_detail,
.WB_text,
.WB_feed_detail,
.WB_media_wrap,
.WB_feed_together,
.WB_feed_expand,
.WB_sonFeed {
  background-color: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(var(--wb-blur-intensity)) !important;
  -webkit-backdrop-filter: blur(var(--wb-blur-intensity)) !important;
  border-radius: 8px;
  transition: backdrop-filter 0.3s ease;
}

/* 针对滚动容器优化 */
.woo-panel-main:not(.woo-box-overlay),
.PicViewerDialog_picViewerContent_1e2Xs {
  overflow: overlay !important;
}

/* 图片查看器特殊处理 */
.woo-box-overlay-image {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* 保证内容可读性，文本区域不模糊 */
.wbpro-feed-content p,
.wbpro-feed-content a,
.wbpro-text,
.wbpro-text-content,
.func-info,
.woo-panel-main a,
.text,
.title,
.username,
.user-name,
.nav-name {
  text-shadow: 0 0 1px rgba(0, 0, 0, 0.1);
}

/* 确保模糊不影响交互元素 */
button, 
input, 
select, 
textarea {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
`;
