// 评论系统模块
// widescreenStore 从chrome-storage.js全局获取
// commentModalCSS 从styles/comments.js全局获取
// getCurrentWebsiteMode 从theme.js全局获取
// weiboWidescreenCSS 从styles/widescreen.js全局获取

// 设置评论系统
function setupCommentSystem() {
  // 添加评论悬浮窗样式
  addCommentModalStyles();
  
  // 启动评论链接拦截
  interceptCommentLinks();
  
  // 添加调试快捷键
  setupDebugShortcuts();
  
  // 设置主题变化监听
  setupCommentThemeListener();
}

// 添加评论悬浮窗样式
function addCommentModalStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = commentModalCSS;
  document.head.appendChild(styleElement);
}

// 创建评论悬浮窗
function createCommentModal() {
  const overlay = document.createElement('div');
  overlay.className = 'comment-modal-overlay';
  
  // 获取当前网站模式（深色/浅色）
  const isDarkMode = getCurrentWebsiteMode();
  const themeClass = isDarkMode ? 'dark-theme' : 'light-theme';
  
  overlay.innerHTML = `
      <div class="comment-modal" data-theme="${isDarkMode ? 'dark' : 'light'}">
          <div class="comment-modal-header">
              <div class="comment-modal-title">评论</div>
              <button class="comment-modal-close" aria-label="关闭"></button>
          </div>
          <div class="comment-modal-content">
              <div class="comment-modal-loading">加载中...</div>
          </div>
      </div>
  `;
  
  document.body.appendChild(overlay);
  
  // 关闭按钮事件
  const closeBtn = overlay.querySelector('.comment-modal-close');
  closeBtn.addEventListener('click', () => {
    closeCommentModal(overlay);
  });
  
  // 点击遮罩层关闭 - 优化右侧点击区域
  overlay.addEventListener('click', (e) => {
    const clickX = e.clientX;
    const windowWidth = window.innerWidth;
    
    // 右侧100px区域内任何点击都关闭
    if (clickX > windowWidth - 100) {
      closeCommentModal(overlay);
    } 
    // 或者点击的是遮罩层本身（不是modal内容）
    else if (e.target === overlay) {
      closeCommentModal(overlay);
    }
  });
  
  // ESC键关闭
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeCommentModal(overlay);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
  
  return overlay;
}

// 关闭评论悬浮窗
function closeCommentModal(overlay) {
  overlay.classList.remove('show');
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }, 300);
}

// 显示评论悬浮窗
function showCommentModal(commentUrl, commentCount) {
  const modal = createCommentModal();
  
  // 更新标题
  const title = modal.querySelector('.comment-modal-title');
  title.textContent = '详情';
  
  // 确保使用正确的主题模式
  const commentModalElement = modal.querySelector('.comment-modal');
  const isDarkMode = getCurrentWebsiteMode();
  if (commentModalElement) {
    commentModalElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }
  
  // 显示动画
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
  
  // 加载评论内容
  loadCommentContent(modal, commentUrl);
}

// 加载评论内容
function loadCommentContent(modal, commentUrl) {
  const contentDiv = modal.querySelector('.comment-modal-content');
  const loadingDiv = contentDiv.querySelector('.comment-modal-loading');
  
  try {
    // 创建iframe元素
    const iframe = document.createElement('iframe');
    iframe.className = 'comment-modal-iframe';
    iframe.src = commentUrl;
    
    iframe.onload = function() {
      // iframe加载完成后隐藏loading
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }
      
      // 向iframe注入宽屏样式
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc && iframeDoc.head && widescreenStore.enabled) {
          // 同步当前页面的主题模式到iframe
          const currentWebsiteMode = getCurrentWebsiteMode();
          if (currentWebsiteMode) {
            iframeDoc.body.classList.add('woo-theme-dark');
            iframeDoc.body.classList.remove('woo-theme-light');
          } else {
            iframeDoc.body.classList.add('woo-theme-light');
            iframeDoc.body.classList.remove('woo-theme-dark');
          }
          
          // 确保模态框也与当前主题匹配
          const modal = iframe.closest('.comment-modal');
          if (modal) {
            modal.setAttribute('data-theme', currentWebsiteMode ? 'dark' : 'light');
          }
          
          const style = iframeDoc.createElement('style');
          style.id = 'widescreen-style';
          style.textContent = weiboWidescreenCSS;
          iframeDoc.head.appendChild(style);
          
          console.log('已向评论iframe注入宽屏样式');
        }
      } catch (error) {
        console.log('无法向iframe注入样式（可能是跨域）:', error);
      }
    };
    
    iframe.onerror = function() {
      if (loadingDiv) {
        loadingDiv.textContent = '加载评论失败，请稍后重试';
      }
    };
    
    // 将iframe添加到内容区域
    contentDiv.appendChild(iframe);
    
  } catch (error) {
    console.error('创建iframe失败:', error);
    if (loadingDiv) {
      loadingDiv.textContent = '加载评论失败，请稍后重试';
    }
  }
}

// 拦截评论相关的点击事件
function interceptCommentLinks() {
  // 使用事件委托处理动态添加的链接和按钮
  document.addEventListener('click', function(e) {
    // 只监听链接元素，避免拦截普通的按钮和展开功能
    const target = e.target.closest('a[href]');
    if (!target) return;
    
    const linkText = target.textContent || target.innerText || '';
    let href = target.getAttribute('href');
    
    // 确保是有效的链接，排除JavaScript链接和锚点
    if (!href || href === '#' || href.startsWith('javascript:')) return;
    
    console.log('检测到链接点击:', {
      target: target,
      linkText: linkText.trim(),
      href: href,
      className: target.className
    });
    
    // 只拦截明确的"查看全部评论"链接
    const isViewAllCommentsLink = 
      // 包含"查看全部"和"评论"的链接
      (linkText.includes('查看全部') && linkText.includes('评论')) ||
      // 匹配"查看全部X条评论"的模式
      /查看全部\s*\d+\s*条?评论/.test(linkText) ||
      // 链接文本只是数字，但链接指向详情页（可能是简化的查看全部评论链接）
      (/^\s*\d+\s*条?评论?\s*$/.test(linkText) && (href.includes('/status/') || href.includes('/detail/')));
    
    if (isViewAllCommentsLink) {
      console.log('拦截查看全部评论链接:', linkText.trim());
      e.preventDefault();
      e.stopPropagation();
      
      // 如果没有直接的href，尝试从父级元素或相关元素获取
      if (!href) {
        const article = target.closest('article');
        if (article) {
          // 尝试从文章中找到链接
          const articleLink = article.querySelector('a[href*="/status/"], a[href*="/detail/"], a[href*="/u/"]');
          if (articleLink) {
            href = articleLink.getAttribute('href');
          }
          
          // 尝试从微博ID构建链接
          if (!href) {
            const midElement = article.querySelector('[data-mid], [mid]');
            if (midElement) {
              const mid = midElement.getAttribute('data-mid') || midElement.getAttribute('mid');
              if (mid) {
                href = `/detail/${mid}`;
              }
            }
          }
          
          // 尝试从data属性获取
          if (!href) {
            const dataElement = article.querySelector('[data-itemid], [data-id]');
            if (dataElement) {
              const itemId = dataElement.getAttribute('data-itemid') || dataElement.getAttribute('data-id');
              if (itemId) {
                href = `/detail/${itemId}`;
              }
            }
          }
        }
      }
      
      // 尝试从页面元素中提取微博ID
      if (!href) {
        // 查找页面中的微博链接模式
        const pageLinks = document.querySelectorAll('a[href*="/status/"], a[href*="/detail/"]');
        if (pageLinks.length > 0) {
          // 使用最近添加的微博链接
          const closestLink = Array.from(pageLinks).find(link => {
            const rect = link.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            return Math.abs(rect.top - targetRect.top) < 200; // 200px范围内
          });
          if (closestLink) {
            href = closestLink.getAttribute('href');
          }
        }
      }
      
      // 从当前页面URL构建
      if (!href) {
        const currentUrl = window.location.href;
        if (currentUrl.includes('/status/')) {
          href = currentUrl;
        } else if (currentUrl.includes('/detail/')) {
          href = currentUrl;
        } else if (currentUrl.includes('/u/')) {
          // 如果在用户页面，尝试获取最新的微博
          const firstWeiboLink = document.querySelector('a[href*="/status/"], a[href*="/detail/"]');
          if (firstWeiboLink) {
            href = firstWeiboLink.getAttribute('href');
          }
        }
      }
      
      // 最后的尝试：使用页面标题或其他元素推断
      if (!href) {
        // 尝试从页面的script标签中提取信息
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const content = script.textContent || script.innerText;
          const midMatch = content.match(/"mid":\s*"([^"]+)"/);
          if (midMatch && midMatch[1]) {
            href = `/detail/${midMatch[1]}`;
            break;
          }
          const statusMatch = content.match(/\/status\/(\w+)/);
          if (statusMatch && statusMatch[1]) {
            href = `/status/${statusMatch[1]}`;
            break;
          }
        }
      }
      
      if (!href) {
        console.log('无法确定评论页面URL，尝试的元素:', target);
        console.log('当前页面URL:', window.location.href);
        if (widescreenStore.notify_enabled && window.simpleNotify) {
          window.simpleNotify('未找到评论页面链接');
        }
        return;
      }
      
      // 提取评论数量
      const commentMatch = linkText.match(/(\d+)/);
      const commentCount = commentMatch ? commentMatch[1] : '全部';
      
      // 构建完整的URL
      const fullUrl = href.startsWith('http') ? href : 
                     href.startsWith('//') ? 'https:' + href :
                     href.startsWith('/') ? window.location.origin + href :
                     window.location.href.split('?')[0] + '/' + href;
      
      showCommentModal(fullUrl, commentCount);
      if (widescreenStore.notify_enabled && window.simpleNotify) {
        window.simpleNotify('正在加载评论内容...');
      }
    }
  }, true);
}

// 设置评论模块的主题监听
function setupCommentThemeListener() {
  // 监听全局主题变化事件
  window.addEventListener('weiboThemeChanged', (event) => {
    const isDark = event.detail.isDark;
    console.log(`[微博评论] 收到主题变化事件: ${isDark ? '深色' : '浅色'}`);
    
    // 更新所有已打开的评论模态框主题
    updateAllCommentModalsTheme(isDark);
  });
  
  console.log('[微博评论] 主题变化监听已设置');
}

// 更新所有评论模态框的主题
function updateAllCommentModalsTheme(isDark) {
  const commentModals = document.querySelectorAll('.comment-modal');
  commentModals.forEach(modal => {
    modal.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    console.log(`[微博评论] 更新评论模态框主题为: ${isDark ? '深色' : '浅色'}`);
    
    // 尝试更新iframe内容的主题
    const iframe = modal.querySelector('.comment-modal-iframe');
    if (iframe) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc && iframeDoc.body) {
          iframeDoc.body.classList.remove('woo-theme-dark', 'woo-theme-light');
          iframeDoc.body.classList.add(isDark ? 'woo-theme-dark' : 'woo-theme-light');
          console.log(`[微博评论] 已更新iframe主题`);
        }
      } catch (error) {
        console.log('[微博评论] 无法更新iframe主题（可能是跨域）:', error);
      }
    }
  });
}

// 调试函数：分析页面中的评论相关元素
function analyzeCommentElements() {
  console.log('=== 微博评论元素分析 ===');
  
  // 查找所有可能的评论相关元素
  const commentSelectors = [
    'a[href*="comment"]',
    'div[class*="comment"]',
    'span[class*="comment"]',
    'i[class*="comment"]',
    'div[class*="toolbar"]',
    'footer',
    '[class*="Feed_func"]',
    'a:contains("评论")',
    'div:contains("条评论")'
  ];
  
  commentSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`找到 ${elements.length} 个 "${selector}" 元素:`);
        elements.forEach((el, index) => {
          if (index < 5) { // 只显示前5个，避免日志过长
            console.log(`  ${index + 1}. 文本: "${el.textContent.trim()}", 类名: "${el.className}", 标签: ${el.tagName}`);
          }
        });
        if (elements.length > 5) {
          console.log(`  ... 还有 ${elements.length - 5} 个元素未显示`);
        }
      }
    } catch (e) {
      // 忽略querySelector错误
    }
  });
  
  // 查找页面中的微博ID
  const scripts = document.querySelectorAll('script');
  console.log('页面中的微博ID信息:');
  for (const script of scripts) {
    const content = script.textContent || script.innerText;
    if (content.includes('mid') || content.includes('status')) {
      const midMatches = content.match(/"mid":\s*"([^"]+)"/g);
      const statusMatches = content.match(/\/status\/(\w+)/g);
      if (midMatches) {
        console.log('  找到MID:', midMatches.slice(0, 3));
      }
      if (statusMatches) {
        console.log('  找到Status:', statusMatches.slice(0, 3));
      }
      break;
    }
  }
  
  console.log('当前页面URL:', window.location.href);
  console.log('=== 分析完成 ===');
}

// 添加调试快捷键
function setupDebugShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+D 分析评论元素
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      analyzeCommentElements();
    }
  });
}
