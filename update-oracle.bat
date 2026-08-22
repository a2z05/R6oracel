@echo off
title ORACLE Updater
color 0A
echo.
echo  ========================================
echo        ORACLE - Rainbow Six Companion
echo            Update Script
echo  ========================================
echo.

:: Check for admin privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo  [OK] Running as administrator
) else (
    echo  [!] Not running as admin - some operations may need it
)
echo.

:: Set paths
set "GITHUB_API=https://api.github.com/repos/a2z05/R6oracel/releases/latest"
set "INSTALL_DIR=%LOCALAPPDATA%\Programs\ORACLE"
set "DOWNLOAD_DIR=%TEMP%\oracle-update"

echo  [1/5] Checking for updates...
echo  Calling GitHub API...

:: Get latest release info
curl -s %GITHUB_API% > "%DOWNLOAD_DIR%\release.json" 2>nul
if %errorLevel% neq 0 (
    echo  [X] Failed to check for updates. Check your internet connection.
    echo  Press any key to exit...
    pause >nul
    exit /b 1
)

:: Extract version and download URL
for /f "tokens=2 delims=:," %%a in ('findstr /r "\"tag_name\"" "%DOWNLOAD_DIR%\release.json"') do (
    set "TAG=%%~a"
)
set "TAG=%TAG: =%"
set "TAG=%TAG:"=%"

for /f "tokens=2 delims=:," %%a in ('findstr /r "\"browser_download_url.*exe\"" "%DOWNLOAD_DIR%\release.json"') do (
    set "EXE_URL=%%~a"
)
set "EXE_URL=%EXE_URL: =%"
set "EXE_URL=%EXE_URL:"=%"

echo  Latest version: %TAG%
echo.

:: Check current version
if exist "%INSTALL_DIR%\ORACLE.exe" (
    echo  Current install found at: %INSTALL_DIR%
) else (
    echo  No existing installation found.
    echo  Will install to: %INSTALL_DIR%
)
echo.

echo  [2/5] Downloading update...
if not exist "%DOWNLOAD_DIR%" mkdir "%DOWNLOAD_DIR%"

:: Download the exe
curl -L -o "%DOWNLOAD_DIR%\ORACLE-update.exe" "%EXE_URL%" --progress-bar
if %errorLevel% neq 0 (
    echo  [X] Download failed.
    echo  Press any key to exit...
    pause >nul
    exit /b 1
)

echo  Download complete!
echo.

echo  [3/5] Closing ORACLE if running...
taskkill /f /im ORACLE.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo  [4/5] Installing update...
echo  Running installer silently...
"%DOWNLOAD_DIR%\ORACLE-update.exe" /S
timeout /t 5 /nobreak >nul

echo  [5/5] Cleaning up...
rd /s /q "%DOWNLOAD_DIR%" >nul 2>&1

echo.
echo  ========================================
echo     Update complete! ORACLE %TAG%
echo  ========================================
echo.

:: Ask to launch
set /p "LAUNCH=  Launch ORACLE now? (Y/N): "
if /i "%LAUNCH%" == "Y" (
    echo  Starting ORACLE...
    start "" "%INSTALL_DIR%\ORACLE.exe"
) else (
    echo  You can launch ORACLE from: %INSTALL_DIR%\ORACLE.exe
)

echo.
echo  Press any key to exit...
pause >nul
