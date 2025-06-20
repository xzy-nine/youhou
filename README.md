# 个人油猴脚本存储仓库

## 简介

这是一个专门用于存储和管理个人自制油猴脚本（Tampermonkey/Greasemonkey 脚本）的仓库。所有脚本都是基于个人需求开发，用于增强网页功能、改善用户体验或解决特定问题。

## 仓库内容

本仓库包含以下类型的脚本：
- 网页功能增强脚本
- 用户界面优化脚本
- 自动化操作脚本
- 数据提取和处理脚本
- 其他实用工具脚本

## 脚本列表

| 脚本名称 | 文件名 | 功能描述 | 适用网站 |
|---------|--------|----------|----------|
| - | ee.js | - | - |

## 使用方法

1. **安装油猴扩展**
   - Chrome: 安装 [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Firefox: 安装 [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) 或 [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
   - Edge: 安装 [Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. **安装脚本**
   - 点击对应的 `.js` 文件
   - 复制脚本内容
   - 在 Tampermonkey 管理界面创建新脚本
   - 粘贴代码并保存

3. **使用脚本**
   - 访问对应的网站
   - 脚本将自动运行（如果匹配 @match 规则）

## 脚本开发规范

所有脚本都遵循以下开发规范：

### 元数据块
```javascript
// ==UserScript==
// @name         脚本名称
// @namespace    http://tampermonkey.net/
// @version      版本号
// @description  脚本描述
// @author       作者名
// @match        适用网站URL模式
// @grant        所需权限
// ==/UserScript==
```

### 代码结构
- 使用严格模式 `'use strict';`
- 避免全局变量污染
- 添加适当的错误处理
- 包含详细注释

## 更新日志

### 版本历史
- 初始版本：创建仓库

## 注意事项

⚠️ **免责声明**
- 本仓库中的脚本仅供个人学习和使用
- 使用脚本时请遵守相关网站的服务条款
- 脚本可能因目标网站更新而失效，请及时更新
- 使用脚本造成的任何问题，作者不承担责任

## 反馈与建议

如果您在使用过程中遇到问题或有改进建议，欢迎：
- 提交 Issue
- 发起 Pull Request
- 通过其他方式联系作者

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

*最后更新：2025年6月20日*
