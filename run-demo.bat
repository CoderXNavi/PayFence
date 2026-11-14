@echo off
setlocal enabledelayedexpansion

title PayFence Demo Launcher

echo ========================================================
echo PayFence: Autonomous Payment Security Gateway Demo
echo ========================================================
echo.

:: 1. Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js (v18 or higher) from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] Detected Node.js: %NODE_VERSION%

:: 2. Check npm installation
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH.
    echo.
    pause
    exit /b 1
)

:: 3. Setup Backend dependencies
echo.
echo [1/4] Checking Backend dependencies...
if not exist "%~dp0backend\node_modules" (
    echo Installing backend dependencies...
    pushd "%~dp0backend"
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Backend npm install failed.
        popd
        pause
        exit /b 1
    )
    popd
) else (
    echo Backend dependencies found.
)

:: 4. Setup Frontend dependencies
echo.
echo [2/4] Checking Frontend dependencies...
if not exist "%~dp0frontend\node_modules" (
    echo Installing frontend dependencies...
    pushd "%~dp0frontend"
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Frontend npm install failed.
        popd
        pause
        exit /b 1
    )
    popd
) else (
    echo Frontend dependencies found.
)

:: 5. Launch Backend (Port 5000)
echo.
echo [3/4] Starting PayFence Backend on http://localhost:5000 ...
start "PayFence Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

:: 6. Launch Frontend (Port 5173)
echo.
echo [4/4] Starting PayFence Frontend on http://localhost:5173 ...
start "PayFence Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: 7. Wait and Open Browser
echo.
echo Waiting 4 seconds for services to initialize...
timeout /t 4 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo PayFence is now running:
echo  - Frontend: http://localhost:5173
echo  - Backend API: http://localhost:5000
echo.
echo Demo Credentials:
echo  - Email: admin@college.edu
echo  - Password: admin123
echo  (Or click 'Quick Demo Login' on the login screen)
echo.
echo Keep the backend and frontend terminal windows open.
echo Close those windows to stop the services.
echo ========================================================
echo.
pause
