@echo off
title ORACLE Local Updater
color 0A
echo.
echo  ========================================
echo    ORACLE - Update from local build files
echo  ========================================
echo.

set "SCRIPT_DIR=%~dp0"
set "BUILD_DIR=%SCRIPT_DIR%apps\desktop\release\win-unpacked"

:: Where ORACLE is installed (NSIS default)
set "INSTALL_DIR=%LOCALAPPDATA%\Programs\ORACLE"

if not exist "%BUILD_DIR%\ORACLE.exe" (
    echo  [X] Build not found:
    echo      %BUILD_DIR%
    echo  Build it first:  cd apps/desktop ^&^& npm run build:unpack
    echo.
    pause
    exit /b 1
)

echo  [1/4] Closing ORACLE if running...
taskkill /f /im ORACLE.exe >nul 2>&1
timeout /t 2 /nobreak >nul

if not exist "%INSTALL_DIR%" (
    echo  [2/4] No existing install found - creating %INSTALL_DIR%
    mkdir "%INSTALL_DIR%"
) else (
    echo  [2/4] Found install at %INSTALL_DIR%
)

echo  [3/4] Copying new files...
xcopy "%BUILD_DIR%\*" "%INSTALL_DIR%\" /E /Y /Q >nul

echo  [4/4] Done!
echo.
echo  ========================================
echo   ORACLE updated from local build
echo   Location: %INSTALL_DIR%\ORACLE.exe
echo  ========================================
echo.

set /p "LAUNCH= Launch ORACLE now? (Y/N): "
if /i "%LAUNCH%"=="Y" start "" "%INSTALL_DIR%\ORACLE.exe"

pause
