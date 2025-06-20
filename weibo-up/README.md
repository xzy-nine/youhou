# 微博增强脚本

这是一个用于增强微博网站体验的油猴脚本项目，提供宽屏显示、深色/浅色模式切换、评论悬浮窗等功能。

## 主要功能

- **宽屏显示**：自动将微博页面宽度扩展，充分利用屏幕空间
- **自适应主题**：自动跟随系统的深色/浅色模式设置
- **评论悬浮窗**：查看评论时不离开当前页面
- **控制面板**：可拖动的控制面板，方便调整设置
- **通知系统**：友好的操作反馈提示

## 目录结构

```
weibo-up/
├── dist/                  # 构建输出目录
├── src/                   # 源代码目录
│   ├── modules/          # 功能模块
│   │   ├── comments.js   # 评论功能模块
│   │   ├── theme.js      # 主题系统模块
│   │   ├── ui.js         # UI控制面板模块
│   │   └── widescreen.js # 宽屏功能模块
│   ├── styles/           # 样式文件
│   │   ├── comments.js   # 评论系统样式
│   │   └── widescreen.js # 宽屏模式样式
│   ├── utils/            # 工具函数
│   │   └── storage.js    # 存储相关功能
│   └── index.js          # 主入口文件
├── package.json          # 项目配置
├── webpack.config.js     # Webpack配置
└── README.md             # 项目说明
```

## 开发指南

### 环境设置

1. 安装 Node.js 和 npm (建议使用 Node.js v14 或更高版本)
2. 克隆仓库并安装依赖：

```bash
git clone <仓库地址>
cd weibo-up
npm install
```

### 开发流程

1. 在开发模式下构建项目（带有文件监听）：

```bash
npm run dev
```

2. 构建生产版本：

```bash
npm run build
```

3. 构建完成后，可以在 `dist` 目录中找到生成的 `weibo-up.user.js` 文件

### 功能模块说明

- **widescreen.js**：实现微博页面宽屏显示功能，支持新旧版微博
- **theme.js**：实现主题系统，能够自动适应系统的深色/浅色模式
- **comments.js**：实现评论悬浮窗功能，让用户不需要跳转页面即可查看评论
- **ui.js**：实现控制面板，让用户可以方便地调整各项设置

### 自定义开发

如需添加新功能或修改现有功能：

1. 在 `src/modules/` 目录下创建新的功能模块文件
2. 在 `src/index.js` 中导入并初始化该模块
3. 运行构建命令生成新的脚本文件

## 安装指南

### 浏览器要求

支持安装 Tampermonkey 或 Greasemonkey 的现代浏览器，包括但不限于：

- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari

### 安装步骤

1. 安装油猴扩展：
   - [Chrome 版 Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox 版 Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Edge 版 Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. 安装脚本：
   - 点击 `dist` 目录下的 `weibo-up.user.js` 文件
   - 或者在油猴扩展中创建新脚本，并粘贴构建生成的代码

## 使用方法

1. 安装后自动启用宽屏功能
2. 使用控制面板调整设置：
   - 右上角会显示控制面板图标
   - 点击图标展开完整控制面板
   - 可以设置是否启用宽屏、更宽模式、切换主题等

3. 快捷键：
   - `Ctrl+Shift+R`：重置主题为跟随系统模式
   - `Ctrl+Shift+D`：开发者模式（分析评论元素）

## 贡献指南

欢迎贡献代码或提交问题！请遵循以下步骤：

1. Fork 此仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
