# 微博增强 Chrome扩展

## 简介

这是从油猴脚本转换而来的微博增强Chrome扩展，完全复用了原有油猴脚本的模块化代码。该扩展提供以下功能：

- **自动适应深色/浅色模式**：跟随系统主题或手动设置
- **评论悬浮窗**：无需离开当前页面查看评论
- **页面宽屏显示**：更好地利用宽屏显示器
- **自定义背景图片**：支持必应每日图片或自定义图片背景
- **样式自定义**：内容透明度和模糊度可调整

## 安装方法

### 方式一：手动安装

1. 下载或克隆这个仓库
2. 打开Chrome浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择此目录（包含manifest.json的文件夹）

### 方式二：打包安装

1. 运行 `install_chrome_extension.bat` (Windows) 或 `install_chrome_extension.sh` (Mac/Linux)
2. 将生成的 `微博增强_Chrome扩展.zip` 文件拖入Chrome浏览器的扩展页面

## 使用方法

安装后，访问微博网站 (https://weibo.com/)，扩展会自动启用。

1. 点击浏览器工具栏上的扩展图标打开设置面板
2. 在设置面板中可以配置深色模式、宽屏显示和背景图片等选项

## 项目结构

本扩展完全复用了原油猴脚本的模块化代码结构：

```
manifest.json       - 扩展配置文件
background.js       - 后台脚本
content.js          - 内容脚本
popup.html          - 弹出设置界面
popup.js            - 弹出界面逻辑
chrome-storage.js   - 存储适配层
chrome-utils.js     - 工具函数适配层
icons/              - 图标文件夹
src/
  ├── index.js      - 原脚本入口文件(现已由content.js调用)
  ├── modules/      - 功能模块
  │   ├── comments.js     - 评论功能
  │   ├── theme.js        - 主题功能
  │   ├── ui.js           - 界面功能
  │   └── widescreen.js   - 宽屏功能
  ├── styles/       - 样式定义
  │   ├── comments.js     - 评论样式
  │   ├── controlPanel.js - 控制面板样式
  │   └── widescreen.js   - 宽屏样式
  └── utils/        - 工具函数
      ├── background.js   - 背景处理
      ├── notification.js - 通知功能
      └── storage.js      - 存储功能
```

## 技术说明

本扩展通过适配层将油猴脚本的GM_*函数转换为Chrome扩展API：

- `GM_setValue/GM_getValue` → `chrome.storage.local.set/get`
- `GM_addStyle` → 原生DOM API添加样式
- `GM_registerMenuCommand` → 弹出菜单实现
- `GM_xmlhttpRequest` → 封装XHR API

## 许可证

MIT

## 致谢

感谢原油猴脚本中的所有贡献者。
