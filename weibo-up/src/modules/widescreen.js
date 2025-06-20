// 宽屏功能模块
import { widescreenStore } from '../utils/storage';
import { weiboWidescreenCSS, weiboWidescreenLooseCSS } from '../styles/widescreen';

// 应用宽屏样式
export function applyWidescreenStyles() {
  if (!widescreenStore.enabled) return;

  // 检测微博版本并应用相应的样式
  if (isNewWeiboVersion()) {
    setupNewWeiboStyles(getVueApp());
  } else {
    setupLegacyWeiboStyles();
  }

  // 向iframe注入宽屏样式
  injectIframeStyles();

  console.log('[微博宽屏] 宽屏功能已启用');
}

// 检测是否是新版微博
function isNewWeiboVersion() {
  return document.querySelector('.woo-box-flex') !== null || 
         document.querySelector('[class*="Frame_wrap"]') !== null ||
         document.querySelector('[class*="Home_wrap"]') !== null;
}

// 获取Vue应用实例
function getVueApp() {
  // 等待Vue应用加载完成
  const waitForVue = (callback) => {
    const checkVue = () => {
      let vueApp = null;
      
      // 检查文档中的所有元素，查找Vue实例
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        if (el.__vue__ && el.__vue__.$router) {
          vueApp = el.__vue__;
          break;
        }
      }
      
      if (vueApp) {
        callback(vueApp);
      } else {
        setTimeout(checkVue, 100);
      }
    };
    
    checkVue();
  };
  
  let vueAppInstance = null;
  waitForVue((app) => {
    vueAppInstance = app;
  });
  
  return vueAppInstance;
}

// 设置旧版微博样式
function setupLegacyWeiboStyles() {
  console.log('[微博宽屏] 检测到旧版微博，正在配置宽屏样式');
  
  // 如果已有样式，先移除
  let existingStyle = document.getElementById('widescreen-style');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // 创建样式元素
  const style = document.createElement('style');
  style.id = 'widescreen-style';
  style.textContent = weiboWidescreenCSS;
  document.head.appendChild(style);
  
  // 如果启用了更宽模式，添加额外样式
  if (widescreenStore.loose) {
    let looseStyle = document.getElementById('widescreen-loose-style');
    if (!looseStyle) {
      looseStyle = document.createElement('style');
      looseStyle.id = 'widescreen-loose-style';
      document.head.appendChild(looseStyle);
    }
    looseStyle.textContent = weiboWidescreenLooseCSS;
  } else {
    // 如果不需要更宽模式，移除相关样式
    const looseStyle = document.getElementById('widescreen-loose-style');
    if (looseStyle) {
      looseStyle.remove();
    }
  }
  
  // 根据页面类型应用不同的宽屏样式
  handleLegacyWeiboConfig();
}

// 处理旧版微博配置
function handleLegacyWeiboConfig() {
  const url = window.location.href;
  const classname = 'wb-wide-screen';
  
  document.documentElement.classList.add(classname);
  
  // 动态添加页面特定样式
  let pageStyle = document.getElementById('widescreen-page-style');
  if (!pageStyle) {
    pageStyle = document.createElement('style');
    pageStyle.id = 'widescreen-page-style';
    document.head.appendChild(pageStyle);
  }
  
  // 不同页面应用不同的样式
  if (url.includes('/u/') || url.includes('/p/')) {
    pageStyle.textContent = getLegacyProfilePageStyles(classname);
  } else if (url.includes('/detail/') || url.includes('/status/')) {
    pageStyle.textContent = getLegacySingleWeiboStyles(classname);
  } else {
    pageStyle.textContent = getLegacyMainPageStyles(classname);
  }
}

// 获取旧版微博主页样式
function getLegacyMainPageStyles(classname) {
  return `
    .${classname} .WB_frame {
      width: var(--inject-page-width-legacy) !important;
    }
    .${classname} .WB_main_c,
    .${classname} .WB_frame_c {
      width: calc(var(--inject-page-width-legacy) - 230px) !important;
    }
    .${classname} .WB_main_r {
      margin-left: 20px;
    }
  `;
}

// 获取旧版微博个人页面样式
function getLegacyProfilePageStyles(classname) {
  return `
    .${classname} .WB_frame {
        width: var(--inject-page-width-legacy) !important;
    }
    .${classname} .WB_frame_a, 
    .${classname} .WB_frame_a_fix {
        width: 100%;
    }
    .${classname} #plc_main {
        width: 100% !important;
        display: flex;
    }
    .${classname} #plc_main > div:last-child {
        margin-right: 0;
    }
    .${classname} .WB_frame_c .input_simple_wrap .inputfunc_simple_wrap {
        width: calc(100% - 80px);
    }
    .${classname} .WB_frame_c {
        flex: 1;
    }
    .${classname} .WB_timeline {
        left: calc(50% + (var(--inject-page-width-legacy) / 2) + 10px);
        margin-left: 0;
    }
    .${classname} .W_gotop {
        left: calc(50% + (var(--inject-page-width-legacy) / 2));
        margin-left: 0 !important;
    }
  `;
}

// 获取旧版微博详情页样式
function getLegacySingleWeiboStyles(classname) {
  return `
    .${classname} .WB_frame {
        width: var(--inject-page-width-legacy) !important;
    }
    .${classname} #plc_main {
        display: flex !important;
        width: auto !important;
    }
    .${classname} #plc_main .WB_frame_c {
        flex: 1;
    }
    .${classname} .W_gotop {
        left: calc(50% + (var(--inject-page-width-legacy) / 2) - 19px);
        margin-left: 0 !important;
    }
  `;
}

// 设置新版微博样式
function setupNewWeiboStyles(vueApp) {
  console.log('[微博宽屏] 检测到新版微博，正在配置宽屏样式');
  
  // 如果已有样式，先移除
  let existingStyle = document.getElementById('widescreen-style');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // 创建样式元素
  const style = document.createElement('style');
  style.id = 'widescreen-style';
  style.textContent = weiboWidescreenCSS;
  document.head.appendChild(style);
  
  // 如果启用了更宽模式，添加额外样式
  if (widescreenStore.loose) {
    let looseStyle = document.getElementById('widescreen-loose-style');
    if (!looseStyle) {
      looseStyle = document.createElement('style');
      looseStyle.id = 'widescreen-loose-style';
      document.head.appendChild(looseStyle);
    }
    looseStyle.textContent = weiboWidescreenLooseCSS;
  } else {
    // 如果不需要更宽模式，移除相关样式
    const looseStyle = document.getElementById('widescreen-loose-style');
    if (looseStyle) {
      looseStyle.remove();
    }
  }
  
  // 支持的页面类型映射
  const pageStyleMap = new Map([
    [['home', 'mygroups', 'profile', 'nameProfile', 'customProfile', 'bidDetail', 
      'atWeibo', 'cmtInbox', 'likeInbox', 'follow', 'myFollowTab', 'fav', 'like', 
      'weibo', 'list', 'topic', 'search', 'searchResult'], 'home'],
    [['Playdetail'], 'video']
  ]);
  
  let currentStyleSheet = null;
  
  // 应用对应页面样式的函数
  const applyPageStyles = (pageType) => {
    // 移除旧的特定页面样式
    if (currentStyleSheet && currentStyleSheet.parentNode) {
      currentStyleSheet.parentNode.removeChild(currentStyleSheet);
    }
    
    // 遍历页面类型映射，查找匹配的样式
    for (const [types, styleType] of pageStyleMap.entries()) {
      if (types.includes(pageType)) {
        const pageStyle = document.createElement('style');
        pageStyle.id = 'widescreen-page-style';
        
        // 根据页面类型应用不同的样式
        if (styleType === 'video') {
          pageStyle.textContent = `
            /* 视频页面宽屏适配样式 */
            .woo-panel-main {
              width: 100% !important;
              max-width: none !important;
            }
            .woo-box-flex {
              max-width: var(--inject-page-width) !important;
              margin: 0 auto !important;
            }
          `;
        } else {
          pageStyle.textContent = `
            /* 标准页面宽屏适配样式 */
            .Frame_content_3XrxZ,
            .Frame_side_3QqER {
              width: auto !important;
            }
            .Home_main_2xZVV,
            .Frame_content_3XrxZ > div:first-child {
              flex: 1 !important;
              width: auto !important;
              max-width: none !important;
            }
          `;
        }
        
        document.head.appendChild(pageStyle);
        currentStyleSheet = pageStyle;
        break;
      }
    }
  };
  
  // 如果有vue实例且有路由，监听路由变化
  if (vueApp && vueApp.$route && vueApp.$router) {
    // 初始应用当前页面样式
    applyPageStyles(vueApp.$route.name);
    
    // 监听路由变化
    vueApp.$router.afterEach((to) => {
      applyPageStyles(to.name);
    });
  }
}

// 向iframe注入宽屏样式
function injectIframeStyles() {
  // 监听iframe加载
  document.addEventListener('load', function(e) {
    if (e.target.tagName === 'IFRAME') {
      try {
        const iframe = e.target;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        // 检查iframe是否已有宽屏样式
        if (iframeDoc && !iframeDoc.getElementById('widescreen-style') && widescreenStore.enabled) {
          const style = iframeDoc.createElement('style');
          style.id = 'widescreen-style';
          style.textContent = weiboWidescreenCSS;
          iframeDoc.head.appendChild(style);
          
          // 如果启用了更宽模式，也应用到iframe
          if (widescreenStore.loose) {
            const looseStyle = iframeDoc.createElement('style');
            looseStyle.id = 'widescreen-loose-style';
            looseStyle.textContent = weiboWidescreenLooseCSS;
            iframeDoc.head.appendChild(looseStyle);
          }
        }
      } catch (error) {
        // 可能是跨域iframe，忽略错误
      }
    }
  }, true);
  
  // 定期检查并更新已存在的iframe
  setInterval(() => {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc && !iframeDoc.getElementById('widescreen-style') && widescreenStore.enabled) {
          const style = iframeDoc.createElement('style');
          style.id = 'widescreen-style';
          style.textContent = weiboWidescreenCSS;
          iframeDoc.head.appendChild(style);
          
          if (widescreenStore.loose) {
            const looseStyle = iframeDoc.createElement('style');
            looseStyle.id = 'widescreen-loose-style';
            looseStyle.textContent = weiboWidescreenLooseCSS;
            iframeDoc.head.appendChild(looseStyle);
          }
        }
      } catch (error) {
        // 可能是跨域iframe，忽略错误
      }
    });
  }, 2000);
}
