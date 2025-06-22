// Chrome扩展替代版的storage.js，用于替换油猴特有的存储函数
// 此文件已合并到src/utils/chrome-storage.js，避免重复定义

// 注意：所有变量和函数已从src/utils/chrome-storage.js导入
// 此文件只作为兼容性存在，正在逐步弃用

// 检查是否已经有定义，避免重复声明
if (typeof chromeStorage === 'undefined') {
  console.warn('[微博增强] chrome-storage.js被重复加载，已跳过定义，请更新你的引用。');
}

// 注意：此文件中所有实现已移至src/utils/chrome-storage.js
// 这里仅保留导入防止错误
console.log('[微博增强] 已加载src/utils/chrome-storage.js，使用的是更新的代码版本');
