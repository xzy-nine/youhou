# 开始使用

这个文档提供了如何设置和使用微博增强脚本项目的步骤。

## 快速开始

### Windows 用户

1. 双击 `install.bat` 文件，它会自动安装依赖并构建项目
2. 构建完成后，可以在 `dist` 文件夹中找到 `weibo-up.user.js` 文件
3. 将此文件拖入油猴扩展中即可安装脚本

### Mac/Linux 用户

1. 打开终端并导航到项目目录
2. 运行以下命令使安装脚本可执行：
   ```bash
   chmod +x install.sh
   ```
3. 执行安装脚本：
   ```bash
   ./install.sh
   ```
4. 构建完成后，可以在 `dist` 文件夹中找到 `weibo-up.user.js` 文件
5. 将此文件拖入油猴扩展中即可安装脚本

## 开发流程

1. 开发模式（监听文件变化并自动重新构建）：
   ```bash
   npm run dev
   ```

2. 编辑源文件：
   - `src/index.js` - 主入口文件
   - `src/modules/` - 功能模块
   - `src/styles/` - 样式文件
   - `src/utils/` - 工具函数

3. 每次修改后，`dist` 目录中的文件会自动更新
   
4. 在浏览器中刷新微博页面以查看效果（注意可能需要在油猴扩展中重新启用脚本）

## 发布新版本

当你完成更改并准备发布新版本时：

1. 更新 `weibo-up\webpack.config.js` 文件中的版本号
2. 运行构建命令生成发布版本：
   ```bash
   npm run build
   ```
3. 将 `dist/weibo-up.user.js` 文件发布到油猴脚本平台或直接分享给用户

## 疑难解答

如果遇到问题：

1. 确保已安装最新版本的Node.js
2. 尝试删除 `node_modules` 文件夹并重新安装依赖：
   ```bash
   rm -rf node_modules
   npm install
   ```
3. 检查浏览器控制台是否有错误信息
4. 确保油猴扩展已启用并正确安装了脚本

## 了解更多

请查看项目的 [README.md](./README.md) 文件获取更多信息。
