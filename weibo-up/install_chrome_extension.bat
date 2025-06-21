@echo off
echo 微博增强Chrome扩展准备工作...

REM 检查必要文件
echo 检查必要文件...
set missing_files=0

REM 检查扩展基本文件
set required_files=manifest.json background.js content.js popup.html popup.js chrome-storage.js chrome-utils.js
for %%f in (%required_files%) do (
    if not exist "%%f" (
        echo 错误: 缺少%%f文件
        set /a missing_files+=1
    )
)

REM 检查图标文件
if not exist "icons\icon16.png" (
  echo 错误: 缺少icons\icon16.png文件
  set /a missing_files+=1
)

if not exist "icons\icon48.png" (
  echo 错误: 缺少icons\icon48.png文件
  set /a missing_files+=1
)

if not exist "icons\icon128.png" (
  echo 错误: 缺少icons\icon128.png文件
  set /a missing_files+=1
)

REM 检查模块文件夹
if not exist "src\modules" (
  echo 错误: src\modules文件夹不存在
  set /a missing_files+=1
)

if not exist "src\styles" (
  echo 错误: src\styles文件夹不存在
  set /a missing_files+=1
)

if not exist "src\utils" (
  echo 错误: src\utils文件夹不存在
  set /a missing_files+=1
)

if %missing_files% NEQ 0 (
  echo.
  echo 错误: 发现%missing_files%个缺失文件，请确保所有必要文件都存在！
  echo.
  goto error
)

echo 所有必要文件检查通过！
echo.

REM 打包扩展
echo 正在打包扩展文件...
powershell -Command "& {Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('.', '微博增强_Chrome扩展.zip', 'Optimal', $false)}"

if %errorlevel% NEQ 0 (
    echo 错误: 打包扩展文件失败！
    goto error
)

echo 扩展文件已打包为: 微博增强_Chrome扩展.zip
echo.

REM 安装说明
echo ===================== 安装说明 =====================
echo 1. 打开Chrome浏览器，访问 chrome://extensions/
echo 2. 开启右上角的"开发者模式"
echo 3. 点击"加载已解压的扩展程序"
echo 4. 选择此目录（包含manifest.json的文件夹）
echo ===================================================
echo.

goto end

:error
echo.
echo 安装准备失败，请解决上述错误后重试！
echo.
pause
exit /b 1

:end
echo 点击任意键退出...
pause >nul
exit /b 0
echo 安装步骤:
echo 1. 打开Chrome浏览器，访问 chrome://extensions
echo 2. 打开右上角的"开发者模式"
echo 3. 点击"加载已解压的扩展程序"
echo 4. 选择本文件夹(包含manifest.json的目录)
echo.
echo 或者您可以直接将生成的zip文件拖入扩展管理页面

goto end

:error
echo 安装准备工作失败!

:end
pause
