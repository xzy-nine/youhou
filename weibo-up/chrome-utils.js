// Chrome扩展通知和工具函数，替代油猴的API

// 简单通知函数
export function simpleNotify(text, timeout = 3000) {
  // 创建通知元素
  const notifyElement = document.createElement('div');
  notifyElement.className = 'weibo-up-notification';
  notifyElement.textContent = text;
  
  // 添加样式
  notifyElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    min-width: 200px;
    max-width: 350px;
    padding: 10px 15px;
    background-color: #50a14f;
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  // 添加到DOM
  document.body.appendChild(notifyElement);
  
  // 显示通知
  setTimeout(() => {
    notifyElement.style.opacity = '1';
  }, 10);
  
  // 移除通知
  setTimeout(() => {
    notifyElement.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notifyElement);
    }, 300);
  }, timeout);
}

// 添加样式函数，替代GM_addStyle
export function addCustomStyle(css) {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
  return style;
}

// 模拟GM_xmlhttpRequest
export function xmlHttpRequest(options) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.onload = function() {
      const response = {
        responseText: xhr.responseText,
        responseXML: xhr.responseXML,
        readyState: xhr.readyState,
        responseHeaders: xhr.getAllResponseHeaders(),
        status: xhr.status,
        statusText: xhr.statusText
      };
      
      if (typeof options.onload === 'function') {
        options.onload(response);
      }
      resolve(response);
    };
    
    xhr.onerror = function(error) {
      if (typeof options.onerror === 'function') {
        options.onerror(error);
      }
      reject(error);
    };
    
    xhr.open(options.method || 'GET', options.url, true);
    
    if (options.headers) {
      for (const header in options.headers) {
        xhr.setRequestHeader(header, options.headers[header]);
      }
    }
    
    xhr.send(options.data);
  });
}

// 向全局添加GM兼容函数
window.GM_xmlhttpRequest = xmlHttpRequest;
window.GM_openInTab = (url) => {
  return window.open(url, '_blank');
};

// 注册菜单命令，替代GM_registerMenuCommand
export function registerMenuCommand(name, callback) {
  // 在Chrome扩展中，我们可以在popup.html中实现这些菜单
  // 这里我们只记录菜单命令，实际实现在popup.html中
  if (!window.chromeMenuCommands) {
    window.chromeMenuCommands = [];
  }
  window.chromeMenuCommands.push({ name, callback });
}
