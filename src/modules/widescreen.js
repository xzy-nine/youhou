// 宽屏功能模块
// widescreenStore 从chrome-storage.js全局获取
// weiboWidescreenCSS, weiboWidescreenLooseCSS 从styles/widescreen.js全局获取
// simpleNotify 从notification.js全局获取

// 应用宽屏样式
function applyWidescreenStyles() {
  // 首先应用基本样式
  applyBaseWidescreenStyles();
  
  // 监听宽屏模式开关，当切换时重新应用
  document.addEventListener('widescreenChange', (event) => {
    if (event.detail) {
      console.log('[微博宽屏] 宽屏模式变化:', event.detail);
      applyBaseWidescreenStyles(true);
    }
  });

  // 添加MutationObserver监听DOM变化，在可能的样式丢失情况下重新应用样式
  const observer = new MutationObserver((mutations) => {
    // 检查是否需要重新应用样式
    if (!widescreenStore.enabled) return;
    
    // 检查是否有重要的DOM结构变化
    const needsReapply = mutations.some(mutation => {
      // 如果有添加/删除节点，或者是类名变化
      return mutation.type === 'childList' || 
             (mutation.type === 'attributes' && 
              mutation.attributeName === 'class' && 
              mutation.target.classList.contains('inject-widescreen-loose-js') !== widescreenStore.loose);
    });
    
    if (needsReapply) {
      // 使用节流函数限制重新应用的频率
      if (!observer.reapplyDebounceTimer) {
        observer.reapplyDebounceTimer = setTimeout(() => {
          checkAndReapplyStyles();
          observer.reapplyDebounceTimer = null;
        }, 1000);
      }
    }
  });
  
  // 开始监听文档变化
  observer.observe(document.documentElement, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
  
  // 设置定期检查，确保宽屏样式长期存在
  setInterval(checkAndReapplyStyles, 30000);
  
  console.log('[微博宽屏] 宽屏功能初始化完成');
}

// 检查并重新应用样式（确保宽屏样式被正确应用）
function checkAndReapplyStyles() {
  if (!widescreenStore.enabled) return;
  
  // 检查样式元素是否存在
  const styleEl = document.getElementById('weibo-widescreen-style');
  if (!styleEl || !styleEl.textContent.includes('--inject-page-width')) {
    console.log('[微博宽屏] 检测到样式缺失，重新应用样式');
    applyBaseWidescreenStyles(true);
    return;
  }
  
  // 检查CSS类是否正确应用
  const hasLooseClass = document.documentElement.classList.contains('inject-widescreen-loose-js');
  if (widescreenStore.loose && !hasLooseClass) {
    console.log('[微博宽屏] 检测到宽松模式类缺失，重新应用样式');
    document.documentElement.classList.add('inject-widescreen-loose-js');
    document.body.classList.add('inject-widescreen-loose-js');
  } else if (!widescreenStore.loose && hasLooseClass) {
    console.log('[微博宽屏] 检测到不需要宽松模式类，移除');
    document.documentElement.classList.remove('inject-widescreen-loose-js');
    document.body.classList.remove('inject-widescreen-loose-js');
  }
}

// 应用基本宽屏样式（不依赖Vue应用）
function applyBaseWidescreenStyles(isUpdate = false) {
  if (!widescreenStore.enabled) {
    console.log('[微博宽屏] 宽屏功能未启用');
    return;
  }
  
  // 添加宽屏CSS
  const styleId = 'weibo-widescreen-style';
  let styleElement = document.getElementById(styleId);
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  
  // 更新样式内容
  styleElement.textContent = weiboWidescreenCSS;
  
  // 处理宽松模式(更宽模式)
  if (widescreenStore.loose) {
    // 添加CSS类 (对文档和body都添加)
    document.documentElement.classList.add('inject-widescreen-loose-js');
    document.body.classList.add('inject-widescreen-loose-js');
    
    // 单独应用宽松模式CSS
    const looseStyleId = 'weibo-widescreen-loose-style';
    let looseStyleElement = document.getElementById(looseStyleId);
    
    if (!looseStyleElement) {
      looseStyleElement = document.createElement('style');
      looseStyleElement.id = looseStyleId;
      document.head.appendChild(looseStyleElement);
    }
    
    looseStyleElement.textContent = weiboWidescreenLooseCSS;
  } else {
    // 移除更宽模式
    document.documentElement.classList.remove('inject-widescreen-loose-js');
    document.body.classList.remove('inject-widescreen-loose-js');
    
    const looseStyleElement = document.getElementById('weibo-widescreen-loose-style');
    if (looseStyleElement) {
      looseStyleElement.remove();
    }
  }
  
  // 检测微博版本并应用相应的样式
  if (isNewWeiboVersion()) {
    // 当可以检测到新版微博时，应用新版样式
    const vueApp = getVueApp();
    if (vueApp) {
      setupNewWeiboStyles(vueApp);
    } else {
      // 尝试延迟获取Vue实例
      setTimeout(() => {
        const delayedVueApp = getVueApp();
        if (delayedVueApp) {
          setupNewWeiboStyles(delayedVueApp);
        }
      }, 1000);
    }
  } else {
    // 否则应用旧版样式
    setupLegacyWeiboStyles();
  }

  // 再次确保宽屏类被应用（防止其他脚本移除）
  if (widescreenStore.loose) {
    document.documentElement.classList.add('inject-widescreen-loose-js');
    document.body.classList.add('inject-widescreen-loose-js');
  }

  // 向iframe注入宽屏样式
  injectIframeStyles();

  console.log('[微博宽屏] 宽屏样式已' + (isUpdate ? '更新' : '应用'));
  
  // 运行一段时间后，再次检查宽屏样式是否被正确应用
  setTimeout(checkAndReapplyStyles, 2000);
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
  if (!widescreenStore.enabled) return;
  
  console.log('[微博宽屏] 检测到旧版微博，正在配置宽屏样式');
  
  let proxyConfig = null;
  let currentStyleSheet = null;
  const classnamePrefix = 'inject-ws-';
  
  const getClassname = (classname) => `${classnamePrefix}${classname}`;
  
  const applyLegacyStyles = () => {
    const { $CONFIG } = window;
    if (!$CONFIG || !$CONFIG.location) return;
      
    // 移除旧样式和类名
    if (currentStyleSheet) {
      currentStyleSheet.remove();
      currentStyleSheet = null;
    }
      
    // 清理旧的类名
    [...document.body.classList.values()].forEach(item => {
      if (item.startsWith(classnamePrefix)) {
        document.body.classList.remove(item);
      }
    });
      
    // 根据页面类型应用相应样式
    const pages = {
      // 首页(含特别关注)、我的收藏、我的赞、好友圈
      mainpage: {
        test: /^v6.*_content_home$/.test($CONFIG.location) || /v6_(fav|likes_outbox|content_friends)/.test($CONFIG.location),
        styles: getLegacyMainPageStyles
      },
      // 用户资料页、相册、管理中心、粉丝、服务、财经专家、热门话题
      profilepage: {
        test: /^page_.*_(home|photos|manage|myfollow|service|expert|topic)$/.test($CONFIG.location),
        styles: getLegacyProfilePageStyles
      },
      // 微博详情
      singleweibo: {
        test: /^page_.*_single_weibo$/.test($CONFIG.location),
        styles: getLegacySingleWeiboStyles
      }
    };
      
    const matchedPage = Object.entries(pages).find(([, { test }]) => test);
    if (matchedPage) {
      const [pageType, { styles }] = matchedPage;
      const className = getClassname(pageType);
      document.body.classList.add(className);
      currentStyleSheet = document.createElement('style');
      currentStyleSheet.textContent = styles(className);
      document.head.appendChild(currentStyleSheet);
      console.log(`[微博宽屏] 应用旧版微博${pageType}页面宽屏样式`);
    }
  };
    
  // 创建$CONFIG代理以监听位置变化
  if (window.$CONFIG && !proxyConfig) {
    proxyConfig = new Proxy(window.$CONFIG, {
      set(target, property, value, receiver) {
        const oldVal = target[property];
        const succeeded = Reflect.set(target, property, value, receiver);
          
        if (property === 'location' && value !== oldVal) {
          console.log('[微博宽屏] 页面位置变化，重新应用样式');
          setTimeout(applyLegacyStyles, 100);
        }
          
        return succeeded;
      }
    });
    window.$CONFIG = proxyConfig;
  }
    
  // 立即应用样式
  applyLegacyStyles();
    
  // 监听文档状态变化
  document.addEventListener('readystatechange', () => {
    // 检查是否存在$CONFIG对象（旧版微博标志）
    if (window.$CONFIG) {
      applyLegacyStyles();
    }
  });
    
  // 如果已经加载完成，立即检查
  if (document.readyState !== 'loading' && window.$CONFIG) {
    applyLegacyStyles();
  }
}

// 获取旧版微博主页样式
function getLegacyMainPageStyles(classname) {
  return `
    .${classname} .WB_frame {
      display: flex;
      width: var(--inject-page-width-legacy) !important;
    }
    .${classname} #plc_main {
      display: flex !important;
      flex: 1;
      width: auto !important;
    }
    .${classname} .WB_main_c {
      flex: 1;
    }
    .${classname} .tab_box {
      display: flex;
    }
    .${classname} .tab_box::after {
      content: none;
    }
    .${classname} .tab_box .fr_box {
      flex: 1;
    }
    .${classname} .W_gotop {
      left: calc(50% + (var(--inject-page-width-legacy) / 2));
      margin-left: 0 !important;
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
    }    .${classname} .W_gotop {
      left: calc(50% + (var(--inject-page-width-legacy) / 2) - 19px);
      margin-left: 0 !important;
    }
  `;
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

// 获取旧版微博主页替代样式（未使用）
function getLegacyMainPageAlternativeStyles(classname) {
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

// 设置新版微博样式
function setupNewWeiboStyles(vueApp) {
  console.log('[微博宽屏] 设置新版微博宽屏样式');

  if (!widescreenStore.enabled || !vueApp) return;

  // 支持的页面类型映射
  const pageStyleMap = new Map([
    [['home', 'mygroups', 'profile', 'nameProfile', 'customProfile', 'bidDetail', 
      'atWeibo', 'cmtInbox', 'likeInbox', 'follow', 'myFollowTab', 'fav', 'like', 
      'weibo', 'list', 'topic', 'search', 'searchResult'], 'home'],
    [['Playdetail'], 'video']
  ]);

  // 应用对应页面样式的函数
  const applyPageStyles = (pageType) => {
    if (!widescreenStore.enabled) return;

    // 确保宽屏样式被应用
    const styleElement = document.getElementById('weibo-widescreen-style');
    if (!styleElement || !styleElement.textContent) {
      const newStyle = document.createElement('style');
      newStyle.id = 'weibo-widescreen-style';
      newStyle.textContent = weiboWidescreenCSS;
      document.head.appendChild(newStyle);
    }

    // 确保CSS类被正确应用
    if (widescreenStore.loose) {
      document.documentElement.classList.add('inject-widescreen-loose-js');
      document.body.classList.add('inject-widescreen-loose-js');
      
      // 确保宽松模式CSS被应用
      let looseStyle = document.getElementById('weibo-widescreen-loose-style');
      if (!looseStyle) {
        looseStyle = document.createElement('style');
        looseStyle.id = 'weibo-widescreen-loose-style';
        looseStyle.textContent = weiboWidescreenLooseCSS;
        document.head.appendChild(looseStyle);
      }    }

    console.log(`[微博宽屏] 应用新版微博${pageType}页面宽屏样式`);
    
    // 通知用户样式已应用
    if (widescreenStore.notify_enabled) {
      simpleNotify('微博宽屏模式已启用');
    }
    
    // 发布宽屏变化事件
    document.dispatchEvent(new CustomEvent('widescreenStyleApplied', {
      detail: { pageType, isLoose: widescreenStore.loose }
    }));
  };

  // 尝试监听路由变化
  if (vueApp.$router) {
    vueApp.$router.afterEach((to) => {
      console.log('[微博宽屏] 路由变化:', to.name);
      
      for (const [routeNames, pageType] of pageStyleMap.entries()) {
        if (routeNames.includes(to.name)) {
          applyPageStyles(pageType);
          break;
        }
      }
    });
    
    // 应用当前页面样式
    const currentRoute = vueApp.$route;
    if (currentRoute) {
      for (const [routeNames, pageType] of pageStyleMap.entries()) {
        if (routeNames.includes(currentRoute.name)) {
          applyPageStyles(pageType);
          break;
        }
      }
    } else {
      // 如果无法确定当前路由，尝试应用默认样式
      applyPageStyles('home');
    }
  } else {
    // 如果无法获取路由，尝试应用默认样式
    applyPageStyles('home');
  }
}

// 向iframe注入宽屏样式
function injectIframeStyles() {
  // 监听iframe加载
  document.addEventListener('load', function(e) {
    if (e.target.tagName === 'IFRAME') {
      try {
        const iframeDoc = e.target.contentDocument || e.target.contentWindow.document;
        if (iframeDoc && iframeDoc.head) {
          // 注入基本样式
          const style = iframeDoc.createElement('style');
          style.id = 'widescreen-style';
          style.textContent = weiboWidescreenCSS;
          iframeDoc.head.appendChild(style);
          
          // 如果启用了宽松模式，也注入宽松模式CSS
          if (widescreenStore.loose) {
            const looseStyle = iframeDoc.createElement('style');
            looseStyle.id = 'weibo-widescreen-loose-style';
            looseStyle.textContent = weiboWidescreenLooseCSS;
            iframeDoc.head.appendChild(looseStyle);
            
            // 同步宽屏状态到iframe
            iframeDoc.documentElement.classList.add('inject-widescreen-loose-js');
            if (iframeDoc.body) {
              iframeDoc.body.classList.add('inject-widescreen-loose-js');
            }
          }
        }
      } catch (error) {
        // 跨域iframe无法访问，忽略错误
        console.log('无法访问iframe内容（可能是跨域）');
      }
    }
  }, true);
  
  // 定期检查并更新已存在的iframe
  setInterval(() => {
    document.querySelectorAll('iframe').forEach(iframe => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc && iframeDoc.head) {
          // 检查是否已经注入样式
          if (!iframeDoc.querySelector('#widescreen-style')) {
            const style = iframeDoc.createElement('style');
            style.id = 'widescreen-style';
            style.textContent = weiboWidescreenCSS;
            iframeDoc.head.appendChild(style);
          }
          
          // 检查宽松模式
          const hasLooseStyle = !!iframeDoc.querySelector('#weibo-widescreen-loose-style');
          const hasLooseClass = iframeDoc.documentElement.classList.contains('inject-widescreen-loose-js');
          
          if (widescreenStore.loose && !hasLooseStyle) {
            const looseStyle = iframeDoc.createElement('style');
            looseStyle.id = 'weibo-widescreen-loose-style';
            looseStyle.textContent = weiboWidescreenLooseCSS;
            iframeDoc.head.appendChild(looseStyle);
          } else if (!widescreenStore.loose && hasLooseStyle) {
            const looseStyle = iframeDoc.querySelector('#weibo-widescreen-loose-style');
            if (looseStyle) looseStyle.remove();
          }
          
          // 同步宽松模式类
          if (widescreenStore.loose && !hasLooseClass) {
            iframeDoc.documentElement.classList.add('inject-widescreen-loose-js');
            if (iframeDoc.body) {
              iframeDoc.body.classList.add('inject-widescreen-loose-js');
            }
          } else if (!widescreenStore.loose && hasLooseClass) {
            iframeDoc.documentElement.classList.remove('inject-widescreen-loose-js');
            if (iframeDoc.body) {
              iframeDoc.body.classList.remove('inject-widescreen-loose-js');
            }
          }
        }
      } catch (error) {
        // 忽略跨域错误
      }
    });
  }, 2000);
}
