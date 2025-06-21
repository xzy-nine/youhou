// 宽屏样式
const weiboWidescreenCSS = `
/* 新版微博宽屏样式 */
@media screen and (min-width: 1340px) {
    :root {
        --inject-page-width: min(90vw, 1380px);
    }
    
    .inject-widescreen-loose-js {
        --inject-page-width: 90vw;
    }
    
    /* 新版微博主要布局 */
    [class*=Frame_content] {
        --main-width: var(--inject-page-width);
        width: var(--inject-page-width);
    }
    
    [class*=Frame_content] > div:nth-of-type(2) {
        flex: 1;
    }
    
    [class*=Frame_main],
    [class*=Main_full] {
        flex-grow: 1;
    }
    
    /* 微博内容区域优化 */
    .woo-box-wrap[class*=picture_inlineNum3] {
        max-width: 409px;
    }
    
    .u-col-4.woo-box-wrap {
        max-width: 546px;
    }
    
    [class*=content_row] [class*=card-video_videoBox] {
        max-width: 540px;
    }
    
    [class*=content_row] [class*=card-article_pic] {
        max-width: 540px;
    }
    
    [class*=ProfileHeader_pic] {
        overflow: hidden;
    }
    
    /* 返回顶部按钮 */
    [class*=Index_backTop] {
        left: calc(50% + var(--inject-page-width)/2 + var(--frame-mod-gap-space));
        margin-left: 0;
        transform: translateX(0);
    }
}

/* 视频详情页宽屏样式 */
@media screen and (min-width: 1450px) {
    [class*=Frame_content2] {
        max-width: none;
        width: var(--inject-page-width);
    }
    
    [class*=Frame_main2] {
        flex-grow: 1;
        padding-right: 20px;
    }
}

/* 旧版微博宽屏样式 - 兼容支持 */
@media screen and (min-width: 1300px) {
    :root {
        --inject-page-width-legacy: min(75vw, 1330px);
    }
    
    /* 旧版微博主页 */
    .WB_frame {
        display: flex;
        width: var(--inject-page-width-legacy) !important;
    }
    
    .WB_frame #plc_main {
        display: flex !important;
        flex: 1;
        width: auto !important;
    }
    
    .WB_main_c {
        flex: 1;
    }
    
    .WB_frame_c {
        flex: 1;
    }
    
    /* 微博类型标签 */
    .tab_box {
        display: flex;
    }
    
    .tab_box::after {
        content: none;
    }
    
    .tab_box .fr_box {
        flex: 1;
    }
    
    /* 返回顶部按钮 */
    .W_gotop {
        left: calc(50% + (var(--inject-page-width-legacy) / 2));
        margin-left: 0 !important;
    }
    
    /* 微博时间线 */
    .WB_timeline {
        left: calc(50% + (var(--inject-page-width-legacy) / 2) + 10px);
        margin-left: 0;
    }
}

/* 微博文章页宽屏样式 */
@media screen and (min-width: 1150px) {
    #articleRoot .WB_frame {
        width: var(--inject-page-width-legacy);
    }
    
    #articleRoot #plc_main {
        max-width: 100%;
        width: auto;
    }
    
    #articleRoot .WB_frame_a,
    #articleRoot .WB_artical {
        max-width: 100%;
        width: auto;
    }
    
    #articleRoot .main_toppic {
        margin-left: auto;
        margin-right: auto;
    }
    
    #articleRoot .WB_editor_iframe_new {
        width: auto;
    }
    
    .B_artical [node-type=sidebar]>.W_gotop {
        left: calc(50% + var(--inject-page-width-legacy)/2);
        margin-left: 0;
    }
}`;

// 自定义额外的宽屏样式定义
const weiboWidescreenLooseCSS = `
/* 用户自定义宽度设置 - 更宽模式 */
@media screen and (min-width: 1340px) {
  :root.inject-widescreen-loose-js {
    --inject-page-width: 95vw !important;
  }
  
  body.inject-widescreen-loose-js {
    --inject-page-width: 95vw !important;
  }
  
  /* 更宽模式下的特殊调整 */
  .inject-widescreen-loose-js [class*=Frame_content],
  .inject-widescreen-loose-js [class*=Frame_content2] {
    width: var(--inject-page-width) !important;
    max-width: var(--inject-page-width) !important;
  }
  
  /* 确保返回顶部按钮位置正确 */
  .inject-widescreen-loose-js [class*=Index_backTop] {
    left: calc(50% + var(--inject-page-width)/2 + 10px);
  }
}

/* 旧版微博更宽模式 */
@media screen and (min-width: 1300px) {
  :root.inject-widescreen-loose-js {
    --inject-page-width-legacy: 95vw !important;
  }
  
  body.inject-widescreen-loose-js {
    --inject-page-width-legacy: 95vw !important;
  }
  
  .inject-widescreen-loose-js .WB_frame {
    width: var(--inject-page-width-legacy) !important;
  }
  
  .inject-widescreen-loose-js .W_gotop {
    left: calc(50% + var(--inject-page-width-legacy)/2 + 10px);
  }
  
  .inject-widescreen-loose-js .WB_timeline {
    left: calc(50% + var(--inject-page-width-legacy)/2 + 20px);
  }
}
`;
