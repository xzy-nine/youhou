# 微博增强 Chrome扩展使用说明

## 从油猴脚本转换为Chrome扩展的说明

这个项目已经从油猴脚本转换为Chrome扩展。主要变更包括：

1. 移除了webpack打包相关依赖
2. 使用Chrome扩展API替代了油猴特有的API：
   - `GM_setValue/GM_getValue` → `chrome.storage.local.set/get`
   - `GM_addStyle` → 原生DOM API添加样式
   - `GM_registerMenuCommand` → 弹出菜单实现
3. 增加了Chrome扩展特有文件：
   - `manifest.json`: 扩展定义文件
   - `popup.html/js`: 弹出界面
   - `background.js`: 后台服务
   - `content.js`: 内容脚本（替代原油猴脚本主体）

## 安装方法

1. 确保您已提供icons目录下的图标文件：
   - icon16.png (16x16)
   - icon48.png (48x48) 
   - icon128.png (128x128)
   
2. 使用Chrome开发者模式加载扩展：
   - 打开Chrome浏览器
   - 访问 chrome://extensions/
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择此目录（包含manifest.json的文件夹）
