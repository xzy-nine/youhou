// 宽屏样式
export const weiboWidescreenCSS = `
:root {
  --inject-page-width: 90vw;
  --inject-page-width-legacy: 90vw;
}

/* 新版微博宽屏样式 */
.woo-box-flex {
  width: var(--inject-page-width) !important;
  max-width: var(--inject-page-width) !important;
}

.woo-panel-main, .woo-panel-main > div {
  width: 100% !important;
  max-width: none !important;
}

.woo-box-flex.woo-box-wrap > div {
  flex: 1;
}

/* 顶部导航条 */
header.woo-header, .woo-header > .woo-box-flex {
  width: 100% !important;
  max-width: none !important;
  padding-left: calc((100% - var(--inject-page-width)) / 2) !important;
  padding-right: calc((100% - var(--inject-page-width)) / 2) !important;
}

/* 用户页面个性化设置 */
.Frame_wrap_2nVTl {
  width: var(--inject-page-width) !important;
  max-width: var(--inject-page-width) !important;
}

/* 旧版微博宽屏基础样式 */
.W_main, .WB_global_nav {
  width: var(--inject-page-width-legacy) !important;
}
`;

// 更宽模式样式
export const weiboWidescreenLooseCSS = `
:root {
  --inject-page-width: 95vw;
  --inject-page-width-legacy: 95vw;
}
`;
