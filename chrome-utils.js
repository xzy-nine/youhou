// Chrome扩展通用工具函数

// 添加样式函数
function addCustomStyle(css) {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
  return style;
}

// 将函数暴露到全局作用域
window.addCustomStyle = addCustomStyle;
