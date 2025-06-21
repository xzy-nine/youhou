#!/bin/bash

echo "安装微博增强Chrome扩展准备工作..."

echo "检查图标文件..."
if [ ! -f "icons/icon16.png" ]; then
  echo "错误: 缺少icons/icon16.png文件"
  echo "请先创建所需图标文件！"
  exit 1
fi

if [ ! -f "icons/icon48.png" ]; then
  echo "错误: 缺少icons/icon48.png文件"
  echo "请先创建所需图标文件！"
  exit 1
fi

if [ ! -f "icons/icon128.png" ]; then
  echo "错误: 缺少icons/icon128.png文件"
  echo "请先创建所需图标文件！"
  exit 1
fi

echo "图标文件检查通过！"

echo "压缩扩展文件..."
zip -r "微博增强_Chrome扩展.zip" manifest.json background.js content.js popup.html popup.js chrome-storage.js chrome-utils.js icons

echo "扩展文件已打包为: 微博增强_Chrome扩展.zip"

echo
echo "安装步骤:"
echo "1. 打开Chrome浏览器，访问 chrome://extensions"
echo "2. 打开右上角的"开发者模式""
echo "3. 点击"加载已解压的扩展程序""
echo "4. 选择本文件夹(包含manifest.json的目录)"
echo
echo "或者您可以直接将生成的zip文件拖入扩展管理页面"

read -p "按回车键继续..."
