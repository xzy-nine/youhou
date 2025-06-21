# 微博增强扩展

## 项目更新

本项目已将原先油猴脚本模式下的存储API进行了重构，直接使用Chrome扩展存储API，使代码更加紧密地结合到Chrome扩展本体上。

### 主要更改

1. 移除了对`GM_*`函数的模拟，直接使用Chrome的`chrome.storage.local` API
2. 创建了`src/utils/chrome-storage.js`统一管理存储功能
3. 更新了所有模块中的存储引用，从`storage.js`改为`chrome-storage.js`
4. 将异步操作加入到相关函数中

### 如何构建

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

构建完成后会在`dist`目录生成打包文件。

### 功能特性

- 自动适应深色/浅色模式
- 弹出页查看更多评论
- 页面宽屏显示
- 自定义背景图片

### 注意

原有的油猴功能已完全转移到Chrome扩展API上，不再需要使用`chrome-storage.js`中的模拟函数。
