@echo off
setlocal enabledelayedexpansion
title FilePeek Launcher

echo ============================================================
echo                  FilePeek Desktop Launcher
echo ============================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "HTML_FILE=%SCRIPT_DIR%index.html"

if not exist "%HTML_FILE%" (
    set "HTML_FILE=%SCRIPT_DIR%filepeek-preview.html"
)

if not exist "%HTML_FILE%" (
    echo Error: index.html was not found in the current directory.
    pause
    exit /b 1
)

echo [1/2] Launching FilePeek Web Application in default browser...
start "" "%HTML_FILE%"

echo.
echo ============================================================
echo  FilePeek is now running in your default web browser!
echo  Drop any file into the application to inspect its format,
echo  magic bytes, 10 hidden properties, and SHA-256 / MD5 hashes.
echo ============================================================
echo.
timeout /t 4 >nul
