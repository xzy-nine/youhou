@echo off
echo 正在安装微博增强脚本开发环境...

REM 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo 错误: 未找到Node.js! 请先安装Node.js后再运行此脚本。
  echo 下载地址: https://nodejs.org/
  pause
  exit /b 1
)

echo Node.js已安装，版本:
node -v

REM 安装依赖
echo 正在安装项目依赖...
call npm install

if %ERRORLEVEL% neq 0 (
  echo 安装依赖失败! 请检查错误信息。
  pause
  exit /b 1
)

echo 依赖安装成功!

REM 构建项目
echo 正在构建项目...
call npm run build

if %ERRORLEVEL% neq 0 (
  echo 构建失败! 请检查错误信息。
  pause
  exit /b 1
)

echo 构建成功!
echo 可在 dist 文件夹中找到生成的油猴脚本文件: weibo-up.user.js

echo.
echo 若要开始开发，请运行: npm run dev
echo 这会启动监视模式，自动重新构建修改的文件

pause
