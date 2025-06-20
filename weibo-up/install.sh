#!/bin/bash

echo "正在安装微博增强脚本开发环境..."

# 检查当前目录是否有package.json
if [ ! -f "package.json" ]; then
  echo "错误: 未找到package.json文件!"
  echo "请确保你在项目根目录下运行此脚本。"
  echo "当前目录: $(pwd)"
  
  # 检查是否在父目录执行了脚本
  if [ -f "weibo-up/package.json" ]; then
    echo "检测到在父目录执行了脚本，正在切换到正确目录..."
    cd weibo-up
    echo "已切换到目录: $(pwd)"
  else
    read -p "按任意键继续..." key
    exit 1
  fi
fi

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
  echo "错误: 未找到Node.js! 请先安装Node.js后再运行此脚本。"
  echo "下载地址: https://nodejs.org/"
  read -p "按任意键继续..." key
  exit 1
fi

echo "Node.js已安装，版本:"
node -v

# 安装依赖
echo "正在安装项目依赖..."
npm install

if [ $? -ne 0 ]; then
  echo "安装依赖失败! 请检查错误信息。"
  read -p "按任意键继续..." key
  exit 1
fi

echo "依赖安装成功!"

# 构建项目
echo "正在构建项目..."
npm run build

if [ $? -ne 0 ]; then
  echo "构建失败! 请检查错误信息。"
  read -p "按任意键继续..." key
  exit 1
fi

echo "构建成功!"
echo "可在 dist 文件夹中找到生成的油猴脚本文件: weibo-up.user.js"

echo ""
echo "若要开始开发，请运行: npm run dev"
echo "这会启动监视模式，自动重新构建修改的文件"

# 在Linux/Mac下模拟Windows批处理的pause命令
read -p "按任意键继续..." key
